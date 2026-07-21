import { fetchUserProfile, fetchUserProgress } from "@/lib/protocol-cloud";

export async function resolvePostAuthDestination(
  userId: string,
  opts?: { isNewSignup?: boolean; explicitRedirect?: string | null },
): Promise<string> {
  if (opts?.explicitRedirect) return opts.explicitRedirect;
  if (opts?.isNewSignup) return "/bem-vindo";
  try {
    const [{ data: profile }, { data: progress }] = await Promise.all([
      fetchUserProfile(userId),
      fetchUserProgress(userId),
    ]);
    if (!profile?.plant_registered_at) return "/minha-orquidea";
    if (!progress?.diagnosis_result) return "/diagnostico";
    return "/inicio";
  } catch {
    return "/inicio";
  }
}