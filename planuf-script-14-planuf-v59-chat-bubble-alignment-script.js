
(function(){
  if(window.__PLANUF_V59_CHAT_BUBBLES__) return;
  window.__PLANUF_V59_CHAT_BUBBLES__=true;
  function classify(){
    var body=document.querySelector('.conversation-body');
    if(!body) return;
    body.querySelectorAll('.message,[data-message-id]').forEach(function(el){
      var cls=el.className||'';
      var text=(el.getAttribute('data-sender')||el.getAttribute('data-from')||el.getAttribute('data-user')||'').toLowerCase();
      if(String(cls).includes('own') || text==='self' || text==='me' || el.getAttribute('data-current-user-message')==='true'){
        el.classList.add('own');
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',classify); else classify();
  window.addEventListener('hashchange',function(){setTimeout(classify,120)});
  window.addEventListener('planuf-message-auto-refresh',function(){setTimeout(classify,120)});
  window.addEventListener('planuf-soft-message-refresh',function(){setTimeout(classify,120)});
  var obs=new MutationObserver(function(){classify();});
  obs.observe(document.body||document.documentElement,{childList:true,subtree:true});
})();
