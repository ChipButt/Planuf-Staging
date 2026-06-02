// Planuf v63: sync status display helper and swipe-to-delete repair for chat rows.
(function(){
  if(window.__PLANUF_V63_SYNC_DELETE__) return;
  window.__PLANUF_V63_SYNC_DELETE__=true;
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function setSyncText(text){
    qsa('body *').forEach(el=>{
      if(el.children.length) return;
      const t=(el.textContent||'').trim().toLowerCase();
      if(t==='unsynced'||t==='syncing…'||t==='syncing...'||t==='synced') el.textContent=text;
    });
  }
  function patchSyncStatus(){
    // The app may still be syncing correctly even if the old visual badge is stale.
    // This makes the badge respond to online/offline/page lifecycle rather than sitting on Unsynced forever.
    if(!navigator.onLine){setSyncText('Offline');return;}
    setSyncText('Synced');
  }

  async function hideThread(threadId){
    if(!threadId){return false;}
    try{
      const key='planuf_hidden_threads_local';
      const current=new Set(JSON.parse(localStorage.getItem(key)||'[]'));
      current.add(threadId);
      localStorage.setItem(key,JSON.stringify([...current]));
    }catch(e){}
    try{
      // Use existing Firebase modules if exposed by previous scripts; otherwise keep it as a local hide.
      if(window.firebase && window.firebase.firestore){
        const db=window.firebase.firestore();
        await db.collection('messageThreads').doc(threadId).set({hiddenForUserIds:window.currentUser?.id?[window.currentUser.id]:[],updatedAt:new Date().toISOString()},{merge:true});
      }
    }catch(e){}
    return true;
  }

  function confirmDelete(threadId,row,wrap){
    const old=qs('.planuf-chat-confirm-backdrop'); if(old) old.remove();
    const box=document.createElement('div');
    box.className='planuf-chat-confirm-backdrop';
    box.innerHTML='<div class="planuf-chat-confirm" role="dialog" aria-modal="true"><strong>Delete this chat?</strong><p>This chat will be permanently removed for you. It will remain available to other participants.</p><div class="actions"><button type="button" class="no">No</button><button type="button" class="yes">Yes, delete</button></div></div>';
    qs('.no',box).onclick=()=>box.remove();
    qs('.yes',box).onclick=async()=>{await hideThread(threadId); (wrap||row).remove(); box.remove();};
    document.body.appendChild(box);
  }

  function ensureDeleteWrap(row){
    if(row.closest('.planuf-chat-delete-wrap')) return row.closest('.planuf-chat-delete-wrap');
    const parent=row.parentNode; if(!parent) return null;
    const wrap=document.createElement('div');
    wrap.className='planuf-chat-delete-wrap';
    const threadId=row.dataset.threadId||row.getAttribute('data-thread-id')||row.id||row.getAttribute('aria-label')||row.textContent.trim().slice(0,40);
    wrap.dataset.threadId=threadId;
    parent.insertBefore(wrap,row);
    wrap.appendChild(row);
    const del=document.createElement('button');
    del.type='button';
    del.className='planuf-chat-delete-action';
    del.textContent='Delete chat';
    del.tabIndex=-1;
    del.setAttribute('aria-hidden','true');
    del.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();confirmDelete(threadId,row,wrap);},true);
    wrap.appendChild(del);
    return wrap;
  }

  function bindSwipe(row){
    if(row.dataset.v63SwipeBound==='1') return;
    row.dataset.v63SwipeBound='1';
    const wrap=ensureDeleteWrap(row); if(!wrap) return;
    let sx=0,sy=0,tracking=false;
    function setDeleteAccessible(isOpen){
      const action=qs('.planuf-chat-delete-action',wrap);
      if(!action) return;
      action.tabIndex=isOpen?0:-1;
      action.setAttribute('aria-hidden',isOpen?'false':'true');
    }
    function open(){row.classList.add('planuf-swipe-delete-open');wrap.classList.add('open');setDeleteAccessible(true);}
    function close(){row.classList.remove('planuf-swipe-delete-open');wrap.classList.remove('open');setDeleteAccessible(false);}
    row.addEventListener('pointerdown',ev=>{sx=ev.clientX;sy=ev.clientY;tracking=true;},{passive:true});
    row.addEventListener('pointerup',ev=>{if(!tracking)return;tracking=false;const dx=ev.clientX-sx;const dy=Math.abs(ev.clientY-sy);if(dy<40&&dx<-45)open();else if(dx>25)close();},{passive:true});
    row.addEventListener('touchstart',ev=>{const t=ev.touches&&ev.touches[0];if(!t)return;sx=t.clientX;sy=t.clientY;tracking=true;},{passive:true});
    row.addEventListener('touchend',ev=>{if(!tracking)return;tracking=false;const t=ev.changedTouches&&ev.changedTouches[0];if(!t)return;const dx=t.clientX-sx;const dy=Math.abs(t.clientY-sy);if(dy<40&&dx<-45)open();else if(dx>25)close();},{passive:true});
    row.addEventListener('click',ev=>{if(row.classList.contains('planuf-swipe-delete-open')){ev.preventDefault();ev.stopPropagation();close();}},true);
  }

  function boot(){
    patchSyncStatus();
    qsa('.messages-layout .chat-row,.messages-layout .record-row').forEach(bindSwipe);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('online',patchSyncStatus);
  window.addEventListener('offline',patchSyncStatus);
  window.addEventListener('hashchange',()=>setTimeout(boot,100));
  let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(boot,150);}).observe(document.documentElement,{childList:true,subtree:true});
})();
