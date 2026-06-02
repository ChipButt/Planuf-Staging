// Planuf v71: messages route class, back-button binding, and surgical chat banner cleanup.
(function(){
  if(window.__PLANUF_V68_MESSAGES_ROUTE_CLASS__) return;
  window.__PLANUF_V68_MESSAGES_ROUTE_CLASS__=true;

  var suppressChatOpenUntil=0;
  var lastMessagesNavActivationAt=0;

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

  function forceChatList(){
    var layouts=Array.from(document.querySelectorAll('.messages-layout'));
    layouts.forEach(function(layout){
      layout.classList.remove('planuf-chat-open','chat-open','show-chat','open-chat','active-chat');
      layout.dataset.planufForceList='1';
      var detail=layout.querySelector('.chat-detail,.chatView,[data-chat-detail]');
      var sidebar=layout.querySelector('.chat-sidebar,.feed,[data-chat-list]');
      if(detail){ detail.style.setProperty('display','none','important'); }
      if(sidebar){ sidebar.style.setProperty('display','flex','important'); }
    });
    document.body.classList.add('planuf-messages-route','planuf-force-chat-list');
  }

  function releaseForcedList(){
    document.body.classList.remove('planuf-force-chat-list');
    Array.from(document.querySelectorAll('.messages-layout')).forEach(function(layout){
      delete layout.dataset.planufForceList;
      var detail=layout.querySelector('.chat-detail,.chatView,[data-chat-detail]');
      var sidebar=layout.querySelector('.chat-sidebar,.feed,[data-chat-list]');
      if(detail){ detail.style.removeProperty('display'); }
      if(sidebar){ sidebar.style.removeProperty('display'); }
    });
  }

  function goBackToChatList(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    suppressChatOpenUntil=Date.now()+2000;
    try{ sessionStorage.removeItem('planuf_active_thread_id'); }catch(e){}
    try{ sessionStorage.removeItem('planuf_selected_thread_id'); }catch(e){}
    try{ localStorage.removeItem('planuf_active_thread_id'); }catch(e){}
    try{ localStorage.removeItem('planuf_selected_thread_id'); }catch(e){}

    if(location.hash.toLowerCase().includes('messages/')){
      try{ history.pushState(null,'',location.pathname+location.search+'#/messages'); }
      catch(e){ location.hash='#/messages'; }
      try{ window.dispatchEvent(new HashChangeEvent('hashchange')); }catch(e){ window.dispatchEvent(new Event('hashchange')); }
    } else if(!location.hash.toLowerCase().includes('messages')){
      location.hash='#/messages';
    }

    forceChatList();
    setTimeout(forceChatList,50);
    setTimeout(forceChatList,150);
    setTimeout(forceChatList,350);
    setTimeout(forceChatList,750);
    setTimeout(forceChatList,1250);
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
      btn.addEventListener('touchstart',function(event){ event.stopPropagation(); },true);
      btn.addEventListener('touchend',goBackToChatList,true);
    });
  }

  function bindMessagesNavButtons(){
    var selectors=[
      '.sidebar button',
      '.sidebar .nav-item',
      '.nav-list button',
      '.nav-item',
      '.nav-tabs button',
      '.nav-tab'
    ].join(',');
    Array.from(document.querySelectorAll(selectors)).forEach(function(btn){
      if(btn.closest && btn.closest('.messages-layout')) return;
      var btnText=text(btn);
      if(!btnText.includes('message')) return;
      if(btn.dataset.planufMessagesListBound==='1') return;
      btn.dataset.planufMessagesListBound='1';
      btn.addEventListener('click',goBackToChatList,true);
      btn.addEventListener('touchend',goBackToChatList,true);
    });
  }

  function messagesNavTarget(event){
    var target=event && event.target && event.target.closest ? event.target.closest('.nav-tabs button,.nav-tab,.sidebar button,.sidebar .nav-item,.nav-list button,.nav-item') : null;
    if(!target) return null;
    if(target.closest && target.closest('.messages-layout')) return null;
    return text(target).includes('message') ? target : null;
  }

  function handleMessagesNavActivation(event){
    if(!messagesNavTarget(event)) return;
    var now=Date.now();
    if(now-lastMessagesNavActivationAt<650){
      if(event){ event.preventDefault(); event.stopPropagation(); }
      return;
    }
    lastMessagesNavActivationAt=now;
    goBackToChatList(event);
  }

  function bindChatRows(){
    var selectors='.messages-layout .chat-row,.messages-layout .record-row,.messages-layout .item-list button';
    Array.from(document.querySelectorAll(selectors)).forEach(function(row){
      if(row.dataset.planufOpenBound==='1') return;
      row.dataset.planufOpenBound='1';
      row.addEventListener('click',function(){ suppressChatOpenUntil=0; releaseForcedList(); },true);
      row.addEventListener('touchend',function(){ suppressChatOpenUntil=0; releaseForcedList(); },true);
    });
  }

  function stripChatMembersText(container){
    if(!container) return;
    var walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT,null);
    var nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var value=String(node.nodeValue||'');
      if(/chat\s+members\s*:/i.test(value)){
        node.nodeValue=value.replace(/\s*Chat\s+Members\s*:\s*[^\n\r]*/ig,'');
      }
    });
  }

  function cleanChatBanner(){
    Array.from(document.querySelectorAll('.messages-layout .chat-header')).forEach(function(header){
      header.classList.add('planuf-clean-chat-banner');
      stripChatMembersText(header);

      Array.from(header.querySelectorAll('.planuf-hide-chat-member-line')).forEach(function(el){
        el.classList.remove('planuf-hide-chat-member-line');
        el.removeAttribute('aria-hidden');
      });

      Array.from(header.querySelectorAll('*')).forEach(function(el){
        var own=String(Array.from(el.childNodes).filter(function(n){return n.nodeType===Node.TEXT_NODE;}).map(function(n){return n.nodeValue||'';}).join(' ')).trim().toLowerCase();
        if(own.includes('chat members:') || own === 'chat members' || own.startsWith('members:')){
          el.classList.add('planuf-hide-chat-member-line');
          el.setAttribute('aria-hidden','true');
        }
      });

      var title=header.querySelector('h1,h2,h3,.chat-title,.planuf-chat-participant-head');
      if(title){
        stripChatMembersText(title);
        var raw=String(title.textContent||'').replace(/\s+/g,' ').trim();
        if(raw) title.textContent=raw;
        title.classList.add('planuf-chat-banner-title');
      }
    });
  }

  function apply(){
    document.body.classList.toggle('planuf-messages-route', isMessagesActive());
    bindBackButtons();
    bindMessagesNavButtons();
    bindChatRows();
    cleanChatBanner();
    if(Date.now()<suppressChatOpenUntil){ forceChatList(); }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
  window.addEventListener('hashchange',function(){ setTimeout(apply,20); setTimeout(apply,120); });
  window.addEventListener('popstate',function(){ setTimeout(apply,20); setTimeout(apply,120); });
  window.addEventListener('resize',apply);
  document.addEventListener('click',function(){ setTimeout(apply,80); },true);
  document.addEventListener('click',handleMessagesNavActivation,true);
  document.addEventListener('touchend',handleMessagesNavActivation,true);
  var timer=null;
  new MutationObserver(function(){ clearTimeout(timer); timer=setTimeout(apply,60); }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-current','data-planuf-force-list']});
})();
