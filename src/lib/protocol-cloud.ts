import { supabase } from "@/integrations/supabase/client";
import { ProtocolState } from "./protocol-store";
import { UserProfile } from "./auth/types";
import { PostgrestError } from "@supabase/supabase-js";

export async function fetchUserProfile(userId: string): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, 
      full_name, 
      plant_name, 
      onboarded,
      plant_registered_at,
      plant_species,
      plant_unknown_species,
      plant_location,
      plant_pot,
      plant_substrate,
      plant_difficulty
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data: data as UserProfile, error: null };
}

export async function fetchUserProgress(userId: string): Promise<{ data: any | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("protocol_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function saveProgressRemote(userId: string, state: ProtocolState): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("protocol_progress")
    .upsert({
      user_id: userId,
      current_day: state.currentDay,
      completed_tasks: state.days,
      applications: state.applications,
      diagnosis_answers: state.diagnosis,
      diagnosis_result: state.diagnosisResult,
      diagnosis_status: state.diagnosisStatus,
      answers_version: state.answersVersion,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  return { error };
}

export async function saveProfileRemote(userId: string, profile: Partial<UserProfile>): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      ...profile,
    }, { onConflict: "id" });

  return { error };
}

export async function registerPlantRemote(userId: string, plantData: {
  plant_name: string;
  plant_species?: string | null;
  plant_unknown_species: boolean;
  plant_location?: string | null;
  plant_pot?: string | null;
  plant_substrate?: string | null;
  plant_difficulty?: string | null;
}): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      ...plantData,
      plant_registered_at: new Date().toISOString()
    }, { onConflict: "id" });

  return { error };
}
