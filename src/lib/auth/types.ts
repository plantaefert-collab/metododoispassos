import { ProtocolState } from "../protocol-store";

export type AuthBootstrapStatus = 
  | "booting" 
  | "signed_out" 
  | "signing_in" 
  | "loading_remote_data" 
  | "needs_plant_registration" 
  | "needs_diagnosis" 
  | "diagnosing"
  | "reviewing_diagnosis_result"
  | "ready" 

  | "auth_error";

export interface UserProfile {
  id: string;
  full_name: string | null;
  plant_name: string;
  plant_registered_at: string | null;
  plant_species: string | null;
  plant_unknown_species: boolean;
  plant_location: string | null;
  plant_pot: string | null;
  plant_substrate: string | null;
  plant_difficulty: string | null;
  onboarded: boolean;
}

export interface CachedProtocolEnvelope {
  version: number;
  userId: string | "guest";
  updatedAt: string;
  state: ProtocolState;
}

export interface LegacyMigrationRecord {
  status: "imported" | "dismissed";
  timestamp: string;
}

export interface BootstrapSnapshot {
  userId: string | "guest";
  state: ProtocolState;
  status: AuthBootstrapStatus;
}

export interface SyncResult {
  ok: boolean;
  error?: string;
}
