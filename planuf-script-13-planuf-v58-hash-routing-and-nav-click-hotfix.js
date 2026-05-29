
(function(){
  if(window.__PLANUF_V58_ROUTING_HOTFIX__) return;
  window.__PLANUF_V58_ROUTING_HOTFIX__=true;
  var routes={home:'/',ideas:'/ideas',idea:'/ideas',budget:'/budget',marketing:'/marketing',messages:'/messages',message:'/messages'};
  function normaliseRouteFromText(text){
    text=String(text||'').trim().toLowerCase();
    if(!text) return '';
    if(text.includes('home')) return '/';
    if(text.includes('idea')) return '/ideas';
    if(text.includes('budget')) return '/budget';
    if(text.includes('marketing')) return '/marketing';
    if(text.includes('message')) return '/messages';
    return '';
  }
  function setRoute(route){
    if(!route) return;
    if(location.hash !== '#'+route) location.hash = route;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  // If the app is ever loaded at a real path, convert to hash routing so refresh does not request a missing GitHub Pages path next time.
  function repairCurrentUrl(){
    try{
      if(location.hash && location.hash.startsWith('#/')) return;
      var parts=(location.pathname||'/').split('/').filter(Boolean);
      var known=['ideas','budget','marketing','messages','schedule','admin','people','profile'];
      var idx=parts.findIndex(function(p){return known.indexOf(String(p).toLowerCase())!==-1;});
      if(idx>=0){
        var route='/'+parts.slice(idx).join('/');
        var baseParts=parts.slice(0,idx);
        var base='/' + (baseParts.length?baseParts.join('/') + '/':'');
        history.replaceState({},'',base+'index.html#'+route);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    }catch(e){}
  }
  repairCurrentUrl();
  document.addEventListener('click',function(ev){
    var tab=ev.target && ev.target.closest && ev.target.closest('.nav-tab,.nav-tabs button,.nav-tabs a');
    if(!tab) return;
    var route=tab.getAttribute('data-route') || tab.getAttribute('href') || normaliseRouteFromText(tab.textContent||tab.getAttribute('aria-label'));
    if(!route) return;
    route=route.replace(/^#/, '');
    if(!route.startsWith('/')) route=normaliseRouteFromText(route) || '/';
    ev.preventDefault();
    ev.stopPropagation();
    setRoute(route);
  },true);
  document.addEventListener('touchend',function(ev){
    var tab=ev.target && ev.target.closest && ev.target.closest('.nav-tab,.nav-tabs button,.nav-tabs a');
    if(!tab) return;
    var route=normaliseRouteFromText(tab.textContent||tab.getAttribute('aria-label'));
    if(!route) return;
    ev.preventDefault();
    ev.stopPropagation();
    setRoute(route);
  },{capture:true,passive:false});
})();
