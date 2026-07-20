import { supabase } from "@/integrations/supabase/client";
import { ProtocolState, mergeRemoteProgressState } from "./protocol-store";
import { UserProfile } from "./auth/types";
import { PostgrestError } from "@supabase/supabase-js";

export async function fetchUserProfile(userId: string): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, plant_name, onboarded")
    .eq("id", userId)
    .single();

  if (error) return { data: null, error };
  return { data: data as UserProfile, error: null };
}

export async function fetchUserProgress(userId: string): Promise<{ data: any | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("protocol_progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function saveProgressRemote(userId: string, state: ProtocolState): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("protocol_progress")
    .upsert({
      user_id: userId,
      current_day: state.currentDay,
      completed_tasks: state.days, // Map directly as the normalization handles it
      applications: state.applications,
      diagnosis_answers: state.diagnosis,
      diagnosis_result: state.diagnosisResult,
      diagnosis_status: state.diagnosisStatus,
      answers_version: state.answersVersion,
      updated_at: new Date().toISOString(),
    });

  return { error };
}

export async function saveProfileRemote(userId: string, profile: Partial<UserProfile>): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", userId);

  return { error };
}
