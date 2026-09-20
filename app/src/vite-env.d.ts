/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Privy app ID. Required — the app shows a setup notice without it. */
  readonly VITE_PRIVY_APP_ID: string | undefined;
  /** Optional, only for multi-environment Privy deployments. */
  readonly VITE_PRIVY_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
