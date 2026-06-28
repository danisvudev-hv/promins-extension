import { defineManifest } from '@crxjs/vite-plugin'

// The OAuth client id (Google Cloud Console → "Web application" type) is read from
// the build env so we never hard-code it. See README for setup.
const OAUTH_CLIENT_ID = process.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? ''

export default defineManifest({
  manifest_version: 3,
  name: 'Promins — Prompt Manager',
  version: '0.1.0',
  description:
    'Manage prompts & instructions: categories, tags, versions, copy & inject into ChatGPT / Claude / Gemini.',
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Promins',
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: [
    'sidePanel',
    'storage',
    'identity',
    'clipboardWrite',
    'activeTab',
    'tabs',
  ],
  host_permissions: [
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
    'https://*.supabase.co/*',
  ],
  content_scripts: [
    {
      matches: [
        'https://chatgpt.com/*',
        'https://chat.openai.com/*',
        'https://claude.ai/*',
        'https://gemini.google.com/*',
      ],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  // Only emit the oauth2 block when a client id is configured. `getAuthToken`
  // is not used (we use launchWebAuthFlow), but Chrome validates this block.
  ...(OAUTH_CLIENT_ID
    ? {
        oauth2: {
          client_id: OAUTH_CLIENT_ID,
          scopes: ['openid', 'email', 'profile'],
        },
      }
    : {}),
})
