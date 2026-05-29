
(function(){
  const firebaseConfig={apiKey:"AIzaSyD2BphkPc8Ho_7QPmOxtnRWVcMSfqLJf7o",authDomain:"planufproductions-d1484.firebaseapp.com",projectId:"planufproductions-d1484",storageBucket:"planufproductions-d1484.firebasestorage.app",messagingSenderId:"1064640847372",appId:"1:1064640847372:web:291b833757f82b7f9e5829",measurementId:"G-CV076XFFKE"};
  const firebaseUrls={app:"https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js",auth:"https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"};
  let fbPromise=null;

  function firebase(){
    if(fbPromise) return fbPromise;
    fbPromise=Promise.all([import(firebaseUrls.app),import(firebaseUrls.auth)]).then(([appMod,authMod])=>{
      const app=appMod.getApps().length?appMod.getApps()[0]:appMod.initializeApp(firebaseConfig);
      return {appMod,authMod,app,auth:authMod.getAuth(app)};
    });
    return fbPromise;
  }

  function fixProfileHeader(){
    document.querySelectorAll('.modal-window.profile-modal .modal-header.profile-detail-header').forEach(function(header){
      var actions=header.querySelector('.profile-actions');
      if(!actions) return;
      var close=header.querySelector(':scope > .profile-close-corner') || actions.querySelector('.icon-close');
      if(close && close.parentElement!==header){
        close.classList.add('profile-close-corner');
        header.appendChild(close);
      }
    });
  }

  function visible(el){
    if(!el) return false;
    const style=getComputedStyle(el);
    if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0) return false;
    const rect=el.getBoundingClientRect();
    return rect.width>8 && rect.height>8 && rect.bottom>0 && rect.top<window.innerHeight;
  }

  function visiblePasswordField(){
    return Array.prototype.some.call(document.querySelectorAll('input[type="password"]'), function(el){
      return visible(el);
    });
  }

  function pageLooksLikeEmptyUsers(){
    var text=(document.body && document.body.innerText || '').toLowerCase();
    return text.includes('no users') || text.includes('no profiles') || text.includes('no staff') || text.includes('no people');
  }

  function profileLooksLoaded(){
    const selectors=[
      '.sidebar .personnel-badge',
      '.sidebar .profile-avatar',
      '.sidebar .profile-initials',
      '.topbar .personnel-badge',
      '.topbar .profile-avatar',
      '.topbar .profile-initials',
      'button .personnel-badge',
      'button .profile-avatar',
      'button .profile-initials'
    ].join(',');
    const badges=Array.from(document.querySelectorAll(selectors)).filter(visible);
    return badges.some(function(el){
      const value=String(el.textContent||'').replace(/\s+/g,'').trim();
      return value.length>1 && !/^P$/i.test(value);
    });
  }

  function profileLooksUnhydrated(){
    if(visiblePasswordField()) return false;
    if(profileLooksLoaded()) return false;
    const selectors=[
      '.sidebar .personnel-badge',
      '.sidebar .profile-avatar',
      '.sidebar .profile-initials',
      '.topbar .personnel-badge',
      '.topbar .profile-avatar',
      '.topbar .profile-initials',
      'button .personnel-badge',
      'button .profile-avatar',
      'button .profile-initials'
    ].join(',');
    const badges=Array.from(document.querySelectorAll(selectors)).filter(visible);
    return badges.some(function(el){
      const value=String(el.textContent||'').replace(/\s+/g,'').trim();
      return value.length<=1 || /^P$/i.test(value);
    });
  }

  function safeReloadOnce(reason){
    const key='planufV71AuthHydrationReloadDone';
    if(sessionStorage.getItem(key)==='1') return;
    sessionStorage.setItem(key,'1');
    sessionStorage.setItem('planufV71AuthHydrationReason',reason||'profile-placeholder');
    window.location.reload();
  }

  function requestProfileHydration(){
    try{ window.dispatchEvent(new CustomEvent('planuf-auth-ready',{detail:{source:'v71-profile-hydration'}})); }catch(e){}
    try{ window.dispatchEvent(new CustomEvent('planuf-profile-refresh-request',{detail:{source:'v71-profile-hydration'}})); }catch(e){}
    try{ window.dispatchEvent(new Event('storage')); }catch(e){}
  }

  function scheduleOneSafeRefreshAfterLogin(){
    requestProfileHydration();
    const checks=[900,1800,3200,5200];
    checks.forEach(function(delay){
      setTimeout(function(){
        requestProfileHydration();
        if(pageLooksLikeEmptyUsers() || profileLooksUnhydrated()){
          safeReloadOnce(pageLooksLikeEmptyUsers()?'empty-users-after-login':'profile-placeholder-after-login');
        }
      },delay);
    });
  }

  function wireFirebaseAuthHydrationGuard(){
    firebase().then(function(fb){
      fb.authMod.onAuthStateChanged(fb.auth,function(user){
        if(!user) return;
        requestProfileHydration();
        setTimeout(requestProfileHydration,300);
        setTimeout(function(){
          if(profileLooksUnhydrated()) safeReloadOnce('auth-ready-profile-placeholder');
        },1400);
        setTimeout(function(){
          if(profileLooksUnhydrated()) safeReloadOnce('auth-ready-profile-placeholder-late');
        },3600);
      });
    }).catch(function(){
      // If Firebase modules are unavailable, retain the click/submit based guard below.
    });
  }

  document.addEventListener('click', function(ev){
    var btn=ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if(!btn) return;
    var label=(btn.innerText || btn.textContent || btn.getAttribute('aria-label') || '').toLowerCase();
    if(label.includes('log in') || label.includes('login') || label.includes('sign in')){
      scheduleOneSafeRefreshAfterLogin();
    }
  }, true);

  document.addEventListener('submit', function(){ scheduleOneSafeRefreshAfterLogin(); }, true);

  fixProfileHeader();
  wireFirebaseAuthHydrationGuard();
  new MutationObserver(function(){fixProfileHeader();}).observe(document.documentElement,{childList:true,subtree:true});
})();
