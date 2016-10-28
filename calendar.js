propertySet('CHANNEL_ID_CALENDAR','XXXXXXXXX');
propertySet('CALENDAR_ACCOUNT',   'xxxxxxxxx@gmail.com');

// -------------------------------------------------------------
// -------------------------------------------------------------
function sch_googleCalendar(){
  postSlackMessage(propertyGet('CHANNEL_ID_CALENDAR'), "ScheduleBot", 
                   getCalendar(propertyGet('CALENDAR_ACCOUNT'), 21), ":calendar:", "", "");
}

// -------------------------------------------------------
// -------------------------------------------------------
var getCalendar = function(cal_id, day_cnt){

  writeCustomLog("INFO",('cal_id is "%s",day_cnt is "%s".', cal_id, day_cnt),"getCalendar");
  
  var list = "";

  var cal = CalendarApp.getCalendarById(cal_id);
  var startTime = new Date();
  var endTime   = new Date();
  startTime.setDate(startTime.getDate());
    endTime.setDate(  endTime.getDate()+day_cnt);
  writeCustomLog("INFO",('startTime is "%s",endTime is "%s".', startTime, endTime),"getCalendar");

  var events = cal.getEvents(startTime, endTime)
  for(var i=0; i < events.length; i++){
    var sch = "";
    var myDay = Utilities.formatDate(events[i].getStartTime(), "JST" , "u");  
    var youbi = "(" + myTbl[myDay] + ")";
    if (events[i].isAllDayEvent()) {
      sch += Utilities.formatDate(events[i].getStartTime(),"GMT+0900","MM/dd ") + youbi + " 00:00-23:59 " ;
    } else {
      sch += Utilities.formatDate(events[i].getStartTime(),"GMT+0900","MM/dd ") + youbi + " ";
      sch += Utilities.formatDate(events[i].getStartTime(),"GMT+0900","HH:mm");
      sch += Utilities.formatDate(events[i].getEndTime(),  "GMT+0900","-HH:mm  ");
    }
    sch += events[i].getTitle();

    if (i <= 5){
      var loc = events[i].getLocation();
      if (loc != ""){ sch += " @" + loc; }
    }
    list += "\n" + sch;
  }
}
