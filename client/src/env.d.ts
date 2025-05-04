/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FAL_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 