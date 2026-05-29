// Planuf v62 messages UI cleanup: move Create Idea from Chat to right, stop back button being reused incorrectly, remove empty headings.
(function(){
  if(window.__PLANUF_V62_MESSAGES_CLEANUP__) return;
  window.__PLANUF_V62_MESSAGES_CLEANUP__=true;
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function isMessages(){return !!qs('.messages-layout');}
  function labelOf(el){return String(el?.textContent||el?.getAttribute?.('aria-label')||'').trim().toLowerCase();}
  function cleanupChatList(){
    const root=qs('.messages-layout'); if(!root) return;
    const sidebar=qs('.chat-sidebar',root); if(!sidebar) return;
    qsa('h1,h2,h3,strong',sidebar).forEach(el=>{if(labelOf(el)==='chats'||labelOf(el)==='chat'||labelOf(el)==='messages') el.style.display='none';});
    qsa('button',sidebar).forEach(btn=>{const t=labelOf(btn); if(t.includes('new chat')||t==='new') btn.classList.add('planuf-new-chat-button');});
    const list=qs('.chat-list,.message-list,.item-list',sidebar);
    if(list) list.classList.add('planuf-existing-chat-list');
  }
  function cleanupChatHeader(){
    const root=qs('.messages-layout'); if(!root) return;
    const header=qs('.chat-detail .chat-header,.chat-header',root); if(!header) return;
    qsa('button',header).forEach(btn=>{
      const t=labelOf(btn);
      if(t.includes('create idea')||t.includes('idea from chat')){
        btn.classList.add('planuf-create-idea-from-chat');
        btn.classList.remove('planuf-chat-back-button');
        btn.style.backgroundImage='none';
        btn.removeAttribute('aria-label');
        if(!btn.textContent.trim()) btn.textContent='Idea';
      }
    });
    let back=qs('.planuf-chat-back-button',header);
    if(!back){
      back=document.createElement('button');
      back.type='button';
      back.className='planuf-chat-back-button';
      back.setAttribute('aria-label','Back to chats');
      back.innerHTML='<span class="planuf-back-unread-badge" hidden>0</span>';
      back.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();root.classList.remove('planuf-chat-open');},true);
      header.insertBefore(back,header.firstChild);
    }
  }
  function boot(){if(!isMessages()) return; cleanupChatList(); cleanupChatHeader();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('hashchange',()=>setTimeout(boot,100));
  window.addEventListener('planuf-message-auto-refresh',()=>setTimeout(boot,100));
  let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(boot,120);}).observe(document.documentElement,{childList:true,subtree:true});
})();
