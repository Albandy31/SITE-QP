/* ===== GOOGLE ADS + CONSENTEMENT (Loi 25) =====
   Charge dans le <head> de chaque page publique, avant tout autre script.
   Par defaut tout est refuse : rien n'est stocke tant que le visiteur n'a pas accepte.
   Le choix est memorise dans localStorage ("qp_consent" = "granted" | "denied"). */
(function(){
  var AW_ID='AW-18368971500';
  // Etiquettes de conversion Google Ads (AW-18368971500/XXXX). Vide = aucun envoi.
  var CONVERSION_LABELS={
    contact:'w5JeCLSQuugcEOyFgbdE',     // formulaire de contact + infolettre
    diagnostic:'6ze6CJDWuegcEOyFgbdE'   // diagnostic Loi 16 complete
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
  gtag('config','G-6VRTEHH4Q0'); // Google Analytics 4 (Quatre piliers inc.)

  /* Source de la visite : notee a l'arrivee, jointe uniquement aux demandes que
     la personne envoie elle-meme (formulaires, diagnostic). Rien n'est envoye a un tiers.
     - sessionStorage "qp_src"       : la visite en cours (remplacee seulement par un nouveau clic pub ou des UTM)
     - localStorage   "qp_src_first" : le premier contact, garde 90 jours
     Tests manuels (console) :
       /?gclid=TEST123&utm_source=google&utm_medium=cpc&utm_campaign=test -> qpSource().source = "Google Ads (clic sur une pub)", campagne "test"
       arrivee depuis bing.com                                            -> "Bing (recherche)"
       adresse tapee, sans parametre                                      -> "Direct (adresse tapee, favori ou courriel)" */
  var SRC_KEY='qp_src',FIRST_KEY='qp_src_first',FIRST_TTL=90*24*3600*1000;
  function host(u){try{return u?new URL(u).hostname.replace(/^www\./,''):'';}catch(e){return '';}}
  try{
    var q=new URLSearchParams(location.search);
    var g=function(k){return (q.get(k)||'').slice(0,300);};
    var clickId=g('gclid')||g('gbraid')||g('wbraid');
    if(clickId||g('utm_source')||!sessionStorage.getItem(SRC_KEY)){
      var ref=host(document.referrer);
      if(ref===location.hostname.replace(/^www\./,''))ref='';
      var med=g('utm_medium').toLowerCase(),us=g('utm_source').toLowerCase(),src;
      if(clickId||med==='cpc'||med==='ppc'||med==='paid')src='Google Ads (clic sur une pub)';
      else if(us)src=g('utm_source')+(med?' / '+g('utm_medium'):'');
      else if(/(^|\.)google\./.test(ref))src='Google (recherche, carte ou fiche)';
      else if(/(^|\.)bing\.com$/.test(ref))src='Bing (recherche)';
      else if(/(^|\.)(linkedin\.com|lnkd\.in)$/.test(ref))src='LinkedIn';
      else if(/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/.test(ref))src='Facebook / Instagram';
      else if(ref)src='Autre site : '+ref;
      else src='Direct (adresse tapee, favori ou courriel)';
      var rec={
        source:src,campagne:g('utm_campaign'),gclid:g('gclid'),gbraid:g('gbraid'),wbraid:g('wbraid'),
        utm_source:g('utm_source'),utm_medium:g('utm_medium'),utm_term:g('utm_term'),utm_content:g('utm_content'),
        referent:ref,referrer:ref?(document.referrer||'').slice(0,300):'',arrivee:location.pathname,date:new Date().toISOString()
      };
      sessionStorage.setItem(SRC_KEY,JSON.stringify(rec));
      var first=null;try{first=JSON.parse(localStorage.getItem(FIRST_KEY));}catch(e){}
      if(!first||!first.date||Date.now()-Date.parse(first.date)>FIRST_TTL){
        try{localStorage.setItem(FIRST_KEY,JSON.stringify(rec));}catch(e){}
      }
    }
  }catch(e){}
  window.qpSource=function(){
    try{return JSON.parse(sessionStorage.getItem(SRC_KEY))||{};}catch(e){return {};}
  };
  /* Source complete a joindre a un envoi : visite en cours + premier contact. */
  window.qpGetAttribution=function(){
    var s=window.qpSource(),f=null;
    try{f=JSON.parse(localStorage.getItem(FIRST_KEY));}catch(e){}
    if(f&&f.date&&Date.now()-Date.parse(f.date)>FIRST_TTL)f=null;
    var out={};for(var k in s)out[k]=s[k];
    out.source_resumee=s.source||'';
    out.first_touch=f;
    return out;
  };

  /* Conversion : appeler qpConversion('contact' | 'diagnostic') apres un succes. */
  window.qpConversion=function(type){
    var label=CONVERSION_LABELS[type];
    if(label) gtag('event','conversion',{send_to:AW_ID+'/'+label,value:1.0,currency:'CAD'});
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
