
(function(){
  const firebaseConfig = {
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
    firestore:"https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
  };
  let firebasePromise=null;
  async function firebase(){
    if(firebasePromise) return firebasePromise;
    firebasePromise=(async()=>{
      const [appMod, authMod, fsMod] = await Promise.all([import(urls.app), import(urls.auth), import(urls.firestore)]);
      const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      const db = fsMod.getFirestore(app);
      return { appMod, authMod, fsMod, app, auth, db };
    })();
    return firebasePromise;
  }
  function clean(obj){
    if(Array.isArray(obj)) return obj.map(clean).filter(v=>v!==undefined);
    if(obj && typeof obj==='object'){
      const out={};
      Object.entries(obj).forEach(([k,v])=>{ if(v!==undefined) out[k]=clean(v); });
      return out;
    }
    return obj;
  }
  function stamp(){ return new Date().toISOString(); }
  async function requireAuth(){
    const fb=await firebase();
    const user=fb.auth.currentUser;
    if(!user) throw new Error('No signed-in Firebase user for messaging sync.');
    return {fb,user};
  }
  async function saveThread(thread){
    const {fb}=await requireAuth();
    if(!thread || !thread.id) return;
    await fb.fsMod.setDoc(fb.fsMod.doc(fb.db,'messageThreads',thread.id), clean({...thread, syncedAt:fb.fsMod.serverTimestamp(), updatedAt:thread.updatedAt||stamp()}), {merge:true});
  }
  async function saveMessage(message, thread){
    const {fb}=await requireAuth();
    if(!message || !message.id) return;
    const msg=clean({...message, toUserIds:Array.isArray(message.toUserIds)?message.toUserIds:[message.toUserId].filter(Boolean), mentionedUserIds:Array.isArray(message.mentionedUserIds)?message.mentionedUserIds:[], readByUserIds:Array.from(new Set([...(message.readByUserIds||[]), message.fromUserId].filter(Boolean))), status:message.status||'sent', syncedAt:fb.fsMod.serverTimestamp()});
    const ops=[fb.fsMod.setDoc(fb.fsMod.doc(fb.db,'messages',message.id), msg, {merge:true})];
    if(thread && thread.id){
      ops.push(fb.fsMod.setDoc(fb.fsMod.doc(fb.db,'messageThreads',thread.id), clean({...thread, updatedAt:message.createdAt||stamp(), syncedAt:fb.fsMod.serverTimestamp()}), {merge:true}));
    }
    await Promise.all(ops);
    window.dispatchEvent(new CustomEvent('planuf-message-synced',{detail:{messageId:message.id,threadId:message.threadId}}));
  }
  async function markThreadRead(threadId,userId){
    const {fb}=await requireAuth();
    if(!threadId || !userId) return;
    const q=fb.fsMod.query(fb.fsMod.collection(fb.db,'messages'), fb.fsMod.where('threadId','==',threadId));
    const snap=await fb.fsMod.getDocs(q);
    const batch=fb.fsMod.writeBatch(fb.db);
    const now=stamp();
    snap.docs.forEach(d=>{
      const data=d.data()||{};
      const to=Array.isArray(data.toUserIds)?data.toUserIds:[data.toUserId].filter(Boolean);
      if(!to.includes(userId)) return;
      const readBy=Array.from(new Set([...(data.readByUserIds||[]), userId]));
      batch.set(d.ref, {status:'read', readAt:now, readByUserIds:readBy, syncedAt:fb.fsMod.serverTimestamp()}, {merge:true});
    });
    await batch.commit();
  }
  function showToast(message, sender){
    const old=document.querySelector('.planuf-live-message-toast');
    if(old) old.remove();
    const toast=document.createElement('div');
    toast.className='planuf-live-message-toast';
    toast.innerHTML='<strong>New message'+(sender?' from '+sender:'')+'</strong><span></span><button type="button">Open Messages</button>';
    toast.querySelector('span').textContent=message.body||'You have a new message.';
    toast.querySelector('button').addEventListener('click',()=>{
      window.location.hash='#/messages/'+encodeURIComponent(message.threadId||'');
      window.dispatchEvent(new CustomEvent('planuf-open-message-thread',{detail:{threadId:message.threadId||''}}));
    });
    document.body.appendChild(toast);
    window.setTimeout(()=>{ toast.classList.add('show'); },20);
  }
  async function startUnreadListener(){
    const fb=await firebase();
    fb.authMod.onAuthStateChanged(fb.auth, async user=>{
      if(!user) return;
      try{
        const usersSnap=await fb.fsMod.getDocs(fb.fsMod.collection(fb.db,'users'));
        const email=(user.email||'').toLowerCase();
        const username=email.includes('@')?email.split('@')[0]:'';
        const appUserDoc=usersSnap.docs.find(d=>{
          const u=d.data()||{};
          return u.firebaseAuthUid===user.uid || (u.authEmail||'').toLowerCase()===email || (u.username||'').toLowerCase()===username;
        });
        const appUserId=appUserDoc?.id || appUserDoc?.data()?.id;
        if(!appUserId) return;
        const seenKey='planuf_seen_message_ids_'+appUserId;
        const seen=new Set(JSON.parse(localStorage.getItem(seenKey)||'[]'));
        const startedAt=Date.now();
        const q=fb.fsMod.query(fb.fsMod.collection(fb.db,'messages'), fb.fsMod.where('toUserIds','array-contains',appUserId));
        fb.fsMod.onSnapshot(q, snap=>{
          const allSeen=new Set(seen);
          snap.docChanges().forEach(change=>{
            if(change.type!=='added' && change.type!=='modified') return;
            const data={id:change.doc.id,...(change.doc.data()||{})};
            const readBy=Array.isArray(data.readByUserIds)?data.readByUserIds:[];
            if(data.fromUserId===appUserId || readBy.includes(appUserId)) return;
            const createdMs=Date.parse(data.createdAt||'')||0;
            if(!seen.has(data.id) && createdMs && createdMs > startedAt-5000){
              const senderDoc=usersSnap.docs.find(d=>d.id===data.fromUserId);
              const sender=senderDoc?.data()?.displayName || '';
              showToast(data, sender);
            }
            allSeen.add(data.id);
          });
          localStorage.setItem(seenKey, JSON.stringify(Array.from(allSeen).slice(-500)));
        }, err=>console.error('Planuf unread message listener failed', err));
      }catch(err){ console.error('Planuf unread listener setup failed', err); }
    });
  }
  window.PlanufMessagingSync={saveThread,saveMessage,markThreadRead,startUnreadListener};
  startUnreadListener().catch(err=>console.error('Planuf messaging listener failed',err));
})();
