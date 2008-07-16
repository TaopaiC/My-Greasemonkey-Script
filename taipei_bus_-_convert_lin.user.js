// ==UserScript==
// @name           Taipei Bus - convert links
// @namespace      http://pctao.org/
// @description    將路線及公車站的連結從 javascript: 改成直接連結.<br/>  Convert Line and BusStop links from javascript: to direct links.
// @author         TaopaiC
// @version        $Id$
// @include        http://www.taipeibus.taipei.gov.tw/emap/program/html/bus_stationcnt.asp*
// @include        http://www.taipeibus.taipei.gov.tw/emap/program/html/bus_cnt.asp*
// ==/UserScript==

(function(){
    function process_busline(table) {
        jQuery("a", table).each( function(i, val) {
          href = jQuery(this).attr("href").replace( /.*showSS\(\'(.*)\'\).*/g, "http://www.taipeibus.taipei.gov.tw/emap/program/html/bus_stationcnt.asp?s=$1" );
          jQuery(this).attr("href", href);
        });
    }
    function process_busstop(table) {
        jQuery("a", table).each( function(i, val) {
          href = jQuery(this).attr("href").replace( /.*showBus\(\'(.*)\'\).*/g, "http://www.taipeibus.taipei.gov.tw/emap/program/html/bus_cnt.asp?s=$1" );
          jQuery(this).attr("href", href);
        });
    }
    function myjob()
    {
        table = jQuery("td.mtext1:contains('路線資訊')").parent().next();
        if (table.length > 0)
            process_busline();

        table = jQuery("td.mtext1:contains('停靠路線')").next();;
        if (table.length > 0)
            process_busstop();
    }
    function loadSnap() {
        var script= document.createElement('script');
        script.type= 'text/javascript';
        script.src= 'http://shots.snap.com/ss/053d995628053581b456595b40596e61/snap_shots.js';
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    GM_xmlhttpRequest({
        method: 'GET',
        url: 'http://ajax.googleapis.com/ajax/libs/jquery/1.2.6/jquery.min.js',
        onload: function(r){ eval(r.responseText); myjob(); loadSnap();}
        });
})();
// vim6:set et ts=4 sw=4:
