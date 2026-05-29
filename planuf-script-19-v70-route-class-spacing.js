// Planuf v70: set a reliable body route class so spacing fixes only affect the visible route.
(function(){
  if(window.__PLANUF_V70_ROUTE_CLASS__) return;
  window.__PLANUF_V70_ROUTE_CLASS__=true;
  function routeFromHash(){
    var h=String(location.hash||'').toLowerCase();
    if(h.includes('message')||h.includes('chat')) return 'messages';
    if(h.includes('marketing')) return 'marketing';
    if(h.includes('budget')) return 'budget';
    if(h.includes('idea')) return 'ideas';
    return 'home';
  }
  function routeFromActiveNav(){
    var active=document.querySelector('.nav-item.active,.nav-list button.active,.sidebar button.active,[aria-current="page"]');
    var t=String(active&&active.textContent||'').toLowerCase();
    if(t.includes('message')) return 'messages';
    if(t.includes('marketing')) return 'marketing';
    if(t.includes('budget')) return 'budget';
    if(t.includes('idea')) return 'ideas';
    if(t.includes('home')) return 'home';
    return routeFromHash();
  }
  function apply(){
    var route=routeFromActiveNav();
    document.body.classList.remove('planuf-route-home','planuf-route-ideas','planuf-route-budget','planuf-route-marketing','planuf-route-messages');
    document.body.classList.add('planuf-route-'+route);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
  window.addEventListener('hashchange',function(){setTimeout(apply,30)});
  document.addEventListener('click',function(){setTimeout(apply,80)},true);
  var t=null;new MutationObserver(function(){clearTimeout(t);t=setTimeout(apply,100);}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']});
})();
