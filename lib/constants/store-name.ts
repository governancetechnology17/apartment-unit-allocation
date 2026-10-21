import { getStoredStoreData } from "./store-data";

export const appWindow = typeof window !== "undefined" ? window : null;

const STORE_NAME_KEY = "esub_storeName";
export const DEFAULT_STORE_NAME = "myxelliainc-dev";

export function persistStoreName(storeName: string): void {
  const trimmed = storeName.trim();
  if (!trimmed || !appWindow) return;
  try {
    appWindow.sessionStorage?.setItem(STORE_NAME_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

const PREFIXES_HYPHEN = ["esub-"] as const;
const PREFIXES_DOT = ["esub"] as const;

function isLocalDevHost(hostname: string): boolean {
  return hostname.includes("localhost") || hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
}

function getStoreNameFromHostname(hostname: string): string | null {
  if (isLocalDevHost(hostname)) return DEFAULT_STORE_NAME;
  const segments = hostname.split(".");
  const firstSegment = segments[0];
  if (!firstSegment) return null;

  for (const prefix of PREFIXES_HYPHEN) {
    if (firstSegment.startsWith(prefix)) {
      const storeName = firstSegment.slice(prefix.length);
      return storeName || null;
    }
  }

  if (segments.length >= 3) {
    for (let i = 0; i < PREFIXES_DOT.length; i++) {
      if (firstSegment === PREFIXES_DOT[i] && segments[1]) return segments[1];
    }
  }

  return null;
}

/** Resolve store name from a request Host header (server) or window (client). */
export function getStoreNameFromHost(hostHeader: string): string {
  const host = (hostHeader ?? "").split(":")[0]?.trim() ?? "";
  if (!host || isLocalDevHost(host)) return DEFAULT_STORE_NAME;
  const fromHost = getStoreNameFromHostname(host);
  if (fromHost) return fromHost;
  return DEFAULT_STORE_NAME;
}

export function getStoreNameForWindow(win: Window): string {
  const hostname = win.location?.hostname ?? "";
  if (isLocalDevHost(hostname)) {
    try {
      win.sessionStorage?.setItem(STORE_NAME_KEY, JSON.stringify(DEFAULT_STORE_NAME));
    } catch {
      /* ignore */
    }
    return DEFAULT_STORE_NAME;
  }
  const segments = hostname.split(".");
  const firstSegment = segments[0];

  for (const prefix of PREFIXES_HYPHEN) {
    if (firstSegment?.startsWith(prefix)) {
      const name = firstSegment.slice(prefix.length);
      if (name) {
        try {
          win.sessionStorage?.setItem(STORE_NAME_KEY, JSON.stringify(name));
        } catch {
          /* ignore */
        }
        return name;
      }
      break;
    }
  }
  if (segments.length >= 3) {
    for (let i = 0; i < PREFIXES_DOT.length; i++) {
      if (firstSegment === PREFIXES_DOT[i] && segments[1]) {
        const name = segments[1];
        try {
          win.sessionStorage?.setItem(STORE_NAME_KEY, JSON.stringify(name));
        } catch {
          /* ignore */
        }
        return name;
      }
    }
  }
  try {
    const stored = win.sessionStorage?.getItem(STORE_NAME_KEY);
    if (stored) return JSON.parse(stored) as string;
  } catch {
    /* ignore */
  }
  return DEFAULT_STORE_NAME;
}

function getStoreNameFromUrl(): string | null {
  if (appWindow?.location?.origin?.includes("localhost")) return DEFAULT_STORE_NAME;
  if (!appWindow?.location?.hostname) return null;
  return getStoreNameFromHostname(appWindow.location.hostname);
}

/** Store slug for API query params — matches buyback pattern, with esub hostname prefixes. */
export const store_name = (): string => {
  if (!appWindow) return DEFAULT_STORE_NAME;
  return DEFAULT_STORE_NAME;
};

export const business_id = (): string => {
  if (!appWindow) return "";
  return window.sessionStorage.getItem("business_id") || "";
};
