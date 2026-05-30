// Planuf v74: mobile message composer/send repair.
(function(){
  if(window.__PLANUF_V74_MESSAGE_COMPOSER_FIX__) return;
  window.__PLANUF_V74_MESSAGE_COMPOSER_FIX__=true;

  function qsa(sel,root){return Array.from((root||document).querySelectorAll(sel));}
  function qs(sel,root){return (root||document).querySelector(sel);}
  function isMessagesRoute(){return String(location.hash||'').toLowerCase().includes('message') || !!document.querySelector('.messages-layout');}
  function visible(el){
    if(!el) return false;
    var st=getComputedStyle(el);
    if(st.display==='none'||st.visibility==='hidden') return false;
    var r=el.getBoundingClientRect();
    return r.width>0&&r.height>0;
  }
  function text(el){return String((el&&(el.textContent||el.getAttribute&&el.getAttribute('aria-label')||el.title))||'').trim().toLowerCase();}
  function findComposer(el){return el&&el.closest?el.closest('.message-composer'):null;}
  function findInput(composer){return qs('textarea,input[type="text"],input:not([type])',composer);}
  function findRealSend(composer){
    var buttons=qsa('button',composer).filter(function(btn){
      if(btn.classList.contains('dictate-button')) return false;
      if(btn.classList.contains('planuf-message-send-icon-button')) return false;
      var t=text(btn);
      return t.includes('send') || t.includes('update message') || btn.classList.contains('primary') || btn.classList.contains('planuf-message-send-source');
    });
    return buttons.find(function(btn){return !btn.classList.contains('planuf-message-send-icon-button');}) || null;
  }
  function blurAndResetZoom(){
    try{ if(document.activeElement && /textarea|input/i.test(document.activeElement.tagName)) document.activeElement.blur(); }catch(e){}
    try{ window.scrollTo(window.scrollX, window.scrollY); }catch(e){}
    document.documentElement.style.setProperty('zoom','1');
    document.body.style.setProperty('zoom','1');
    document.documentElement.style.transform='none';
    document.body.style.transform='none';
  }
  function tapRealSend(composer){
    if(!composer) return false;
    var source=findRealSend(composer);
    if(!source || source.disabled) return false;
    var input=findInput(composer);
    if(input){
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }
    try{
      source.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch'}));
      source.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'touch'}));
    }catch(e){}
    source.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}));
    source.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true}));
    source.click();
    blurAndResetZoom();
    return true;
  }
  function ensureIcon(composer){
    if(!composer) return;
    var wrap=qs('.dictation-wrap',composer)||composer;
    var source=findRealSend(composer);
    if(source) source.classList.add('planuf-message-send-source');
    var icon=qs('.planuf-message-send-icon-button',composer);
    if(!icon){
      icon=document.createElement('button');
      icon.type='button';
      icon.className='planuf-message-send-icon-button';
      icon.setAttribute('aria-label','Send message');
      icon.title='Send message';
      wrap.appendChild(icon);
    }
    icon.disabled=source?!!source.disabled:false;
    icon.dataset.planufSendBound='1';
  }
  function fixInputs(){
    qsa('.message-composer textarea,.message-composer input').forEach(function(input){
      input.style.setProperty('font-size','16px','important');
      input.style.setProperty('line-height','1.25','important');
      input.style.setProperty('-webkit-text-size-adjust','100%','important');
      if(input.dataset.planufZoomBound==='1') return;
      input.dataset.planufZoomBound='1';
      input.addEventListener('focus',function(){
        input.style.setProperty('font-size','16px','important');
      },true);
      input.addEventListener('blur',function(){ setTimeout(blurAndResetZoom,80); setTimeout(blurAndResetZoom,260); },true);
    });
  }
  function fixComposers(){
    if(!isMessagesRoute()) return;
    fixInputs();
    qsa('.message-composer').forEach(ensureIcon);
  }
  document.addEventListener('click',function(ev){
    var target=ev.target&&ev.target.closest?ev.target.closest('.planuf-message-send-icon-button'):null;
    if(!target) return;
    var composer=findComposer(target);
    ev.preventDefault();
    ev.stopPropagation();
    tapRealSend(composer);
  },true);
  document.addEventListener('touchend',function(ev){
    var target=ev.target&&ev.target.closest?ev.target.closest('.planuf-message-send-icon-button'):null;
    if(!target) return;
    var composer=findComposer(target);
    ev.preventDefault();
    ev.stopPropagation();
    tapRealSend(composer);
  },true);

  function boot(){fixComposers();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('hashchange',function(){setTimeout(boot,80); setTimeout(boot,260);});
  window.addEventListener('planuf-message-auto-refresh',function(){setTimeout(boot,80);});
  window.addEventListener('planuf-soft-message-refresh',function(){setTimeout(boot,80);});
  var t=null;
  new MutationObserver(function(){clearTimeout(t);t=setTimeout(boot,80);}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','disabled']});
})();
