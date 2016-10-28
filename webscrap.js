/// -------------------------------------------------------------
// 設定
// -------------------------------------------------------------
propertySet('CHANNEL_ID_LOCALREST','XXXXXXXX');
propertySet('SCRAP_SPREADSHEET_ID',   'XXXXXXXXXXXXXXXX');
propertySet('SCRAP_SPREADSHEET_NAME', 'lastScrapText');

// -------------------------------------------------------------
// 食べログ 新規オープン
// -------------------------------------------------------------
function scrapTabelogNewOpen(){

  var datas  = [];

  // ページ取得 
  var url = "https://tabelog.com/chiba/rstLst/?SrtT=nod&Srt=D";
  var html = UrlFetchApp.fetch(url).getContentText();
  //writeCustomLog("INFO",('[html]'+ html),"scrapTabelogNewOpen");
  
  // タイトル
  var title = "";
  var title_match = html.match(/<strong class=\"list-condition__title\">(.*)<\/strong>/);
  if (title_match){ title = title_match[1]; }
  writeCustomLog("INFO",('[title]'+ title),"scrapTabelogNewOpen");
  
  // タグ解析
  var hrefs = "";
  var elems1 = html.match(/<p class=\"list-rst__rst-name\"><a class=\"list-rst__rst-name-target cpy-rst-name\" href=\".*\" target=\"_blank\">.*<\/a><span class="\list-rst__area-genre cpy-area-genre\">.*<\/span>/g);
  var elems2 = html.match(/<div class=\"list-rst__rst-info cpy-info\">([\s\S]*?)<p class=\"list-rst__newopen is-highlight\">([\s\S]*?)<\/p>/gm);
  var elems3 = html.match(/<div class=\"list-rst__photo-frame js-rst-image\">[\s\S]*?<p class=\"list-rst__photo-item\"><a class=\"list-rst__image-target\" href=\".*\">[\s\S]*?<img alt=\".*\" class=\"js-lazy-cassette-image cpy-main-image\" data-original=\"(.*)\" height=/g);
//writeCustomLog("INFO",('[elems1.length]' + elems1.length),"scrapTabelogNewOpen");
//writeCustomLog("INFO",('[elems2.length]' + elems2.length),"scrapTabelogNewOpen");
//writeCustomLog("INFO",('[elems3.length]' + elems3.length),"scrapTabelogNewOpen");
  if (elems1 && elems2 && elems3 && elems1.length == elems2.length && elems2.length == elems3.length){
  //writeCustomLog("INFO",('[elems1(2)(3).length]'+ elems1.length),"scrapTabelogNewOpen");
    for(var i in elems1){
      var hrf = "";
      var rnm = "";
      var rgr = "";
      var matchs1 = elems1[i].match(/href=\"(.*)\" target=\"_blank\">(.*)<\/a><span class="\list-rst__area-genre cpy-area-genre\">(.*)<\/span>/i);
      if (matchs1){
      //writeCustomLog("INFO",('[matchs1.length]'+ matchs1.length),"scrapTabelogNewOpen");
        if (matchs1.length == 4){
          hrf = matchs1[1];
          rnm = matchs1[2];
          rgr = matchs1[3];
        }
      }
      var nop = "";
      var matchs2 = elems2[i].match(/<p class=\"list-rst__newopen is-highlight\">([\s\S]*?)<\/p>/);
      if (matchs2){
      //writeCustomLog("INFO",('[matchs2.length]'+ matchs2.length),"scrapTabelogNewOpen");
        if (matchs2.length == 2){
          nop = matchs2[1].replace(/ /g, "");
        }
      }
      var img = "";
      var matchs3 = elems3[i].match(/data-original=\"(.*)\" /);
      if (matchs3){
        //writeCustomLog("INFO",('[matchs3.length]'+ matchs3.length),"scrapTabelogNewOpen");
        if (matchs3.length == 2){
          img = matchs3[1];
        }
      }
    //var msg = '[href]'+hrf + '\n[name]'+rnm + '\n[genre]'+rgr + '\n[open]'+nop + '\n[image]'+img;
    //writeCustomLog("INFO",('[dat]\n' + msg),"scrapTabelogNewOpen");
      datas.push({href:hrf, name:rnm, genre:rgr, open:nop, image:img});
      hrefs+= hrf;
    }
  }
  
  // 今回取得したデータがある場合
  if (datas.length > 0){
    // スクラップ履歴の前回取得テキストを取得
    var histLastText = manageLastScrapText('get', 'scrapTabelogNewOpen', '')
    // 前回取得の結果と不一致ならSlack投稿
    if (histLastText != hrefs){
      var atts = [];
      for (var idxD=0; idxD<=datas.length-1; idxD++) {
        var ttl = "<" + datas[idxD].href + "|" + datas[idxD].name + "> " + datas[idxD].open;
        var txt = datas[idxD].genre;
        if (idxD==0){ 
          atts.push({color:"#ffa129", title:ttl, text:txt, thumb_url:datas[idxD].image,
                     pretext:"<" + url + "|" + title + "> が更新されました。", fallback:title});
        }else{
          atts.push({color:"#ffa129", title:ttl, text:txt, thumb_url:datas[idxD].image});
        }
      }
      postSlackMessage(propertyGet('CHANNEL_ID_LOCALREST'), "webscrap:tabelog", "", ":tabelog:", "", atts);
      // スクラップ履歴の前回取得テキストを更新
      manageLastScrapText('set', 'scrapTabelogNewOpen', hrefs);
    }
  }  
}

// -------------------------------------------------------------
// 最後にスクラップしたテキストを管理する
// -------------------------------------------------------------
var manageLastScrapText = function(type, fname, text){
  var lastText = "";
  // 履歴シート取得
  var sheetId = PropertiesService.getScriptProperties().getProperty("SCRAP_SPREADSHEET_ID");
  var sheetNm = PropertiesService.getScriptProperties().getProperty("SCRAP_SPREADSHEET_NAME");
  var sheet   = SpreadsheetApp.openById(sheetId).getSheetByName(sheetNm);
  var lastRow = sheet.getDataRange().getLastRow();
  var rowIdx;
  // シート行ループ
  for(var idx=2; idx<=lastRow; idx++){
    if (fname == sheet.getRange(idx,1).getValue()){
      rowIdx = idx;
      break;
    }
  }
  var nowDate = new Date();
  if (type == "get"){
    // 取得の場合
    if (!rowIdx){
      // 対象行がない場合は初期化行を設定
      rowIdx = lastRow + 1;
      sheet.getRange(rowIdx,1).setValue(fname); 
      sheet.getRange(rowIdx,2).setValue(""); 
      sheet.getRange(rowIdx,3).setValue(Utilities.formatDate(nowDate,"GMT+0900","yyyy/MM/dd HH:mm:ss")); 
      lastText = "";
    }
    lastText = sheet.getRange(rowIdx,2).getValue();
  }else{
    // 設定の場合、パラメータ行を設定
    sheet.getRange(rowIdx,1).setValue(fname); 
    sheet.getRange(rowIdx,2).setValue(text); 
    sheet.getRange(rowIdx,3).setValue(Utilities.formatDate(nowDate,"GMT+0900","yyyy/MM/dd HH:mm:ss")); 
  }
  writeCustomLog("INFO",('[lastText]'+lastText),"getLastScrapText");
  return lastText;  
}