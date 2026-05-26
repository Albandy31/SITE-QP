# Guide de déploiement — Diagnostic Loi 16

Ce guide te mène de zéro à un diagnostic en production sur `https://www.quatrepiliers.ca/diagnostic.html`.

**Temps estimé : 1 h 15 min** (dont 15 min d'attente passive de propagation DNS) · **Coût : 0 $/mois**

> **Pourquoi SendGrid et pas Resend ?** Resend exige un enregistrement MX sur un sous-domaine, ce que Wix DNS ne supporte pas. SendGrid utilise uniquement des CNAMEs et un TXT sur sous-domaines — exactement ce que Wix supporte nativement. Aucune migration DNS nécessaire.

Coche chaque case au fur et à mesure.

---

## ✅ Phase 1 — Création des comptes (15 min)

### 1.1 Compte Cloudflare
> Nécessaire pour le Worker (API) et Turnstile (anti-bot). **Pas** pour gérer ton DNS — ton DNS reste chez Wix.

- [ ] Aller sur https://dash.cloudflare.com/sign-up
- [ ] S'inscrire avec `laurent.herlemont@gmail.com`
- [ ] Confirmer l'email

### 1.2 Compte SendGrid
- [ ] Aller sur https://signup.sendgrid.com
- [ ] Créer un compte gratuit (free tier : 100 emails/jour = 3 000/mois)
- [ ] Confirmer l'email
- [ ] Compléter le profil de base (prénom, nom, entreprise)

### 1.3 Nouvelle clé Anthropic
- [ ] Aller sur https://console.anthropic.com/settings/keys
- [ ] **Create Key** → la nommer `Diagnostic Quatre Piliers Production`
- [ ] **Copier la clé immédiatement** (elle ne sera plus jamais affichée) — la garder dans un gestionnaire de mots de passe temporairement.

---

## ✅ Phase 2 — Vérifier le domaine dans SendGrid + Wix DNS (20 min + 5-15 min propagation)

### 2.1 Ajouter le domaine dans SendGrid

- [ ] SendGrid → menu gauche → **Settings** → **Sender Authentication**
- [ ] Cliquer **Authenticate Your Domain**
- [ ] Choisir ton fournisseur DNS : **Other Host (Not Listed)**
- [ ] Entrer `quatrepiliers.ca` → **Next**
- [ ] SendGrid affiche **4 enregistrements DNS** — **garder cet onglet ouvert**

Tu vas voir quelque chose comme :

| Type | Hôte | Valeur |
|---|---|---|
| CNAME | `em1234.quatrepiliers.ca` | `u1234567.wl.sendgrid.net` |
| CNAME | `s1._domainkey.quatrepiliers.ca` | `s1.domainkey.u1234567.wl.sendgrid.net` |
| CNAME | `s2._domainkey.quatrepiliers.ca` | `s2.domainkey.u1234567.wl.sendgrid.net` |
| TXT | `_dmarc.quatrepiliers.ca` | `v=DMARC1; p=none; rua=mailto:info@quatrepiliers.ca` |

*(Les valeurs exactes sont propres à ton compte — prendre celles affichées par SendGrid)*

### 2.2 Ajouter les 4 records dans Wix DNS

- [ ] Wix dashboard → **Settings** → **Domains** → cliquer sur `quatrepiliers.ca`
- [ ] Cliquer **Manage DNS Records** (ou **Gérer les enregistrements DNS**)

**Record 1 — CNAME em\*\*\*\*** :
- [ ] Type : `CNAME`
- [ ] Hôte : `em1234` *(seulement la partie avant `.quatrepiliers.ca`)*
- [ ] Valeur : `u1234567.wl.sendgrid.net`
- [ ] **Save**

**Record 2 — CNAME s1._domainkey** :
- [ ] Type : `CNAME`
- [ ] Hôte : `s1._domainkey`
- [ ] Valeur : `s1.domainkey.u1234567.wl.sendgrid.net`
- [ ] **Save**

**Record 3 — CNAME s2._domainkey** :
- [ ] Type : `CNAME`
- [ ] Hôte : `s2._domainkey`
- [ ] Valeur : `s2.domainkey.u1234567.wl.sendgrid.net`
- [ ] **Save**

**Record 4 — TXT _dmarc** :
- [ ] Type : `TXT`
- [ ] Hôte : `_dmarc`
- [ ] Valeur : `v=DMARC1; p=none; rua=mailto:info@quatrepiliers.ca`
- [ ] **Save**

> ⚠️ **Ne touche pas** aux enregistrements existants (MX Google, SPF Google, A records, CNAME www). Seulement les 4 ci-dessus à ajouter.

### 2.3 Vérifier dans SendGrid

- [ ] Retourner sur SendGrid → **Verify** (ou **I've Added These Records**)
- [ ] Délai habituel : **5-15 minutes**
- [ ] Tous les records doivent passer au statut **Verified** ✓
- [ ] Si un record reste rouge après 20 min → vérifier qu'il n'y a pas de typo dans Wix DNS

### 2.4 Créer la clé API SendGrid

- [ ] SendGrid → **Settings** → **API Keys** → **Create API Key**
- [ ] Nom : `Worker production`
- [ ] Permission : **Restricted Access** → activer uniquement **Mail Send** → Full Access
- [ ] **Create & View**
- [ ] **Copier la clé immédiatement** (commence par `SG.`) — elle ne sera plus jamais affichée

### 2.5 Configurer l'adresse d'expéditeur

- [ ] SendGrid → **Settings** → **Sender Authentication** → **Single Sender Verification** (si domaine pas encore verified)
- [ ] OU, si le domaine est verified, passer directement — l'adresse `info@quatrepiliers.ca` est automatiquement autorisée

---

## ✅ Phase 3 — Activer Turnstile (5 min)

- [ ] Cloudflare dashboard → menu de gauche → **Turnstile** → **Add Site**
- [ ] Site name : `Diagnostic Quatre Piliers`
- [ ] Domain : `quatrepiliers.ca` (ajouter aussi `www.quatrepiliers.ca`)
- [ ] Widget mode : **Invisible**
- [ ] **Create**
- [ ] Copier **Site Key** (publique, commence par `0x4...`) et **Secret Key** (privée, commence par `0x4...`)

---

## ✅ Phase 4 — Créer le Worker Cloudflare (15 min)

### 4.1 Créer le Worker
- [ ] Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**
- [ ] Nom : `diagnostic-quatrepiliers`
- [ ] **Deploy** (déploie un Hello World par défaut)
- [ ] Noter l'URL générée, ex : `https://diagnostic-quatrepiliers.albandy31.workers.dev`

### 4.2 Coller le code du Worker
- [ ] Cliquer **Edit code** (en haut à droite)
- [ ] Effacer tout le contenu de `worker.js`
- [ ] Copier-coller le contenu complet du fichier `worker.js` (à la racine de ce dossier)
- [ ] **Save and Deploy** (en haut à droite)

### 4.3 Ajouter les Secrets et Variables
- [ ] Worker → **Settings** → **Variables and Secrets** → **Add variable**

**3 secrets (chiffrés)** — type **Secret** :

| Nom | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | clé Anthropic créée en 1.3 |
| `SENDGRID_API_KEY` | clé SendGrid créée en 2.4 |
| `TURNSTILE_SECRET_KEY` | Secret Key Turnstile créée en phase 3 |

**3 variables texte** — type **Plaintext** :

| Nom | Valeur |
|---|---|
| `ALLOWED_ORIGIN` | `https://www.quatrepiliers.ca,https://quatrepiliers.ca` |
| `TO_INTERNAL` | `info@quatrepiliers.ca` |
| `FROM_EMAIL` | `Quatre Piliers <info@quatrepiliers.ca>` |

- [ ] **Save and Deploy** après chaque ajout

---

## ✅ Phase 5 — Mettre à jour `diagnostic.html` (5 min)

Dans `diagnostic.html`, remplacer les 2 placeholders en haut du `<script>` :

- [ ] Ligne `const API_URL = "https://YOUR-WORKER-SUBDOMAIN.workers.dev/api/diagnostic";`
  - Remplacer par l'URL du Worker (phase 4.1) + `/api/diagnostic`
  - Ex : `"https://diagnostic-quatrepiliers.albandy31.workers.dev/api/diagnostic"`

- [ ] Ligne `const TURNSTILE_KEY = "YOUR-TURNSTILE-SITE-KEY";`
  - Remplacer par la **Site Key** Turnstile (phase 3)
  - Ex : `"0x4AAAAAAA..."`

---

## ✅ Phase 6 — Pousser sur GitHub Pages (10 min)

- [ ] Repo GitHub `albandy31/albandy31.github.io` (ou équivalent)
- [ ] Copier `diagnostic.html` à la racine du repo (ou dans le dossier où vit le site)
- [ ] Commit + Push
- [ ] Attendre 1-2 min que GitHub Pages publie
- [ ] Vérifier que `https://www.quatrepiliers.ca/diagnostic.html` charge

---

## ✅ Phase 7 — Tests bout en bout (15 min)

### 7.1 Test fonctionnel
- [ ] Ouvrir https://www.quatrepiliers.ca/diagnostic.html
- [ ] Remplir les 10 questions avec **ton propre courriel** comme prospect
- [ ] Cliquer **Obtenir mon diagnostic**
- [ ] Vérifier que le résultat s'affiche correctement (5-15 secondes)
- [ ] Vérifier la réception **2 courriels** :
  - Dans `info@quatrepiliers.ca` (notification interne, format dense)
  - Dans ton courriel test (récapitulatif prospect, format premium)

### 7.2 Test délivrabilité
- [ ] Aller sur https://www.mail-tester.com
- [ ] Copier l'adresse jetable affichée (ex : `test-abc123@srv1.mail-tester.com`)
- [ ] Refaire un diagnostic en utilisant cette adresse comme courriel prospect
- [ ] Cliquer **Then check your score** sur mail-tester
- [ ] **Objectif : 9/10 ou 10/10**
- [ ] Si < 8/10 : vérifier que SPF, DKIM, DMARC sont tous verts dans le rapport

### 7.3 Test anti-bot
- [ ] Ouvrir le navigateur en mode privé/incognito
- [ ] Refaire un diagnostic — ça doit fonctionner (Turnstile invisible)
- [ ] Si Turnstile échoue, vérifier que la Site Key dans `diagnostic.html` correspond bien

---

## 🔧 Dépannage rapide

| Symptôme | Cause probable | Solution |
|---|---|---|
| "Origin not allowed" | CORS mal configuré | Vérifier `ALLOWED_ORIGIN` dans le Worker |
| Pas de courriel reçu | DNS pas vert ou clé API invalide | SendGrid → **Activity** → vérifier les logs d'envoi |
| Email en spam | DKIM/SPF pas vert | Refaire mail-tester.com et lire le rapport |
| CNAME Wix refusé | Wix bloque certains sous-domaines | Contacter support Wix avec le record exact à ajouter |
| Turnstile timeout | Mauvaise Site Key | Confirmer la valeur copiée depuis Cloudflare |
| Anthropic 401 | Mauvaise clé | Régénérer + refaire la variable Secret |
| Worker 500 | Bug de code | Cloudflare → Worker → **Logs** (en temps réel) |
| SendGrid 403 | Domaine pas vérifié | Retourner en Phase 2.3 et vérifier les records |

---

## 🔒 Sécurité — checklist post-déploiement

- [ ] La clé Anthropic n'apparaît **nulle part** dans le HTML public (vérifier avec `Ctrl+U` sur la page en ligne)
- [ ] Le repo GitHub `albandy31` ne contient pas la clé SendGrid ni la clé Turnstile Secret (juste la Site Key publique, c'est OK)
- [ ] L'ancienne clé Anthropic (celle qui était hardcodée dans `diagnostic.html` local) est supprimée de la console Anthropic
- [ ] Le Worker est en **production** (pas en preview)

---

## 📊 Monitoring & limites

| Service | Limite gratuite | Tu utiliseras (~300 diag/mois) |
|---|---|---|
| Cloudflare DNS Wix | — | DNS géré par Wix, rien à changer |
| Cloudflare Workers | 100 000 req/jour | ~10/jour |
| SendGrid | 100 emails/jour (3 000/mois) | 600 (300×2) |
| Turnstile | Illimité | — |
| Anthropic API | Pay-per-use | ~3 $/mois (Sonnet 4.6, ~1 500 tokens × 300) |

⚠️ **Anthropic n'est pas gratuit** — c'est le seul coût variable. Pour 300 diagnostics/mois avec Sonnet 4.6 : ~3 $/mois. Pour rester strictement à 0 $, on peut basculer sur Haiku 4.5 (10× moins cher) — dis-moi si tu veux.

Pour suivre la consommation :
- Cloudflare → Workers → **Metrics** (requêtes, erreurs)
- SendGrid → **Activity** (tous les emails envoyés + statut delivered/bounced)
- Anthropic → **Usage** (consommation $ en temps réel)

---

## 📝 Améliorations possibles plus tard (optionnel)

- Ajouter `p=quarantine` puis `p=reject` au DMARC après 30 jours sans incident
- Configurer une URL custom pour le Worker via Cloudflare (`api.quatrepiliers.ca/api/diagnostic`) une fois le domaine lié à Cloudflare
- Ajouter des tests automatisés (jest/vitest sur le Worker)
- Migrer le site GitHub Pages vers Cloudflare Pages (un seul service)
- Ajouter rate limiting Cloudflare (KV) si trafic abusé
