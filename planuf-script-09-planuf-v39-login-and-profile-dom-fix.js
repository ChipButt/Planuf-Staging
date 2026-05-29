
(function(){
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
  function visiblePasswordField(){
    return Array.prototype.some.call(document.querySelectorAll('input[type="password"]'), function(el){
      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    });
  }
  function pageLooksLikeEmptyUsers(){
    var text=(document.body && document.body.innerText || '').toLowerCase();
    return text.includes('no users') || text.includes('no profiles') || text.includes('no staff') || text.includes('no people');
  }
  function scheduleOneSafeRefreshAfterLogin(){
    if(sessionStorage.getItem('planufV39LoginRefreshDone')==='1') return;
    sessionStorage.setItem('planufV39LoginRefreshArmed','1');
    setTimeout(function(){
      if(sessionStorage.getItem('planufV39LoginRefreshDone')==='1') return;
      if(!visiblePasswordField() && pageLooksLikeEmptyUsers()){
        sessionStorage.setItem('planufV39LoginRefreshDone','1');
        window.location.reload();
      }
    }, 2200);
    setTimeout(function(){
      if(sessionStorage.getItem('planufV39LoginRefreshDone')==='1') return;
      if(!visiblePasswordField() && pageLooksLikeEmptyUsers()){
        sessionStorage.setItem('planufV39LoginRefreshDone','1');
        window.location.reload();
      }
    }, 5000);
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
  new MutationObserver(function(){fixProfileHeader();}).observe(document.documentElement,{childList:true,subtree:true});
})();
