(function(){
  var dataEl=document.getElementById('projects');
  if(!dataEl) return;
  var P=JSON.parse(dataEl.textContent), role=dataEl.dataset.role;
  var peek=document.getElementById('peek'), peekImg=peek&&peek.querySelector('img');
  var sheet=document.getElementById('sheet'), lastFocus=null, openIdx=-1;
  var thumb=function(id,w){return 'https://i.vimeocdn.com/video/'+id+'_'+(w||960)};
  var rt=function(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]})};

  // Hover still: fixed in the center of the screen, fades in after a short pause
  var showT=null, visible=false;
  document.querySelectorAll('.row').forEach(function(r){
    var i=+r.dataset.i;
    r.addEventListener('mouseenter',function(){
      if(!peek)return; clearTimeout(showT);
      showT=setTimeout(function(){ peekImg.src=thumb(P[i].cuts[0].thumb); visible=true; peek.classList.add('on') }, visible?0:140);
    });
    r.addEventListener('mouseleave',function(){ clearTimeout(showT) });
    r.addEventListener('click',function(e){ e.preventDefault(); open(i,true) });
  });
  var list=document.querySelector('.list');
  list&&list.addEventListener('mouseleave',function(){ clearTimeout(showT); visible=false; peek&&peek.classList.remove('on') });
  // Warm the cache for the first few stills
  P.slice(0,6).forEach(function(p){var im=new Image();im.src=thumb(p.cuts[0].thumb)});

  function player(c,auto){
    var q='?'+(c.hash?'h='+c.hash+'&':'')+'title=0&byline=0&portrait=0&dnt=1'+(auto?'&autoplay=1':'');
    return '<div class="player" style="aspect-ratio:'+c.w+'/'+c.h+'"><iframe src="https://player.vimeo.com/video/'+c.vimeo+q+'" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="'+esc(c.title||'')+'"></iframe></div>';
  }
  function open(i,push){
    var p=P[i]; openIdx=i; clearTimeout(showT); visible=false; peek&&peek.classList.remove('on');
    if(!lastFocus) lastFocus=document.activeElement;
    var n=P.length, prev=P[(i-1+n)%n], next=P[(i+1)%n], multi=p.cuts.length>1;
    var cuts=p.cuts.map(function(c,k){
      c.title=p.title;
      return '<div class="cut">'+(multi?'<div class="cut-label"><span>'+esc(c.label||('Cut '+(k+1)))+'</span><span>'+rt(c.seconds)+'</span></div>':'')+player(c,k===0)+'</div>';
    }).join('');
    sheet.innerHTML='<div class="sheet-in">'+
      '<div class="sheet-top"><span class="meta">'+esc(role)+' · '+(i+1)+' / '+n+'</span><button class="btn-text" id="closeBtn" type="button">Close</button></div>'+
      cuts+
      '<h2 id="sheetTitle">'+esc(p.title)+'</h2>'+
      '<dl class="credits"><div><dt>Client</dt><dd>'+esc(p.client)+'</dd></div><div><dt>Role</dt><dd>'+esc(role)+'</dd></div>'+
      (multi?'<div><dt>Versions</dt><dd>'+p.cuts.map(function(c){return esc(c.label)+' '+rt(c.seconds)}).join(' · ')+'</dd></div>':'<div><dt>Runtime</dt><dd>'+rt(p.cuts[0].seconds)+'</dd></div>')+
      (p.aspect?'<div><dt>Aspect ratio</dt><dd>'+esc(p.aspect)+'</dd></div>':'')+
      (p.credits?'<div><dt>Credits</dt><dd>'+esc(p.credits)+'</dd></div>':'')+'</dl>'+
      '<div class="nav2"><button class="btn-text" id="prevBtn" type="button">← '+esc(prev.title)+'</button><button class="btn-text" id="nextBtn" type="button">'+esc(next.title)+' →</button></div></div>';
    sheet.hidden=false; document.body.style.overflow='hidden';
    document.getElementById('closeBtn').onclick=close;
    document.getElementById('prevBtn').onclick=function(){open((i-1+n)%n,true)};
    document.getElementById('nextBtn').onclick=function(){open((i+1)%n,true)};
    document.getElementById('closeBtn').focus();
    if(push) history.replaceState(null,'','#'+p.slug);
    document.title=p.title+' — '+p.client+' · Alex Corn';
  }
  function close(){
    sheet.hidden=true; sheet.innerHTML=''; document.body.style.overflow='';
    history.replaceState(null,'',location.pathname+location.search);
    document.title=dataEl.dataset.title;
    if(lastFocus&&lastFocus.focus) lastFocus.focus(); lastFocus=null;
  }
  document.addEventListener('keydown',function(e){
    if(sheet.hidden)return; var n=P.length;
    if(e.key==='Escape')close();
    if(e.key==='ArrowRight')open((openIdx+1)%n,true);
    if(e.key==='ArrowLeft')open((openIdx-1+n)%n,true);
  });
  function fromHash(){
    var s=decodeURIComponent(location.hash.slice(1)); if(!s){ if(!sheet.hidden)close(); return }
    for(var i=0;i<P.length;i++) if(P[i].slug===s){ open(i,false); return }
  }
  window.addEventListener('hashchange',fromHash);
  fromHash();
})();
