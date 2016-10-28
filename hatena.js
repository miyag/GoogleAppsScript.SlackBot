propertySet('CHANNEL_ID_NEWS_IT','XXXXXXXXX');

// -------------------------------------------------------------
// -------------------------------------------------------------
function sch_hatenaHotEntry(){

  var targets = [];
  targets.push({kbn:"cateogory", keyword:"it", threshold:100, channel:propertyGet('CHANNEL_ID_NEWS_IT')});
  
  for (var idx=0; idx<=targets.length-1; idx++) {
    var result = getHatenaHotEntry(targets[idx].kbn, targets[idx].keyword, targets[idx].threshold);
    if (result.datas.length > 0){
      var atts = [];
      for (var idxD=0; idxD<=result.datas.length-1; idxD++) {
        var att = {title : "<" + result.datas[idxD].link + "|" + result.datas[idxD].title + ">",
                   color : "#3333cc",
                   author_name: result.datas[idxD].pubdate,
                   author_icon: result.datas[idxD].image,
                   text       : result.datas[idxD].text,
                   fields: [  
                       { title:"Genre",    value:result.datas[idxD].genre,                    short:true}
                  }
        atts.push(att);
      }
      postSlackMessage(targets[idx].channel, "hatenabot", "", ":hatenabookmark:", "", atts);
    }
  }            
}  

// -------------------------------------------------------
// -------------------------------------------------------
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
  url = url.replace("{dateBgn}",Utilities.formatDate(bgnDate,"GMT+0900","yyyy-MM-dd"));
  url = url.replace("{dateEnd}",Utilities.formatDate(endDate,"GMT+0900","yyyy-MM-dd"));
  writeCustomLog("INFO",('request url is "%s".', url),"getHatenaHotEntry");

  var xml = UrlFetchApp.fetch(url).getContentText();

  var document = XmlService.parse(xml);
  var root    = document.getRootElement();
  var rss     = XmlService.getNamespace('http://purl.org/rss/1.0/');
  var dc      = XmlService.getNamespace('dc',      'http://purl.org/dc/elements/1.1/');
  var content = XmlService.getNamespace('content', 'http://purl.org/rss/1.0/modules/content/');
  var hatena  = XmlService.getNamespace('hatena',  'http://www.hatena.ne.jp/info/xmlns#');
  var items   = root.getChildren('item', rss);

  for (var i = 0; i < items.length; i++) {
    var title   = items[i].getChild('title'      , rss).getText();
    var link    = items[i].getChild('link'       , rss).getText();
    var descript= items[i].getChild('description', rss).getText();
    var pubdate = items[i].getChild('date'       , dc).getText();
    var subject = items[i].getChild('subject'    , dc).getText();
    var bcount  = items[i].getChild('bookmarkcount',hatena).getText();
    var encoded = items[i].getChild('encoded'    , content).getText()
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
