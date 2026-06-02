// Planuf v75: polished chat header member circles, delete-chat handling, and new-chat render guard.
(function(){
  if(window.__PLANUF_V75_CHAT_HEADER_AND_NEW_CHAT_FIX__) return;
  window.__PLANUF_V75_CHAT_HEADER_AND_NEW_CHAT_FIX__=true;

  const firebaseConfig={apiKey:"AIzaSyD2BphkPc8Ho_7QPmOxtnRWVcMSfqLJf7o",authDomain:"planufproductions-d1484.firebaseapp.com",projectId:"planufproductions-d1484",storageBucket:"planufproductions-d1484.firebasestorage.app",messagingSenderId:"1064640847372",appId:"1:1064640847372:web:291b833757f82b7f9e5829",measurementId:"G-CV076XFFKE"};
  const urls={app:"https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js",auth:"https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js",firestore:"https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"};
  let fbPromise=null;
  let currentAppUserId='';

  function qsa(sel,root){return Array.from((root||document).querySelectorAll(sel));}
  function qs(sel,root){return (root||document).querySelector(sel);}
  function cleanText(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function isMessagesRoute(){return String(location.hash||'').toLowerCase().includes('message') || !!document.querySelector('.messages-layout');}

  function firebase(){
    if(fbPromise) return fbPromise;
    fbPromise=Promise.all([import(urls.app),import(urls.auth),import(urls.firestore)]).then(function(parts){
      const appMod=parts[0],authMod=parts[1],fsMod=parts[2];
      const app=appMod.getApps().length?appMod.getApps()[0]:appMod.initializeApp(firebaseConfig);
      return {appMod,authMod,fsMod,app,auth:authMod.getAuth(app),db:fsMod.getFirestore(app)};
    });
    return fbPromise;
  }

  function safeString(value){
    if(value == null) return '';
    if(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if(Array.isArray(value)) return value.map(safeString).filter(Boolean).join(', ');
    if(typeof value === 'object') return value.displayName || value.name || value.nickname || value.username || value.email || value.title || '';
    return '';
  }

  function initialsFromName(name){
    name=cleanText(safeString(name));
    if(!name || /^everyone$/i.test(name)) return '•';
    const parts=name.split(/[\s._-]+/).filter(Boolean);
    if(parts.length>=2) return (parts[0][0]+parts[1][0]).toUpperCase();
    return name.slice(0,2).toUpperCase();
  }

  async function findAppUserId(){
    if(currentAppUserId) return currentAppUserId;
    const fb=await firebase();
    const user=fb.auth.currentUser;
    if(!user) return '';
    const email=(user.email||'').toLowerCase();
    const username=email.includes('@')?email.split('@')[0]:'';
    try{
      const byUid=await fb.fsMod.getDoc(fb.fsMod.doc(fb.db,'usersByUid',user.uid));
      if(byUid.exists()){
        const data=byUid.data()||{};
        currentAppUserId=data.userId||data.id||'';
        if(currentAppUserId) return currentAppUserId;
      }
    }catch(e){}
    const snap=await fb.fsMod.getDocs(fb.fsMod.collection(fb.db,'users'));
    const doc=snap.docs.find(function(d){
      const u=d.data()||{};
      return u.firebaseAuthUid===user.uid || (u.authEmail||'').toLowerCase()===email || (u.email||'').toLowerCase()===email || (u.username||'').toLowerCase()===username;
    });
    currentAppUserId=doc?(doc.data().id||doc.id):'';
    return currentAppUserId;
  }

  function currentThreadId(){
    const hash=String(location.hash||'');
    const m=hash.match(/messages\/?([^/?#]*)/i);
    if(m && m[1]) return decodeURIComponent(m[1]);
    const active=qs('.chat-row.active,.record-row.active,.item-list button.active');
    return active ? (active.dataset.threadId||active.dataset.id||active.getAttribute('data-thread-id')||'') : '';
  }

  function extractNamesFromHeader(header){
    let raw=cleanText(header ? header.textContent : '');
    raw=raw.replace(/create\s*idea/ig,' ').replace(/back\s*to\s*chats/ig,' ').replace(/chat\s*members\s*:/ig,' ').replace(/members\s*:/ig,' ').replace(/everyone/ig,' ');
    const names=raw.split(/,|\band\b|\+|•|\|/i).map(cleanText).filter(function(n){return n && n.length<32 && !/^(chat|members|message|messages|create|idea|back|everyone)$/i.test(n);});
    const unique=[];
    names.forEach(function(n){if(!unique.some(function(x){return x.toLowerCase()===n.toLowerCase();})) unique.push(n);});
    return unique.slice(0,4);
  }

  function extractNamesFromRows(){
    const names=[];
    qsa('.chat-row.active strong, .record-row.active strong, .chat-row.active [class*="name"], .record-row.active [class*="name"]').forEach(function(el){
      const t=cleanText(el.textContent||el.getAttribute('aria-label')||el.title||'');
      if(t && !/everyone|message|chat/i.test(t)) names.push(t);
    });
    const unique=[];
    names.forEach(function(n){if(!unique.some(function(x){return x.toLowerCase()===n.toLowerCase();})) unique.push(n);});
    return unique.slice(0,4);
  }

  function makeStrip(header){
    if(!header) return;
    let strip=qs('.planuf-chat-member-strip',header);
    if(!strip){
      strip=document.createElement('div');
      strip.className='planuf-chat-member-strip';
      header.insertBefore(strip, qs('.planuf-create-idea-from-chat',header) || header.lastChild);
    }
    let names=extractNamesFromHeader(header);
    if(!names.length) names=extractNamesFromRows();
    if(!names.length) names=['Chat'];
    strip.innerHTML='';
    names.slice(0,4).forEach(function(name){
      const avatar=document.createElement('span');
      avatar.className='planuf-chat-member-avatar';
      avatar.title=cleanText(safeString(name));
      avatar.textContent=initialsFromName(name);
      strip.appendChild(avatar);
    });
    if(names.length>4){
      const extra=document.createElement('span');
      extra.className='planuf-chat-member-extra';
      extra.textContent='+'+(names.length-4);
      strip.appendChild(extra);
    }
  }

  function tidyHeader(){
    if(!isMessagesRoute()) return;
    const root=qs('.messages-layout');
    if(!root) return;
    const header=qs('.chat-detail .chat-header,.chat-header',root);
    if(!header) return;
    qsa('button',header).forEach(function(btn){
      const label=cleanText(btn.textContent||btn.getAttribute('aria-label')||btn.title||'').toLowerCase();
      if(label.includes('create') || label.includes('idea')){
        btn.classList.add('planuf-create-idea-from-chat');
        btn.classList.remove('planuf-chat-back-button');
      }
    });
    let back=qs('.planuf-chat-back-button',header);
    if(!back){
      back=document.createElement('button');
      back.type='button';
      back.className='planuf-chat-back-button';
      back.setAttribute('aria-label','Back to chats');
      back.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();root.classList.remove('planuf-chat-open');document.body.classList.add('planuf-force-chat-list');},true);
      header.insertBefore(back,header.firstChild);
    }
    makeStrip(header);
  }

  function patchObjectRenderText(){
    qsa('body *').forEach(function(el){
      if(!el || el.children.length) return;
      const t=cleanText(el.textContent||'');
      if(t==='[object Object]' || t==='object cannot be found here' || /planuf app render error/i.test(t) || /object cannot be found here/i.test(t)){
        el.textContent='';
        el.setAttribute('data-planuf-object-render-cleaned','true');
      }
    });
  }

  function suppressRenderErrorBriefly(){
    document.body.classList.add('planuf-suppress-render-error');
    patchObjectRenderText();
    setTimeout(function(){document.body.classList.remove('planuf-suppress-render-error');patchObjectRenderText();},1800);
  }

  function rowKey(row){
    if(!row) return '';
    return row.dataset.threadId || row.dataset.id || row.getAttribute('data-thread-id') || cleanText(row.textContent||'').slice(0,120);
  }

  function hideRow(row){
    if(!row) return;
    row.classList.add('planuf-chat-hidden');
    row.style.setProperty('display','none','important');
  }

  async function persistHiddenThread(key){
    const appUserId=await findAppUserId();
    if(!appUserId || !key) return;
    const storageKey='planuf_hidden_chat_rows_'+appUserId;
    const existing=JSON.parse(localStorage.getItem(storageKey)||'[]');
    if(!existing.includes(key)) existing.push(key);
    localStorage.setItem(storageKey,JSON.stringify(existing.slice(-500)));
    const fb=await firebase();
    try{
      const threadRef=fb.fsMod.doc(fb.db,'messageThreads',key);
      await fb.fsMod.setDoc(threadRef,{hiddenForUserIds:fb.fsMod.arrayUnion(appUserId),updatedAt:fb.fsMod.serverTimestamp()},{merge:true});
    }catch(e){}
  }

  async function applyHiddenRows(){
    const appUserId=await findAppUserId();
    if(!appUserId) return;
    const list=JSON.parse(localStorage.getItem('planuf_hidden_chat_rows_'+appUserId)||'[]');
    if(!list.length) return;
    qsa('.chat-row,.record-row,.item-list button').forEach(function(row){
      const key=rowKey(row);
      if(key && list.includes(key)) hideRow(row);
    });
  }

  function bindDeleteChat(){
    qsa('button,[role="button"],.delete-chat,.chat-delete,.planuf-delete-chat').forEach(function(btn){
      const label=cleanText(btn.textContent||btn.getAttribute('aria-label')||btn.title||'').toLowerCase();
      if(!label.includes('delete chat') && !label.includes('delete conversation') && !btn.className.toString().toLowerCase().includes('delete')) return;
      if(btn.dataset.planufV75DeleteBound==='1') return;
      btn.dataset.planufV75DeleteBound='1';
      btn.addEventListener('click',function(ev){
        const row=btn.closest('.chat-row,.record-row,.item-list button') || btn.parentElement?.closest?.('.chat-row,.record-row,.item-list button');
        const key=rowKey(row);
        if(row){ hideRow(row); persistHiddenThread(key).catch(function(){}); }
        setTimeout(applyHiddenRows,120);
      },true);
      btn.addEventListener('touchend',function(ev){
        const row=btn.closest('.chat-row,.record-row,.item-list button') || btn.parentElement?.closest?.('.chat-row,.record-row,.item-list button');
        const key=rowKey(row);
        if(row){ hideRow(row); persistHiddenThread(key).catch(function(){}); }
        setTimeout(applyHiddenRows,120);
      },true);
    });
  }

  function guardNewChatClicks(){
    qsa('button,.planuf-new-chat-button').forEach(function(btn){
      const label=cleanText(btn.textContent||btn.getAttribute('aria-label')||btn.title||'').toLowerCase();
      if(!label.includes('new chat') && !label.includes('create chat') && !(btn.classList&&btn.classList.contains('planuf-new-chat-button'))) return;
      if(btn.dataset.planufV75NewChatGuard==='1') return;
      btn.dataset.planufV75NewChatGuard='1';
      btn.addEventListener('click',function(){
        suppressRenderErrorBriefly();
        setTimeout(function(){patchObjectRenderText();tidyHeader();try{window.dispatchEvent(new CustomEvent('planuf-new-chat-guarded'));}catch(e){}},80);
        setTimeout(function(){patchObjectRenderText();tidyHeader();},240);
        setTimeout(function(){patchObjectRenderText();tidyHeader();},700);
      },true);
    });
  }

  function boot(){
    tidyHeader();
    guardNewChatClicks();
    bindDeleteChat();
    patchObjectRenderText();
    applyHiddenRows().catch(function(){});
  }

  window.addEventListener('error',function(ev){
    const msg=String(ev.message||ev.error?.message||'');
    if(/object cannot be found here|objects are not valid as a react child|planuf app render error/i.test(msg)){
      suppressRenderErrorBriefly();
      setTimeout(boot,120);
    }
  },true);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('hashchange',function(){setTimeout(boot,80);setTimeout(boot,240);});
  window.addEventListener('planuf-message-auto-refresh',function(){setTimeout(boot,80);});
  window.addEventListener('planuf-soft-message-refresh',function(){setTimeout(boot,80);});
  let t=null;
  new MutationObserver(function(){clearTimeout(t);t=setTimeout(boot,80);}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-label','title']});
})();
