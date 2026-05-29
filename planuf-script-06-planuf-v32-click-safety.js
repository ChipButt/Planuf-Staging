
(function(){
  function clearBadHeaderOffsets(){
    document.documentElement.style.scrollPaddingTop='0px';
    document.body.style.scrollPaddingTop='0px';
  }
  clearBadHeaderOffsets();
  window.addEventListener('load', clearBadHeaderOffsets);
  window.addEventListener('resize', clearBadHeaderOffsets);
})();
