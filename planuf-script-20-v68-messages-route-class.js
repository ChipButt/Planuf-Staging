// Planuf v68-stable: add a body class only when the active visible page is Messages.
(function(){
  if(window.__PLANUF_V68_MESSAGES_ROUTE_CLASS__) return;
  window.__PLANUF_V68_MESSAGES_ROUTE_CLASS__=true;

  function text(el){ return String((el && (el.textContent || el.getAttribute && el.getAttribute('aria-label'))) || '').toLowerCase(); }

  function isMessagesActive(){
    var activeNav=document.querySelector('.nav-item.active,.nav-list button.active,.sidebar button.active,[aria-current="page"]');
    if(activeNav && text(activeNav).includes('message')) return true;

    var hash=String(location.hash||'').toLowerCase();
    if(hash.includes('message') || hash.includes('chat')) return true;

    var panels=Array.from(document.querySelectorAll('.messages-layout'));
    return panels.some(function(panel){
      var style=getComputedStyle(panel);
      if(style.display==='none' || style.visibility==='hidden') return false;
      var rect=panel.getBoundingClientRect();
      return rect.width>20 && rect.height>20 && rect.bottom>0 && rect.top < window.innerHeight;
    });
  }

  function apply(){
    document.body.classList.toggle('planuf-messages-route', isMessagesActive());
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
  window.addEventListener('hashchange',function(){ setTimeout(apply,60); });
  window.addEventListener('resize',apply);
  document.addEventListener('click',function(){ setTimeout(apply,80); },true);
  var timer=null;
  new MutationObserver(function(){ clearTimeout(timer); timer=setTimeout(apply,100); }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-current']});
})();
