// Planuf v67: measure the actual visible fixed header and place content directly underneath it.
(function(){
  if(window.__PLANUF_V67_MEASURED_HEADER__) return;
  window.__PLANUF_V67_MEASURED_HEADER__=true;
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
  function loadMessagesOnlyFix(){
    if(window.__PLANUF_MESSAGES_ONLY_FIX_LOADED__) return;
    window.__PLANUF_MESSAGES_ONLY_FIX_LOADED__=true;
    const script=document.createElement('script');
    script.src='planuf-script-20-v68-messages-route-class.js?v=stable2';
    script.dataset.sourceId='planuf-v68-stable-messages-route-class';
    document.body.appendChild(script);
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='planuf-style-37-v68-messages-only-stable.css?v=stable2';
    link.dataset.sourceId='planuf-v68-stable-messages-only-layout';
    document.head.appendChild(link);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{apply();loadMessagesOnlyFix();}); else {apply();loadMessagesOnlyFix();}
  window.addEventListener('resize',apply);
  window.addEventListener('orientationchange',()=>setTimeout(apply,250));
  window.addEventListener('hashchange',()=>setTimeout(apply,80));
  let t=null;
  new MutationObserver(()=>{clearTimeout(t);t=setTimeout(apply,80);}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
})();
