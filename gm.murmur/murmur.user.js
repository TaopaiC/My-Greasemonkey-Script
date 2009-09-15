scr_meta=<><![CDATA[
// ==UserScript==
// @name           Murmur
// @namespace      org.pctao
// @description    Murmur
// @include        http://murmur.tw/*
// ==/UserScript==
]]></>;
$ = unsafeWindow.jQuery;
var console= unsafeWindow.console || {log: function(){}, debug: function(){}, error: function() {}};
$("a.hideb").live("click", function() {
	$(this).parents(".murmur-box").find(".murmur-comments").toggle();
	return false;
});

function update_view() {
	var new_boxes = $("li.murmur-box:not(:has('a.hideb'))");
	var hidebutton = $("<a/>").text("顯示").addClass("hideb");
	$(".murmur-links", new_boxes).append(" | ").append(hidebutton);
	$(".murmur-avatar img", new_boxes).css({width:"30px",height:"30px"});
	$(".murmur-content .murmur-footer", new_boxes).css({backgroundImage: "none", overflow:"visible"});
	$(".murmur-content .murmur-body", new_boxes).css("min-height","30px");
	$(".murmur-box:has(.comment-content.unread-comment)", new_boxes).css({backgroundColor:"#000"});
	$(".murmur-comments", new_boxes).toggle();
}

var is_scroll_bottom = function() {
	  var documentHeight = $(document).height();
	  var scrollPosition = $(window).height() + $(window).scrollTop();
	  return (documentHeight == scrollPosition);
}
update_view();

$(window).scroll(function(){
	if( is_scroll_bottom() ) {
		$('.more-murmurs a').click();	}
} );

var old_update_mmbox = unsafeWindow.murmur.update_murmurbox;
unsafeWindow.murmur.update_murmurbox = function() {
	old_update_mmbox();
	update_view();
};
