// 設定
propertySet('LOG_SPREADSHEET_ID', 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
propertySet('LOG_SPREADSHEET_NAME', 'XXXXX');
propertySet('SLACK_INCOMING_URL', 'https://hooks.slack.com/services/XXXXXXXXXXXXXXXXXXXXXXXXXXXX');

// -------------------------------------------------------------
// スクリプトプロパティを設定・取得する
// -------------------------------------------------------------
function propertyGet(name){
  return PropertiesService.getScriptProperties().getProperty(name);
}
function propertySet(name, value){
  PropertiesService.getScriptProperties().setProperty(name, value);
}

// -------------------------------------------------------------
// ログを出力する
// -------------------------------------------------------------
var writeInfoLog  = function(msg){     writeCustomLog("INFO" ,msg,"-"); }
var writeWarnLog  = function(msg){     writeCustomLog("WARN" ,msg,"-"); }
var writeErrorLog = function(msg){     writeCustomLog("ERROR",msg,"-"); }
var writeInfoLog  = function(msg,fnc){ writeCustomLog("INFO" ,msg,fnc); }
var writeWarnLog  = function(msg,fnc){ writeCustomLog("WARN" ,msg,fnc); }
var writeErrorLog = function(msg,fnc){ writeCustomLog("ERROR",msg,fnc); }
var writeCustomLog= function(lvl,msg){ writeCustomLog("ERROR",msg,"-"); }
var writeCustomLog= function(lvl,msg,fnc){
  // ログ記録用のスプレッドシートを読み込み
  var sheetId = PropertiesService.getScriptProperties().getProperty("LOG_SPREADSHEET_ID");
  var sheetNm = PropertiesService.getScriptProperties().getProperty("LOG_SPREADSHEET_NAME");
  var sheet   = SpreadsheetApp.openById(sheetId).getSheetByName(sheetNm);
  var lastRow = sheet.getDataRange().getLastRow();
  var lastNum = sheet.getRange(lastRow,1).getValue();
  if (isNaN(lastNum)){ lastNum = 0; }
  // ログを追記
  var nowDate = new Date();
  var logmsg = [];
  logmsg[0] = lastNum + 1;
  logmsg[1] = Utilities.formatDate(nowDate,"GMT+0900","yyyy/MM/dd HH:mm:ss"),
  logmsg[2] = Utilities.formatDate(nowDate,"GMT+0900","yyyy/MM/dd"),
  logmsg[3] = Utilities.formatDate(nowDate,"GMT+0900","HH:mm:ss"),
  logmsg[4] = lvl;
  logmsg[5] = fnc;
  if (msg.length > 50000){ msg = msg.substring(0,49999); }
  logmsg[6] = msg; 
  sheet.getRange(lastRow+1,1,1,logmsg.length).setValues([logmsg]);
  Logger.log(msg);
}

// -------------------------------------------------------------
// slackにメッセージを投稿する
// -------------------------------------------------------------
function postSlackMessage(channel, username, text, icon_emoji, icon_url, attachments){
  var payload = {"channel"    : channel,
                 "username"   : username,
                 "text"       : text,
                 "icon_emoji" : icon_emoji,
                 "icon_url"   : icon_url,
                 "attachments": attachments,
                 "link_names" : 0};
  writeInfoLog(payload, "postSlackMessage");
  var options = { "method":"post", "contentType":"application/json", "payload":JSON.stringify(payload), muteHttpExceptions:true};
  try {
    var result = UrlFetchApp.fetch(propertyGet('SLACK_INCOMING_URL'), options);
    writeInfoLog(result, "postSlackMessage");
  } catch (e) {
    writeErrorLog(e,"postSlackMessage");
  }
}