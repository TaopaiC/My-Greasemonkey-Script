javascript:(function(){
	var s=document.createElement('script');
	s.setAttribute('src','http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.js');
	if(typeof jQuery=='undefined'){
		document.getElementsByTagName('head')[0].appendChild(s);
	}
	var el=document.createElement('div');
	el.style.position='fixed';
	el.style.height='30';
	el.style.width='200';
	el.style.margin='0 auto 0 auto';
	el.id='wretchexpender';
	el.style.top='20';
	el.style.left='40%';
	el.style.padding='5px 10px 5px 10px';
	el.style.backgroundColor='#f99';
	el.innerHTML='展開照片中';
	var b=document.getElementsByTagName('body')[0];b.appendChild(el);

	window.setTimeout(function(){
		var text = jQuery('font.small-e').removeClass('small-e');
		var imgs = jQuery('.side');
    var table = jQuery('table').slice(4,5).empty().html('<tr><td/></tr>');
		var cell = jQuery('td', table);
		var br = jQuery('<br/>');
    imgs.each(function(i) {
	    var a = jQuery('a', this);
	    var img = jQuery('img', a);
			img.attr('src', img.attr('src').replace(/\/thumbs\/t?/, '/'));
			cell.append(a)
				.append(br.clone())
				.append(text.get(i))
				.append(br.clone());
		});
		jQuery('#wretchexpender').fadeOut('slow',function(){jQuery(this).remove()});
		},2500);
})();
// vim7:st=2:sw=2:ts=2
