// Planuf v75: polished chat header member circles and new-chat render guard.
(function(){
  if(window.__PLANUF_V75_CHAT_HEADER_AND_NEW_CHAT_FIX__) return;
  window.__PLANUF_V75_CHAT_HEADER_AND_NEW_CHAT_FIX__=true;

  function qsa(sel,root){return Array.from((root||document).querySelectorAll(sel));}
  function qs(sel,root){return (root||document).querySelector(sel);}
  function cleanText(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function isMessagesRoute(){return String(location.hash||'').toLowerCase().includes('message') || !!document.querySelector('.messages-layout');}

  function safeString(value){
    if(value == null) return '';
    if(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if(Array.isArray(value)) return value.map(safeString).filter(Boolean).join(', ');
    if(typeof value === 'object'){
      return value.displayName || value.name || value.nickname || value.username || value.email || value.title || '';
    }
    return '';
  }

  function initialsFromName(name){
    name=cleanText(safeString(name));
    if(!name || /^everyone$/i.test(name)) return '•';
    var parts=name.split(/[\s._-]+/).filter(Boolean);
    if(parts.length>=2) return (parts[0][0]+parts[1][0]).toUpperCase();
    return name.slice(0,2).toUpperCase();
  }

  function extractNamesFromHeader(header){
    var raw=cleanText(header ? header.textContent : '');
    raw=raw.replace(/create\s*idea/ig,' ')
           .replace(/back\s*to\s*chats/ig,' ')
           .replace(/chat\s*members\s*:/ig,' ')
           .replace(/members\s*:/ig,' ')
           .replace(/everyone/ig,' ');
    var names=raw.split(/,|\band\b|\+|•|\|/i).map(cleanText).filter(function(n){
      return n && n.length<32 && !/^(chat|members|message|messages|create|idea|back|everyone)$/i.test(n);
    });
    var unique=[];
    names.forEach(function(n){ if(!unique.some(function(x){return x.toLowerCase()===n.toLowerCase();})) unique.push(n); });
    return unique.slice(0,4);
  }

  function extractNamesFromRows(){
    var names=[];
    qsa('.chat-row.active [class*="avatar"], .chat-row.active strong, .record-row.active strong, .chat-row.active [class*="name"], .record-row.active [class*="name"]').forEach(function(el){
      var t=cleanText(el.textContent||el.getAttribute('aria-label')||el.title||'');
      if(t && !/everyone|message|chat/i.test(t)) names.push(t);
    });
    var unique=[];
    names.forEach(function(n){ if(!unique.some(function(x){return x.toLowerCase()===n.toLowerCase();})) unique.push(n); });
    return unique.slice(0,4);
  }

  function makeStrip(header){
    if(!header) return;
    var strip=qs('.planuf-chat-member-strip',header);
    if(!strip){
      strip=document.createElement('div');
      strip.className='planuf-chat-member-strip';
      header.insertBefore(strip, qs('.planuf-create-idea-from-chat',header) || header.lastChild);
    }
    var names=extractNamesFromHeader(header);
    if(!names.length) names=extractNamesFromRows();
    if(!names.length) names=['Chat'];
    strip.innerHTML='';
    names.slice(0,4).forEach(function(name){
      var avatar=document.createElement('span');
      avatar.className='planuf-chat-member-avatar';
      avatar.title=cleanText(safeString(name));
      avatar.textContent=initialsFromName(name);
      strip.appendChild(avatar);
    });
    if(names.length>4){
      var extra=document.createElement('span');
      extra.className='planuf-chat-member-extra';
      extra.textContent='+'+(names.length-4);
      strip.appendChild(extra);
    }
  }

  function tidyHeader(){
    if(!isMessagesRoute()) return;
    var root=qs('.messages-layout');
    if(!root) return;
    var header=qs('.chat-detail .chat-header,.chat-header',root);
    if(!header) return;
    qsa('button',header).forEach(function(btn){
      var label=cleanText(btn.textContent||btn.getAttribute('aria-label')||btn.title||'').toLowerCase();
      if(label.includes('create') || label.includes('idea')){
        btn.classList.add('planuf-create-idea-from-chat');
        btn.classList.remove('planuf-chat-back-button');
      }
    });
    var back=qs('.planuf-chat-back-button',header);
    if(!back){
      back=document.createElement('button');
      back.type='button';
      back.className='planuf-chat-back-button';
      back.setAttribute('aria-label','Back to chats');
      back.addEventListener('click',function(ev){
        ev.preventDefault(); ev.stopPropagation();
        root.classList.remove('planuf-chat-open');
        document.body.classList.add('planuf-force-chat-list');
      },true);
      header.insertBefore(back,header.firstChild);
    }
    makeStrip(header);
  }

  function patchObjectRenderText(){
    qsa('body *').forEach(function(el){
      if(!el || el.children.length) return;
      var t=cleanText(el.textContent||'');
      if(t==='[object Object]' || t==='object cannot be found here' || /object cannot be found here/i.test(t)){
        el.textContent='';
        el.setAttribute('data-planuf-object-render-cleaned','true');
      }
    });
  }

  function guardNewChatClicks(){
    qsa('button,.planuf-new-chat-button').forEach(function(btn){
      var label=cleanText(btn.textContent||btn.getAttribute('aria-label')||btn.title||'').toLowerCase();
      if(!label.includes('new chat') && !label.includes('create chat') && !(btn.classList&&btn.classList.contains('planuf-new-chat-button'))) return;
      if(btn.dataset.planufV75NewChatGuard==='1') return;
      btn.dataset.planufV75NewChatGuard='1';
      btn.addEventListener('click',function(){
        setTimeout(function(){
          patchObjectRenderText();
          tidyHeader();
          try{ window.dispatchEvent(new CustomEvent('planuf-new-chat-guarded')); }catch(e){}
        },80);
        setTimeout(patchObjectRenderText,240);
        setTimeout(patchObjectRenderText,600);
      },true);
    });
  }

  function boot(){
    tidyHeader();
    guardNewChatClicks();
    patchObjectRenderText();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('hashchange',function(){setTimeout(boot,80); setTimeout(boot,240);});
  window.addEventListener('planuf-message-auto-refresh',function(){setTimeout(boot,80);});
  window.addEventListener('planuf-soft-message-refresh',function(){setTimeout(boot,80);});
  var t=null;
  new MutationObserver(function(){clearTimeout(t); t=setTimeout(boot,80);}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-label','title']});
})();
