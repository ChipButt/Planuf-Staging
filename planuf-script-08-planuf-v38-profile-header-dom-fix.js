
(function(){
  function fixProfileHeader(){
    document.querySelectorAll('.modal-window.profile-modal .modal-header.profile-detail-header').forEach(function(header){
      var actions=header.querySelector('.profile-actions');
      if(!actions) return;
      var moved=header.querySelector('.profile-close-corner');
      if(moved) return;
      var close=actions.querySelector('.icon-close');
      if(!close) return;
      close.classList.add('profile-close-corner');
      header.appendChild(close);
    });
  }
  fixProfileHeader();
  var obs=new MutationObserver(function(){fixProfileHeader();});
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
