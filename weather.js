// 設定
propertySet('CHANNEL_ID_WEATHER','XXXXXXXX');

// -------------------------------------------------------------
// スケジュール投稿：天気予報      ※ 毎日朝１回夜1回
// -------------------------------------------------------------
function sch_weatherCast(){
  postSlackMessage(propertyGet('CHANNEL_ID_WEATHER'), "WeatherBot", 
                   getWeatherCast("千葉"), ":sun_behind_rain_cloud:", "", "");
}
// -------------------------------------------------------------
// スケジュール投稿：雨雲レーダー  ※ 毎日昼1回
// -------------------------------------------------------------
function sch_amagumoRadar(){
  // 月-金だけ投稿
  var objDate = new Date();
  var d4 = objDate.getDay();
  if ((1<=d4)&&(d4<=5)){
    postSlackMessage(propertyGet('CHANNEL_ID_WEATHER'), "AmagumoBot", 
                     getAmagumoRadar("千葉"), ":sun_behind_rain_cloud:", "", "");
  }
}

// -------------------------------------------------------------
// 天気予報を取得
// -------------------------------------------------------------
var getWeatherCast = function(place){

  // [cityId] http://weather.livedoor.com/forecast/rss/primary_area.xml
  var cityid = "";
  if (isExistInStrArrray("東京,TOKYO,tokyo", place, ",")){
    cityid = "130010" // id="130010" title="東京"
  }else if (isExistInStrArrray("横浜,YOKOHAMA,yokohama", place, ",")){
    cityid = "130010" // id="140010" title="横浜"
  }else if (isExistInStrArrray("千葉,CHIBA,chiba", place, ",")){
    cityid = "120010" // id="120010" title="千葉"
  }else if (isExistInStrArrray("埼玉,SAITAMA,saitama", place, ",")){
    cityid = "110010" // id="110010" title="さいたま"
  }else{
    cityid = "130010" // id="130010" title="東京"
  }
  var url = "http://weather.livedoor.com/forecast/webservice/json/v1?city=" + cityid;
  writeCustomLog("INFO",('request URL is "%s".', url),"getWeatherCast");
  var myTbl = new Array("日","月","火","水","木","金","土","日"); 
  var res   = UrlFetchApp.fetch(url);
  var json  = JSON.parse(res.getContentText());
  writeCustomLog("INFO",('response json is "%s".', json),"getWeatherCast");
  var msg   = json["title"] + " (予報発表" + json["publicTime"].replace("T"," ").replace("+0900","") + ")\n";
  var text  = json["description"]["text"];
  msg+= text.replace(/\n\n/g, "\n").replace(/\n/g, "").replace(/。/g, "。\n").replace(/</g, "\n<");
  // 今日
  var day = json["forecasts"][0];
  var dow = new Date();
  dow = Utilities.formatDate(dow, "JST" , "u");  
  var icn = "";
  if (day["image"]){
    icn = day["image"]["url"].replace("http://weather.livedoor.com/img/icon/", "").replace(".gif","");
    if (icn != ""){ icn = " :weather" + icn + ": "; }
  }
  msg+= "\n" + day["dateLabel"] + "　 " + day["date"] + "(" + myTbl[dow] + ") : " + icn + day["telop"];
  if (day["temperature"]["max"]){ msg += " 最高" + day["temperature"]["max"]["celsius"] + "℃"; }
  if (day["temperature"]["min"]){ msg += " 最低" + day["temperature"]["min"]["celsius"] + "℃"; }

  // 明日
  day = json["forecasts"][1];
  dow = new Date();
  dow.setDate(dow.getDate()+1);
  dow = Utilities.formatDate(dow, "JST" , "u");  
  icn = "";
  if (day["image"]){
    icn = day["image"]["url"].replace("http://weather.livedoor.com/img/icon/", "").replace(".gif","");
    if (icn != ""){ icn = " :weather" + icn + ": "; }
  }
  msg+= "\n" + day["dateLabel"] + "　 " + day["date"] + "(" + myTbl[dow] + ") : " + icn + day["telop"];
  if (day["temperature"]["max"]){ msg += " 最高" + day["temperature"]["max"]["celsius"] + "℃"; }
  if (day["temperature"]["min"]){ msg += " 最低" + day["temperature"]["min"]["celsius"] + "℃"; }

  // 明後日
  if (json["forecasts"][2]){
    day = json["forecasts"][2];
    dow = new Date();
    dow.setDate(dow.getDate()+2);
    dow = Utilities.formatDate(dow, "JST" , "u");  
    icn = "";
    if (day["image"]){
      icn = day["image"]["url"].replace("http://weather.livedoor.com/img/icon/", "").replace(".gif","");
      if (icn != ""){ icn = " :weather" + icn + ": "; }
    }
    msg+= "\n" + day["dateLabel"] + " " + day["date"] + "(" + myTbl[dow] + ") : " + icn + day["telop"];
    if (day["temperature"]["max"]){ msg += " 最高" + day["temperature"]["max"]["celsius"] + "℃"; }
    if (day["temperature"]["min"]){ msg += " 最低" + day["temperature"]["min"]["celsius"] + "℃"; }
  }

  return msg;
}

// -------------------------------------------------------------
// 雨雲レーダーの情報を取得
// -------------------------------------------------------------
var getAmagumoRadar = function(place){

  var url = "http://map.olp.yahooapis.jp/OpenLocalPlatform/V1/static?"
  url    += "appid=dj0zaiZpPVo4cnhVSDFWZm12biZzPWNvbnN1bWVyc2VjcmV0Jng9ZGY-"
  url    += "&lat={lat}&lon={lon}&z=14&width=500&height=500&overlay=type:rainfall";

  var msg = "";
  if (isExistInStrArrray("東京,TOKYO,tokyo", place, ",")){
    // 東京駅     35.681298 139.766247
    url = url.replace("{lat}", "35.681298");
    url = url.replace("{lon}", "139.766247");
    msg = "今の" + place + "上空はこんな感じです。\n" + url;
  }else if (isExistInStrArrray("横浜,YOKOHAMA,yokohama", place, ",")){
    // 横浜市     35.443708 139.638026
    url = url.Replace("{lat}", "35.443708");
    url = url.Replace("{lon}", "139.638026");
    msg = "今の" + place + "上空はこんな感じです。\n" + url;
  }else if (isExistInStrArrray("千葉,CHIBA,chiba", place, ",")){
    // 千葉市     35.607267 140.106291
    url = url.replace("{lat}", "35.607267");
    url = url.replace("{lon}", "140.106291");
    msg = "今の" + place + "上空はこんな感じです。\n" + url;
  }else if (isExistInStrArrray("埼玉,SAITAMA,saitama", place, ",")){
    // さいたま市 35.861729 139.645482
    url = url.Replace("{lat}", "35.861729");
    url = url.Replace("{lon}", "139.645482");
    msg = "今の" + place + "上空はこんな感じです。\n" + url;
  }

  return msg;
}