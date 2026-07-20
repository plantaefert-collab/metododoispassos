import { ProtocolState } from "./protocol-store";
import { CachedProtocolEnvelope } from "./auth/types";

const APP_PREFIX = "plantaefert-protocolo-21d";
const LEGACY_KEY = APP_PREFIX;

export function getCacheKey(userId: string | "guest"): string {
  return `${APP_PREFIX}:${userId}`;
}

export function saveToCache(userId: string | "guest", state: ProtocolState): void {
  const envelope: CachedProtocolEnvelope = {
    version: 1,
    userId,
    updatedAt: new Date().toISOString(),
    state,
  };
  localStorage.setItem(getCacheKey(userId), JSON.stringify(envelope));
}

export function loadFromCache(userId: string | "guest"): ProtocolState | null {
  const raw = localStorage.getItem(getCacheKey(userId));
  if (!raw) return null;
  try {
    const envelope = JSON.parse(raw) as CachedProtocolEnvelope;
    if (envelope.userId !== userId) return null;
    return envelope.state;
  } catch {
    return null;
  }
}

export function clearCache(userId: string | "guest"): void {
  localStorage.removeItem(getCacheKey(userId));
}

export function hasLegacyData(): boolean {
  return !!localStorage.getItem(LEGACY_KEY);
}

export function getLegacyData(): ProtocolState | null {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProtocolState;
  } catch {
    return null;
  }
}

export function clearLegacyData(): void {
  localStorage.removeItem(LEGACY_KEY);
}
