// 設定
propertySet('CHANNEL_ID_NEWS_IT','XXXXXXXXX');

// -------------------------------------------------------------
// スケジュール投稿：はてなホッテントリ  ※ 毎日朝１回
// -------------------------------------------------------------
function sch_hatenaHotEntry(){

  // 取得対象の設定
  var targets = [];
  targets.push({kbn:"cateogory", keyword:"it", threshold:100, channel:propertyGet('CHANNEL_ID_NEWS_IT')});
  
  // 対象ループ
  for (var idx=0; idx<=targets.length-1; idx++) {
    var result = getHatenaHotEntry(targets[idx].kbn, targets[idx].keyword, targets[idx].threshold);
    if (result.datas.length > 0){
      var atts = [];
      // データループ
      for (var idxD=0; idxD<=result.datas.length-1; idxD++) {
        var att = {title : "<" + result.datas[idxD].link + "|" + result.datas[idxD].title + ">",
                   color : "#3333cc",
                   author_name: result.datas[idxD].pubdate,
                   author_icon: result.datas[idxD].image,
                   text       : result.datas[idxD].text,
                   fields: [  
                       { title:"Genre",    value:result.datas[idxD].genre,                    short:true}
                      ,{ title:"Bookmark", value:result.datas[idxD].bookmarks+"ブックマーク", short:true}]
                  }
        atts.push(att);
      }
      // slackにメッセージを投稿する
      postSlackMessage(targets[idx].channel, "hatenabot", "", ":hatenabookmark:", "", atts);
    }
  }            
}  

// -------------------------------------------------------
// はてなエントリ収集
// -------------------------------------------------------
//  kbn   : categoryかkeywordか？
//  target  : ワードまたはカテゴリ
//  threshold: 閾値・ブックマーク数がN以上
// -------------------------------------------------------
var getHatenaHotEntry = function(kbn, target, threshold){

  var result = {};
  var datas  = [];
  var dataidx = 0;

  // URL
  var url = "";
  if (kbn=="cateogory"){
    url = "http://b.hatena.ne.jp/entrylist/{target}?";
  }else{
    url = "http://b.hatena.ne.jp/search/text?q={target}&";
  }
  url+= "mode=rss&sort=hot&threshold={threshold}&date_begin={dateBgn}&date_end={dateEnd}";
  url = url.replace("{target}", target);
  if (threshold == ""){threshold = 1;}
  url = url.replace("{threshold}", threshold);
  var bgnDate = new Date();
  var endDate = new Date();
  bgnDate.setDate(bgnDate.getDate()-1); // 昨日から
  endDate.setDate(endDate.getDate()-1); // 昨日まで
  url = url.replace("{dateBgn}",Utilities.formatDate(bgnDate,"GMT+0900","yyyy-MM-dd"));
  url = url.replace("{dateEnd}",Utilities.formatDate(endDate,"GMT+0900","yyyy-MM-dd"));
  writeCustomLog("INFO",('request url is "%s".', url),"getHatenaHotEntry");

  // API呼び出し
  var xml = UrlFetchApp.fetch(url).getContentText();

  // 結果パース
  var document = XmlService.parse(xml);
  var root    = document.getRootElement();
  var rss     = XmlService.getNamespace('http://purl.org/rss/1.0/');
  var dc      = XmlService.getNamespace('dc',      'http://purl.org/dc/elements/1.1/');
  var content = XmlService.getNamespace('content', 'http://purl.org/rss/1.0/modules/content/');
  var hatena  = XmlService.getNamespace('hatena',  'http://www.hatena.ne.jp/info/xmlns#');
  var items   = root.getChildren('item', rss);

  // アイテムループ
  for (var i = 0; i < items.length; i++) {
    var title   = items[i].getChild('title'      , rss).getText();
    var link    = items[i].getChild('link'       , rss).getText();
    var descript= items[i].getChild('description', rss).getText();
    var pubdate = items[i].getChild('date'       , dc).getText();
    var subject = items[i].getChild('subject'    , dc).getText();
    var bcount  = items[i].getChild('bookmarkcount',hatena).getText();
    var encoded = items[i].getChild('encoded'    , content).getText()
    // 編集
    pubdate = pubdate.replace("+09:00", "").replace("T"," ");
    pubdate = pubdate.replace(Utilities.formatDate(bgnDate,"GMT+0900","yyyy-"), "")
    var image = "";
    var result = encoded.match(/<cite><img src=\"(.*)\" alt=\"\" \/> <a href=\"/);
    if (result){ image = result[1]; }
    dataidx++;
    var wrk = {idx:dataidx, title:title, link:link, image:image, 
               pubdate:pubdate, bookmarks:bcount, text:descript, genre:subject};   
  //writeCustomLog("INFO",('loop item is "%s".', wrk),"getHatenaHotEntry");
    datas.push(wrk);
  }

  result['datas'] = datas;
  return result;
}