
(function(){
  function fitIdeasGrid(){
    document.querySelectorAll('.ideas-wall').forEach(function(el){
      var w = Math.max(1, el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft || 0) - parseFloat(getComputedStyle(el).paddingRight || 0));
      var h = Math.max(1, el.clientHeight - parseFloat(getComputedStyle(el).paddingTop || 0) - parseFloat(getComputedStyle(el).paddingBottom || 0));
      var cols = Math.max(4, Math.round(w / 28));
      var rows = Math.max(4, Math.round(h / 28));
      var cw = w / cols;
      var ch = h / rows;
      el.style.backgroundSize = cw + 'px ' + ch + 'px';
    });
  }
  window.addEventListener('load', fitIdeasGrid, {once:false});
  window.addEventListener('resize', fitIdeasGrid);
  setInterval(fitIdeasGrid, 750);
})();
