import { ProtocolState } from "./protocol-store";
import { CachedProtocolEnvelope, LegacyMigrationRecord } from "./auth/types";

const APP_PREFIX = "plantaefert-protocolo-21d";
const LEGACY_KEY = APP_PREFIX;
const MIGRATION_PREFIX = `${APP_PREFIX}:migration`;

export function getCacheKey(userId: string | "guest"): string {
  return `${APP_PREFIX}:${userId}`;
}

export function getMigrationKey(userId: string): string {
  return `${MIGRATION_PREFIX}:${userId}`;
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
    // Validação estrita de usuário e estrutura
    if (envelope.userId !== userId) return null;
    if (envelope.version !== 1) return null;
    if (!envelope.state || typeof envelope.state !== 'object') return null;
    return envelope.state;
  } catch {
    return null;
  }
}

export function getCacheTimestamp(userId: string | "guest"): string | null {
  const raw = localStorage.getItem(getCacheKey(userId));
  if (!raw) return null;
  try {
    const envelope = JSON.parse(raw) as CachedProtocolEnvelope;
    return envelope.updatedAt;
  } catch {
    return null;
  }
}

export function clearCache(userId: string | "guest"): void {
  localStorage.removeItem(getCacheKey(userId));
}

// --- Legado e Migração ---

export function hasLegacyData(): boolean {
  return !!localStorage.getItem(LEGACY_KEY);
}

export function getLegacyData(): ProtocolState | null {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    // Verificação básica de que parece um estado de protocolo
    if (data && typeof data.schemaVersion === 'number') {
      return data as ProtocolState;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearLegacyData(): void {
  localStorage.removeItem(LEGACY_KEY);
}

export function getMigrationRecord(userId: string): LegacyMigrationRecord | null {
  const raw = localStorage.getItem(getMigrationKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LegacyMigrationRecord;
  } catch {
    return null;
  }
}

export function saveMigrationRecord(userId: string, record: LegacyMigrationRecord): void {
  localStorage.setItem(getMigrationKey(userId), JSON.stringify(record));
}

// --- Modo Visitante ---

const GUEST_ACTIVE_KEY = `${APP_PREFIX}:guest-active`;

export function setGuestActive(active: boolean): void {
  if (active) {
    sessionStorage.setItem(GUEST_ACTIVE_KEY, "true");
  } else {
    sessionStorage.removeItem(GUEST_ACTIVE_KEY);
  }
}

export function isGuestActive(): boolean {
  return sessionStorage.getItem(GUEST_ACTIVE_KEY) === "true";
}
