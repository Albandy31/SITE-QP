// Cloudflare Worker — Diagnostic Loi 16 — Quatre Piliers
// Endpoint: POST /api/diagnostic
// Secrets requis: ANTHROPIC_API_KEY, SENDGRID_API_KEY, TURNSTILE_SECRET_KEY
// Variables requises: ALLOWED_ORIGIN, TO_INTERNAL, FROM_EMAIL

export default {
  async fetch(request, env, ctx) {
    const allowedOrigins = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = buildCorsHeaders(origin, allowedOrigins);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST')   return json({ error: 'Method not allowed' }, 405, corsHeaders);

    const url = new URL(request.url);
    if (url.pathname !== '/api/diagnostic') return json({ error: 'Not found' }, 404, corsHeaders);
    if (!allowedOrigins.includes(origin))   return json({ error: 'Origin not allowed' }, 403, corsHeaders);

    let payload;
    try { payload = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders); }

    if (payload.website && payload.website.length > 0) {
      return json({ success: true }, 200, corsHeaders);
    }

    if (payload.turnstile_token) {
      const ip = request.headers.get('CF-Connecting-IP');
      const tsValid = await verifyTurnstile(payload.turnstile_token, env.TURNSTILE_SECRET_KEY, ip);
      if (!tsValid) return json({ error: 'Échec de la vérification anti-bot' }, 403, corsHeaders);
    }

    const ans = payload.answers || {};
    const v = validateAnswers(ans);
    if (!v.ok) return json({ error: v.error }, 400, corsHeaders);

    const score = calcScore(ans);
    const niveau = getNiveau(score);

    let diagnostic;
    try {
      diagnostic = await callClaude(ans, score, env.ANTHROPIC_API_KEY);
    } catch (e) {
      return json({ error: 'Erreur lors de la génération : ' + e.message }, 502, corsHeaders);
    }

    ctx.waitUntil(sendEmails(ans, score, niveau, diagnostic, env));

    return json({ success: true, score, niveau, result: diagnostic }, 200, corsHeaders);
  },
};

function buildCorsHeaders(origin, allowedOrigins) {
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

async function verifyTurnstile(token, secret, ip) {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const data = await res.json();
    return data.success === true;
  } catch { return false; }
}

function validateAnswers(ans) {
  const required = ['syndicat','nb_unites','gestion','carnet','etude_fp','fp_niveau','attestation','ag','registre','defi','email'];
  for (const k of required) {
    if (ans[k] === undefined || ans[k] === null || ans[k] === '') return { ok: false, error: `Champ requis manquant : ${k}` };
  }
  if (typeof ans.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ans.email)) return { ok: false, error: 'Adresse courriel invalide' };
  if (!Array.isArray(ans.defi) || ans.defi.length === 0) return { ok: false, error: 'Au moins un défi doit être sélectionné' };
  if (String(ans.syndicat).length > 200 || String(ans.nb_unites).length > 10) return { ok: false, error: 'Champs trop longs' };
  return { ok: true };
}

function calcScore(ans) {
  let s = 100;
  if (['non','nsp'].includes(ans.carnet))        s -= 25; else if (ans.carnet === 'partiel')      s -= 12;
  if (['non','nsp'].includes(ans.etude_fp))      s -= 25; else if (ans.etude_fp === 'oui_ancienne') s -= 10;
  if (['sous','nsp'].includes(ans.fp_niveau))    s -= 15;
  if (ans.attestation === 'non')                 s -= 15; else if (ans.attestation === 'difficile') s -= 7;
  if (ans.ag === 'non')                          s -= 10; else if (ans.ag === 'irregulier')         s -= 5;
  if (ans.registre === 'non')                    s -= 8;  else if (ans.registre === 'partiel')      s -= 4;
  if (ans.gestion === 'autogere')                s -= 3;
  return Math.max(0, Math.min(100, s));
}

function getNiveau(s) {
  if (s < 40) return { label: 'Critique',    color: '#A32D2D' };
  if (s < 60) return { label: 'À risque',    color: '#854F0B' };
  if (s < 80) return { label: 'En progrès',  color: '#2A4D9E' };
  return       { label: 'Bien géré',   color: '#0F6E56' };
}

