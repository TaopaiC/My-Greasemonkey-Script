// ==UserScript==
// @name           Taipei Bus - convert links
// @namespace      http://pctao.org/
// @description    將路線及公車站的連結從 javascript: 改成直接連結.<br/>  Convert Line and BusStop links from javascript: to direct links.
// @author         TaopaiC
// @version        $Id$
// @include        http://www.taipeibus.taipei.gov.tw/emap/program/html/bus_stationcnt.asp*
// @include        http://www.taipeibus.taipei.gov.tw/emap/program/html/bus_cnt.asp*
// @include        http://www.taipeibus.taipei.gov.tw/transit/result1.asp
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.2.6/jquery.min.js
// @require        http://code.google.com/apis/gears/gears_init.js
// ==/UserScript==

(function(){

// -------------------------------------------------------
// Global variables
// -------------------------------------------------------
var hasGears = false;
var console= unsafeWindow.console || {log: function(){}, debug: function(){}};
var server = null;
var store = null;
var db = null;

var regex = { 
    "busstop":   /.*bus_stationcnt.asp\?s=(\d*).*/,
    "showSS":    /.*showSS\(\'(.*)\'\).*/g,
    "showBus":   /.*showBus\(\'(.*)\'\).*/g,
    "showMS":    /.*showMS\(\'(.*)\'\).*/g,
    "href_sid":  /.*bus_stationcnt.asp\?s=(\d*).*/,
    "href_stop": /.*bus_stationcnt.asp\?s=.*/,
    "href_line": /.*bus_cnt.asp\?s=.*/,
    "href_mrt":  /.*\/result1\.asp$/,
    "stop_mrt":  /捷運|台北車站/
};

var url = {
    "busstop": "http://www.taipeibus.taipei.gov.tw/emap/program/html/bus_stationcnt.asp?s=",
    "busline": "http://www.taipeibus.taipei.gov.tw/emap/program/html/bus_cnt.asp?s=",
    "mrt": "http://www.taipeibus.taipei.gov.tw/transit/mstationcnt.asp?s="
}

var regexurl = {
    "busstop": url.busstop + "$1",
    "busline": url.busline + "$1",
    "mrt":     url.mrt + "$1"
}

    function process_busstop_header() {
        if (!hasGears)
            return;

        var sid = location.href.replace( regex.href_sid, "$1" );
        var sname = jQuery("td.mtext1:contains('站位名稱')").next().text();
        var sarea = jQuery("td.mtext1:contains('所在行政區')").next().text();
        var sroad = jQuery("td.mtext1:contains('所在道路')").next().text();

        var rs = db.execute( 'SELECT SId,isLoaded from BusStop where SId = ?', [ sid ] );
        if (rs.isValidRow()) {
            if (rs.field(1) == 1)
                // dont need update
                return;

            db.execute('UPDATE BusStop SET Name=?,Area=?,Road=?,isLoaded=1 WHERE SId = ?', 
                    [sname, sarea, sroad, sid]);
        } else {
            db.execute('INSERT into BusStop values (?, ?, ?, ?, 1)', 
                    [sid, sname, sarea, sroad]);
        }
    }

    function process_busline_header() {
        if (!hasGears)
            return;

        var lname = jQuery("td.mtext1:contains('路線編號')").next().text();
        var lid = query_lid(lname, 0);
        var lStartStop = jQuery("td.mtext1:contains('起點')").next().text();
        var lEndStop   = jQuery("td.mtext1:contains('迄點')").next().text();

        db.execute('UPDATE BusLine SET Name=?,StartStop=?,EndStop=?,isLoaded=1 WHERE LId = ?', 
                    [lname, lStartStop, lEndStop, lid]);
    }

    function process_busline(table) {
        var lname = jQuery("td.mtext1:contains('路線編號')").next().text();
        var lid = query_lid(lname, 0);
        console.debug("lname:" + lname + "  lid:" + lid);

        // new table
        var newTable = jQuery("<table id ='newTable' class='newTable'><thead><tr><td class='name'>站名</td></tr></thead><tbody></tbody></table>");
        var newTableBody = jQuery("tbody", newTable);

        if (hasGears) {
            jQuery("<td class='area'>地點</td>").prependTo(jQuery("thead>tr", newTable));
            jQuery("<td class='otherbus'>路線</td>"  ).appendTo( jQuery("thead>tr", newTable));
        }

        var org_tr       = jQuery("<tr></tr>");
        var org_tdname   = jQuery("<td class='name'/>");
        var org_tdarea   = jQuery("<td class='area'/>");
        var org_otherbus = jQuery("<td class='otherbus'/>");
        var org_a        = jQuery("<a/>");

        //db.execute( 'CREATE TEMP VIEW STOPLINE AS SELECT BusLine.Name BusStopLine.SId FROM BusLine left join BusStopLine on BusLine.lid=BusStopLine.lid WHERE BusStopLine.lid=? ORDER BY BusLine.Name', [ lid ] );

        jQuery("a", table).each( function(i, val) {
            var tthis = jQuery(this);
                var sid = tthis.attr("href").replace( regex.showSS, "$1" );
                var sname = tthis.text();
                var href = url.busstop + sid;
                tthis.attr("href", href);

                var tr = org_tr.clone();
                if ( sname.match(regex.stop_mrt) )
                    tr.addClass('mrt');
                tthis.clone().appendTo(tr).wrap(org_tdname.clone());

            try {
                if (hasGears) {
                    var needupdate = insert_sid(sid, sname);
                    if (needupdate == true)
                        insert_sidlid(sid,lid,i+1);

                    var rs = db.execute( 'select Area,Road from BusStop where SId = ?', [ sid ] );
                    if (rs.isValidRow()) {
                        if (rs.field(0) != null) {
                            org_tdarea.clone().text(rs.field(0) + rs.field(1)).prependTo(tr);
                        } else {
                            org_tdarea.clone().prependTo(tr);
                        }
                        rs.close();
                    } else {
                        org_tdarea.clone().prependTo(tr);
                    }

                    var otherbus = org_otherbus.clone().appendTo(tr);

                    // TODO: need rewrite
                    rs = db.execute( 'SELECT BusLine.Name FROM BusLine left join BusStopLine on BusLine.lid=BusStopLine.lid WHERE BusStopLine.sid=? ORDER BY BusLine.Name', [ sid ] );
                    while (rs.isValidRow()) {
                        var lname = rs.field(0);
                        var a = org_a.clone().text(lname).attr("href", url.busline + lname);
                        a.appendTo(otherbus);
                        rs.next();
                    }
                    rs.close();
                }
            } catch (e) {
                console.debug("error process_busline:" + e);
            }

            tr.appendTo(newTableBody);
        });
        newTable.insertAfter(table).wrap("<tr><td colspan='4'/></tr>");
    }

    function process_busstop(table) {
        try {

        var sid = location.href.replace( regex.href_sid, "$1" );
        var newTable = jQuery("<table class='newTable'><thead><tr><td class='line'>路線</td></tr></thead><tbody></tbody></table>");
        var newTableBody = jQuery("tbody", newTable);
        if (hasGears) {
            jQuery("<td class='start'>起點</td>").prependTo(jQuery("thead>tr", newTable));
            jQuery("<td class='end'>迄點</td>"  ).appendTo( jQuery("thead>tr", newTable));
        }
        jQuery("a", table).each( function(i, val) {
                var lname = jQuery(this).attr("href").replace( regex.showBus, "$1" );
                var href = url.busline + lname;
                jQuery(this).attr("href", href);

                var tr = jQuery("<tr></tr>");
                jQuery(this).clone().appendTo(tr).wrap("<td class='line'/>");

                if (hasGears) {
                    var lid = query_lid(lname, 0);
                    console.debug("line:" + lname + " : "+ query_lid(lname, 0));
                    insert_sidlid(sid,lid,0);

                    var rs = db.execute( 'SELECT StartStop,EndStop FROM BusLine WHERE LId=? AND isLoaded=1', [ lid ] );
                    if (rs.isValidRow()) {
                        var lStartStop = rs.field(0);
                        var lEndStop = rs.field(1);
                        jQuery("<td class='start'/>").text(lStartStop).prependTo(tr);
                        jQuery("<td class='end'/>"  ).text(lEndStop  ).appendTo(tr);
                    } else {
                        jQuery("<td class='start'/>").prependTo(tr);
                        jQuery("<td class='end'/>"  ).appendTo(tr);
                    }
                    rs.close();
                }
                tr.appendTo(newTableBody);
        });
        newTable.insertAfter(table.parent().next()).wrap("<tr><td colspan='2'/></tr>");

        } catch (e) {
            console.debug("error process_busline:" + e);
        }
    }

    function process_searchresult() {
        jQuery("a").each( function(i, val) {
            var oldhref = jQuery(this).attr("href");
            if (oldhref == null)
                return;
            var ahref = oldhref
                .replace( regex.showBus, regexurl.busline )
                .replace( regex.showSS,  regexurl.busstop )
                .replace( regex.showMS,  regexurl.mrt );
            if (oldhref != ahref)
                jQuery(this).attr("href", ahref);
        } );
    }

    function myjob()
    {
        try {

            jQuery("body>table").attr("width", 600);

            if (location.href.match( regex.href_mrt )) {
                process_searchresult();
            } else if (location.href.match( regex.href_line )) {
                table = jQuery("td.mtext1:contains('路線資訊')").parent().next();
                if (table.length > 0) {
                    process_busline_header();
                    process_busline(table);
                }
            } else if (location.href.match( regex.href_stop )) {
                table = jQuery("td.mtext1:contains('停靠路線')").next();;
                if (table.length > 0) {
                    process_busstop_header();
                    process_busstop(table);
                }
            }

        } catch (e) {
            console.debug("error process_busline:" + e);
        }
    }

    function loadSnap() {
        var script= document.createElement('script');
        script.type= 'text/javascript';
        script.src= 'http://shots.snap.com/ss/053d995628053581b456595b40596e61/snap_shots.js';
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    function insert_sidlid(sid, lid, no) {
        // insert sid<->lid and no
        if (!hasGears)
            return;
        var rs = db.execute( 'select LId,SId,No from BusStopLine where SId = ? AND LId = ?', [ sid, lid ] );
        if (rs.isValidRow()) {
            var nno = rs.field(2);
            rs.close();

            if ( (no != 0) && (nno == 0) )
                db.execute('UPDATE BusStopLine SET No=? WHERE LId = ? AND SId = ?', [ no, lid, sid ] ); 

            return;
        } else {
            // no this busline, add one
            rs.close();
            db.execute('REPLACE into BusStopLine values (?, ?, ?)', 
                    [ sid, lid, no ] );
            rs.close();
            return;
        }
        rs.close();
        return;
    }

    function insert_sid(sid, sname) {
    // insert [sid,sname] to BusStop. (isLoaded=0)
    //   return true  if isLoaded=0 | need update
    //          false if isLoaded=1 | dont need update (also no gear)  
        if (!hasGears)
            return false;
        var rs = db.execute( 'select isLoaded from BusStop where SId = ?', [ sid ] );
        if (rs.isValidRow()) {
            var result = (rs.field(0) == 0) ? true : false;
            rs.close();
            return result;
        } else {
            // no this busstop, add one
            rs.close();
            db.execute('REPLACE into BusStop values (?, ?, NULL, NULL, 0)', 
                    [ sid, sname ] );
            return true;
        }
    }

    function query_lid(lname, isLoaded) {
        // return lid : bus line id
        // isLoaded: 0:部份資料 1:全部資料
        //   0->1需要UPDATE
        if (!hasGears)
            return null;
        try {
            console.debug("query_lid:" + lname);
            var lid;
            var rs = db.execute( 'select LId,isLoaded from BusLine where Name = ?', [ lname ] );
            if (rs.isValidRow()) {
                lid = rs.field(0);
                rs.close();
                if ( (isLoaded == 1) && (rs.field(1) == 0) ) {
                    db.execute('UPDATE BusLine SET isLoaded=? WHERE LId = ?', [ isLoaded, lid ] ); 
                }
                return lid;
            } else {
                // no this busline, add one
                rs.close();
                db.execute('REPLACE into BusLine values (NULL, ?, ?, NULL, NULL)', 
                        [ lname, isLoaded ] );
                rs = db.execute( 'select LId from BusLine where Name = ?', [ lname ] );
                if (rs.isValidRow()) {
                    lid = rs.field(0);
                    rs.close();
                    return lid;
                }
            }
            rs.close();
            return null;
        } catch (e) {
            rs.close();
            console.debug("error process_busline:" + e);
        }
    }

    function initGears() {
        if (!unsafeWindow.google) unsafeWindow.google = {};
        if (!unsafeWindow.google.gears){
            unsafeWindow.google.gears= {factory: new GearsFactory()};
        }
        try {
            server = unsafeWindow.google.gears.factory.create('beta.localserver', '1.0');
            store = server.createStore("taipeibus");
            db = unsafeWindow.google.gears.factory.create('beta.database', '1.0');
            if (db) {
                db.open('taipeibus');
                // BusStop
                db.execute('create table if not exists BusStop' +
                    ' (SId INTEGER, Name varchar(128), Area varchar(128), Road varchar(128), isLoaded INTEGER)');
                db.execute('CREATE INDEX if not exists BS_SID' + 
                    ' ON BusStop (SId ASC)');
                // BusLine
                db.execute('create table if not exists BusLine' +
                    ' (LId INTEGER NOT NULL PRIMARY KEY, Name varchar(128), isLoaded INTEGER, StartStop varchar(64), EndStop varchar(64))');
                db.execute('CREATE INDEX if not exists BL_LID' + 
                    ' ON BusLine (LId ASC)');
                db.execute('CREATE INDEX if not exists BL_LIDNAME' + 
                    ' ON BusLine (LId ASC, Name ASC)');
                // BusStop -> lines
                db.execute('create table if not exists BusStopLine' +
                    ' (SId INTEGER, LId INTEGER, No INTEGER)');
                db.execute('CREATE INDEX if not exists BSL_LID' + 
                    ' ON BusStopLine (LId ASC)');
                db.execute('CREATE INDEX if not exists BSL_SID' + 
                    ' ON BusStopLine (SId ASC)');
            }
            hasGears = true;
            console.debug("done");
        } catch(e) {
            console.debug("error:" + e);
        }
    }

    function triggerAllowGearsDialog() {
        alert("trigger");
        window.addEventListener("load",
            function() {
                new GearsFactory().create("beta.localserver", "1.0");
                location.href = location.href;
                return false;
            },
        true);
    }
    function caltime(starttime, endtime) {
        var sec = endtime.getSeconds() - starttime.getSeconds();
        var msec = endtime.getMilliseconds() - starttime.getMilliseconds();
        var allmsec = sec * 1000 + msec;
        return allmsec;
    }
    function init() {
        initGears();
        if (!server) {
            triggerAllowGearsDialog();
        }
        GM_addStyle(
            "table.newTable {font-size: 14px}" +
            "table.newTable tr.mrt {background:#AA0}" + 
            "table.newTable tr {border: 1px solid #333}" +
//            "table.newTable td {border: 1px solid #000000}" +
            "table.newTable td.name {width: 220px}" +
            "table.newTable td.area {width: 100px}" +
            "table.newTable td.otherbus {width: 400px}" +
            "table.newTable td.start {width: 190px; text-align:right}" +
            "table.newTable td.line  {width: 200px; text-align:center}" +
            "table.newTable td.end   {width: 200px}"
        );
        var starttime = new Date();
        myjob();
        var endtime = new Date();
        console.debug("exec " + caltime(starttime, endtime) + " msec");
        loadSnap();
    }

    init();
})();
// vim6:set et ts=4 sw=4:
