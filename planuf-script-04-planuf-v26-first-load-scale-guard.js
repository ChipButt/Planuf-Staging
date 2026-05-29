
(function(){
  function applySizingGuard(){
    try {
      var meta = document.querySelector('meta[name="viewport"]');
      if (meta) meta.setAttribute('content','width=device-width, initial-scale=1.0, minimum-scale=1.0, viewport-fit=cover');
      document.documentElement.style.width = '100%';
      document.documentElement.style.maxWidth = '100vw';
      document.documentElement.style.overflowX = 'hidden';
      document.body.style.maxWidth = '100vw';
      document.body.style.overflowX = 'hidden';
      var root = document.getElementById('root');
      if (root) {
        root.style.maxWidth = '100vw';
        root.style.overflowX = 'hidden';
      }
    } catch(e) {}
  }
  applySizingGuard();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySizingGuard, {once:true});
  }
  window.addEventListener('pageshow', applySizingGuard);
  window.addEventListener('resize', applySizingGuard);
})();
