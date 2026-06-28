# Promins — Prompt Manager (Chrome Extension)

Manage your prompts & instructions: organize by **category** and **tags**, keep
**version history**, **copy** or **inject** straight into ChatGPT / Claude /
Gemini, and sync everything to your Google account.

Built with **Manifest V3 + React + TypeScript + Vite (CRXJS)**, a **Supabase**
backend (Postgres + Auth + Row Level Security), a **Chrome Side Panel** as the
main UI, and a small toolbar **popup** for quick access to favorites.

## Features

- ✅ Create / edit / delete / **copy** prompts
- 🗂️ Organize by **category** + multiple **tags**
- 🕓 **Version history** per prompt with one-click **restore**
- 🔍 Full-text **search** + filter by category / tag / favorites
- ⭐ **Favorites** surfaced in the popup
- 🧠 **Variables** — `{{topic}}`, `{{lang|English}}` filled in before copy/inject
- 📥📤 **Import / Export** JSON
- 💉 **Inject** into the chat box of ChatGPT, Claude and Gemini
- 🌗 Dark / light theme
- ☁️ **Google sign-in** + cross-device sync

## Project structure

```
manifest.config.ts        CRXJS manifest (MV3)
src/
  sidepanel/   Main management UI (React)
  popup/       Quick-access favorites
  background/  Service worker (auth keep-alive, open side panel)
  content/     Content script + per-site injection adapters
  lib/         supabase/, api/, store/, variables/, messaging/, importExport/, theme/, db/
  shared/      constants
supabase/migrations/   SQL: schema (0001), triggers (0002), RLS (0003)
```

## Setup

### 1. Install

```bash
npm install
cp .env.example .env   # then fill in the values below
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` in order (SQL editor or
   `supabase db push` if you link the project).
3. Copy **Project URL** and **anon public key** (Project Settings → API) into
   `.env` as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

### 3. Google OAuth

The extension uses `chrome.identity.launchWebAuthFlow` to get a Google
`id_token`, then bridges it into Supabase via `signInWithIdToken`.

1. **Pin the extension ID** so the OAuth redirect URI is stable. Either load the
   unpacked build once and copy the generated ID, or add a `"key"` to
   `manifest.config.ts`. The redirect URI is
   `https://<EXTENSION_ID>.chromiumapp.org/`.
2. **Google Cloud Console** → APIs & Services → Credentials:
   - Configure the OAuth consent screen.
   - Create an **OAuth 2.0 Client ID** of type **Web application**.
   - Add the authorized redirect URI `https://<EXTENSION_ID>.chromiumapp.org/`.
   - Put the client ID in `.env` as `VITE_GOOGLE_OAUTH_CLIENT_ID`.
3. **Supabase** → Authentication → Providers → **Google**: enable it, paste the
   Google client ID and secret, and add the client ID under
   **Authorized Client IDs** (required for `signInWithIdToken`).

### 4. Build & load

```bash
npm run build
```

Then in `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select the `dist/` folder. Open the side panel from the toolbar icon → popup →
**Open panel**.

For development with HMR:

```bash
npm run dev   # then Load unpacked the dist/ folder it produces
```

## Verifying

- **Auth:** click *Continue with Google* → the session persists across reloads.
- **CRUD:** create / edit / delete / copy a prompt.
- **Versions:** edit a prompt's body twice → check the version timeline → restore.
- **Injection:** open ChatGPT / Claude / Gemini → *Inject* → text lands in the
  chat box (it does not auto-send).
- **Variables:** a prompt with `{{var}}` shows the fill dialog before copy/inject.

## Security notes

- Only the **anon** Supabase key ships in the bundle; never include the
  service-role key.
- Row Level Security ensures each user can only read/write their own rows.