async function callClaude(ans, score, apiKey) {
  const prompt = buildPrompt(ans, score);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `Anthropic API ${res.status}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

function buildPrompt(ans, score) {
  const defis = Array.isArray(ans.defi) ? ans.defi.join(', ') : ans.defi;
  return `Tu es un expert en gestion de copropriété au Québec, spécialisé dans la Loi 16 (en vigueur août 2025, délai conformité août 2028). Réponds UNIQUEMENT en JSON valide, sans balises Markdown.

SYNDICAT: ${ans.syndicat} (${ans.nb_unites} unités)
Gestion: ${ans.gestion} | Carnet: ${ans.carnet} | Étude FP: ${ans.etude_fp} | Niveau FP: ${ans.fp_niveau} | Attestation: ${ans.attestation} | AG: ${ans.ag} | Registre: ${ans.registre} | Défis: ${defis} | Score: ${score}/100

{"titre":"<phrase accrocheuse 8-12 mots personnalisée>","resume":"<2-3 phrases situation spécifique de CE syndicat, ton direct>","points_forts":["<point fort concret 1>","<point fort concret 2>"],"priorites":[{"rang":1,"titre":"<action prioritaire>","description":"<2 phrases concrètes, référencer Loi 16 si pertinent>","echeance":"<délai précis>","urgence":"Critique"},{"rang":2,"titre":"","description":"","echeance":"","urgence":"Important"},{"rang":3,"titre":"","description":"","echeance":"","urgence":"Recommandé"}],"forfait_recommande":"<Essentiel|Sérénité|Sur mesure>","justification_forfait":"<1 phrase pourquoi ce forfait>","message_cta":"<invitation RDV personnalisée mentionnant le nom du syndicat>"}`;
}

async function sendEmails(ans, score, niveau, diagnostic, env) {
  const tasks = [];
  tasks.push(sendSendGridEmail({
    from: env.FROM_EMAIL,
    to: env.TO_INTERNAL,
    reply_to: ans.email,
    subject: `[Diagnostic Loi 16] ${ans.syndicat} — Score ${score}/100 (${niveau.label})`,
    html: renderInternalEmail(ans, score, niveau, diagnostic),
  }, env.SENDGRID_API_KEY));

  if (ans.email) {
    tasks.push(sendSendGridEmail({
      from: env.FROM_EMAIL,
      to: ans.email,
      reply_to: env.TO_INTERNAL,
      subject: `Votre diagnostic Loi 16 personnalisé — ${ans.syndicat}`,
      html: renderProspectEmail(ans, score, niveau, diagnostic),
    }, env.SENDGRID_API_KEY));
  }
  await Promise.allSettled(tasks);
}

function parseFromAddress(str) {
  const match = str.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: str.trim() };
}

async function sendSendGridEmail(payload, apiKey) {
  const body = {
    personalizations: [{ to: [{ email: payload.to }] }],
    from: parseFromAddress(payload.from),
    subject: payload.subject,
    content: [{ type: 'text/html', value: payload.html }],
  };
  if (payload.reply_to) body.reply_to = { email: payload.reply_to };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('SendGrid error:', res.status, err);
  }
}

const URGENCE_COLORS = {
  Critique:    { bg: '#FCEBEB', color: '#791F1F', border: '#A32D2D' },
  Important:   { bg: '#FAEEDA', color: '#633806', border: '#854F0B' },
  Recommandé:  { bg: '#E1F5EE', color: '#085041', border: '#0F6E56' },
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function renderProspectEmail(ans, score, niv, r) {
  const priorites = (r.priorites || []).map(p => {
    const u = URGENCE_COLORS[p.urgence] || URGENCE_COLORS['Recommandé'];
    return `<tr><td style="padding:0 0 12px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid ${u.border};background:#fff;border:1px solid #E8EAEF;border-radius:8px">
        <tr><td style="padding:14px 18px">
          <span style="display:inline-block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;padding:3px 9px;border-radius:4px;background:${u.bg};color:${u.color}">${esc(p.urgence)}</span>
          <span style="font-size:11px;color:#5C6880;margin-left:8px">${esc(p.echeance || '')}</span>
          <div style="font-size:14px;font-weight:700;color:#1A3270;margin:8px 0 4px">${esc(p.titre || '')}</div>
          <div style="font-size:13px;color:#5C6880;line-height:1.6">${esc(p.description || '')}</div>
        </td></tr>
      </table>
    </td></tr>`;
  }).join('');

  const forts = (r.points_forts || []).map(p => `<div style="font-size:13px;color:#0F6E56;line-height:1.55;margin-bottom:3px">· ${esc(p)}</div>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Votre diagnostic</title></head>
<body style="margin:0;padding:0;background:#F0F3FA;font-family:'Nunito Sans','Segoe UI',Arial,sans-serif;color:#212B3C">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F3FA;padding:24px 12px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 20px rgba(42,77,158,.08)">
  <tr><td style="background:#1A3270;padding:28px 28px 24px;border-bottom:4px solid #E8B800">
    <div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#E8B800;margin-bottom:6px">Quatre Piliers — Diagnostic Loi 16</div>
    <div style="font-size:20px;font-weight:800;color:#fff;line-height:1.3;margin-bottom:4px">${esc(r.titre || 'Votre diagnostic personnalisé')}</div>
    <div style="font-size:13px;color:rgba(255,255,255,.7)">${esc(ans.syndicat)} · ${esc(ans.nb_unites)} unités</div>
  </td></tr>
  <tr><td style="padding:24px 28px 8px">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="80" valign="top">
        <div style="width:72px;height:72px;border-radius:50%;background:${niv.color};color:#fff;font-size:24px;font-weight:800;text-align:center;line-height:72px">${score}</div>
      </td>
      <td valign="top" style="padding-left:16px">
        <div style="font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${niv.color};margin-bottom:4px">${esc(niv.label)}</div>
        <div style="font-size:14px;color:#5C6880;line-height:1.6">${esc(r.resume || '')}</div>
      </td>
    </tr></table>
  </td></tr>
  ${forts ? `<tr><td style="padding:16px 28px 0">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#E1F5EE;border:1px solid #9FE1CB;border-radius:10px"><tr><td style="padding:12px 16px">
      <div style="font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#085041;margin-bottom:6px">Points forts</div>
      ${forts}
    </td></tr></table>
  </td></tr>` : ''}
  <tr><td style="padding:20px 28px 4px">
    <div style="font-size:14px;font-weight:700;color:#1A3270;margin-bottom:12px">Vos 3 priorités d'action</div>
    <table width="100%" cellpadding="0" cellspacing="0">${priorites}</table>
  </td></tr>
  <tr><td style="padding:8px 28px 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A3270;border-radius:12px"><tr><td style="padding:22px 24px;color:#fff">
      <div style="font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#E8B800;margin-bottom:6px">Recommandation Quatre Piliers</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:6px">Forfait ${esc(r.forfait_recommande || '')}</div>
      <div style="font-size:13px;color:rgba(255,255,255,.78);margin-bottom:14px;line-height:1.55">${esc(r.justification_forfait || '')}</div>
      <div style="font-size:13px;color:rgba(255,255,255,.92);font-style:italic;line-height:1.55;margin-bottom:18px">${esc(r.message_cta || '')}</div>
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:8px"><a href="tel:5148392494" style="display:inline-block;background:#E8B800;color:#1A3270;font-weight:800;font-size:13px;letter-spacing:.04em;text-decoration:none;padding:12px 22px;border-radius:6px;text-transform:uppercase">📞 514-839-2494</a></td>
        <td><a href="mailto:info@quatrepiliers.ca" style="display:inline-block;background:transparent;border:1.5px solid rgba(255,255,255,.4);color:#fff;font-weight:700;font-size:13px;letter-spacing:.04em;text-decoration:none;padding:11px 22px;border-radius:6px">✉ Nous écrire</a></td>
      </tr></table>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:0 28px 28px">
    <div style="font-size:11px;color:#5C6880;text-align:center;line-height:1.6">
      Diagnostic généré pour ${esc(ans.email)}<br>
      <a href="https://www.quatrepiliers.ca" style="color:#2A4D9E;text-decoration:none">www.quatrepiliers.ca</a>
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function renderInternalEmail(ans, score, niv, r) {
  const labelMap = { autogere:'Autogéré', gestionnaire_ok:'Gestionnaire pro (satisfait)', gestionnaire_nok:'Gestionnaire pro (veut changer)', oui:'Oui', non:'Non', partiel:'Partiel', nsp:'Ne sait pas', oui_recente:'Oui (récente)', oui_ancienne:'Oui (>5 ans)', sous:'Sous-financé', difficile:'Difficile', irregulier:'Irrégulier' };
  const lab = (v) => labelMap[v] || v || '—';

  const rows = [
    ['Syndicat', ans.syndicat],
    ['Unités', ans.nb_unites],
    ['Score', `${score}/100 — ${niv.label}`],
    ['Email prospect', `<a href="mailto:${esc(ans.email)}">${esc(ans.email)}</a>`],
    ['Nom prospect', ans.nom || '—'],
    ['Gestion', lab(ans.gestion)],
    ['Carnet entretien', lab(ans.carnet)],
    ['Étude fonds prévoyance', lab(ans.etude_fp)],
    ['Niveau FP', lab(ans.fp_niveau)],
    ['Attestation 15j', lab(ans.attestation)],
    ['AG annuelle', lab(ans.ag)],
    ['Registre', lab(ans.registre)],
    ['Défis', Array.isArray(ans.defi) ? ans.defi.join(', ') : ans.defi],
  ].map(([k, v], i) => `<tr><td style="padding:7px 12px;background:${i%2?'#F8FAFE':'#F0F3FA'};font-weight:700;color:#1A3270;font-size:12px;width:180px">${esc(k)}</td><td style="padding:7px 12px;background:${i%2?'#fff':'#fff'};font-size:13px;color:#212B3C">${k.includes('Email') ? v : esc(v)}</td></tr>`).join('');

  const priorites = (r.priorites || []).map(p => `
    <div style="margin-bottom:10px;padding:10px 12px;background:#fff;border-left:3px solid #2A4D9E;border-radius:4px">
      <div style="font-size:11px;color:#5C6880">${esc(p.urgence)} · ${esc(p.echeance || '')}</div>
      <div style="font-size:13px;font-weight:700;color:#1A3270">${esc(p.titre || '')}</div>
      <div style="font-size:12px;color:#5C6880;margin-top:2px">${esc(p.description || '')}</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Nouveau diagnostic</title></head>
<body style="margin:0;padding:0;background:#fff;font-family:'Nunito Sans','Segoe UI',Arial,sans-serif;color:#212B3C">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:18px 12px;background:#F0F3FA"><tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #E8EAEF">
  <tr><td style="background:#1A3270;padding:16px 20px;border-bottom:3px solid #E8B800">
    <div style="font-size:11px;color:#E8B800;font-weight:800;letter-spacing:.1em;text-transform:uppercase">Nouveau diagnostic Loi 16</div>
    <div style="font-size:17px;color:#fff;font-weight:800;margin-top:3px">${esc(ans.syndicat)} — ${score}/100 (${esc(niv.label)})</div>
  </td></tr>
  <tr><td style="padding:18px 20px 12px">
    <div style="font-size:12px;font-weight:800;color:#1A3270;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Réponses</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8EAEF;border-radius:6px;overflow:hidden">${rows}</table>
  </td></tr>
  <tr><td style="padding:8px 20px 12px">
    <div style="font-size:12px;font-weight:800;color:#1A3270;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Diagnostic IA</div>
    <div style="background:#F0F3FA;padding:14px 16px;border-radius:6px">
      <div style="font-size:14px;font-weight:700;color:#1A3270;margin-bottom:6px">${esc(r.titre || '')}</div>
      <div style="font-size:13px;color:#212B3C;margin-bottom:10px;line-height:1.55">${esc(r.resume || '')}</div>
      ${(r.points_forts && r.points_forts.length) ? `<div style="font-size:12px;color:#0F6E56;margin-bottom:10px"><strong>Points forts:</strong><br>${r.points_forts.map(p => '· ' + esc(p)).join('<br>')}</div>` : ''}
      ${priorites}
      <div style="margin-top:10px;padding:10px 12px;background:#fff;border:1px dashed #E8B800;border-radius:4px">
        <div style="font-size:11px;color:#5C6880;text-transform:uppercase;letter-spacing:.06em;font-weight:800">Forfait recommandé</div>
        <div style="font-size:14px;font-weight:700;color:#1A3270">${esc(r.forfait_recommande || '')}</div>
        <div style="font-size:12px;color:#5C6880;margin-top:2px">${esc(r.justification_forfait || '')}</div>
      </div>
    </div>
  </td></tr>
  <tr><td style="padding:0 20px 18px">
    <a href="mailto:${esc(ans.email)}?subject=Votre diagnostic Loi 16 — ${esc(ans.syndicat)}" style="display:inline-block;background:#2A4D9E;color:#fff;font-weight:700;font-size:13px;text-decoration:none;padding:10px 18px;border-radius:6px">Répondre au prospect</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
