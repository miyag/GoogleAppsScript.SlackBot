// 設定
propertySet('CHANNEL_ID_INFO_TREND', 'XXXXXXXX');

// -------------------------------------------------------------
// Google急上昇ワード
// -------------------------------------------------------------
function loadGoogleTrend(){

  // データ取得
  var result = getGoogleTrend();
  writeCustomLog("INFO",('[result.datas.length]'+result.datas.length),"loadGoogleTrend");

  if (result.datas.length > 0){
    var atts = [];
    // データループ
    for (var idxD=0; idxD<=result.datas.length-1; idxD++) {
      var att;
      var rd = result.datas[idxD];
      var ptext = "";
      var fback = "";
      if (idxD==0){ 
        ptext = result.title + " @" + result.updated;
        fback = result.title + " @" + result.updated;
      }
      att = {title : rd.idx + " " + rd.class + " <" + rd.href + "|" + rd.title + ">",
             color : "#3333cc",
             pretext: ptext ,
             fallback: fback};
      atts.push(att);
    }
    // slackにメッセージを投稿する
    postSlackMessage(propertyGet('CHANNEL_ID_INFO_TREND'), "googleTrendBot", "", ":googletrends:", "", atts);
  }
}

// -------------------------------------------------------------
// Yahooデイリーランキング - 急上昇ワード
// -------------------------------------------------------------
function loadYahooTrend(){

  // 月-金だけ投稿
  var objDate = new Date();
  var d4 = objDate.getDay();
  if (1<=d4 && d4<=5){
  }else{
    return "";
  }

  // データ取得
  var result = getYahooTrend();
  writeCustomLog("INFO",('[result.datas.length]'+result.datas.length),"loadYahooTrend");
  
  if (result.datas.length > 0){
    var atts = [];
    // データループ
    for (var idxD=0; idxD<=result.datas.length-1; idxD++) {
      var att;
      var rd = result.datas[idxD];
      var ptext = "";
      var fback = "";
      if (idxD==0){ 
        ptext = result.title + " @" + result.lastBuildDate;
        fback = result.title + " @" + result.lastBuildDate;
      }
      att = {title : rd.rank + ". <" + rd.link + "|" + rd.title + "> (" + rd.point + " point)",
             text  : rd.description,
             color : "#FF0000",
             pretext:  ptext,
             fallback: fback
            }
      atts.push(att);
    }

    // slackにメッセージを投稿する
    postSlackMessage(propertyGet('CHANNEL_ID_INFO_TREND'), "yahooTrendBot", "", ":yahoojapan:", "", atts);
  }
}


// -------------------------------------------------------
// Googleトレンド収集
// -------------------------------------------------------
var getGoogleTrend = function(){

  var result = {};
  var datas  = [];
  var dataidx = 0;

  // リクエスト
  var url  = "http://www.google.co.jp/trends/hottrends/atom/hourly";
  var xml  = UrlFetchApp.fetch(url).getContentText();
//writeCustomLog("INFO",('[xml]\n'+xml),"getGoogleTrend");

  // パース
  var doc  = XmlService.parse(xml);
  var root = doc.getRootElement();
  var atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  var nowDate = new Date();
  var updated = Utilities.formatDate(nowDate,"GMT+0900","MM/dd HH:00");
  var content = root.getChild('entry', atom).getChild('content', atom).getText();
  result['title']   = root.getChild('title', atom).getText();
//result['updated'] = root.getChild('updated', atom).getText();
  result['updated'] = updated.replace("T", " ").replace(":00Z", "");

  // ループ
  aryContent = content.split("\n");
  for(var idx=0; idx < aryContent.length; idx++){
    if (aryContent[idx]){
    //Logger.log(aryContent[idx]);
      var match = aryContent[idx].match(/<li><span class=\"(.*)\"><a href=\"(.*)\">(.*)<\/a><\/span><\/li>/);
      if (match){
        dataidx++;
        var wrk = {idx:dataidx, class:match[1], href:match[2], title:match[3]};   
      //Logger.log("[item]"+wrk);
        datas.push(wrk);
      }
    }
  }
  result['datas'] = datas;
//writeCustomLog("INFO",('[result]'+result),"getGoogleTrend");
  return result;
}

// -------------------------------------------------------
// Yahooトレンド収集
// -------------------------------------------------------
var getYahooTrend = function(){
  
  var result = {};
  var datas  = [];
  var dataidx = 0;

  // リクエスト
  var url  = "http://searchranking.yahoo.co.jp/rss/burst_ranking-rss.xml";
  var xml  = UrlFetchApp.fetch(url).getContentText();
//writeCustomLog("INFO",('[xml]\n'+xml),"getYahooTrend");

  // パース
  var ranking = XmlService.getNamespace('http://searchranking.yahoo.co.jp/ns/ranking');
  var doc     = XmlService.parse(xml);
  var root    = doc.getRootElement();
  result['title']         = root.getChild('channel').getChild('title').getText();
  result['description']   = root.getChild('channel').getChild('description').getText();
  var bdDate = new Date(root.getChild('channel').getChild('lastBuildDate').getText());
  result['lastBuildDate'] = Utilities.formatDate(bdDate,"GMT+0900","MM/dd HH:00");;
  var items = root.getChild('channel').getChildren('item')
//writeCustomLog("INFO",('[items]\n'+items.length),"getYahooTrend");
  for(var idx=0; idx < items.length; idx++){
    if (items[idx]){
      dataidx++;
      var wrk = {idx        : dataidx, 
                 title      : items[idx].getChild('title').getText(),
                 link       : items[idx].getChild('link').getText(), 
                 description: items[idx].getChild('description').getText(),
                 pubDate    : items[idx].getChild('pubDate').getText(),
                 rank       : items[idx].getChild('rank' ,ranking).getText(),
                 point      : items[idx].getChild('point',ranking).getText()
                };   
    //Logger.log('[item]\n'+wrk);
      datas.push(wrk);
    }
  }
  result['datas'] = datas;
//writeCustomLog("INFO",('[result]\n', result),"getYahooTrend");
  return result;
}