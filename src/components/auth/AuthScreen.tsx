import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, X } from "lucide-react";

interface AuthScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function AuthScreen({ onBack, onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = mode === "signup" 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      if (data.session) {
        onSuccess();
      } else if (mode === "signup") {
        setError("Verifique seu e-mail para confirmar o cadastro.");
      }
    } catch (err: any) {
      setError(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      console.log("Initiating Google Auth with Lovable adapter...");
      const { lovable } = await import("@/integrations/lovable/index");
      
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/protocolo-21-dias",
        extraParams: { prompt: "select_account" }
      });

      if (result?.error) {
        throw result.error;
      }
      
      console.log("OAuth flow result:", result);
    } catch (err: any) {
      console.error("OAuth error:", err);
      setError("Erro ao iniciar login com Google: " + (err.message || "desconhecido"));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-[400px] bg-card p-8 rounded-3xl border border-border shadow-xl">
        <header className="text-center mb-8">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Leaf size={24} strokeWidth={2.2} />
          </div>
          <h1 className="font-display text-2xl text-primary">
            {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Acesse seu progresso salvo." : "Comece sua jornada botânica."}
          </p>
        </header>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground px-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="exemplo@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground px-1">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <span className="relative bg-card px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            ou continue com
          </span>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-3 rounded-full border border-border bg-background py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <div className="mt-8 text-center text-sm">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-semibold hover:underline"
          >
            {mode === "login" ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre agora"}
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-6 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
