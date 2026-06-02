// Planuf v77: measure fixed header and load messages fixes with fresh cache keys.
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function visibleBottomOfHeader(sidebar){
    if(!sidebar) return 0;
    const sideRect=sidebar.getBoundingClientRect();
    let bottom=sideRect.top;
    qsa('*',sidebar).forEach(el=>{
      const st=getComputedStyle(el);
      if(st.display==='none'||st.visibility==='hidden'||Number(st.opacity)===0) return;
      const r=el.getBoundingClientRect();
      if(r.width>0&&r.height>0) bottom=Math.max(bottom,r.bottom);
    });
    return Math.ceil(bottom - sideRect.top + 3);
  }
  function apply(){
    const sidebar=qs('.sidebar');
    const panel=qs('.main-panel');
    if(!sidebar||!panel) return;
    const h=Math.max(66, Math.min(96, visibleBottomOfHeader(sidebar)));
    document.documentElement.style.setProperty('--planuf-fixed-topbar', h+'px');
    sidebar.style.height=h+'px';
    sidebar.style.maxHeight=h+'px';
    panel.style.position='fixed';
    panel.style.top=h+'px';
    panel.style.height='calc(100dvh - '+h+'px)';
    panel.style.maxHeight='calc(100dvh - '+h+'px)';
    panel.style.paddingTop='0px';
    panel.style.marginTop='0px';
    const topbar=panel.querySelector(':scope > .topbar');
    if(topbar){topbar.style.display='none';topbar.style.height='0';topbar.style.margin='0';topbar.style.padding='0';}
    const first=panel.firstElementChild;
    if(first){first.style.marginTop='0';first.style.paddingTop='0';}
  }
  function addScript(src,id){
    if(document.querySelector('script[data-source-id="'+id+'"]')) return;
    const script=document.createElement('script');
    script.src=src;
    script.dataset.sourceId=id;
    document.body.appendChild(script);
  }
  function addStyle(href,id){
    if(document.querySelector('link[data-source-id="'+id+'"]')) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    link.dataset.sourceId=id;
    document.head.appendChild(link);
  }
  function loadMessagesOnlyFix(){
    addScript('planuf-script-20-v68-messages-route-class.js?v=stable4','planuf-v69-chat-banner-cleanup');
    addStyle('planuf-style-37-v68-messages-only-stable.css?v=stable4','planuf-v69-chat-banner-layout');
    addStyle('planuf-style-40-v75-smart-chat-header.css?v=77','planuf-v77-smart-chat-header');
    addScript('planuf-script-22-v75-chat-header-and-new-chat-fix.js?v=77','planuf-v77-chat-header-and-new-chat-fix');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{apply();loadMessagesOnlyFix();}); else {apply();loadMessagesOnlyFix();}
  window.addEventListener('resize',apply);
  window.addEventListener('orientationchange',()=>setTimeout(apply,250));
  window.addEventListener('hashchange',()=>{setTimeout(apply,80);setTimeout(loadMessagesOnlyFix,100);});
  let t=null;
  new MutationObserver(()=>{clearTimeout(t);t=setTimeout(apply,80);}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
})();
