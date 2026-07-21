import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthScreen } from "@/components/auth/AuthScreen";

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
  const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/inicio";

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) navigate({ to: target, replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        navigate({ to: target, replace: true });
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, target]);

  return (
    <AuthScreen
      onBack={() => navigate({ to: "/", replace: true })}
      onSuccess={() => navigate({ to: target, replace: true })}
    />
  );
}
