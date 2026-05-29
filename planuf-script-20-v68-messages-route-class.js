// Planuf v68-stable: add a body class only when the active visible page is Messages, and force-bind the chat back button.
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

  function goBackToChatList(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    var layouts=Array.from(document.querySelectorAll('.messages-layout'));
    layouts.forEach(function(layout){
      layout.classList.remove('planuf-chat-open');
      layout.classList.remove('chat-open');
      layout.classList.remove('show-chat');
      var detail=layout.querySelector('.chat-detail,.chatView,[data-chat-detail]');
      var sidebar=layout.querySelector('.chat-sidebar,.feed,[data-chat-list]');
      if(detail){ detail.style.display='none'; }
      if(sidebar){ sidebar.style.display='flex'; }
    });
    if(location.hash.toLowerCase().includes('messages/')){
      try{ history.replaceState(null,'',location.pathname+location.search+'#/messages'); }
      catch(e){ location.hash='#/messages'; }
    }
    document.body.classList.add('planuf-messages-route');
  }

  function bindBackButtons(){
    var selectors=[
      '.messages-layout .planuf-chat-back-button',
      '.messages-layout button[aria-label*="Back" i]',
      '.messages-layout button[title*="Back" i]',
      '.messages-layout .chat-header button:first-child',
      '.messages-layout .chatTop button:first-child'
    ].join(',');
    Array.from(document.querySelectorAll(selectors)).forEach(function(btn){
      var btnText=text(btn);
      var looksLikeCreateIdea=btnText.includes('create') || btnText.includes('idea');
      if(looksLikeCreateIdea) return;
      if(btn.dataset.planufBackBound==='1') return;
      btn.dataset.planufBackBound='1';
      btn.addEventListener('click',goBackToChatList,true);
      btn.addEventListener('touchend',goBackToChatList,true);
    });
  }

  function apply(){
    document.body.classList.toggle('planuf-messages-route', isMessagesActive());
    bindBackButtons();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
  window.addEventListener('hashchange',function(){ setTimeout(apply,60); });
  window.addEventListener('resize',apply);
  document.addEventListener('click',function(){ setTimeout(apply,80); },true);
  var timer=null;
  new MutationObserver(function(){ clearTimeout(timer); timer=setTimeout(apply,100); }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-current']});
})();
