$("p.install-button:has(a[iseulapagelink!=true])").prepend($('<input type="checkbox" class="install" checked="checked">安裝</input>'));
$("<button>安裝</button>").click(function(i){
var l = {};
var amo = "https://addons.mozilla.org/";
$("div.item:has(input.install:checked)").each(function(i) {
  var a = $(this).find("a.button.positive");
  l[a.attr('addonname')] = {
    URL: amo + a.attr("href"),
    IconURL: amo + $(this).find("img.icon").attr("src"),
    Hash: a.attr('addonhash')
  };
} );
window.InstallTrigger.install(l);
return false;
} ).appendTo($("form:has(select#sortby)"));
