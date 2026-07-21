import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { resolvePostAuthDestination } from "@/lib/auth-destination";

type AuthSearch = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Guia Orquídeas Floridas" },
      { name: "description", content: "Acesse sua conta para salvar e continuar seu protocolo de 21 dias." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const explicitRedirect =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : null;

  async function resolveDestination(userId: string, opts?: { isNewSignup?: boolean }) {
    return resolvePostAuthDestination(userId, {
      isNewSignup: opts?.isNewSignup,
      explicitRedirect,
    });
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted || !data.session) return;
      const dest = await resolveDestination(data.session.user.id);
      if (mounted) navigate({ to: dest, replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        const dest = await resolveDestination(session.user.id);
        if (mounted) navigate({ to: dest, replace: true });
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, explicitRedirect]);

  return (
    <AuthScreen
      onBack={() => navigate({ to: "/", replace: true })}
      onSuccess={async (ctx) => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        const dest = await resolveDestination(data.session.user.id, ctx);
        navigate({ to: dest, replace: true });
      }}
    />
  );
}
