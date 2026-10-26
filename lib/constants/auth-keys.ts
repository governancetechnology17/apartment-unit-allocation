const ENV_PREFIX =
  process.env.NEXT_PUBLIC_SERVER_ENV === "development"
    ? "dev"
    : process.env.NEXT_PUBLIC_SERVER_ENV === "staging"
      ? "staging"
      : process.env.NEXT_PUBLIC_SERVER_ENV === "production"
        ? "api"
        : "dev";

export const LOCAL_ESUB_DOMAIN = "belmont-jubilee-towers-3457-dev.6787878.com";

export const BaseURL = `https://${ENV_PREFIX}.matadortrust.com/v2`;
/** v1 API base (investment project, upload, etc.) */
export const BaseURL_ONE = `https://${ENV_PREFIX}.matadortrust.com/v1`;

export const ESUB_SESSION_KEY = "auth_esub";
export const TOKEN_SESSION_KEY = "esub_token";
/** Cookie key for ref_id/agent from URL; cleared with auth. */
export const REF_AGENT_COOKIE_KEY = "esub_ref_agent";

export const STORE_DATA_KEY = "esubStoreData";
export const STORE_BRAND_COOKIE = "esub_store_brand";
