// 設定
propertySet('CHANNEL_ID_NEWS_IT','XXXXXXXX');
propertySet('TWITTER_CONS_KEY',  'XXXXXXXXXXXXXXXXXXX');
propertySet('TWITTER_CONS_SEC',  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
propertySet('TWIT_SPREADSHEET_ID', 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
propertySet('TWIT_SPREADSHEET_NAME', 'twitterlastids');

// -------------------------------------------------------------
// twitter検索（特定ユーザー）
// -------------------------------------------------------------
function sch_TwitterSearch1(){
  twitterSearch("asciijpeditors", propertyGet('CHANNEL_ID_NEWS_IT'));
}

// -------------------------------------------------------------
// twitter検索（特定ユーザー）
// -------------------------------------------------------------
function twitterSearch(account,channelid){
  
    var result = getUserTweets(account);
    if (result.datas.length > 0){
      var atts = [];
      var icon = "";
      var uname = "";
      // データループ
      for (var idxD=0; idxD<=result.datas.length-1; idxD++) {
        var ptext = "";
        var fback = "";
        dt = result.datas[idxD];
        if (idxD==0){ 
          icon  = dt.uimage;
          uname = dt.uname
          ptext = "<" + dt.tlink + "|@" + dt.uid + ">";
          fback = dt.uname;
        }
        var mediaurl = "";
        if (dt.mediaurl.length > 0)
        {
          mediaurl = dt.mediaurl[0];
          //for (var idxM=0; idxM<=dt.mediaurl.length-1; idxM++) {
          //  mediaurl += "\n" + dt.mediaurl[idxM];
          //}
        }
        var att = {title : "[" + dt.tdatestr + "]",
                   color : "#1da1f3",
                   text  : dt.tweet,
                   pretext:ptext, 
                   fallback:fback,
                   thumb_url : mediaurl}
        atts.push(att);
        //writeCustomLog("INFO",('[mediaurl]'+mediaurl),"twitterSearch");
      }
      if (uname == ""){ uname = account; }

      // slackにメッセージを投稿する
      postSlackMessage(channelid, "twitter:" + uname, "", "", icon, atts);
  }
}

// -------------------------------------------------------
// 指定ユーザーのtweetを取得し配列で返却する
// -------------------------------------------------------
// - 最後に取得したツィートIDをスプレッドシートで管理し、重複取得はしない。
// - twitter検索APIは「15分の間で180回」以上呼び出すとBANされるらしい。
//   （1分12回、5秒に1回以上ペース、15分でリセット）
//   https://dev.twitter.com/rest/public/rate-limits
// -------------------------------------------------------
var getUserTweets = function(user){  

  var result = {};
  var datas  = [];
  var dataidx = 0;

  // スプレッドシートから「最後に処理したツィート」IDを取得
  var sheetId = PropertiesService.getScriptProperties().getProperty("TWIT_SPREADSHEET_ID");
  var sheetNm = PropertiesService.getScriptProperties().getProperty("TWIT_SPREADSHEET_NAME");
  var sheet   = SpreadsheetApp.openById(sheetId).getSheetByName(sheetNm);
  var lastRow = sheet.getDataRange().getLastRow();

  // スプレッドシート行ループ（1行目はヘッダーなので2行目から）
  var rowIdx;
  for(var idx=2; idx<=lastRow; idx++){
    if (user == sheet.getRange(idx,1).getValue()){ // 1列目が指定のユーザー名か？
      rowIdx = idx; // 行を退避
      break;
    }
  }

  // 対象の行が無いなら初期化行を入れておく
  if (!rowIdx){
    rowIdx = lastRow + 1;
    sheet.getRange(rowIdx,1).setValue(user); 
    sheet.getRange(rowIdx,5).setValue("780000000000000000"); 
  }
  var lastIdstr = sheet.getRange(rowIdx,5).getValue();
  writeCustomLog("INFO",('[lastIdstr]'+lastIdstr),"getUserTweets");

  // twitterアクセストークンの取得
  var tokenUrl      = "https://api.twitter.com/oauth2/token";
  var tokenCredential = Utilities.base64EncodeWebSafe(
                         propertyGet('TWITTER_CONS_KEY') + ":" + propertyGet('TWITTER_CONS_SEC'));
  var tokenOptions  = {  headers: { Authorization: "Basic " + tokenCredential,
                                   "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
                          method: "post",
                         payload: "grant_type=client_credentials" };
  var responseToken = UrlFetchApp.fetch(tokenUrl, tokenOptions);
  var parsedToken   = JSON.parse(responseToken);
  var token         = parsedToken.access_token;
  writeCustomLog("INFO",('[token]'+token),"getUserTweets");
  
  // 検索  
  var apiUrl = "https://api.twitter.com/1.1/search/tweets.json?q=from%3A{from}&count=50&since_id={since_id}"
  apiUrl = apiUrl.replace("{from}", user).replace("{since_id}", lastIdstr);
  var apiOptions  = { headers : { Authorization: 'Bearer ' + token}, method : "get" };
  var responseApi = UrlFetchApp.fetch(apiUrl, apiOptions);
  if (responseApi.getResponseCode() !== 200){
    writeCustomLog("ERROR",('[getResponseCode]'+responseApi.getResponseCode()),"getUserTweets");
    return "";
  }
  var json = JSON.parse(responseApi.getContentText());    
  writeCustomLog("INFO",('[apiUrl]'+apiUrl),"getUserTweets");
  writeCustomLog("INFO",('[json.statuses.length]'+json.statuses.length),"getUserTweets");
 
  // 検索結果を確認
  if (json.statuses.length > 0){
    // スプレッドシート上の「最後に処理したツィート」より新しいものが対象
    var tidx = 0;
    for (var idx=0; idx<=json.statuses.length-1; idx++) {
      var statuse = json.statuses[idx];
    //writeCustomLog("INFO",('[statuse]'+statuse),"getUserTweets");
      var mediaUrls = [];
    //writeCustomLog("INFO",('[statuse.id_str]'+statuse.id_str),"getUserTweets");
      if (statuse.id_str > lastIdstr){
        var wktdate = new Date(statuse.created_at);
        var wktlink = "https://twitter.com/" + statuse.user.screen_name + "/status/" + statuse.id_str;
        if (statuse.extended_entities)
        {
          if (statuse.extended_entities.media){
            for (var idxM=0; idxM<=statuse.extended_entities.media.length-1; idxM++) {
              mediaUrls.push(statuse.extended_entities.media[idxM].media_url);
            //writeCustomLog("INFO",('[media_url]'+ statuse.extended_entities.media[idxM].media_url),"getUserTweets");
            }
          }
        }
        var wrk = {idstr    : statuse.id_str,
                   uname    : statuse.user.name,
                   uid      : statuse.user.screen_name,
                   uimage   : statuse.user.profile_image_url,
                   tweet    : statuse.text,
                   mediaurl : mediaUrls,
                   tdate    : wktdate,
                   tdatestr : Utilities.formatDate(wktdate,"GMT+0900","MM/dd HH:mm"),
                   tlink    : wktlink};
      //writeCustomLog("INFO",('[item]'+wrk),"getUserTweets");
        datas.push(wrk);
      }
    }
    if (datas.length > 0){
      // IDの最大値を退避
      var maxIdTweet = {idstr:"1",uname:"",uimage:"",tweet:"",tdate:"",tdatestr:"",tlink:""};
      for (var idx=datas.length-1; idx>=0; idx--) {
        if (maxIdTweet.idstr < datas[idx].idstr){ maxIdTweet = datas[idx]; }
      }
      // スプレッドシート内の「最後に取得したツィート」情報を更新
      sheet.getRange(rowIdx,2).setValue(maxIdTweet.tweet); 
      sheet.getRange(rowIdx,3).setValue(maxIdTweet.tlink); 
      sheet.getRange(rowIdx,4).setValue(maxIdTweet.tdatestr); 
      sheet.getRange(rowIdx,5).setValue(maxIdTweet.idstr); 
    //writeCustomLog("INFO",('[maxIdTweet]'+maxIdTweet),"getUserTweets");
    }
  }

  result['datas'] = datas;
  return result;
}