/* ===== CHAT ===== */
function toggleChat(){
  var panel=document.getElementById('chat-panel');
  var iconOpen=document.getElementById('chat-icon-open');
  var iconClose=document.getElementById('chat-icon-close');
  var notif=document.getElementById('chat-notif');
  var isOpen=panel.style.display==='flex';
  if(!isOpen){
    panel.style.display='flex';
    iconOpen.style.display='none';
    iconClose.style.display='block';
    if(notif)notif.style.display='none';
    setTimeout(function(){var ci=document.getElementById('chat-input');if(ci)ci.focus();},200);
  } else {
    panel.style.display='none';
    iconOpen.style.display='block';
    iconClose.style.display='none';
  }
}

var chatState=0;
var chatFirstMsg='';

function botReply(text){
  var msgs=document.getElementById('chat-messages');
  var reply=document.createElement('div');
  reply.style.cssText='display:flex;gap:8px;align-items:flex-end;';
  reply.innerHTML='<div style="width:30px;height:30px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;">🏢</div><div style="background:#fff;border:1px solid var(--brd);border-radius:12px 12px 12px 2px;padding:10px 14px;font-size:13px;color:var(--txt);max-width:230px;line-height:1.55;box-shadow:0 1px 4px rgba(0,0,0,.06);">'+text+'</div>';
  msgs.appendChild(reply);
  msgs.scrollTop=msgs.scrollHeight;
}

function sendChatMsg(){
  var input=document.getElementById('chat-input');
  var msg=input.value.trim();
  if(!msg) return;
  var msgs=document.getElementById('chat-messages');
  var userBubble=document.createElement('div');
  userBubble.style.cssText='display:flex;justify-content:flex-end;';
  userBubble.innerHTML='<div style="background:var(--blue);color:#fff;border-radius:12px 12px 2px 12px;padding:10px 14px;font-size:13px;max-width:230px;line-height:1.55;box-shadow:0 1px 4px rgba(0,0,0,.1);">'+escHtml(msg)+'</div>';
  msgs.appendChild(userBubble);
  input.value='';
  msgs.scrollTop=msgs.scrollHeight;
  if(chatState===0){
    chatFirstMsg=msg;
    chatState=1;
    setTimeout(function(){botReply(translations[currentLang||'fr']['chat.reply1']);},600);
  } else if(chatState===1){
    var contact=msg;
    chatState=2;
    fetch('https://formspree.io/f/mgoplwyd',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({'_subject':'Message chat – Quatre Piliers','Message':chatFirstMsg,'Contact':contact})
    })
    .then(function(r){return r.json();})
    .then(function(res){
      if(res.ok){botReply(translations[currentLang||'fr']['chat.ok']);}
      else{botReply(translations[currentLang||'fr']['chat.err1']);chatState=1;}
    })
    .catch(function(){botReply(translations[currentLang||'fr']['chat.err2']);chatState=1;});
  }
}

