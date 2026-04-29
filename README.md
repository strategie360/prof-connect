# ProfConnect

Plateforme communautaire réservée aux enseignants de l'Éducation nationale française.  
Seuls les emails `@ac-*.fr` et `@education.gouv.fr` peuvent s'inscrire.

## Fonctionnalités

- **Auth** — inscription avec vérification d'email institutionnel, connexion
- **Fil d'annonces** — publication libre (location, échange, service, objet, etc.)
- **Messagerie** — conversations directes entre enseignants
- **Profils** — académie, matière, ville, bio

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL + Auth)
- **Vercel** (déploiement)

---

## Installation locale

### 1. Cloner et installer

```bash
git clone <repo>
cd prof-connect
npm install
```

### 2. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → nouveau projet
2. Récupérer l'**URL** et la **anon key** dans Settings → API
3. Dans Authentication → URL Configuration, ajouter :
   - Site URL : `http://localhost:3000`
   - Redirect URLs : `http://localhost:3000/auth/callback`

### 3. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplir `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Exécuter les migrations SQL

Dans Supabase → SQL Editor, coller et exécuter le contenu de :

```text
supabase/migrations/001_initial.sql
```

### 5. Démarrer

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

> **Note** : `npm run dev` supprime automatiquement `app/page.tsx` (résidu de create-next-app qui entre en conflit avec le routing).

---

## Déploiement sur Vercel

1. Pousser sur GitHub
2. Importer le repo sur [vercel.com](https://vercel.com)
3. Ajouter les variables d'environnement dans Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` → votre domaine Vercel (ex: `https://prof-connect.vercel.app`)
4. Dans Supabase → Authentication → URL Configuration, ajouter :
   - `https://votre-domaine.vercel.app/auth/callback`

---

## Structure du projet

```text
app/
  (auth)/          → login, register, verify (layout sans nav)
  (app)/           → toutes les pages authentifiées (layout avec nav)
    page.tsx       → fil d'annonces (/)
    post/          → création + détail d'annonce
    messages/      → messagerie
    profile/       → profil
  auth/callback/   → callback Supabase OAuth
  api/messages/    → route API pour polling messagerie
lib/
  supabase/        → clients browser / server / middleware
  types.ts         → types TypeScript
  utils.ts         → utilitaires (validation email, dates, etc.)
supabase/
  migrations/      → schéma SQL à appliquer dans Supabase
```
