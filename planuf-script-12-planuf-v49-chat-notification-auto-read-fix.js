
(function(){
  const firebaseConfig={apiKey:"AIzaSyD2BphkPc8Ho_7QPmOxtnRWVcMSfqLJf7o",authDomain:"planufproductions-d1484.firebaseapp.com",projectId:"planufproductions-d1484",storageBucket:"planufproductions-d1484.firebasestorage.app",messagingSenderId:"1064640847372",appId:"1:1064640847372:web:291b833757f82b7f9e5829",measurementId:"G-CV076XFFKE"};
  const urls={app:"https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js",auth:"https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js",firestore:"https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"};
  let fbPromise=null;
  let currentAppUserId='';
  let readTimer=null;
  let lastReadThread='';
  function firebase(){
    if(fbPromise) return fbPromise;
    fbPromise=Promise.all([import(urls.app),import(urls.auth),import(urls.firestore)]).then(([appMod,authMod,fsMod])=>{
      const app=appMod.getApps().length?appMod.getApps()[0]:appMod.initializeApp(firebaseConfig);
      return {appMod,authMod,fsMod,app,auth:authMod.getAuth(app),db:fsMod.getFirestore(app)};
    });
    return fbPromise;
  }
  function preview(text){
    const value=String(text||'New message').trim();
    return value.length>92?value.slice(0,89)+'...':value;
  }
  function currentThreadId(){
    const hash=String(location.hash||'');
    const m=hash.match(/messages\/?([^/?#]*)/i);
    return m&&m[1]?decodeURIComponent(m[1]):'';
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
    const doc=snap.docs.find(d=>{const u=d.data()||{};return u.firebaseAuthUid===user.uid||(u.authEmail||'').toLowerCase()===email||(u.email||'').toLowerCase()===email||(u.username||'').toLowerCase()===username;});
    currentAppUserId=doc?(doc.data().id||doc.id):'';
    return currentAppUserId;
  }
  async function markCurrentThreadRead(){
    const threadId=currentThreadId();
    if(!threadId) return;
    const appUserId=await findAppUserId();
    if(!appUserId) return;
    if(lastReadThread===threadId+':'+appUserId+':'+Math.floor(Date.now()/3000)) return;
    lastReadThread=threadId+':'+appUserId+':'+Math.floor(Date.now()/3000);
    if(window.PlanufMessagingSync && typeof window.PlanufMessagingSync.markThreadRead==='function'){
      await window.PlanufMessagingSync.markThreadRead(threadId,appUserId);
    }
    window.dispatchEvent(new CustomEvent('planuf-thread-auto-read',{detail:{threadId,appUserId}}));
  }
  function isAtConversationBottom(body){
    if(!body) return false;
    return body.scrollTop+body.clientHeight>=body.scrollHeight-36;
  }
  function scheduleReadCheck(){
    clearTimeout(readTimer);
    const body=document.querySelector('.conversation-body');
    if(!body || !currentThreadId() || !isAtConversationBottom(body)) return;
    readTimer=setTimeout(()=>{
      const latest=document.querySelector('.conversation-body');
      if(latest && isAtConversationBottom(latest)) markCurrentThreadRead().catch(err=>console.warn('Planuf auto-read failed',err));
    },2000);
  }
  function wireAutoRead(){
    const body=document.querySelector('.conversation-body');
    if(!body || body.dataset.planufAutoReadWired==='true') return;
    body.dataset.planufAutoReadWired='true';
    body.addEventListener('scroll',scheduleReadCheck,{passive:true});
    body.addEventListener('touchend',scheduleReadCheck,{passive:true});
    body.addEventListener('pointerup',scheduleReadCheck,{passive:true});
    const hint=document.createElement('span');
    hint.className='planuf-read-hint';
    hint.textContent='Viewed at the latest message for 2 seconds = read';
    body.appendChild(hint);
    setTimeout(()=>{body.scrollTop=body.scrollHeight; scheduleReadCheck();},250);
  }
  function hideManualMarkRead(){
    document.querySelectorAll('button').forEach(btn=>{
      if((btn.textContent||'').trim().toLowerCase()==='mark read'){
        btn.dataset.planufHiddenMarkread='true';
        btn.setAttribute('aria-hidden','true');
        btn.tabIndex=-1;
      }
    });
  }
  function openThread(threadId){
    if(threadId) location.hash='#/messages/'+encodeURIComponent(threadId);
    else location.hash='#/messages';
    setTimeout(()=>{wireAutoRead(); scheduleReadCheck();},250);
  }
  function showTopMessageBanner(message,sender){
    document.querySelectorAll('.planuf-live-message-toast,.planuf-top-message-banner').forEach(el=>el.remove());
    const banner=document.createElement('div');
    banner.className='planuf-top-message-banner';
    const title='New message'+(sender?' from '+sender:'');
    banner.innerHTML='<strong></strong><span></span><button type="button">Open</button>';
    banner.querySelector('strong').textContent=title;
    banner.querySelector('span').textContent=preview(message&&message.body);
    const activate=(ev)=>{ev.preventDefault();ev.stopPropagation();openThread(message&&message.threadId||'');banner.classList.remove('show');setTimeout(()=>banner.remove(),280);};
    banner.addEventListener('click',activate);
    banner.querySelector('button').addEventListener('click',activate);
    document.body.appendChild(banner);
    requestAnimationFrame(()=>banner.classList.add('show'));
    setTimeout(()=>{ if(document.body.contains(banner)){ banner.classList.remove('show'); setTimeout(()=>banner.remove(),360); } },3000);
  }
  function patchToastAPIs(){
    window.PlanufMessagingUX={showTopMessageBanner,openThread,scheduleReadCheck,markCurrentThreadRead};
    const apply=()=>{
      if(window.PlanufMessagingSync){ window.PlanufMessagingSync.showToast=showTopMessageBanner; }
    };
    apply();
    let tries=0;
    const id=setInterval(()=>{apply(); if(++tries>30) clearInterval(id);},500);
    window.addEventListener('planuf-message-auto-refresh',ev=>{
      const msg=ev.detail&&ev.detail.message;
      if(msg) showTopMessageBanner(msg,'');
    });
  }
  function fixCheckboxClickBehaviour(){
    // Stop oversized/label bubbling from toggling the wrong recipient. The actual React onChange still receives the checkbox change.
    document.addEventListener('click',ev=>{
      const row=ev.target.closest&&ev.target.closest('.chat-check-row');
      if(!row) return;
      const input=row.querySelector('input[type="checkbox"]');
      if(!input) return;
      if(ev.target!==input){
        ev.preventDefault();
        ev.stopPropagation();
        input.click();
      }
    },true);
  }
  function boot(){
    patchToastAPIs();
    fixCheckboxClickBehaviour();
    const obs=new MutationObserver(()=>{hideManualMarkRead(); wireAutoRead();});
    obs.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('hashchange',()=>setTimeout(()=>{hideManualMarkRead();wireAutoRead();scheduleReadCheck();},250));
    window.addEventListener('planuf-soft-message-refresh',()=>setTimeout(()=>{wireAutoRead();scheduleReadCheck();},250));
    setInterval(()=>{hideManualMarkRead();wireAutoRead();scheduleReadCheck();},3500);
    firebase().then(fb=>fb.authMod.onAuthStateChanged(fb.auth,()=>findAppUserId().catch(()=>{}))).catch(()=>{});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
