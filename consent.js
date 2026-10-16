/* ===== GOOGLE ADS + CONSENTEMENT (Loi 25) =====
   Charge dans le <head> de chaque page publique, avant tout autre script.
   Par defaut tout est refuse : rien n'est stocke tant que le visiteur n'a pas accepte.
   Le choix est memorise dans localStorage ("qp_consent" = "granted" | "denied"). */
(function(){
  var AW_ID='AW-18368971500';
  // Etiquettes de conversion Google Ads (AW-18368971500/XXXX). Vide = aucun envoi.
  var CONVERSION_LABELS={
    contact:'',     // formulaire de contact + infolettre
    diagnostic:''   // diagnostic Loi 16 complete
  };
  var KEY='qp_consent';

  window.dataLayer=window.dataLayer||[];
  function gtag(){dataLayer.push(arguments);}
  window.gtag=gtag;

  gtag('consent','default',{
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    analytics_storage:'denied',
    wait_for_update:500
  });

  function readChoice(){
    try{return localStorage.getItem(KEY);}catch(e){return null;}
  }
  function saveChoice(v){
    try{localStorage.setItem(KEY,v);}catch(e){}
  }
  function applyChoice(v){
    var s=v==='granted'?'granted':'denied';
    gtag('consent','update',{ad_storage:s,ad_user_data:s,ad_personalization:s,analytics_storage:s});
  }

  var choice=readChoice();
  if(choice==='granted') applyChoice('granted');

  var tag=document.createElement('script');
  tag.async=true;
  tag.src='https://www.googletagmanager.com/gtag/js?id='+AW_ID;
  document.head.appendChild(tag);
  gtag('js',new Date());
  gtag('config',AW_ID);

  /* Conversion : appeler qpConversion('contact' | 'diagnostic') apres un succes. */
  window.qpConversion=function(type){
    var label=CONVERSION_LABELS[type];
    if(label) gtag('event','conversion',{send_to:AW_ID+'/'+label});
  };

  /* ===== BANDEAU ===== */
  var isEn=(document.documentElement.lang||'').toLowerCase().indexOf('en')===0;
  var T=isEn?{
    msg:'This site uses cookies. You can accept or refuse them.',
    policy:'Privacy policy',href:'/en/privacy-policy',
    accept:'Accept',refuse:'Refuse',label:'Cookie consent'
  }:{
    msg:'Ce site utilise des témoins (cookies). Vous pouvez les accepter ou les refuser.',
    policy:'Politique de confidentialité',href:'/politique-confidentialite',
    accept:'Accepter',refuse:'Refuser',label:'Consentement aux témoins'
  };

  var css=''+
    '#qp-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;max-width:480px;margin:0 auto;'+
    'background:#fff;color:#212B3C;border:1px solid #DCE0EC;border-radius:10px;box-shadow:0 6px 24px rgba(15,31,74,.16);'+
    'padding:12px 14px;display:flex;gap:12px;align-items:center;font-family:\'Nunito Sans\',sans-serif;font-size:13px;line-height:1.45}'+
    '#qp-consent p{margin:0;flex:1}'+
    '#qp-consent a{color:#2A4D9E;text-decoration:underline;white-space:nowrap}'+
    '#qp-consent .qp-c-btns{display:flex;gap:6px;flex-shrink:0}'+
    '#qp-consent button{font:inherit;font-weight:700;cursor:pointer;border-radius:7px;padding:7px 12px;min-width:78px;'+
    'border:1.5px solid #2A4D9E;background:#fff;color:#2A4D9E}'+
    '#qp-consent button.qp-c-yes{background:#2A4D9E;color:#fff}'+
    '#qp-consent button:hover{background:#1A3270;border-color:#1A3270;color:#fff}'+
    '#qp-consent button:focus-visible{outline:2px solid #E8B800;outline-offset:2px}'+
    '@media (max-width:480px){#qp-consent{flex-direction:column;align-items:stretch;gap:10px}#qp-consent .qp-c-btns button{flex:1}}';

  function closeBanner(){
    var b=document.getElementById('qp-consent');
    if(b) b.parentNode.removeChild(b);
  }
  function showBanner(){
    if(document.getElementById('qp-consent')) return;
    if(!document.getElementById('qp-consent-css')){
      var st=document.createElement('style');
      st.id='qp-consent-css';
      st.textContent=css;
      document.head.appendChild(st);
    }
    var b=document.createElement('div');
    b.id='qp-consent';
    b.setAttribute('role','dialog');
    b.setAttribute('aria-label',T.label);
    b.innerHTML='<p>'+T.msg+' <a href="'+T.href+'">'+T.policy+'</a></p><div class="qp-c-btns">'+
      '<button type="button" class="qp-c-no">'+T.refuse+'</button>'+
      '<button type="button" class="qp-c-yes">'+T.accept+'</button></div>';
    b.querySelector('.qp-c-no').onclick=function(){saveChoice('denied');applyChoice('denied');closeBanner();};
    b.querySelector('.qp-c-yes').onclick=function(){saveChoice('granted');applyChoice('granted');closeBanner();};
    document.body.appendChild(b);
  }
  window.qpOpenConsent=function(){showBanner();return false;};

  if(choice!=='granted'&&choice!=='denied'){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',showBanner);
    else showBanner();
  }
})();
