
(function(){
  function safeScrollTop(){
    try {
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          document.documentElement.scrollLeft = 0;
          document.body.scrollLeft = 0;
        });
      });
    } catch (e) {
      try { window.scrollTo(0, 0); } catch(_) {}
    }
  }

  var lastHref = window.location.href;
  function onRouteMaybeChanged(){
    var href = window.location.href;
    if (href !== lastHref) {
      lastHref = href;
      safeScrollTop();
      return;
    }
    // The app is mostly state-routed, so some page changes do not alter the URL.
    // If a profile/detail/modal view has just been opened, force it to start below the sticky header.
    if (document.querySelector('.profile-detail-header, .detail-list, .profile-modal, .modal-window')) {
      safeScrollTop();
    }
  }

  ['pushState','replaceState'].forEach(function(name){
    var original = history[name];
    if (typeof original !== 'function') return;
    history[name] = function(){
      var result = original.apply(this, arguments);
      setTimeout(onRouteMaybeChanged, 0);
      setTimeout(onRouteMaybeChanged, 80);
      return result;
    };
  });

  window.addEventListener('popstate', function(){
    setTimeout(onRouteMaybeChanged, 0);
    setTimeout(onRouteMaybeChanged, 80);
  });

  document.addEventListener('click', function(event){
    var target = event.target && event.target.closest && event.target.closest('button, a, .record-row, .nav-tab, .item-list button, .profile-popover button, .profile-button, .message-pill');
    if (!target) return;
    if (target.closest && target.closest('input, textarea, select, label')) return;
    setTimeout(onRouteMaybeChanged, 80);
    setTimeout(onRouteMaybeChanged, 220);
  }, true);
})();
