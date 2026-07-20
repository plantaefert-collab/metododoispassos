import { ProtocolState } from "../protocol-store";

export type AuthBootstrapStatus = 
  | "booting" 
  | "signed_out" 
  | "signing_in" 
  | "loading_remote_data" 
  | "needs_plant_registration" 
  | "needs_diagnosis" 
  | "ready" 
  | "auth_error";

export interface UserProfile {
  id: string;
  full_name: string | null;
  plant_name: string;
  onboarded: boolean;
}

export interface CachedProtocolEnvelope {
  version: number;
  userId: string | "guest";
  updatedAt: string;
  state: ProtocolState;
}

export interface LegacyLocalMigration {
  imported: boolean;
  timestamp: string;
}