function escHtml(t){
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ===== MODAL ===== */
function openModal(){
  var m=document.getElementById('modal');
  if(m){m.style.display='flex';document.body.style.overflow='hidden';}
}
function closeModal(){
  var m=document.getElementById('modal');
  if(m){m.style.display='none';document.body.style.overflow='';}
}
window.addEventListener('click',function(e){
  var m=document.getElementById('modal');
  if(m&&e.target===m) closeModal();
});

/* ===== FORM ===== */
function submitForm(btn){
  var scope=btn.closest('.modal')||btn.closest('.mini-form')||btn.parentElement;
  var fields=scope?scope.querySelectorAll('input,textarea,select'):[];
  var originalText=btn.textContent;
  var data={};
  if(fields.length===1&&fields[0].type==='email'){
    var email=fields[0].value.trim();
    if(!email){alert(translations[currentLang||'fr']['alert.email']||'Veuillez entrer votre adresse courriel.');return;}
    data={'_subject':'Inscription infolettre - Quatre Piliers','Courriel':email};
  } else {
    data={'_subject':'Message via le site - Quatre Piliers'};
    fields.forEach(function(f){
      var label='';
      var fg=f.closest('.fg');
      if(fg){var lbl=fg.querySelector('label');if(lbl)label=lbl.textContent.trim().replace(/\s*\*$/,'');}
      if(!label&&f.placeholder)label=f.placeholder;
      if(f.value&&f.value.trim())data[label||f.type]=f.value.trim();
    });
  }
  btn.disabled=true;
  btn.textContent=translations[currentLang||'fr']['btn.sending']||'Envoi en cours…';
  fetch('https://formspree.io/f/mgoplwyd',{
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify(data)
  })
  .then(function(r){return r.json();})
  .then(function(res){
    if(res.ok){
      fields.forEach(function(f){f.value='';});
      btn.textContent=translations[currentLang||'fr']['btn.sent']||'Envoyé ✓';
      var ok=btn.nextElementSibling;
      if(ok&&ok.classList&&ok.classList.contains('ok-msg'))ok.style.display='block';
      if(btn.closest('.modal')){setTimeout(function(){closeModal();if(ok)ok.style.display='none';btn.disabled=false;btn.textContent=originalText;},1800);}
    } else {
      btn.disabled=false;btn.textContent=originalText;
      alert('Erreur lors de l\'envoi. Veuillez réessayer.');
    }
  })
  .catch(function(){
    btn.disabled=false;btn.textContent=originalText;
    alert('Erreur de connexion. Veuillez réessayer.');
  });
}

/* ===== MOBILE MENU ===== */
function toggleMenu(){
  var m=document.getElementById('mobMenu');
  if(!m)return;
  var isOpen=m.classList.contains('open');
  if(isOpen){m.classList.remove('open');document.body.style.overflow='';}
  else{m.classList.add('open');document.body.style.overflow='hidden';}
}

/* ===== i18n ===== */
var currentLang='fr';
var translations={
  fr:{
    'nav.home':'Accueil','nav.services':'Services','nav.pricing':'Tarification',
    'nav.law16':'Loi 16','nav.blog':'Blog','nav.contact':'Contact',
    'nav.devis':'Soumission gratuite','nav.devis.short':'Soumission gratuite',
    'mob.devis':'Soumission gratuite',
    'hero.title':'Gestion de copropriété à Montréal — experts et réactifs 24/7',
    'hero.pill1':'Urgence 24/7','hero.pill2':'Réponse <24h',
    'hero.pill3':'Transparent','hero.pill4':'Conformité Loi 16',
    'hero.btn.quote':'Découvrez nos forfaits',
    'diag.banner.pill':'Nouveau',
    'diag.banner.text':'Loi 16 — Êtes-vous conforme ?',
    'diag.banner.text.mob':'Loi 16 · Êtes-vous conforme ?',
    'diag.banner.cta':'Évaluation gratuite en 2 mn →',
    'diag.hero.btn':'Évaluez votre conformité loi 16',
    'diag.home.card.title':'Diagnostic de conformité Loi 16 — Gratuit',
    'diag.home.card.desc':'10 questions · Rapport personnalisé par IA · Résultat immédiat',
    'diag.info.card.title':'Votre syndicat est-il prêt pour août 2028 ?',
    'diag.info.card.desc':'Faites le diagnostic en 2 minutes — rapport personnalisé par IA, 100 % gratuit',
    'diag.info.btn':'Évaluation conformité loi 16 gratuite',
    'hero.btn.services':'Découvrir nos services →',
    'hero.btn.pricing':'Voir nos tarifs →',
    'eng.lbl':'Nos engagements',
    'eng.title':'Six valeurs au cœur de chaque mandat',
    'eng.desc':'Notre approche repose sur des principes concrets qui guident chaque action, chaque décision et chaque interaction avec votre syndicat.',
    'eng.1.title':'Réactivité','eng.1.desc':'Une réponse rapide et des solutions efficaces à chaque situation.',
    'eng.2.title':'Transparence','eng.2.desc':'Communication claire et accès à l\'information en tout temps.',
    'eng.3.title':'Rigueur','eng.3.desc':'Processus structurés et contrôles efficaces pour une gestion optimale.',
    'eng.4.title':'Proximité','eng.4.desc':'Une équipe disponible et à l\'écoute de vos besoins.',
    'eng.5.title':'Valorisation','eng.5.desc':'Gestion proactive pour assurer la pérennité et la valeur de votre actif.',
    'eng.6.title':'Conformité Loi 16','eng.6.desc':'Nous assurons le respect des exigences de la Loi 16 et des meilleures pratiques.',
    'home.srv.lbl':'Nos quatre piliers de services',
    'home.srv.title':'Une gestion complète sur tous les fronts',
    'home.srv.desc':'Quatre domaines intégrés pour couvrir chaque aspect de la vie de votre syndicat — avec la réactivité qui nous distingue.',
    'srv.admin.title':'Administratif & juridique',
    'srv.admin.desc':'Assemblées, contrats, registres et conformité légale — le tout géré avec rigueur.',
    'srv.fin.title':'Financier & comptable',
    'srv.fin.desc':'Budgets, charges, fonds de prévoyance et rapports trimestriels transparents.',
    'srv.tech.title':'Technique & entretien',
    'srv.tech.desc':'Carnet d\'entretien, travaux, contrats et urgences 24h/24 — votre immeuble est entre de bonnes mains.',
    'srv.com.title':'Communication & gouvernance',
    'srv.com.desc':'Communication proactive, plateforme logicielle et soutien complet au CA.',
    'btn.detail':'Voir le détail →','btn.allservices':'Voir tous les services en détail →',
    'home.pricing.title':'Des forfaits adaptés à chaque syndicat',
    'pc.badge':'Plus populaire',
    'pc.ess.desc':'Idéal pour les petits syndicats souhaitant rigueur comptable et conformité administrative.',
    'pc.ser.desc':'Gestionnaire dédié, gestion technique et planification long terme inclus.',
    'pc.cus.desc':'Services à la carte, tous types d\'immeubles, tarif négocié.',
    'btn.contact':'Nous contacter →','btn.seepricing':'Voir la tarification complète →',
    'home.law.lbl':'Informations','home.law.title':'La Loi 16 : êtes-vous en règle ?',
    'home.law.desc':'La Loi 16 impose de nouvelles obligations à tous les syndicats de copropriété au Québec. Chez Quatre Piliers, nous vous accompagnons pas à pas.',
    'law.item1.title':'Carnet d\'entretien obligatoire',
    'law.item1.desc':'Les syndicats doivent produire un carnet d\'entretien d\'ici le 14 août 2028.',
    'law.item2.title':'Étude du fonds de prévoyance',
    'law.item2.desc':'Les syndicats ont jusqu\'au 14 août 2028 pour obtenir leur première étude du fonds de prévoyance.',
    'law.item3.title':'Attestation du syndicat',
    'law.item3.desc':'Obligatoire à chaque vente d\'unité depuis 2025.',
    'btn.fullguide':'Lire notre guide complet →',
    'home.contact.lbl':'Contact','home.contact.title':'Parlons de votre copropriété',
    'home.contact.desc':'Notre équipe vous répond sous 24 heures ouvrables. Pour les urgences, appelez directement 24/7.',
    'contact.phone.lbl':'Téléphone (urgence 24/7)','contact.email.lbl':'Courriel',
    'contact.zone.lbl':'Zone desservie','contact.zone.val':'Grand Montréal — Laval, Longueuil, Rive-Nord, Rive-Sud',
    'contact.hours.lbl':'Heures de bureau','contact.hours.val':'Lun–Ven 8h30–17h30 · Urgences 24/7',
    'contact.urg.title':'🚨 Urgence 24/7',
    'contact.urg.desc':'Pour tout sinistre, dégât d\'eau ou bris majeur, appelez notre ligne d\'urgence 24h/24, 7j/7. Intervention rapide garantie.',
    'contact.urg.desc2':'Pour tout sinistre, dégât d\'eau ou bris majeur, appelez notre ligne d\'urgence disponible 24h/24, 7j/7.',
    'form.title':'Envoyer un message','form.syndic':'Syndicat *','form.units':'Unités',
    'form.name':'Votre nom *','form.message':'Message *','btn.send':'Envoyer →',
    'ph.syndic':'Nom du syndicat','ph.units':'Nb. unités','ph.name':'Prénom Nom',
    'ph.message':'Décrivez votre situation...',
    'page.srv.h1':'Nos quatre piliers de services',
    'page.srv.sub':'Une gamme de service complète pour répondre à tous vos besoins, avec la réactivité qui nous distingue.',
    'page.tar.h1':'Nos forfaits sur mesure',
    'page.tar.sub':'Pas de prix rigides : un forfait adapté à vos besoins, votre taille et vos priorités.',
    'page.tar.note':'<span data-i18n-html="page.tar.note">Nos tarifs sont indicatifs et varient selon le nombre d\'unités et les services sélectionnés. <strong>Soumission personnalisée</strong>, réponse sous 24h.</span>',
    'tar.ess.desc':'Idéal pour les petits syndicats (moins de 10 unités) souhaitant une rigueur comptable pour éviter les conflits et faciliter les transactions notariales.',
    'tar.ser.desc':'La formule la plus populaire. Elle décharge le CA de la paperasse et de la gestion des fournisseurs quotidiens, tout en laissant les décisions stratégiques aux administrateurs. Sa gestion inclut un gestionnaire dédié qui s\'occupe de la planification à long terme des actifs (Loi 16) en plus d\'une plateforme logicielle.',
    'tar.cus.desc':'Profitez d\'une offre de services exclusive et évolutive : choisissez vos prestations à la carte ou optez pour un accompagnement renforcé avec des services récurrents. Notre flexibilité vous permet d\'ajuster votre forfait à tout moment pour répondre parfaitement aux priorités de votre syndicat.',
    'tar.footnote':'Les tarifs sont par unité par mois et peuvent varier selon le nombre d\'unités et les services inclus.',
    'btn.custquote':'Demander ma tarification personnalisée',
    'page.info.h1':'Loi 16',
    'page.info.sub':'Guide complet sur la Loi 16 et la gestion des copropriétés divises au Québec.',
    'page.contact.h1':'Contactez-nous',
    'page.contact.sub':'Notre équipe vous répond sous 24 heures ouvrables. Pour les urgences, appelez directement 24/7.',
    'contact.main.desc':'Que vous cherchiez un nouveau gestionnaire, une mise à niveau de votre gouvernance ou une structure plus fiable pour votre syndicat, nous sommes là pour vous aider rapidement. Notre équipe vous répond sous 24 heures ouvrables. Pour les urgences, appelez directement 24/7.',
    'modal.title':'Soumission gratuite & sans engagement',
    'modal.sub':'Complétez ce formulaire et nous vous répondons sous 24 heures ouvrables.',
    'form.syndic.full':'Nom du syndicat *','form.contact':'Contact *',
    'form.nbunits':'Nb. unités *','form.email':'Courriel *','form.phone':'Téléphone',
    'ph.syndic.full':'Ex. : Syndicat Les Érables','ph.modal.message':'Vos besoins ou questions...',
    'btn.sendrequest':'Envoyer ma demande →',
    'form.ok':'✅ Merci ! Nous vous contacterons sous 24 heures ouvrables.',
    'footer.tagline':'Gestionnaire de copropriété expert et ultra réactif dans le Grand Montréal. Urgences 24/7.',
    'footer.copy':'© 2025 Quatre Piliers Gestion Copropriété Inc. Tous droits réservés.',
    'hero.subtitle':'Gestionnaire ultra réactif pour votre syndicat : prise en charge complète ou à la carte (administrative, financière, technique, humaine). Conformité Loi 16.',
    'lbl.pricing':'Tarification','lbl.plan':'Forfait','lbl.perunit':' /unité/mois',
    'home.pricing.note':'<strong>Soumission gratuite</strong>, réponse sous 24h.',
    'plan.essential':'Essentiel','plan.serenity':'Sérénité','plan.custom':'Sur mesure','plan.discuss':'À discuter',
    'feat.admin.base':'Administratif de base','feat.fin.base':'Financier de base',
    'feat.platform':'Plateforme logicielle','feat.alacarte':'Services à la carte',
    'feat.adjustable':'Ajustable en tout temps','feat.negotiated':'Tarif négocié selon volume',
    'btn.askquote':'Demander une soumission →',
    'form.ok2':'✅ Message envoyé ! Nous vous répondons sous 2h.',
    'contact.email.val':'<a href="mailto:info@quatrepiliers.ca" style="color:inherit">info@quatrepiliers.ca</a>',
    'cta.title':'Prêt à confier votre copropriété à des experts ?',
    'cta.desc':'<strong>Soumission personnalisée gratuite</strong>, sans engagement. Réponse garantie <strong>sous 24 heures ouvrables</strong>.',
    'cta.btn':'Obtenir ma soumission gratuite',
    'cta.srv.title':'Libérez-vous de la gestion complexe et des nouvelles obligations légales !',
    'cta.srv.desc':'Obtenez votre soumission gratuite en un clic et simplifiez la vie de votre syndicat dès aujourd\'hui.',
    'footer.nav':'Navigation','footer.newsletter':'Infolettre',
    'ph.email':'Votre courriel','btn.subscribe':"S'abonner →",
    'footer.privacy':'Politique de confidentialité','footer.legal':'Mentions légales',
    'srv.tech.title2':'Gestion technique &amp; entretien',
    'btn.reqsrv':'Demander ce service →',
    'btn.retour':'← Retour au blog',
    'blog.h1':'Blog',
    'blog.sub':'Conseils, actualités et guides pratiques pour les syndicats de copropriété au Québec.',
    'lbl.includes':'Ce forfait inclut',
    'feat.fin.comp.base':'Financier et comptable de base',
    'feat.tech.mgmt':'Gestion technique &amp; entretien',
    'feat.allbldg':'Tous types d\'immeubles',
    'feat.enhanced':'Accompagnement renforcé possible',
    'info.update':'<strong style="color:var(--blue)">Mise à jour : mars 2026</strong> – Basé sur le Règlement établissant diverses règles en matière de copropriété divise, en vigueur depuis le <strong style="color:var(--txt)">14 août 2025</strong>.',
    'info.p1':'La Loi 16, officiellement le <strong style="color:var(--txt)">projet de loi n° 16 (2019, chapitre 28)</strong>, est la plus importante réforme de la copropriété divise au Québec depuis l\'entrée en vigueur du Code civil du Québec en 1994. Elle vise à moderniser la gestion des syndicats de copropriété, à renforcer la protection financière des copropriétaires et à assurer la pérennité du parc immobilier en copropriété.',
    'info.p2':'Le règlement d\'application (publié le 30 juillet 2025 dans la Gazette officielle du Québec) est entré en vigueur le <strong style="color:var(--txt)">14 août 2025</strong>. Il concrétise les trois grands outils prévus par la Loi 16 : le <strong style="color:var(--txt)">carnet d\'entretien</strong>, l\'<strong style="color:var(--txt)">étude du fonds de prévoyance</strong> et l\'<strong style="color:var(--txt)">attestation sur l\'état de la copropriété</strong>. Ces obligations s\'appliquent à toutes les copropriétés divises au Québec, sans exception.',
    'info.h2.1':'1. Pourquoi la Loi 16 ? Objectifs de la réforme',
    'info.h2.2':'2. Les trois piliers obligatoires de la Loi 16',
    'info.h2.3':'3. Autres mesures importantes',
    'info.h2.4':'4. Échéancier de mise en conformité (2025–2028)',
    'info.h2.5':'5. Qui fait quoi ?',
    'info.h2.6':'6. Conséquences pratiques',
    'info.h2.7':'7. Ressources officielles',
    'info.sec1.list':'<li>Passer d\'une gestion réactive à une gestion proactive et planifiée sur 25 ans.</li><li>Protéger les copropriétaires contre la sous-capitalisation des fonds de prévoyance.</li><li>Améliorer la transparence lors des ventes d\'unités.</li><li>Renforcer la gouvernance et la responsabilité des conseils d\'administration.</li><li>Assurer la durabilité des immeubles (toitures, ascenseurs, systèmes mécaniques, etc.).</li>',
    'info.sec1.p':'La réforme s\'inscrit dans la continuité du projet de loi n° 31 (2024) et modifie principalement les articles 1068.1, 1070.2, 1071 et 1070 du Code civil du Québec (C.c.Q.).',
    'info.card.a.title':'Le carnet d\'entretien <span style="font-size:13px;font-weight:400;opacity:.8">(art. 1070.2 C.c.Q.)</span>',
    'info.card.b.title':'L\'étude du fonds de prévoyance <span style="font-size:13px;font-weight:400;opacity:.8">(art. 1071 C.c.Q.)</span>',
    'info.card.c.title':'L\'attestation sur l\'état de la copropriété <span style="font-size:13px;font-weight:400;opacity:.8">(art. 1068.1 C.c.Q.)</span>',
    'info.card.a.obj':'<strong style="color:var(--txt)">Objectif :</strong> Documenter l\'état de l\'immeuble, planifier les travaux et conserver l\'historique des interventions.',
    'info.card.b.obj':'<strong style="color:var(--txt)">Objectif :</strong> Déterminer le montant nécessaire pour couvrir les réparations majeures et remplacements des parties communes sur 25 ans.',
    'info.card.c.obj':'<strong style="color:var(--txt)">Objectif :</strong> Informer l\'acheteur potentiel de l\'état financier et physique de la copropriété avant l\'achat. Fournie dans les <strong style="color:var(--txt)">15 jours</strong> suivant la demande.',
    'info.sec3.list':'<li><strong style="color:var(--txt)">Acomptes pour condos neufs (art. 1791.1 C.c.Q.) :</strong> Protection renforcée par fidéicommis, plan de garantie, assurance ou cautionnement.</li><li><strong style="color:var(--txt)">Transparence :</strong> Le conseil doit transmettre plus rapidement les procès-verbaux et résolutions.</li><li><strong style="color:var(--txt)">Assurances :</strong> Obligations accrues pour le syndicat.</li><li><strong style="color:var(--txt)">Fonds d\'auto-assurance :</strong> Règles précises sur son utilisation.</li>',
    'info.sec4.table':'<thead><tr style="background:var(--blue);color:#fff"><th style="padding:12px 16px;text-align:left;font-family:\'Nunito Sans\',serif;font-weight:600;letter-spacing:.04em">Action</th><th style="padding:12px 16px;text-align:left;font-family:\'Nunito Sans\',serif;font-weight:600;letter-spacing:.04em">Copropriétés existantes</th><th style="padding:12px 16px;text-align:left;font-family:\'Nunito Sans\',serif;font-weight:600;letter-spacing:.04em">Nouvelles copropriétés</th></tr></thead><tbody><tr style="border-bottom:1px solid var(--brd)"><td style="padding:12px 16px;color:var(--txt);font-weight:600">Carnet d\'entretien + Étude</td><td style="padding:12px 16px;color:var(--muted)"><strong style="color:var(--txt)">15 août 2028</strong> au plus tard</td><td style="padding:12px 16px;color:var(--muted)">Par le promoteur (30 j. ou 6 mois)</td></tr><tr style="border-bottom:1px solid var(--brd);background:var(--cream)"><td style="padding:12px 16px;color:var(--txt);font-weight:600">Mise à jour annuelle du carnet</td><td style="padding:12px 16px;color:var(--muted)">Dès production</td><td style="padding:12px 16px;color:var(--muted)">Dès production</td></tr><tr style="border-bottom:1px solid var(--brd)"><td style="padding:12px 16px;color:var(--txt);font-weight:600">Révision étude</td><td style="padding:12px 16px;color:var(--muted)">Tous les 5 ans</td><td style="padding:12px 16px;color:var(--muted)">Tous les 5 ans</td></tr><tr style="background:var(--cream)"><td style="padding:12px 16px;color:var(--txt);font-weight:600">Attestation (vente)</td><td style="padding:12px 16px;color:var(--muted)">Immédiat (15 jours)</td><td style="padding:12px 16px;color:var(--muted)">Immédiat (15 jours)</td></tr></tbody>',
    'info.sec5.grid':'<div style="background:var(--cream);border-radius:8px;padding:18px 20px"><p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:8px">Syndicat / CA</p><p style="font-size:13.5px;color:var(--muted);line-height:1.75">Commande les documents, met à jour le carnet, fixe les contributions, conserve au registre, fournit l\'attestation.</p></div><div style="background:var(--cream);border-radius:8px;padding:18px 20px"><p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:8px">Copropriétaires</p><p style="font-size:13.5px;color:var(--muted);line-height:1.75">Paient les contributions obligatoires, ont droit d\'accès aux documents.</p></div><div style="background:var(--cream);border-radius:8px;padding:18px 20px"><p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:8px">Promoteurs</p><p style="font-size:13.5px;color:var(--muted);line-height:1.75">Responsables des premiers documents dans les nouvelles copropriétés.</p></div><div style="background:var(--cream);border-radius:8px;padding:18px 20px"><p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:8px">Professionnels</p><p style="font-size:13.5px;color:var(--muted);line-height:1.75">Ingénieurs, architectes, évaluateurs, technologues ou CPA — indépendants.</p></div>',
    'info.sec6.list':'<li><strong style="color:var(--txt)">Augmentation possible des charges :</strong> Pour rattraper un fonds sous-capitalisé (jusqu\'à 10 ans pour atteindre le niveau recommandé).</li><li><strong style="color:var(--txt)">Valeur des unités :</strong> Une copropriété bien gérée (carnet et étude à jour) se vend mieux et à meilleur prix.</li><li><strong style="color:var(--txt)">Responsabilité :</strong> Les administrateurs doivent justifier leurs décisions sur la base des documents professionnels.</li><li><strong style="color:var(--txt)">Non-conformité :</strong> Risque de poursuites, de difficultés de vente et d\'insatisfaction des copropriétaires.</li>',
    'info.sec7.list':'<li>Site SHQ : Copropriété divise</li><li>Guide explicatif SHQ (PDF) : Télécharger ici</li><li>Modèle d\'attestation : Disponible sur le site de la SHQ.</li><li>Texte du Règlement : Gazette officielle du Québec (30 juillet 2025).</li><li>Texte de la Loi 16 : Publications du Québec.</li>',
    'info.rec':'<strong style="color:var(--blue)">Recommandation :</strong> Consultez un avocat spécialisé en copropriété ou un gestionnaire certifié (RGCQ) pour une analyse adaptée à votre immeuble. Ce guide est une synthèse vulgarisée ; le texte officiel du Règlement et du Code civil prime en cas de doute.',
    'info.cta.title':'Vous gérez un syndicat ? Vous préparez une vente ?',
    'info.cta.desc':'La Loi 16 marque le début d\'une ère de gestion professionnelle et transparente. Bien appliquée, elle protège votre patrimoine collectif.',
    'info.cta.btn':'Demander une consultation gratuite →',
    'srv.p1.li1':'Organisation et tenue des assemblées générales',
    'srv.p1.li2':'Convocation et animation des réunions du conseil d\'administration',
    'srv.p1.li3':'Mise à jour et gestion de la déclaration de copropriété et du registre des copropriétaires',
    'srv.p1.li4':'Gestion et renouvellement du contrat d\'assurance du bâtiment',
    'srv.p1.li5':'Préparation des déclarations annuelles au REQ',
    'srv.p1.li6':'Suivi des obligations de la loi 16',
    'srv.p1.li7':'Recrutement et paiement des employés embauchés par le syndicat',
    'srv.p2.li1':'Préparation et suivi du budget annuel en collaboration étroite avec le conseil d\'administration',
    'srv.p2.li2':'Perception des charges de copropriété, rappel d\'arréages et dépôts sécurisés',
    'srv.p2.li3':'Paiement des fournisseurs, gestion des liquidités',
    'srv.p2.li4':'Production des états financiers annuels et déclaration fiscale du syndicat',
    'srv.p2.li5':'Transmission des documents requis au notaire lors des ventes d\'unités',
    'srv.p2.li6':'Planification et suivi du fonds de prévoyance conforme à l\'étude exigée par la loi 16',
    'srv.p2.li7':'Conciliation bancaire mensuelle',
    'srv.p3.li1':'Coordination des inspections périodiques et tenue du carnet d\'entretien obligatoire',
    'srv.p3.li2':'Négociation et gestion des contrats d\'entretien',
    'srv.p3.li3':'Suivi des travaux majeurs et mineurs : appel d\'offre, sélection d\'entrepreneurs, supervision',
    'srv.p3.li4':'Service d\'urgence disponible 24h/24, 7j/7 pour tout bris ou sinistre',
    'srv.p3.li5':'Coordination des réclamations d\'assurances',
    'srv.p3.li6':'Rapports d\'inspection réguliers et recommandations proactives pour anticiper les problèmes.',
    'srv.p3.li7':'Inspection annuelle des alarmes d\'incendie et autres',
    'srv.p3.li8':'Coordination des travaux (intérieur et extérieur)',
    'srv.p4.li1':'Communication proactive avec tous les copropriétaires',
    'srv.p4.li2':'Gestion des demandes et plaintes — réponse garantie &lt;24h',
    'srv.p4.li3':'Promotion de la transparence et participation des copropriétaires',
    'srv.p4.li4':'Médiation et résolution de conflits',
    'srv.p4.li5':'Plateforme logicielle disponible pour tous les copropriétaires',
    'info.card.a.detail':'<p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Contenu obligatoire :</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:16px"><li>Inventaire détaillé des parties communes (toiture, ascenseurs, fondations, systèmes de chauffage, etc.) et des éléments des parties privatives dont le syndicat est responsable.</li><li>Pour chaque élément : date d\'installation (si connue), travaux d\'entretien requis (fréquence), réparations effectuées, contrats, garanties, manuels, rapports d\'inspection.</li><li>Section planification : état actuel, durée de vie restante, liste des réparations majeures et remplacements prévus sur au moins 25 ans (avec année estimée).</li><li>Documents joints : plans, devis, factures, contrats.</li></ul><p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Qui peut l\'établir ou le réviser ?</p><p style="font-size:14px;color:var(--muted);line-height:1.8;margin-bottom:16px">Un professionnel indépendant membre de l\'Ordre des ingénieurs, des évaluateurs agréés, des architectes ou des technologues professionnels du Québec, dont l\'activité principale porte sur la gestion, la construction, la rénovation, l\'évaluation ou l\'inspection immobilière. Interdiction de conflits d\'intérêts.</p><p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Mises à jour et révisions :</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:16px"><li>Mise à jour annuelle par le conseil d\'administration.</li><li>Révision complète par un professionnel tous les 5 ans (ou 10 ans pour les petites copropriétés : ≤ 8 fractions privatives, pas de bâtiment ou ≤ 3 étages hors sol).</li><li>Visite physique de l\'immeuble obligatoire lors de la production/révision.</li></ul><div style="background:rgba(240,165,0,.10);border:1.5px solid rgba(240,165,0,.35);border-radius:6px;padding:14px 18px"><p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:6px">⏰ Délai de mise en conformité</p><ul style="font-size:14px;color:var(--muted);line-height:1.9;margin-left:16px;margin-bottom:0"><li><strong style="color:var(--txt)">Copropriétés existantes :</strong> au plus tard le <strong style="color:var(--txt)">15 août 2028</strong>.</li><li><strong style="color:var(--txt)">Nouvelles copropriétés :</strong> fourni par le promoteur au plus tard 30 jours après l\'assemblée de transition.</li></ul></div>',
    'info.card.b.detail':'<p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Contenu obligatoire :</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:16px"><li>Basée sur le carnet d\'entretien.</li><li>Solde actuel du fonds.</li><li>Estimation des coûts par année pour chaque réparation/remplacement.</li><li>Recommandation annuelle des sommes à verser au fonds (y compris pour les parties communes à usage restreint).</li><li>Explication des calculs.</li></ul><p style="font-size:14px;color:var(--muted);line-height:1.8;margin-bottom:14px"><strong style="color:var(--txt)">Fréquence :</strong> Au moins tous les 5 ans. Révision annuelle recommandée.</p><p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Utilisation des résultats :</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:0"><li>Le conseil d\'administration doit fixer les contributions au fonds selon les recommandations de l\'étude.</li><li>Jusqu\'à l\'obtention de la première étude : versement minimal de <strong style="color:var(--txt)">0,5 % de la valeur de reconstruction</strong> par an.</li><li>Le fonds doit être partiellement liquide, à court terme, avec capital garanti.</li></ul>',
    'info.card.c.detail':'<p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Contenu minimal obligatoire :</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:16px"><li>Montant actuel du fonds de prévoyance et recommandation de l\'étude pour l\'année en cours.</li><li>Contributions aux charges communes (exigées et payées) des 3 dernières années.</li><li>Liquidités, surplus/déficits des 3 derniers exercices.</li><li>Budget prévisionnel de l\'année.</li><li>Confirmation des assurances obligatoires + montant du fonds d\'auto-assurance et franchise maximale.</li><li>Résumé des 5 dernières années : inspections, sinistres, réparations majeures (date + coût).</li><li>Travaux prévus pour les 10 prochaines années (date + coût estimé).</li><li>Litiges en cours et modifications à la déclaration de copropriété des 3 dernières années.</li></ul><p style="font-size:14px;color:var(--muted);line-height:1.8">Un modèle gratuit est disponible sur le site de la <strong style="color:var(--txt)">Société d\'habitation du Québec (SHQ)</strong>. L\'attestation doit être datée et signée par un administrateur ou le gérant.</p>',
    'srv.cta.title':'Libérez-vous de la gestion complexe et des nouvelles obligations légales !',
    'srv.cta.desc':'Obtenez votre soumission gratuite en un clic et simplifiez la vie de votre syndicat dès aujourd\'hui.',
    'srv.cta.btn':'Demander ma soumission gratuite',
    'contact.urg.title':'🚨 Urgence 24/7',
    'form.subject':'Sujet',
    'form.subject.opts':'<option>Demande de soumission</option><option>Question sur la Loi 16</option><option>Urgence technique</option><option>Autre demande</option>',
    'ph.email.addr':'adresse@email.com',
    'ph.phone':'514-xxx-xxxx',
    'chat.bubble.title':'Nous écrire',
    'chat.status':'Réponse sous 24h ouvrables',
    'chat.greeting':'Bonjour ! 👋 Comment puis-je vous aider concernant la gestion de votre copropriété ?',
    'ph.chat.input':'Écrivez votre message…',
    'chat.reply1':'Merci ! Pour que nous puissions vous recontacter, laissez-nous votre courriel ou numéro de téléphone. 📞',
    'chat.ok':'Parfait ! Votre message a bien été envoyé. Nous vous recontactons sous 24h ouvrables. ✅',
    'chat.err1':'Une erreur est survenue. Écrivez-nous directement à info@quatrepiliers.ca.',
    'chat.err2':'Erreur de connexion. Écrivez-nous à info@quatrepiliers.ca.',
    'alert.email':'Veuillez entrer votre adresse courriel.',
    'btn.sending':'Envoi en cours…',
    'btn.sent':'Envoyé ✓',
  },
  en:{
    'nav.home':'Home','nav.services':'Services','nav.pricing':'Pricing',
    'nav.law16':'Bill 16','nav.blog':'Blog','nav.contact':'Contact',
    'nav.devis':'Free Quote','nav.devis.short':'Free Quote',
    'mob.devis':'Free Quote',
    'hero.title':'Condominium management in Montreal — experts available 24/7',
    'hero.pill1':'Emergency 24/7','hero.pill2':'Response <24h',
    'hero.pill3':'Transparent','hero.pill4':'Bill 16 Compliant',
    'hero.btn.quote':'Get a Free Quote',
    'diag.banner.pill':'New',
    'diag.banner.text':'Bill 16 — Are you compliant?',
    'diag.banner.text.mob':'Bill 16 · Compliant?',
    'diag.banner.cta':'Free diagnostic →',
    'diag.hero.btn':'Bill 16 Compliance Diagnostic',
    'diag.home.card.title':'Bill 16 Compliance Diagnostic — Free',
    'diag.home.card.desc':'10 questions · AI-personalized report · Instant results',
    'diag.info.card.title':'Is your condo association ready for August 2028?',
    'diag.info.card.desc':'Complete the diagnostic in 2 minutes — AI-personalized report, 100% free',
    'diag.info.btn':'Free Bill 16 compliance evaluation',
    'hero.btn.services':'Discover our services →',
    'hero.btn.pricing':'View our pricing →',
    'eng.lbl':'Our commitments',
    'eng.title':'Six values at the heart of every mandate',
    'eng.desc':'Our approach is built on concrete principles that guide every action, every decision and every interaction with your corporation.',
    'eng.1.title':'Responsiveness','eng.1.desc':'Fast responses and effective solutions for every situation.',
    'eng.2.title':'Transparency','eng.2.desc':'Clear communication and access to information at all times.',
    'eng.3.title':'Rigour','eng.3.desc':'Structured processes and effective controls for optimal management.',
    'eng.4.title':'Proximity','eng.4.desc':'A team that is available and attentive to your needs.',
    'eng.5.title':'Value Creation','eng.5.desc':'Proactive management to ensure the longevity and value of your asset.',
    'eng.6.title':'Bill 16 Compliance','eng.6.desc':'We ensure compliance with Bill 16 requirements and best practices.',
    'home.srv.lbl':'Our four pillars of service',
    'home.srv.title':'Complete management on all fronts',
    'home.srv.desc':'Four integrated domains covering every aspect of your condo corporation — with the responsiveness that sets us apart.',
    'srv.admin.title':'Administrative & legal',
    'srv.admin.desc':'Meetings, contracts, records and legal compliance — all managed with rigour.',
    'srv.fin.title':'Financial & accounting',
    'srv.fin.desc':'Budgets, fees, reserve funds and transparent quarterly reports.',
    'srv.tech.title':'Technical & maintenance',
    'srv.tech.desc':'Maintenance log, work orders, contracts and 24/7 emergencies — your building is in good hands.',
    'srv.com.title':'Communication & governance',
    'srv.com.desc':'Proactive communication, software platform and full board support.',
    'btn.detail':'View details →','btn.allservices':'View all services in detail →',
    'home.pricing.title':'Plans tailored to every condo',
    'pc.badge':'Most popular',
    'pc.ess.desc':'Ideal for small condos seeking accounting rigour and administrative compliance.',
    'pc.ser.desc':'Dedicated manager, technical management and long-term planning included.',
    'pc.cus.desc':'À la carte services, all building types, negotiated rates.',
    'btn.contact':'Contact us →','btn.seepricing':'View full pricing →',
    'home.law.lbl':'Information','home.law.title':'Bill 16: are you compliant?',
    'home.law.desc':'Bill 16 imposes new obligations on all condo corporations in Quebec. At Quatre Piliers, we guide you step by step.',
    'law.item1.title':'Mandatory maintenance log',
    'law.item1.desc':'Condo corporations must produce a maintenance log by August 14, 2028.',
    'law.item2.title':'Reserve fund study',
    'law.item2.desc':'Condo corporations have until August 14, 2028 to obtain their first reserve fund study.',
    'law.item3.title':'Condo corporation attestation',
    'law.item3.desc':'Mandatory at every unit sale since 2025.',
    'btn.fullguide':'Read our complete guide →',
    'home.contact.lbl':'Contact','home.contact.title':'Let\'s talk about your condo',
    'home.contact.desc':'Our team responds within 24 business hours. For emergencies, call us directly 24/7.',
    'contact.phone.lbl':'Phone (24/7 emergency)','contact.email.lbl':'Email',
    'contact.zone.lbl':'Service area','contact.zone.val':'Greater Montreal — Laval, Longueuil, North Shore, South Shore',
    'contact.hours.lbl':'Office hours','contact.hours.val':'Mon–Fri 8:30am–5:30pm · Emergencies 24/7',
    'contact.urg.title':'🚨 Emergency 24/7',
    'contact.urg.desc':'For any disaster, water damage or major failure, call our emergency line 24/7. Fast response guaranteed.',
    'contact.urg.desc2':'For any disaster, water damage or major failure, call our emergency line available 24/7.',
    'form.title':'Send a message','form.syndic':'Condo name *','form.units':'Units',
    'form.name':'Your name *','form.message':'Message *','btn.send':'Send →',
    'ph.syndic':'Condo name','ph.units':'No. of units','ph.name':'First Last',
    'ph.message':'Describe your situation...',
    'page.srv.h1':'Our four pillars of service',
    'page.srv.sub':'A complete range of services to meet all your needs, with the responsiveness that sets us apart.',
    'page.tar.h1':'Our custom plans',
    'page.tar.sub':'No rigid pricing: a plan tailored to your needs, size and priorities.',
    'page.tar.note':'Our rates are indicative and vary based on the number of units and services selected. <strong>Personalized quote</strong>, response within 24h.',
    'tar.ess.desc':'Ideal for small condo corporations (fewer than 10 units) seeking accounting rigour to avoid disputes and facilitate notarial transactions.',
    'tar.ser.desc':'Our most popular plan. It relieves the board of paperwork and day-to-day vendor management, while leaving strategic decisions to administrators. Includes a dedicated manager for long-term asset planning (Bill 16) plus a software platform.',
    'tar.cus.desc':'Take advantage of an exclusive and scalable service offer: choose your services à la carte or opt for enhanced support with recurring services. Our flexibility lets you adjust your plan at any time to perfectly meet your condo\'s priorities.',
    'tar.footnote':'Rates are per unit per month and may vary based on the number of units and services included.',
    'btn.custquote':'Request my custom quote',
    'page.info.h1':'Bill 16',
    'page.info.sub':'Complete guide to Bill 16 and the management of divided co-ownerships in Quebec.',
    'page.contact.h1':'Contact us',
    'page.contact.sub':'Our team responds within 24 business hours. For emergencies, call us directly 24/7.',
    'contact.main.desc':'Whether you are looking for a new property manager, a governance upgrade or a more reliable structure for your condo corporation, we are here to help quickly. Our team responds within 24 business hours. For emergencies, call us directly 24/7.',
    'modal.title':'Free & no-obligation quote',
    'modal.sub':'Complete this form and we will respond within 24 business hours.',
    'form.syndic.full':'Condo name *','form.contact':'Contact *',
    'form.nbunits':'No. units *','form.email':'Email *','form.phone':'Phone',
    'ph.syndic.full':'Ex.: Les Erables Condo Corp','ph.modal.message':'Your needs or questions...',
    'btn.sendrequest':'Send my request →',
    'form.ok':'✅ Thank you! We will contact you within 24 business hours.',
    'footer.tagline':'Expert and ultra-responsive condominium manager in Greater Montreal. Emergencies 24/7.',
    'footer.copy':'© 2025 Quatre Piliers Gestion Copropriété Inc. All rights reserved.',
    'hero.subtitle':'Ultra-responsive manager for your syndicate: complete or à-la-carte support (administrative, financial, technical, human). Law 16 compliance guaranteed.',
    'lbl.pricing':'Pricing','lbl.plan':'Plan','lbl.perunit':' /unit/month',
    'home.pricing.note':'<strong>Free quote</strong>, response within 24h.',
    'plan.essential':'Essential','plan.serenity':'Serenity','plan.custom':'Custom','plan.discuss':'To discuss',
    'feat.admin.base':'Administrative basics','feat.fin.base':'Financial basics',
    'feat.platform':'Software platform','feat.alacarte':'À la carte services',
    'feat.adjustable':'Adjustable at any time','feat.negotiated':'Negotiated rate by volume',
    'btn.askquote':'Request a quote →',
    'form.ok2':'✅ Message sent! We will respond within 2 hours.',
    'contact.email.val':'<a href="mailto:info@quatrepiliers.ca" style="color:inherit">info@quatrepiliers.ca</a>',
    'cta.title':'Ready to entrust your condo to experts?',
    'cta.desc':'<strong>Free personalized quote</strong>, no obligation. Response guaranteed <strong>within 24 business hours</strong>.',
    'cta.btn':'Get my free quote',
    'cta.srv.title':'Free yourself from complex management and new legal obligations!',
    'cta.srv.desc':'Get your free quote in one click and simplify your condo corporation management today.',
    'footer.nav':'Navigation','footer.newsletter':'Newsletter',
    'ph.email':'Your email','btn.subscribe':'Subscribe →',
    'footer.privacy':'Privacy policy','footer.legal':'Legal notices',
    'srv.tech.title2':'Technical management &amp; maintenance',
    'btn.reqsrv':'Request this service →',
    'btn.retour':'← Back to blog',
    'blog.h1':'Blog',
    'blog.sub':'Advice, news and practical guides for condo corporations in Quebec.',
    'lbl.includes':'This plan includes',
    'feat.fin.comp.base':'Financial & accounting basics',
    'feat.tech.mgmt':'Technical management &amp; maintenance',
    'feat.allbldg':'All building types',
    'feat.enhanced':'Enhanced support available',
    'info.update':'<strong style="color:var(--blue)">Update: March 2026</strong> – Based on the Regulation establishing various rules regarding divided co-ownership, in force since <strong style="color:var(--txt)">August 14, 2025</strong>.',
    'info.p1':'Bill 16, officially <strong style="color:var(--txt)">Bill no. 16 (2019, chapter 28)</strong>, is the most significant reform of divided co-ownership in Quebec since the Civil Code of Quebec came into force in 1994. It aims to modernize the management of condo corporations, strengthen the financial protection of unit owners, and ensure the long-term sustainability of the condo property stock.',
    'info.p2':'The implementing regulation (published July 30, 2025 in the Quebec Official Gazette) came into force on <strong style="color:var(--txt)">August 14, 2025</strong>. It implements the three main tools introduced by Bill 16: the <strong style="color:var(--txt)">maintenance log</strong>, the <strong style="color:var(--txt)">reserve fund study</strong> and the <strong style="color:var(--txt)">attestation on the state of the co-ownership</strong>. These obligations apply to all divided co-ownerships in Quebec, without exception.',
    'info.h2.1':'1. Why Bill 16? Reform Objectives',
    'info.h2.2':'2. The Three Mandatory Pillars of Bill 16',
    'info.h2.3':'3. Other Important Measures',
    'info.h2.4':'4. Compliance Timeline (2025–2028)',
    'info.h2.5':'5. Who Does What?',
    'info.h2.6':'6. Practical Consequences',
    'info.h2.7':'7. Official Resources',
    'info.sec1.list':'<li>Shift from reactive management to proactive and planned 25-year management.</li><li>Protect unit owners against undercapitalized reserve funds.</li><li>Improve transparency at unit sales.</li><li>Strengthen the governance and accountability of boards of directors.</li><li>Ensure building longevity (roofs, elevators, mechanical systems, etc.).</li>',
    'info.sec1.p':'The reform follows from Bill no. 31 (2024) and primarily amends articles 1068.1, 1070.2, 1071 and 1070 of the Civil Code of Quebec (C.C.Q.).',
    'info.card.a.title':'The maintenance log <span style="font-size:13px;font-weight:400;opacity:.8">(art. 1070.2 C.C.Q.)</span>',
    'info.card.b.title':'The reserve fund study <span style="font-size:13px;font-weight:400;opacity:.8">(art. 1071 C.C.Q.)</span>',
    'info.card.c.title':'The attestation on the state of the co-ownership <span style="font-size:13px;font-weight:400;opacity:.8">(art. 1068.1 C.C.Q.)</span>',
    'info.card.a.obj':'<strong style="color:var(--txt)">Objective:</strong> Document the building\'s condition, plan works and maintain a history of interventions.',
    'info.card.b.obj':'<strong style="color:var(--txt)">Objective:</strong> Determine the amount needed to cover major repairs and replacements of common areas over 25 years.',
    'info.card.c.obj':'<strong style="color:var(--txt)">Objective:</strong> Inform the potential buyer of the financial and physical state of the co-ownership before purchase. Provided within <strong style="color:var(--txt)">15 days</strong> of request.',
    'info.sec3.list':'<li><strong style="color:var(--txt)">Advances for new condos (art. 1791.1 C.C.Q.):</strong> Enhanced protection through trust, warranty plan, insurance or surety bond.</li><li><strong style="color:var(--txt)">Transparency:</strong> The board must transmit minutes and resolutions more quickly.</li><li><strong style="color:var(--txt)">Insurance:</strong> Increased obligations for the corporation.</li><li><strong style="color:var(--txt)">Self-insurance fund:</strong> Specific rules on its use.</li>',
    'info.sec4.table':'<thead><tr style="background:var(--blue);color:#fff"><th style="padding:12px 16px;text-align:left;font-family:\'Nunito Sans\',serif;font-weight:600;letter-spacing:.04em">Action</th><th style="padding:12px 16px;text-align:left;font-family:\'Nunito Sans\',serif;font-weight:600;letter-spacing:.04em">Existing condos</th><th style="padding:12px 16px;text-align:left;font-family:\'Nunito Sans\',serif;font-weight:600;letter-spacing:.04em">New condos</th></tr></thead><tbody><tr style="border-bottom:1px solid var(--brd)"><td style="padding:12px 16px;color:var(--txt);font-weight:600">Maintenance log + Study</td><td style="padding:12px 16px;color:var(--muted)"><strong style="color:var(--txt)">August 15, 2028</strong> at latest</td><td style="padding:12px 16px;color:var(--muted)">By developer (30 days or 6 months)</td></tr><tr style="border-bottom:1px solid var(--brd);background:var(--cream)"><td style="padding:12px 16px;color:var(--txt);font-weight:600">Annual log update</td><td style="padding:12px 16px;color:var(--muted)">Upon production</td><td style="padding:12px 16px;color:var(--muted)">Upon production</td></tr><tr style="border-bottom:1px solid var(--brd)"><td style="padding:12px 16px;color:var(--txt);font-weight:600">Study revision</td><td style="padding:12px 16px;color:var(--muted)">Every 5 years</td><td style="padding:12px 16px;color:var(--muted)">Every 5 years</td></tr><tr style="background:var(--cream)"><td style="padding:12px 16px;color:var(--txt);font-weight:600">Attestation (sale)</td><td style="padding:12px 16px;color:var(--muted)">Immediate (15 days)</td><td style="padding:12px 16px;color:var(--muted)">Immediate (15 days)</td></tr></tbody>',
    'info.sec5.grid':'<div style="background:var(--cream);border-radius:8px;padding:18px 20px"><p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:8px">Corporation / Board</p><p style="font-size:13.5px;color:var(--muted);line-height:1.75">Orders documents, updates log, sets contributions, keeps in registry, provides attestation.</p></div><div style="background:var(--cream);border-radius:8px;padding:18px 20px"><p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:8px">Unit owners</p><p style="font-size:13.5px;color:var(--muted);line-height:1.75">Pay mandatory contributions, have right of access to documents.</p></div><div style="background:var(--cream);border-radius:8px;padding:18px 20px"><p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:8px">Developers</p><p style="font-size:13.5px;color:var(--muted);line-height:1.75">Responsible for initial documents in new condos.</p></div><div style="background:var(--cream);border-radius:8px;padding:18px 20px"><p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:8px">Professionals</p><p style="font-size:13.5px;color:var(--muted);line-height:1.75">Engineers, architects, appraisers, technologists or CPAs — independent.</p></div>',
    'info.sec6.list':'<li><strong style="color:var(--txt)">Possible fee increase:</strong> To catch up on an undercapitalized fund (up to 10 years to reach recommended level).</li><li><strong style="color:var(--txt)">Unit value:</strong> A well-managed condo (up-to-date log and study) sells better and at a better price.</li><li><strong style="color:var(--txt)">Liability:</strong> Administrators must justify decisions based on professional documents.</li><li><strong style="color:var(--txt)">Non-compliance:</strong> Risk of lawsuits, difficulty selling and unit owner dissatisfaction.</li>',
    'info.sec7.list':'<li>SHQ website: Divided co-ownership</li><li>SHQ explanatory guide (PDF): Download here</li><li>Attestation template: Available on the SHQ website.</li><li>Regulation text: Quebec Official Gazette (July 30, 2025).</li><li>Bill 16 text: Publications du Québec.</li>',
    'info.rec':'<strong style="color:var(--blue)">Recommendation:</strong> Consult a lawyer specializing in co-ownership or a certified manager (RGCQ) for an analysis tailored to your building. This guide is a simplified summary; the official text of the Regulation and the Civil Code takes precedence in case of doubt.',
    'info.cta.title':'Managing a corporation? Preparing a sale?',
    'info.cta.desc':'Bill 16 marks the beginning of an era of professional and transparent management. When properly applied, it protects your collective heritage.',
    'info.cta.btn':'Request a free consultation →',
    'srv.p1.li1':'Organization and management of general meetings',
    'srv.p1.li2':'Scheduling and facilitating board of directors meetings',
    'srv.p1.li3':'Updating and managing the declaration of co-ownership and the unit owners registry',
    'srv.p1.li4':'Managing and renewing the building insurance contract',
    'srv.p1.li5':'Preparing annual filings with the REQ',
    'srv.p1.li6':'Monitoring Bill 16 compliance obligations',
    'srv.p1.li7':'Hiring and payroll for employees engaged by the corporation',
    'srv.p2.li1':'Preparing and monitoring the annual budget in close collaboration with the board',
    'srv.p2.li2':'Collecting condo fees, following up on arrears and managing secure deposits',
    'srv.p2.li3':'Paying suppliers and managing cash flow',
    'srv.p2.li4':'Producing annual financial statements and tax filings for the corporation',
    'srv.p2.li5':'Providing required documents to the notary at unit sales',
    'srv.p2.li6':'Planning and monitoring the reserve fund in compliance with the Bill 16 study',
    'srv.p2.li7':'Monthly bank reconciliation',
    'srv.p3.li1':'Coordinating periodic inspections and maintaining the mandatory maintenance log',
    'srv.p3.li2':'Negotiating and managing maintenance contracts',
    'srv.p3.li3':'Overseeing major and minor works: tendering, contractor selection, supervision',
    'srv.p3.li4':'Emergency service available 24/7 for any breakdown or incident',
    'srv.p3.li5':'Coordinating insurance claims',
    'srv.p3.li6':'Regular inspection reports and proactive recommendations to anticipate issues.',
    'srv.p3.li7':'Annual fire alarm and other system inspections',
    'srv.p3.li8':'Coordinating interior and exterior work',
    'srv.p4.li1':'Proactive communication with all unit owners',
    'srv.p4.li2':'Handling requests and complaints — response guaranteed &lt;24h',
    'srv.p4.li3':'Promoting transparency and unit owner participation',
    'srv.p4.li4':'Mediation and conflict resolution',
    'srv.p4.li5':'Software platform available to all unit owners',
    'info.card.a.detail':'<p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Mandatory content:</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:16px"><li>Detailed inventory of common areas (roof, elevators, foundations, heating systems, etc.) and private portions the corporation is responsible for.</li><li>For each element: installation date (if known), required maintenance (frequency), completed repairs, contracts, warranties, manuals, inspection reports.</li><li>Planning section: current condition, remaining lifespan, list of major repairs and replacements planned over at least 25 years (with estimated year).</li><li>Attached documents: plans, specifications, invoices, contracts.</li></ul><p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Who can prepare or revise it?</p><p style="font-size:14px;color:var(--muted);line-height:1.8;margin-bottom:16px">An independent professional who is a member of the Order of Engineers, Certified Appraisers, Architects, or Professional Technologists of Quebec, whose primary activity relates to building management, construction, renovation, appraisal, or inspection. Conflicts of interest are prohibited.</p><p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Updates and revisions:</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:16px"><li>Annual update by the board of directors.</li><li>Full revision by a professional every 5 years (or 10 years for small condos: ≤ 8 private units, no building or ≤ 3 above-ground floors).</li><li>Physical inspection of the building is mandatory during production/revision.</li></ul><div style="background:rgba(240,165,0,.10);border:1.5px solid rgba(240,165,0,.35);border-radius:6px;padding:14px 18px"><p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:6px">⏰ Compliance deadline</p><ul style="font-size:14px;color:var(--muted);line-height:1.9;margin-left:16px;margin-bottom:0"><li><strong style="color:var(--txt)">Existing condos:</strong> no later than <strong style="color:var(--txt)">August 15, 2028</strong>.</li><li><strong style="color:var(--txt)">New condos:</strong> provided by the developer no later than 30 days after the transition meeting.</li></ul></div>',
    'info.card.b.detail':'<p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Mandatory content:</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:16px"><li>Based on the maintenance log.</li><li>Current fund balance.</li><li>Estimated annual costs for each repair/replacement.</li><li>Annual recommended contributions (including restricted common areas).</li><li>Explanation of calculations.</li></ul><p style="font-size:14px;color:var(--muted);line-height:1.8;margin-bottom:14px"><strong style="color:var(--txt)">Frequency:</strong> At least every 5 years. Annual review recommended.</p><p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Using the results:</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:0"><li>The board must set fund contributions based on the study recommendations.</li><li>Until the first study is obtained: minimum annual contribution of <strong style="color:var(--txt)">0.5% of the reconstruction value</strong>.</li><li>The fund must be partially liquid, short-term, with guaranteed capital.</li></ul>',
    'info.card.c.detail':'<p style="font-size:13.5px;font-weight:700;color:var(--blue);margin-bottom:8px">Minimum mandatory content:</p><ul style="font-size:14px;color:var(--muted);line-height:1.95;margin-left:18px;margin-bottom:16px"><li>Current reserve fund balance and study recommendation for the current year.</li><li>Common charge contributions (required and paid) for the last 3 years.</li><li>Liquidity, surpluses/deficits for the last 3 fiscal years.</li><li>Current year budget forecast.</li><li>Confirmation of mandatory insurance + self-insurance fund amount and maximum deductible.</li><li>Summary of last 5 years: inspections, claims, major repairs (date + cost).</li><li>Planned works for the next 10 years (date + estimated cost).</li><li>Ongoing litigation and declaration of co-ownership amendments over the last 3 years.</li></ul><p style="font-size:14px;color:var(--muted);line-height:1.8">A free template is available on the website of the <strong style="color:var(--txt)">Société d\'habitation du Québec (SHQ)</strong>. The attestation must be dated and signed by a board member or manager.</p>',
    'srv.cta.title':'Free yourself from complex management and new legal obligations!',
    'srv.cta.desc':'Get your free quote in one click and simplify the life of your condo corporation today.',
    'srv.cta.btn':'Request my free quote',
    'contact.urg.title':'🚨 Emergency 24/7',
    'form.subject':'Subject',
    'form.subject.opts':'<option>Quote request</option><option>Question about Bill 16</option><option>Technical emergency</option><option>Other request</option>',
    'ph.email.addr':'address@email.com',
    'ph.phone':'514-xxx-xxxx',
    'chat.bubble.title':'Write to us',
    'chat.status':'Response within 24 business hours',
    'chat.greeting':'Hello! 👋 How can I help you with your condo corporation management?',
    'ph.chat.input':'Write your message…',
    'chat.reply1':'Thank you! So we can reach back out, please leave your email or phone number. 📞',
    'chat.ok':'Great! Your message has been sent. We\'ll get back to you within 24 business hours. ✅',
    'chat.err1':'An error occurred. Write to us directly at info@quatrepiliers.ca.',
    'chat.err2':'Connection error. Write to us at info@quatrepiliers.ca.',
    'alert.email':'Please enter your email address.',
    'btn.sending':'Sending…',
    'btn.sent':'Sent ✓',
  }
};

function setLang(lang){
  currentLang=lang;
  var t=translations[lang];
  if(!t) return;
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key=el.getAttribute('data-i18n');
    if(t[key]!==undefined) el.innerHTML=t[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){
    var key=el.getAttribute('data-i18n-html');
    if(t[key]!==undefined) el.innerHTML=t[key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    var key=el.getAttribute('data-i18n-ph');
    if(t[key]!==undefined) el.placeholder=t[key];
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el){
    var key=el.getAttribute('data-i18n-title');
    if(t[key]!==undefined) el.title=t[key];
  });
  document.querySelectorAll('.lang-btn').forEach(function(btn){
    btn.classList.toggle('active',btn.dataset.lang===lang);
  });
  var heroEl=document.getElementById('hero-qp-type');
  if(heroEl) heroTypewriter(lang);
}

/* ===== NAV SCROLL ===== */
window.addEventListener('scroll',function(){
  var nav=document.querySelector('nav');
  if(nav) nav.classList.toggle('scrolled',window.scrollY>10);
});

/* ===== HERO TYPEWRITER ===== */
function heroTypewriter(lang){
  var el=document.getElementById('hero-qp-type');
  var cur=document.getElementById('hero-qp-cursor');
  if(!el||!cur) return;
  var text='QUATRE PILIERS';
  el.textContent='';
  cur.style.animation='heroBlink .7s step-end infinite';
  cur.style.opacity='1';
  var i=0,speed=90;
  function type(){
    if(i<text.length){el.textContent+=text[i++];setTimeout(type,speed);}
    else{setTimeout(function(){cur.style.animation='none';cur.style.opacity='0';},600);}
  }
  setTimeout(type,300);
}
document.addEventListener('DOMContentLoaded',function(){
  if(document.getElementById('hero-qp-type')) heroTypewriter('fr');
});

/* ===== DIAGNOSTIC ===== */
function openDiagnostic(){
  var f=document.getElementById('diagFrame');
  if(f&&(!f.src||f.src==='about:blank'||!f.src.includes('diagnostic')))f.src='/diagnostic.html';
  var ov=document.getElementById('diagOverlay');
  if(ov){ov.classList.add('open');document.body.style.overflow='hidden';}
}
function closeDiagnostic(){
  var ov=document.getElementById('diagOverlay');
  if(ov){ov.classList.remove('open');document.body.style.overflow='';}
}

/* ===== ALIGN BANNER ===== */
function alignBannerToNav(){
  var accueil=document.querySelector('.nav-links a.active')||document.querySelector('.nav-links a');
  var banner=document.querySelector('.diag-banner');
  var spacer=document.getElementById('diag-banner-spacer');
  if(!accueil||!banner||!spacer){if(banner)banner.classList.add('aligned');return;}
  if(window.innerWidth<=768){spacer.style.width='0px';banner.classList.add('aligned');return;}
  var bannerPL=parseFloat(getComputedStyle(banner).paddingLeft)||0;
  var offset=accueil.getBoundingClientRect().left-banner.getBoundingClientRect().left-bannerPL;
  spacer.style.width=Math.max(0,offset)+'px';
  banner.classList.add('aligned');
}
document.addEventListener('DOMContentLoaded',alignBannerToNav);
window.addEventListener('load',alignBannerToNav);
window.addEventListener('resize',alignBannerToNav);
