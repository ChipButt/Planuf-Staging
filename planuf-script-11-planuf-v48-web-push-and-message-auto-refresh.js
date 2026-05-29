
(function(){
  const firebaseConfig={
    apiKey:"AIzaSyD2BphkPc8Ho_7QPmOxtnRWVcMSfqLJf7o",
    authDomain:"planufproductions-d1484.firebaseapp.com",
    projectId:"planufproductions-d1484",
    storageBucket:"planufproductions-d1484.firebasestorage.app",
    messagingSenderId:"1064640847372",
    appId:"1:1064640847372:web:291b833757f82b7f9e5829",
    measurementId:"G-CV076XFFKE"
  };
  const urls={
    app:"https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js",
    auth:"https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js",
    firestore:"https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js",
    messaging:"https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js"
  };
  const POLL_MS=4000;
  // Add your Firebase Console Web Push certificate key here when available.
  // Without this, foreground/browser notifications still work while the app is open,
  // but true background push requires the VAPID public key and deployed Cloud Function.
  const VAPID_PUBLIC_KEY=window.PLANUF_FCM_VAPID_PUBLIC_KEY||"";
  let firebasePromise=null;
  let pollingStarted=false;
  let currentAppUserId="";
  let lastMessagesHash="";
  let lastMessagesPageReloadAt=0;

  async function firebase(){
    if(firebasePromise) return firebasePromise;
    firebasePromise=(async()=>{
      const [appMod, authMod, fsMod, msgMod]=await Promise.all([
        import(urls.app), import(urls.auth), import(urls.firestore), import(urls.messaging).catch(()=>null)
      ]);
      const app=appMod.getApps().length?appMod.getApps()[0]:appMod.initializeApp(firebaseConfig);
      return {appMod, authMod, fsMod, msgMod, app, auth:authMod.getAuth(app), db:fsMod.getFirestore(app)};
    })();
    return firebasePromise;
  }
  function textPreview(body){
    const text=String(body||'You have received a new message.').trim();
    return text.length>100?text.slice(0,97)+'...':text;
  }
  function safeJsonParse(value,fallback){
    try{return JSON.parse(value)}catch(e){return fallback}
  }
  function notificationAllowed(){
    return typeof Notification!=='undefined' && Notification.permission==='granted';
  }
  function showInAppToast(message,sender){
    if(window.PlanufMessagingSync && typeof window.PlanufMessagingSync.showToast==='function'){
      try{ window.PlanufMessagingSync.showToast(message,sender||''); return; }catch(e){}
    }
    const old=document.querySelector('.planuf-live-message-toast');
    if(old) old.remove();
    const toast=document.createElement('div');
    toast.className='planuf-live-message-toast';
    toast.innerHTML='<strong></strong><span></span><button type="button">Open Messages</button>';
    toast.querySelector('strong').textContent='New message'+(sender?' from '+sender:'');
    toast.querySelector('span').textContent=textPreview(message.body);
    toast.querySelector('button').addEventListener('click',()=>{ window.location.hash='#/messages/'+encodeURIComponent(message.threadId||''); });
    document.body.appendChild(toast);
    window.setTimeout(()=>toast.classList.add('show'),20);
    window.setTimeout(()=>toast.remove(),10000);
  }
  async function showBrowserNotification(message,sender){
    if(!notificationAllowed()) return;
    const title='New Planuf message'+(sender?' from '+sender:'');
    const body=textPreview(message.body);
    const url='#/messages/'+encodeURIComponent(message.threadId||'');
    try{
      if('serviceWorker' in navigator){
        const reg=await navigator.serviceWorker.getRegistration('./');
        if(reg && reg.showNotification){
          await reg.showNotification(title,{body,tag:message.threadId?'planuf-message-'+message.threadId:'planuf-message',data:{url}});
          return;
        }
      }
      const n=new Notification(title,{body,tag:message.threadId?'planuf-message-'+message.threadId:'planuf-message',data:{url}});
      n.onclick=function(){ window.focus(); window.location.hash=url; n.close(); };
    }catch(err){ console.warn('Planuf browser notification failed',err); }
  }
  function addNotificationBanner(){
    if(typeof Notification==='undefined' || Notification.permission!=='default') return;
    if(document.querySelector('.planuf-enable-notifications')) return;
    const banner=document.createElement('div');
    banner.className='planuf-enable-notifications';
    banner.innerHTML='<strong>Message notifications</strong><span>Allow alerts when someone sends you a Planuf message.</span><button type="button">Enable</button><button type="button" class="plain">Later</button>';
    banner.querySelector('button').addEventListener('click',async()=>{ await enableNotifications(); banner.remove(); });
    banner.querySelector('.plain').addEventListener('click',()=>banner.remove());
    document.body.appendChild(banner);
  }
  async function findAppUserId(user){
    const fb=await firebase();
    const email=(user.email||'').toLowerCase();
    const username=email.includes('@')?email.split('@')[0]:'';
    try{
      const byUid=await fb.fsMod.getDoc(fb.fsMod.doc(fb.db,'usersByUid',user.uid));
      if(byUid.exists()){
        const data=byUid.data()||{};
        if(data.userId) return data.userId;
        if(data.id) return data.id;
      }
    }catch(e){}
    const snap=await fb.fsMod.getDocs(fb.fsMod.collection(fb.db,'users'));
    const appUserDoc=snap.docs.find(d=>{
      const u=d.data()||{};
      return u.firebaseAuthUid===user.uid || (u.authEmail||'').toLowerCase()===email || (u.email||'').toLowerCase()===email || (u.username||'').toLowerCase()===username;
    });
    return appUserDoc ? (appUserDoc.data().id || appUserDoc.id) : '';
  }
  async function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return null;
    try{return await navigator.serviceWorker.register('./planuf-messaging-sw.js');}
    catch(err){ console.warn('Planuf messaging service worker registration failed',err); return null; }
  }
  async function enableNotifications(){
    if(typeof Notification==='undefined') return {ok:false,error:'Notifications are not supported on this browser.'};
    const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
    if(permission!=='granted') return {ok:false,error:'Notification permission was not granted.'};
    const fb=await firebase();
    const user=fb.auth.currentUser;
    if(!user) return {ok:false,error:'No signed-in Firebase user.'};
    const appUserId=currentAppUserId || await findAppUserId(user);
    currentAppUserId=appUserId;
    const reg=await registerServiceWorker();
    let fcmToken='';
    if(VAPID_PUBLIC_KEY && fb.msgMod && reg){
      try{
        const messaging=fb.msgMod.getMessaging(fb.app);
        fcmToken=await fb.msgMod.getToken(messaging,{vapidKey:VAPID_PUBLIC_KEY,serviceWorkerRegistration:reg});
      }catch(err){ console.warn('Planuf FCM token registration failed',err); }
    }
    try{
      await fb.fsMod.setDoc(fb.fsMod.doc(fb.db,'pushSubscriptions',user.uid),{
        uid:user.uid,
        appUserId:appUserId||'',
        email:user.email||'',
        fcmToken:fcmToken||'',
        notificationPermission:permission,
        supportsLocalNotifications:true,
        supportsFcmBackgroundPush:!!fcmToken,
        userAgent:navigator.userAgent,
        updatedAt:fb.fsMod.serverTimestamp()
      },{merge:true});
    }catch(err){ console.warn('Planuf push subscription save failed',err); }
    return {ok:true, fcmToken:!!fcmToken, localNotifications:true};
  }
  function messageSortValue(m){ return Date.parse(m.createdAt||m.updatedAt||'')||0; }
  function stableHash(messages){
    return messages.map(m=>[m.id,m.updatedAt||'',m.createdAt||'',m.status||'',(m.readByUserIds||[]).join('|')].join(':')).sort().join('||');
  }
  async function pollMessages(){
    const fb=await firebase();
    const user=fb.auth.currentUser;
    if(!user) return;
    const appUserId=currentAppUserId || await findAppUserId(user);
    if(!appUserId) return;
    currentAppUserId=appUserId;
    const seenKey='planuf_push_seen_message_ids_'+appUserId;
    const seen=new Set(safeJsonParse(localStorage.getItem(seenKey),[]));
    const q=fb.fsMod.query(fb.fsMod.collection(fb.db,'messages'), fb.fsMod.where('toUserIds','array-contains',appUserId));
    const snap=await fb.fsMod.getDocs(q);
    const messages=snap.docs.map(d=>({id:d.id,...(d.data()||{})})).sort((a,b)=>messageSortValue(a)-messageSortValue(b));
    const hash=stableHash(messages);
    const hasChanged=hash && hash!==lastMessagesHash;
    lastMessagesHash=hash;
    const usersCache=await fb.fsMod.getDocs(fb.fsMod.collection(fb.db,'users')).catch(()=>null);
    const newUnread=[];
    messages.forEach(m=>{
      const readBy=Array.isArray(m.readByUserIds)?m.readByUserIds:[];
      if(m.fromUserId===appUserId || readBy.includes(appUserId)) { seen.add(m.id); return; }
      if(!seen.has(m.id)) newUnread.push(m);
      seen.add(m.id);
    });
    localStorage.setItem(seenKey,JSON.stringify(Array.from(seen).slice(-800)));
    if(newUnread.length){
      const newest=newUnread[newUnread.length-1];
      let sender='';
      if(usersCache){
        const senderDoc=usersCache.docs.find(d=>d.id===newest.fromUserId);
        sender=senderDoc?.data()?.displayName || senderDoc?.data()?.nickname || '';
      }
      showInAppToast(newest,sender);
      showBrowserNotification(newest,sender);
      window.dispatchEvent(new CustomEvent('planuf-message-auto-refresh',{detail:{appUserId,message:newest,allMessages:messages}}));
      // If the user is already viewing Messages, refresh the screen once when new data arrives.
      // This avoids manual refresh without creating a constant full-page reload loop.
      if(String(window.location.hash||'').toLowerCase().includes('message')){
        const now=Date.now();
        if(now-lastMessagesPageReloadAt>12000){
          lastMessagesPageReloadAt=now;
          window.dispatchEvent(new CustomEvent('planuf-soft-message-refresh',{detail:{reason:'new-message'}}));
        }
      }
    }else if(hasChanged){
      window.dispatchEvent(new CustomEvent('planuf-message-auto-refresh',{detail:{appUserId,allMessages:messages}}));
    }
  }
  async function startAutoRefresh(){
    if(pollingStarted) return;
    pollingStarted=true;
    await registerServiceWorker();
    const fb=await firebase();
    fb.authMod.onAuthStateChanged(fb.auth,async user=>{
      if(!user) return;
      try{
        currentAppUserId=await findAppUserId(user);
        addNotificationBanner();
        pollMessages().catch(err=>console.warn('Planuf message poll failed',err));
        window.setInterval(()=>pollMessages().catch(err=>console.warn('Planuf message poll failed',err)),POLL_MS);
      }catch(err){ console.warn('Planuf message auto-refresh setup failed',err); }
    });
  }
  window.PlanufWebPush={enableNotifications,startAutoRefresh,pollMessages};
  startAutoRefresh().catch(err=>console.warn('Planuf web push/auto-refresh failed',err));
})();
