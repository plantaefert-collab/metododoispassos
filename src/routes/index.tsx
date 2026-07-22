import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostAuthDestination } from "@/lib/auth-destination";
import {
  Sprout,
  Leaf,
  Calendar,
  Stethoscope,
  BookOpen,
  ChevronRight,
  Sparkles,
  LogIn,
  Flower2,
} from "lucide-react";
import welcomeOrchid from "@/assets/welcome-orchid.jpg";
import kitMetodo from "@/assets/kit-metodo.jpg.asset.json";
import logoPlantaefert from "@/assets/logo-plantaefert.png";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlantaeFert — Guia Prático para Orquídeas Floridas em 21 Dias" },
      {
        name: "description",
        content:
          "Método de 2 Passos + protocolo guiado de 21 dias para diagnosticar, enraizar e nutrir sua orquídea. Comece grátis.",
      },
      { property: "og:title", content: "PlantaeFert — Guia Prático para Orquídeas Floridas em 21 Dias" },
      {
        property: "og:description",
        content: "Método de 2 Passos + protocolo guiado de 21 dias para diagnosticar, enraizar e nutrir sua orquídea. Comece grátis.",
      },
    ],
    links: [
      { rel: "preload", as: "image", href: welcomeOrchid, fetchpriority: "high" },
    ],
  }),
  component: HomePage,
});

const BENEFITS = [
  {
    icon: Stethoscope,
    title: "Diagnóstico guiado",
    body: "Responda perguntas simples e receba um plano personalizado para o estado atual da sua orquídea.",
  },
  {
    icon: Calendar,
    title: "Plano de 21 dias",
    body: "Passo a passo diário com checklists, aplicações e lembretes — sem precisar decorar receita.",
  },
  {
    icon: Sprout,
    title: "Passo 1 · Enraizar",
    body: "Recupere raízes fortes com o Enraizador nas semanas iniciais.",
  },
  {
    icon: Leaf,
    title: "Passo 2 · Nutrir",
    body: "Prepare a floração com Bokashi Premium na fase de nutrição.",
  },
  {
    icon: BookOpen,
    title: "Diário e progresso",
    body: "Registre notas, fotos e acompanhe a evolução dia após dia.",
  },
  {
    icon: Sparkles,
    title: "Sem enrolação",
    body: "Focado no que funciona: método de 2 passos, sem produtos extras.",
  },
];

function HomePage() {
  const { user } = useAuthBootstrap();
  const isLoggedIn = !!user;
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  // Fallback: se o OAuth retornar para "/" (redirect_uri padrão), roteia contextualmente.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" || !session || redirectedRef.current) return;
      // Só redireciona se veio de um fluxo OAuth (hash com tokens) ou primeiro login desta sessão.
      const hasOAuthHash = typeof window !== "undefined" && /access_token|code=/.test(window.location.hash + window.location.search);
      const justSignedIn = sessionStorage.getItem("pf_oauth_pending") === "1";
      if (!hasOAuthHash && !justSignedIn) return;
      redirectedRef.current = true;
      sessionStorage.removeItem("pf_oauth_pending");
      const dest = await resolvePostAuthDestination(session.user.id);
      navigate({ to: dest, replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center">
            <img
              src={logoPlantaefert}
              alt="PlantaeFert — Nutrição Vegetal"
                className="h-13 w-auto md:h-15"

            />
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/metodo" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Método
            </Link>
            <Link to="/aprender" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Aprender
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/minha-orquidea"
                  className="hidden items-center gap-1.5 text-muted-foreground hover:text-foreground sm:inline-flex"
                >
                  <Flower2 className="h-3.5 w-3.5" />
                  Minha orquídea
                </Link>
                <Link
                  to="/inicio"
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Continuar plano
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Entrar
                </Link>
                <Link
                  to="/protocolo-21-dias"
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Começar grátis
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Método de 2 Passos · 21 dias
            </span>
            <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              Orquídeas floridas com um plano simples de 21 dias.
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
              Diagnostique, enraíze e nutra sua orquídea seguindo um protocolo guiado — checklists diários,
              lembretes e diário de progresso, tudo em um só lugar.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/protocolo-21-dias"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg"
              >
                Começar meu plano de 21 dias
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/metodo"
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground/80 transition hover:bg-muted"
              >
                Ver o método
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Grátis · sem cadastro obrigatório</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl border border-border/60 shadow-xl">
              <img
                src={welcomeOrchid}
                alt="Orquídea florida acompanhada pelo protocolo PlantaeFert"
                className="h-[420px] w-full object-cover"
                width={800}
                height={840}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl md:text-4xl">Tudo que você precisa em um só lugar</h2>
            <p className="mt-3 text-muted-foreground">
              Um guia interativo com diagnóstico, plano diário e o método comprovado de 2 passos.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <li
                  key={b.title}
                  className="rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-lg">{b.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Método visual */}
      <section className="border-t border-border/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:py-20">
          <div className="overflow-hidden rounded-3xl border border-border/60 shadow-lg">
            <img
              src={kitMetodo.url}
              alt="Kit PlantaeFert: Enraizador Forte e Bokashi Orquídeas Premium"
              className="h-full w-full object-cover"
              loading="lazy"
              width={800}
              height={800}
            />
          </div>
          <div>
            <h2 className="font-serif text-3xl md:text-4xl">O Método de 2 Passos</h2>
            <p className="mt-3 text-muted-foreground">
              Nada de dezenas de produtos. Duas fórmulas certas, no momento certo:
            </p>
            <ol className="mt-6 space-y-4">
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  1
                </span>
                <div>
                  <h3 className="font-serif text-lg">Enraizar</h3>
                  <p className="text-sm text-muted-foreground">
                    Enraizador Forte para reconstruir raízes robustas nas primeiras semanas.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  2
                </span>
                <div>
                  <h3 className="font-serif text-lg">Nutrir</h3>
                  <p className="text-sm text-muted-foreground">
                    Bokashi Orquídeas Premium para preparar a floração com nutrição equilibrada.
                  </p>
                </div>
              </li>
            </ol>
            <div className="mt-8">
              <Link
                to="/protocolo-21-dias"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg"
              >
                Começar agora
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border/50 bg-primary/5">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center md:py-20">
          <h2 className="font-serif text-3xl md:text-4xl">Pronto para começar seus 21 dias?</h2>
          <p className="mt-3 text-muted-foreground">
            Faça o diagnóstico e receba seu plano guiado em menos de 2 minutos.
          </p>
          <Link
            to="/protocolo-21-dias"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg"
          >
            Começar meu plano de 21 dias
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground space-y-2">
        <div>© {new Date().getFullYear()} PlantaeFert · Método de 2 Passos</div>
        <div className="opacity-60 max-w-xs mx-auto px-4">
          Integre esta suíte de testes no meu pipeline de CI/CD para rodar automaticamente em cada atualização do projeto.
        </div>
      </footer>
    </div>
  );
}
