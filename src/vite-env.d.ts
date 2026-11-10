/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEETS_WEB_APP_URL?: string
  readonly VITE_SHEETS_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
