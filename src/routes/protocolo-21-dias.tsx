import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode, type ChangeEvent, useEffect, useRef, useLayoutEffect } from "react";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Sprout,
  Leaf,
  Home,
  CalendarCheck,
  Stethoscope,
  Images,
  BookOpen,
  Camera,
  Droplets,
  Sun,
  Wind,
  FlowerIcon,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  X,
  Plus,
  Info,
  Flower2,
  Sparkles,
  AlertCircle,
  Loader2,
  FileText,
  Download,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useProtocolStore, isDiagnosisCurrent, defaultState, getState } from "@/lib/protocol-store";
import { compressImage, PHOTO_ERROR_MESSAGE } from "@/lib/image-compress";
import {
  getProtocolDay,
  getProtocolPhase,
  APPLICATION_DAYS,
  PHOTO_DAYS,
  PROTOCOL_PHASES,
  WEEKS,
  getWeekForDay,
  type ProtocolDay,
  type DayStage,
  type RegisterOption,
} from "@/lib/protocol-plan";
import {
  CATEGORY_LABEL,
  DIAGNOSIS_OPTIONS,
  totalObservations,
  type DiagnosisCategory,
  type DiagnosisGuidance,
} from "@/lib/diagnosis-matrix";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import type { AuthBootstrapStatus } from "@/lib/auth/types";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { LegacyProgressDialog } from "@/components/auth/LegacyProgressDialog";
import { 
  hasLegacyData, 
  getLegacyData, 
  clearLegacyData, 
  isGuestActive, 
  setGuestActive, 
  getMigrationRecord, 
  saveMigrationRecord, 
  saveToCache 
} from "@/lib/protocol-cache";
import { saveProgressRemote } from "@/lib/protocol-cloud";
import welcomeOrchid from "@/assets/welcome-orchid.jpg";



export const Route = createFileRoute("/protocolo-21-dias")({
  head: () => ({
    meta: [
      { title: "Guia Prático Orquídeas Floridas — PlantaeFert" },
      {
        name: "description",
        content:
          "Protocolo interativo de 21 dias para diagnosticar, enraizar, nutrir e acompanhar sua orquídea com o método de 2 passos PlantaeFert.",
      },
      { property: "og:title", content: "Guia Prático Orquídeas Floridas — PlantaeFert" },
      {
        property: "og:description",
        content: "Plano guiado de 21 dias para orquídeas floridas.",
      },
    ],
  }),
  component: ProtocoloPage,
});

type Tab = "inicio" | "plano" | "diagnostico" | "diario" | "aprender" | "resumo";

function phaseOf(day: number) {
  const phase = getProtocolPhase(day);
  const tones = {
    "fase-1": "green",
    "fase-2": "lilac",
    "fase-3": "accent",
  } as const;
  return {
    label: phase.title,
    range: phase.range,
    tone: tones[phase.id as keyof typeof tones] || "green",
  };
}

function ProtocoloPage() {
  const store = useProtocolStore();
  const { status, user, error: authError, setStatus } = useAuthBootstrap();
  const [tab, setTab] = useState<Tab>("inicio");

  // Retomar automaticamente para a aba correta quando o status mudar para ready
  useEffect(() => {
    if (status === "ready") {
      const state = getState();
      if (state.onboarded) {
        setTab("plano");
      }
    }
  }, [status]);
  const [guestMode, setGuestMode] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showLegacyDialog, setShowLegacyDialog] = useState(false);

  const actorId = user?.id ?? "guest";

  useEffect(() => {
    // Modo visitante persistente
    if (status === "signed_out" && isGuestActive()) {
      setGuestMode(true);
      setTab("aprender");
    }
  }, [status]);

  useEffect(() => {
    if (status === "loading_remote_data" && hasLegacyData()) {
      // Verificação de marcador de migração
      if (user?.id && !getMigrationRecord(user.id)) {
        setShowLegacyDialog(true);
      }
    }
  }, [status, user?.id]);

  if (status === "booting" || status === "loading_remote_data") {
    return (
      <div className="min-h-screen bg-[#F8F5EE] relative flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        {/* Marca d'água botânica */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
          <svg width="400" height="400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#173D32]">
             <path d="M50 10C50 10 40 30 40 50C40 70 50 90 50 90M50 10C50 10 60 30 60 50C60 70 50 90 50 90M20 50C20 50 40 45 50 50C60 55 80 50 80 50" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round"/>
             <circle cx="50" cy="50" r="2" fill="currentColor"/>
          </svg>
        </div>
        
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="mb-6 text-[#173D32] relative z-10"
        >
          <div className="p-3 bg-white/50 backdrop-blur-sm rounded-full border border-[#173D32]/10 shadow-sm">
            <Loader2 size={32} strokeWidth={1.5} />
          </div>
        </motion.div>
        <div className="font-display text-2xl text-[#173D32] relative z-10 mb-2">Preparando sua jornada...</div>
        <div className="text-[10px] text-[#173D32]/50 font-bold uppercase tracking-[0.2em] relative z-10">PlantaeFert Nutrição Vegetal</div>
      </div>
    );
  }

  if (status === "auth_error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-destructive mb-4" />
        <h2 className="text-xl font-display text-foreground">Ops! Algo deu errado</h2>
        <p className="mt-2 text-muted-foreground max-w-xs">{authError || "Não foi possível carregar seus dados."}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-md"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="font-sans text-foreground antialiased selection:bg-accent/20">
      <Toaster 
        position="top-center" 
        richColors 
        toastOptions={{
          className: "font-sans",
          style: {
            borderRadius: '1rem',
            padding: '12px 16px',
          },
          classNames: {
            toast: "border shadow-lg",
            success: "bg-[#F8F5EE] border-[#173D32]/20 text-[#173D32]",
            info: "bg-[#FDF2F8] border-[#D946EF]/20 text-[#D946EF]",
            error: "bg-destructive/5 border-destructive/20 text-destructive",
            warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
          }
        }}
        icons={{
          success: <Sprout size={18} className="text-[#173D32]" />,
          info: <Sparkles size={18} className="text-[#D946EF]" />,
          error: <AlertCircle size={18} className="text-destructive" />,
          warning: <AlertTriangle size={18} className="text-yellow-600" />,
        }}
      />
      <AnimatePresence mode="wait">
        {status === "signed_out" && !guestMode && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <WelcomeScreen
              onStart={() => setStatus("signing_in")}
              onExplore={() => {
                setGuestActive(true);
                setGuestMode(true);
                setTab("aprender");
              }}
            />
          </motion.div>
        )}

        {status === "signing_in" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <AuthScreen
              onBack={() => setStatus("signed_out")}
              onSuccess={() => {
                // O bootstrap cuidará da transição
              }}
            />
          </motion.div>
        )}

        {/* Overlay "Sincronizando..." é gerenciado pelo estado de carregamento
            inicial (booting/loading_remote_data) no early return acima. */}

        {/* O cadastro da planta agora é acessível via aba Início se o usuário desejar */}

        {status === "needs_diagnosis" && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background"
          >
            <SignupScreen
              actorId={actorId}
              onBack={() => setStatus("ready")}
              onNext={() => setStatus("diagnosing")}
            />
          </motion.div>
        )}

        {status === "diagnosing" && (
          <motion.div
            key="diagnosis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background"
          >
            <DiagnosisScreen
              actorId={actorId}
              onBack={() => setStatus("needs_diagnosis")}
              onFinish={() => {
                store.saveDiagnosisResult(actorId);
                setStatus("reviewing_diagnosis_result");
                // Ao concluir o diagnóstico, a "Tarefa do dia" correspondente será exibida 
                // naturalmente ao retornar ao fluxo principal ou ao ver o resumo.
              }}
            />
          </motion.div>
        )}

        {status === "reviewing_diagnosis_result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background"
          >
            <DiagnosisResultScreen
              actorId={actorId}
              onBack={() => setStatus("needs_diagnosis")}
              onFinish={() => {
                store.setOnboarded(true, actorId);
                setStatus("ready");
                // Fluxo automático: levar diretamente para o Plano (onde está a tarefa do dia)
                setTab("plano");
              }}
            />
          </motion.div>
        )}

        {(status === "ready" || guestMode) && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AppShell tab={tab} setTab={setTab} onReset={() => setShowReset(true)} userEmail={user?.email} setStatus={setStatus}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {tab === "inicio" && <InicioTab actorId={actorId} setTab={setTab} setStatus={setStatus} />}
                  {tab === "plano" && <PlanoTab actorId={actorId} setTab={setTab} />}
                  {tab === "diagnostico" && (
                    <DiagnosticoTab actorId={actorId} onRedo={() => setStatus("needs_diagnosis")} setTab={setTab} />
                  )}
                  {tab === "diario" && <DiarioTab actorId={actorId} />}
                  {tab === "aprender" && <AprenderTab />}
                  {tab === "resumo" && <ResumoTab actorId={actorId} />}
                </motion.div>
              </AnimatePresence>
            </AppShell>
          </motion.div>
        )}
      </AnimatePresence>

      {showLegacyDialog && user?.id && (
        <LegacyProgressDialog 
          onImport={async () => {
            const legacyData = getLegacyData();
            if (legacyData && user.id) {
              store.hydrateStore(legacyData);
              await saveProgressRemote(user.id, legacyData);
              saveMigrationRecord(user.id, { status: "imported", timestamp: new Date().toISOString() });
              clearLegacyData();
            }
            setShowLegacyDialog(false);
          }}
          onContinue={() => {
            if (user.id) {
              saveMigrationRecord(user.id, { status: "dismissed", timestamp: new Date().toISOString() });
            }
            setShowLegacyDialog(false);
          }}
        />
      )}

      <AnimatePresence>
        {showReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
            >
              <ConfirmModal
                title="Reiniciar meu plano?"
                description="Isso apagará cadastro, diagnóstico, checklists, fotos e anotações salvas."
                confirmLabel="Reiniciar meu plano"
                onCancel={() => setShowReset(false)}
                onConfirm={async () => {
                  store.clearStore();
                  saveToCache(actorId, defaultState);
                  if (user?.id) {
                    await saveProgressRemote(user.id, defaultState);
                  }
                  setShowReset(false);
                  setStatus("needs_diagnosis");
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhaseProgressBar({ currentDay }: { currentDay: number }) {
  const phaseInfo = useMemo(() => {
    const day = Math.min(21, Math.max(1, currentDay));
    if (day <= 7) return { label: "Fase 1: Dias 1–7", progress: (day / 7) * 100, color: "bg-primary" };
    if (day <= 14) return { label: "Fase 2: Dias 8–14", progress: ((day - 7) / 7) * 100, color: "bg-[#D946EF]" }; // matching accent magenta
    return { label: "Fase 3: Dias 15–21", progress: ((day - 14) / 7) * 100, color: "bg-accent" };
  }, [currentDay]);

  return (
    <div className="border-t border-border bg-card px-4 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Progresso da {phaseInfo.label}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">
          Dia <span className="font-display text-lg text-primary">{currentDay}</span> de 21
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          key={phaseInfo.label}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, phaseInfo.progress))}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full ${phaseInfo.color}`}
        />
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */


function AppShell({
  tab,
  setTab,
  onReset,
  userEmail,
  setStatus,
  children,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onReset: () => void;
  userEmail?: string;
  setStatus?: (s: AuthBootstrapStatus) => void;
  children: ReactNode;
}) {
  const { state, clearSaveError } = useProtocolStore();
  const diagnosisFresh = isDiagnosisCurrent(state);
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col shadow-[0_30px_90px_-20px_rgba(23,61,50,0.1)] sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:rounded-2xl sm:border sm:border-border sm:bg-card">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-4 backdrop-blur-md sm:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Leaf size={18} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-tight text-primary uppercase">PlantaeFert</div>
              <div className="truncate text-[10px] font-medium text-muted-foreground/80">LABS · NUTRIÇÃO</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {state.plant.name && (
              <div className="hidden max-w-[130px] items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground sm:flex">
                <Flower2 size={12} className="shrink-0" />
                <span className="truncate">{state.plant.name}</span>
              </div>
            )}
            <button
              onClick={onReset}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Reiniciar meu plano"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {state.saveError && (
          <div
            role="alert"
            className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2.5 text-[13px] leading-snug text-destructive"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{state.saveError}</span>
            <button
              onClick={clearSaveError}
              aria-label="Fechar aviso"
              className="ml-1 rounded-full p-1 text-destructive hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
          <div className="relative space-y-6">
            {tab === "inicio" && userEmail && (
              <AccountMenu 
                email={userEmail} 
                onLogout={() => {
                  // O bootstrap cuidará do redirecionamento
                }} 
              />
            )}
            {children}
          </div>
        </main>

        <PhaseProgressBar currentDay={state.currentDay} />
        <nav className="sticky bottom-0 z-20 border-t border-border bg-card/80 backdrop-blur-md sm:rounded-b-2xl">
          <div className="grid grid-cols-5">
            <TabBtn
              active={tab === "inicio"}
              onClick={() => setTab("inicio")}
              icon={<Home size={20} />}
              label="Início"
            />
            <TabBtn
              active={tab === "plano"}
              onClick={() => setTab("plano")}
              icon={<CalendarCheck size={20} />}
              label="Plano"
            />
            <TabBtn
              active={tab === "diagnostico"}
              onClick={() => setTab("diagnostico")}
              icon={
                <div className="relative">
                  <Stethoscope size={20} />
                  {!diagnosisFresh && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(217,70,239,0.8)]" 
                    />
                  )}
                </div>
              }
              label="Diagnóstico"
            />
            <TabBtn
              active={tab === "diario"}
              onClick={() => setTab("diario")}
              icon={<Images size={20} />}
              label="Diário"
            />
            <TabBtn
              active={tab === "aprender"}
              onClick={() => setTab("aprender")}
              icon={<BookOpen size={20} />}
              label="Dicas"
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 py-3 transition-all duration-300 ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className="relative">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl transition-all duration-500 ${
            active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" : "bg-transparent"
          }`}
        >
          {icon}
        </span>
        {active && (
          <motion.div
            layoutId="tabGlow"
            className="absolute -inset-1 z-[-1] rounded-2xl bg-primary/10 blur-md"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </div>
      <span
        className={`text-[9.5px] font-bold uppercase tracking-widest transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-50"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/* ---------------- Welcome ---------------- */

function WelcomeScreen({ onStart, onExplore }: { onStart: () => void; onExplore: () => void }) {
  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: "var(--color-plantae-cream)", color: "var(--color-plantae-ink)" }}
    >
      <div
        className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 pb-8 pt-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-[28px] sm:px-6 sm:shadow-[0_20px_70px_-40px_rgba(23,61,50,0.35)]"
        style={{ backgroundColor: "var(--color-plantae-cream)" }}
      >
        {/* Header */}
        <header className="flex items-center gap-2.5">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl"
            style={{ backgroundColor: "var(--color-plantae-green)", color: "var(--color-plantae-cream)" }}
          >
            <Leaf size={18} strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--color-plantae-green)" }}>
              PlantaeFert
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--color-plantae-mute)" }}>
              Nutrição Vegetal
            </div>
          </div>
        </header>

        {/* Photo */}
        <figure
          className="relative mt-5 overflow-hidden rounded-[28px] border border-white/20 shadow-xl"
          style={{ backgroundColor: "var(--color-plantae-lilac)" }}
        >
          <img
            src={welcomeOrchid}
            alt="Orquídea Phalaenopsis saudável em vaso, com folhas verdes e raízes aéreas visíveis em ambiente doméstico claro."
            width={1024}
            height={1024}
            className="h-[220px] w-full object-cover sm:h-[240px]"
          />
          <span
            className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-md"
            style={{ backgroundColor: "var(--color-plantae-rose)", color: "var(--color-plantae-magenta)" }}
          >
            <Sparkles size={11} /> Método de 2 passos
          </span>
        </figure>

        {/* Title */}
        <h1
          className="mt-6 font-display leading-[1.02] tracking-tight"
          style={{ color: "var(--color-plantae-green)" }}
        >
          <span className="block text-[22px] font-normal" style={{ color: "var(--color-plantae-mute)" }}>
            Guia Prático
          </span>
          <span className="mt-1 block text-[36px] leading-[1.05] font-normal min-[390px]:text-[40px] sm:text-[44px] [word-spacing:0.02em]">
            <span className="whitespace-nowrap">Orquídeas</span>{" "}
            <em className="not-italic whitespace-nowrap" style={{ color: "var(--color-plantae-magenta)" }}>
              Floridas
            </em>
          </span>
        </h1>

        {/* Promise */}
        <p className="mt-4 text-[15px] font-semibold" style={{ color: "var(--color-plantae-green)" }}>
          Seu plano guiado de 21 dias
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "var(--color-plantae-mute)" }}>
          Observe sua orquídea, fortaleça a base e acompanhe os sinais da planta com uma rotina
          simples.
        </p>

        {/* Two-step method */}
        <div className="mt-6 flex flex-col gap-2">
          <StepCard
            number="1"
            label="Enraizar"
            support="Fortalecer a base"
            text="Cuidar das raízes e preparar a planta para aproveitar melhor a rotina."
            bg="var(--color-plantae-lilac)"
            ink="var(--color-plantae-green)"
            badge="var(--color-plantae-green)"
            badgeInk="var(--color-plantae-cream)"
            icon={<Sprout size={18} strokeWidth={2} />}
          />
          <div
            className="flex items-center gap-2 pl-6 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "var(--color-plantae-mute)" }}
          >
            <span className="h-px w-6" style={{ backgroundColor: "var(--color-plantae-mute)" }} />
            depois
          </div>
          <StepCard
            number="2"
            label="Nutrir"
            support="Apoiar o desenvolvimento"
            text="Oferecer suporte nutricional para o vigor e os próximos ciclos da planta."
            bg="var(--color-plantae-lilac)"
            ink="var(--color-plantae-green)"
            badge="var(--color-plantae-magenta)"
            badgeInk="var(--color-plantae-cream)"
            icon={<Leaf size={18} strokeWidth={2} />}
          />
        </div>

        {/* Benefit */}
        <div
          className="mt-5 rounded-2xl px-4 py-3"
          style={{
            backgroundColor: "rgba(255,255,255,0.6)",
            color: "var(--color-plantae-ink)",
            border: "1px solid rgba(23,61,50,0.08)",
          }}
        >
          <div className="flex items-center gap-2">
            <Stethoscope size={13} style={{ color: "var(--color-plantae-green)" }} />
            <CalendarCheck size={13} style={{ color: "var(--color-plantae-green)" }} />
            <Camera size={13} style={{ color: "var(--color-plantae-green)" }} />
            <span
              className="ml-1 text-[12px] font-semibold uppercase tracking-[0.09em]"
              style={{ color: "var(--color-plantae-green)" }}
            >
              Diagnóstico · Tarefas · Fotos
            </span>
          </div>
          <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "var(--color-plantae-mute)" }}>
            Acompanhe tudo em um só lugar.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onStart}
            className="rounded-full px-6 py-4 text-[15px] font-semibold uppercase tracking-[0.06em] transition-transform active:scale-[0.98]"
            style={{ backgroundColor: "var(--color-plantae-green)", color: "var(--color-plantae-cream)" }}
          >
            Começar meu plano
          </button>
          <button
            onClick={onExplore}
            className="rounded-full px-6 py-2.5 text-[13px] font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--color-plantae-mute)" }}
          >
            Explorar o conteúdo
          </button>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  label,
  support,
  text,
  bg,
  ink,
  badge,
  badgeInk,
  icon,
}: {
  number: string;
  label: string;
  support: string;
  text: string;
  bg: string;
  ink: string;
  badge: string;
  badgeInk: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] p-5 border border-white/40 shadow-sm" style={{ backgroundColor: bg }}>
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold shadow-sm"
          style={{ backgroundColor: badge, color: badgeInk }}
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span style={{ color: ink }}>{icon}</span>
            <h3 className="font-display text-[20px] leading-none" style={{ color: ink }}>
              {label}
            </h3>
          </div>
          <p
            className="mt-1 text-[12.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: ink, opacity: 0.7 }}
          >
            {support}
          </p>
          <p
            className="mt-1.5 text-[14.5px] leading-[1.55]"
            style={{ color: "var(--color-plantae-ink)", opacity: 0.85 }}
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Auth ---------------- */



function SignupScreen({
  actorId,
  onNext,
  onBack,
}: {
  actorId: string;
  onNext: () => void;
  onBack?: () => void;
}) {
  const { state, updatePlant } = useProtocolStore();

  const plant = state.plant;

  const handlePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      updatePlant({ photo: dataUrl }, actorId);
    } catch {
      alert(PHOTO_ERROR_MESSAGE);
    }
  };

  const canSave = plant.name.trim().length > 0;

  return (
    <div className="min-h-screen overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col px-5 py-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:shadow-[0_15px_50px_-30px_rgba(23,61,50,0.25)]">
        <div className="flex items-start justify-between">
          <StepHeader
            step={1}
            total={3}
            title="Cadastro da orquídea"
            subtitle="Conte um pouco sobre sua planta."
          />
          {onBack && (
            <button
              onClick={onBack}
              className="mt-1 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Voltar para o início"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="mt-6 space-y-5">
          <Field label="Nome da planta *">
            <input
              value={plant.name}
              onChange={(e) => {
                const name = e.target.value;
                updatePlant({ name }, actorId);
              }}
              placeholder="Ex.: Minha Phalaenopsis"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <Field label="Espécie (opcional)">
            <input
              value={plant.species}
              onChange={(e) => {
                const species = e.target.value;
                updatePlant({ species, unknownSpecies: false }, actorId);
              }}
              disabled={plant.unknownSpecies}
              placeholder="Ex.: Phalaenopsis, Cattleya…"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={plant.unknownSpecies}
                onChange={(e) => {
                  const unknownSpecies = e.target.checked;
                  updatePlant({
                    unknownSpecies,
                    species: unknownSpecies ? "" : plant.species,
                  }, actorId);
                }}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Não sei a espécie
            </label>
          </Field>

          <SelectField
            label="Local de cultivo"
            value={plant.location}
            onChange={(v) => updatePlant({ location: v }, actorId)}
            options={["Varanda", "Janela interna", "Jardim externo", "Estufa", "Outro"]}
          />

          <SelectField
            label="Tipo de vaso"
            value={plant.pot}
            onChange={(v) => updatePlant({ pot: v }, actorId)}
            options={[
              "Vaso plástico transparente",
              "Vaso plástico comum",
              "Vaso de barro",
              "Vaso de madeira",
              "Cachepot",
              "Outro",
            ]}
          />

          <SelectField
            label="Tipo de substrato"
            value={plant.substrate}
            onChange={(v) => updatePlant({ substrate: v }, actorId)}
            options={[
              "Casca de pinus",
              "Fibra de coco",
              "Musgo (sphagnum)",
              "Mistura",
              "Não sei",
              "Outro",
            ]}
          />

          <SelectField
            label="Principal dificuldade"
            value={plant.difficulty}
            onChange={(v) => updatePlant({ difficulty: v }, actorId)}
            options={[
              "Não floresce",
              "Folhas caídas ou enrugadas",
              "Raízes fracas",
              "Manchas nas folhas",
              "Não sei o que fazer",
              "Outra",
            ]}
          />

          <Field label="Foto atual da planta">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-4 py-6 text-center transition-colors hover:border-primary/40">
              {plant.photo ? (
                <img
                  src={plant.photo}
                  alt="Sua orquídea"
                  className="max-h-48 rounded-lg object-cover"
                />
              ) : (
                <>
                  <Camera size={22} className="text-muted-foreground" />
                  <div className="text-sm font-medium text-foreground">Enviar foto</div>
                  <div className="text-xs text-muted-foreground">Salva apenas no seu navegador</div>
                </>
              )}
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
            </label>
            {plant.photo && (
              <button
                onClick={() => updatePlant({ photo: null }, actorId)}
                className="mt-2 text-xs text-muted-foreground underline"
              >
                Remover foto
              </button>
            )}
          </Field>
        </div>
        <div className="mt-8 pb-4">

        <button
          onClick={async () => {
            if (actorId !== "guest") {
              const { registerPlantRemote } = await import("@/lib/protocol-cloud");
              const { error } = await registerPlantRemote(actorId, {
                plant_name: plant.name,
                plant_species: plant.species,
                plant_unknown_species: plant.unknownSpecies,
                plant_location: plant.location,
                plant_pot: plant.pot,
                plant_substrate: plant.substrate,
                plant_difficulty: plant.difficulty,
              });
              if (error) {
                console.error("Erro ao registrar planta:", error);
                alert("Erro ao salvar dados da orquídea. Tente novamente.");
                return;
              }
            }
            onNext();
          }}
          disabled={!canSave}
          className="mt-8 w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          Salvar e fazer diagnóstico
        </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-card px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Selecione…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

function StepHeader({
  step,
  total,
  title,
  subtitle,
}: {
  step: number;
  total: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-accent">
        Passo {step} de {total}
      </div>
      <h1 className="mt-1 text-2xl font-display tracking-tight text-primary">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/* ---------------- Diagnosis ---------------- */

const DIAG_CATEGORIES: Array<{ key: DiagnosisCategory; icon: ReactNode }> = [
  { key: "roots", icon: <Sprout size={18} /> },
  { key: "leaves", icon: <Leaf size={18} /> },
  { key: "environment", icon: <Sun size={18} /> },
  { key: "potAndSubstrate", icon: <FlowerIcon size={18} /> },
  { key: "wateringAndRoutine", icon: <Droplets size={18} /> },
];

function DiagnosisScreen({ actorId, onFinish, onBack }: { actorId: string; onFinish: () => void; onBack: () => void }) {
  const { state, toggleDiagnosis, clearSaveError } = useProtocolStore();

  const [stepIdx, setStepIdx] = useState(0);
  const total = DIAG_CATEGORIES.length;
  const current = DIAG_CATEGORIES[stepIdx];
  const options = DIAGNOSIS_OPTIONS[current.key];
  const selected = state.diagnosis[current.key];
  const isLast = stepIdx === total - 1;

  return (
    <div className="min-h-screen overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col px-5 py-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:shadow-[0_15px_50px_-30px_rgba(23,61,50,0.25)]">
        <StepHeader
          step={2}
          total={3}
          title="Diagnóstico guiado"
          subtitle="Marque tudo que você observa na sua orquídea."
        />

        <ProgressBar value={((stepIdx + 1) / total) * 100} className="mt-4" />
        {state.saveError && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-3 py-2.5 text-sm text-accent"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{state.saveError}</span>
            <button
              type="button"
              onClick={clearSaveError}
              aria-label="Fechar aviso"
              className="rounded-full p-1 text-accent hover:bg-accent/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Etapas do diagnóstico">
          {DIAG_CATEGORIES.map((c, i) => (
            <span
              key={c.key}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                i < stepIdx
                  ? "bg-primary/10 text-primary"
                  : i === stepIdx
                    ? "bg-accent/15 text-accent"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {CATEGORY_LABEL[c.key]}
            </span>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 text-primary">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary">
              {current.icon}
            </span>
            <h2 className="text-xl font-bold">{CATEGORY_LABEL[current.key]}</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Selecione todas as alternativas que descrevem sua observação atual.
          </p>
          <div
            className="mt-4 grid gap-2"
            role="group"
            aria-label={`Alternativas de ${CATEGORY_LABEL[current.key]}`}
          >
            {options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleDiagnosis(current.key, opt, actorId)}
                  aria-pressed={active}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left text-[15px] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="pr-3">{opt}</span>
                  {active ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <InfoCard tone="lilac" icon={<Info size={16} />}>
          Um sinal isolado não fecha um diagnóstico. Estas escolhas orientam a observação nos
          próximos dias.
        </InfoCard>

        <div className="mt-auto pt-8 flex gap-2 pb-4">
          <button
            onClick={() => (stepIdx === 0 ? onBack() : setStepIdx((i) => i - 1))}
            className="flex items-center gap-1 rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft size={16} /> Voltar
          </button>
          <button
            onClick={() => (isLast ? onFinish() : setStepIdx((i) => i + 1))}
            className="ml-auto flex items-center gap-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isLast ? "Ver resultado" : "Próxima etapa"}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Diagnosis Result Screen ---------------- */

function DiagnosisResultScreen({ actorId, onBack, onFinish }: { actorId: string; onBack: () => void; onFinish: () => void }) {
  const { state } = useProtocolStore();
  const observations = totalObservations(state.diagnosis);
  const current = isDiagnosisCurrent(state);
  const result = state.diagnosisResult;

  return (
    <div className="min-h-screen overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col px-5 py-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:shadow-[0_15px_50px_-30px_rgba(23,61,50,0.25)]">
        <StepHeader
          step={3}
          total={3}
          title="Seu resultado personalizado"
          subtitle={
            state.plant.name
              ? `Baseado nas suas observações sobre “${state.plant.name}”.`
              : "Baseado nas suas observações de hoje."
          }
        />
        <div className="mt-3 text-xs text-muted-foreground">
          {observations} {observations === 1 ? "sinal observado" : "sinais observados"}. Este
          resultado orienta o acompanhamento — não é um diagnóstico definitivo.
        </div>

        {result ? (
          <div className="space-y-4">
            {!current && (
              <InfoCard tone="warn" icon={<AlertTriangle size={16} />}>
                As respostas foram alteradas. Este resultado pode estar desatualizado, mas você ainda pode visualizá-lo abaixo.
              </InfoCard>
            )}
            <ResultBlocks result={result} />
          </div>
        ) : (
          <div className="mt-5">
            <InfoCard tone="lilac" icon={<Info size={16} />}>
              O resultado está sendo preparado. Revise as respostas e toque em “Ver resultado” para
              gerar as orientações personalizadas.
            </InfoCard>
          </div>
        )}

        <div className="mt-auto pt-8 flex gap-2 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft size={16} /> Revisar respostas
          </button>
          {result && (
            <button
              onClick={onFinish}
              className="ml-auto flex items-center gap-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ir para meu plano <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultBlocks({
  result,
}: {
  result: {
    priorities: DiagnosisGuidance[];
    adjustments: DiagnosisGuidance[];
    favorable: DiagnosisGuidance[];
    insufficientInformation: DiagnosisGuidance[];
    trackingPoints: string[];
  };
}) {
  const { priorities, adjustments, favorable, insufficientInformation, trackingPoints } = result;
  const hasAny =
    priorities.length + adjustments.length + favorable.length + insufficientInformation.length > 0;
  return (
    <div className="mt-5 space-y-3">
      {!hasAny && (
        <InfoCard tone="lilac" icon={<Info size={16} />}>
          Ainda há poucas informações registradas. Use os pontos abaixo como roteiro de observação
          para completar o diagnóstico com mais segurança.
        </InfoCard>
      )}
      {priorities.length > 0 && (
        <ResultSection title="Pontos que merecem atenção próxima" tone="warn" items={priorities} />
      )}
      {adjustments.length > 0 && (
        <ResultSection title="Ajustes recomendados" tone="accent" items={adjustments} />
      )}
      {favorable.length > 0 && (
        <ResultSection title="Sinais favoráveis" tone="green" items={favorable} />
      )}
      {insufficientInformation.length > 0 && (
        <ResultSection title="Ainda não observado" tone="muted" items={insufficientInformation} />
      )}
      {trackingPoints.length > 0 && (
        <div className="rounded-2xl border border-border bg-secondary/50 p-4">
          <div className="text-sm font-bold text-primary">Pontos para acompanhar</div>
          <ul className="mt-2 space-y-1.5">
            {trackingPoints.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-secondary-foreground/90">
                <ChevronRight size={16} className="mt-0.5 shrink-0 text-primary" /> {p}
              </li>
            ))}
          </ul>
        </div>
      )}
      <InfoCard tone="lilac" icon={<Info size={16} />}>
        Um sinal isolado não fecha um diagnóstico. Utilize estas orientações como apoio à
        observação.
      </InfoCard>
    </div>
  );
}

function ResultSection({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "warn" | "accent" | "green" | "muted";
  items: DiagnosisGuidance[];
}) {
  const toneCls =
    tone === "warn"
      ? "border-accent/40 bg-accent/5"
      : tone === "accent"
        ? "border-primary/20 bg-lilac/40"
        : tone === "green"
          ? "border-primary/20 bg-secondary/40"
          : "border-border bg-card";
  return (
    <section className={`rounded-2xl border p-4 ${toneCls}`}>
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      <ul className="mt-3 space-y-3">
        {items.map((g) => (
          <li key={g.id} className="rounded-xl bg-card/70 p-3 border border-border/60">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABEL[g.category]} · {g.answer}
            </div>
            <div className="mt-1 text-sm font-bold text-primary">{g.title}</div>
            <p className="mt-1 text-sm text-foreground/85">{g.explanation}</p>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-primary">O que fazer: </span>
              <span className="text-foreground/90">{g.action}</span>
            </p>
            {g.avoid && (
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-semibold">Evite: </span>
                {g.avoid}
              </p>
            )}
            {g.tracking.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-semibold">Acompanhe: </span>
                {g.tracking.join(" · ")}
              </p>
            )}
            {g.warning && (
              <div className="mt-2 flex gap-1.5 rounded-lg bg-accent/10 p-2 text-xs text-accent">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{g.warning}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProgressBar({ value, className = "", color = "bg-primary" }: { value: number; className?: string; color?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

function InfoCard({
  tone,
  icon,
  children,
}: {
  tone: "lilac" | "warn" | "green";
  icon: ReactNode;
  children: ReactNode;
}) {
  const styles =
    tone === "warn"
      ? "border-accent/40 bg-accent/10 text-accent"
      : tone === "lilac"
        ? "border-lilac bg-lilac/60 text-lilac-foreground"
        : "border-border bg-secondary text-secondary-foreground";
  return (
    <div className={`flex gap-2 rounded-2xl border p-3.5 text-sm leading-relaxed ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

/* ---------------- Início ---------------- */

function InicioTab({ actorId, setTab, setStatus }: { actorId: string; setTab: (t: Tab) => void; setStatus: (s: AuthBootstrapStatus) => void }) {
  const planTitleRef = useRef<HTMLDivElement>(null);

  const handleRedirectToPlan = () => {
    setTab("plano");
    toast.success("Abrindo seu plano de 21 dias", {
      description: "Confira as tarefas para hoje.",
      duration: 3000,
    });
    // O foco e scroll serão tratados pelo useEffect na PlanoTab
  };

  const { state, setCurrentDay } = useProtocolStore();
  const day = state.currentDay;
  const phase = phaseOf(day);
  const isApplicationDay = APPLICATION_DAYS.includes(day);
  const trackingPoints = state.diagnosisResult?.trackingPoints ?? [];
  const diagnosisFresh = isDiagnosisCurrent(state);

  const completedDays = Object.values(state.days).filter((d) => d.completed).length;
  const totalApplications = state.applications.length;
  const totalNotes = Object.values(state.days).filter((d) => d.note?.trim()).length;
  const totalPhotos = Object.values(state.days).filter((d) => d.photo).length;

  return (
    <div className="space-y-4">
      {isApplicationDay && (
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Dia de aplicação</span>
          </div>
          <h2 className="mt-2 text-xl font-display text-primary">
            Hoje é dia de aplicar o Método de 2 Passos
          </h2>
          <p className="mt-1 text-sm text-primary/80">
            Enraizar primeiro, depois nutrir. Prefira horário fresco e evite sol forte.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => setStatus("needs_diagnosis")}
              className="flex items-center justify-center gap-2 rounded-full border-2 border-primary/30 bg-primary/10 px-6 py-3.5 text-sm font-bold text-primary transition-all hover:bg-primary/20 active:scale-[0.98] sm:py-3"
            >
              <Stethoscope size={18} /> Fazer diagnóstico
            </button>
            <button
              onClick={handleRedirectToPlan}
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
            >
              Registrar aplicação
            </button>
          </div>
        </div>
      )}

      <div 
        onClick={handleRedirectToPlan}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-plantae-cream/40 p-5 transition-all hover:border-primary/30 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-card transition-transform group-hover:scale-105">
            {state.plant.photo ? (
              <img
                src={state.plant.photo}
                alt={state.plant.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Flower2 size={22} className="text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold text-primary">
              {state.plant.name || "Sua orquídea"}
            </div>
            <div className="text-xs text-muted-foreground">{phase.label}</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-primary">
            <div className="text-sm font-medium">Progresso do plano</div>
            <div className="text-sm font-bold">Dia {day} de 21</div>
          </div>
          <ProgressBar 
            className="mt-2" 
            value={(day / 21) * 100} 
            color={day <= 7 ? "bg-primary" : day <= 14 ? "bg-[#D946EF]" : "bg-accent"} 
          />
        </div>

        <div className="mt-4 border-t border-border/50 pt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRedirectToPlan();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
          >
            Ir para o Plano <ChevronRight size={14} />
          </button>
        </div>
      </div>
      {!isApplicationDay && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">
            Tarefa do dia
          </div>
          <h2 className="mt-1 text-lg font-display text-foreground">{getProtocolDay(day).title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{getProtocolDay(day).objective}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setStatus("needs_diagnosis")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary/30 bg-primary/10 px-6 py-3.5 text-sm font-bold text-primary transition-all hover:bg-primary/20 active:scale-[0.98] sm:w-auto sm:py-3"
            >
              <Stethoscope size={18} /> Fazer diagnóstico
            </button>
          </div>
        </div>
      )}

      {/* Resumo da Jornada */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">Sua jornada até aqui</h3>
            <p className="text-[10px] text-muted-foreground">Progresso consolidado</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatCard label="Dias concluídos" value={`${completedDays}/21`} icon={<CalendarCheck size={14} />} />
          <StatCard label="Aplicações" value={totalApplications} icon={<Droplets size={14} />} />
          <StatCard label="Observações" value={totalNotes} icon={<BookOpen size={14} />} />
          <StatCard label="Fotos" value={totalPhotos} icon={<Images size={14} />} />
        </div>
      </div>

      {/* Linha do Tempo */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-primary">Linha do Tempo</h3>
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">21 dias</div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((weekNum) => {
            const weekDays = [1, 2, 3, 4, 5, 6, 7].map(d => (weekNum - 1) * 7 + d);
            const weekCompleted = weekDays.filter(d => state.days[d]?.completed).length;
            const weekPhaseColor = weekNum === 1 ? "bg-primary" : weekNum === 2 ? "bg-[#D946EF]" : "bg-accent";
            
            return (
              <div key={weekNum} className="relative pl-6">
                <div className="absolute left-0 top-1 h-full w-px bg-border/60" />
                <div className={`absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full ${weekPhaseColor}`} />
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Semana {weekNum}
                  </span>
                  <span className="text-[10px] font-medium text-primary">
                    {weekCompleted}/7 concluídos
                  </span>
                </div>
                
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {weekDays.map(d => (
                    <div 
                      key={d} 
                      className={`h-1.5 rounded-full transition-colors ${state.days[d]?.completed ? weekPhaseColor : 'bg-secondary/60'}`}
                      title={`Dia ${d}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-primary">Próximos marcos</div>
          <button
            onClick={() => setTab("plano")}
            className="text-xs font-medium text-accent hover:underline"
          >
            Ver todos
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 21].map((d) => (
            <button
              key={d}
              onClick={() => {
                setCurrentDay(d, actorId);
                setTab("plano");
              }}
              className="rounded-xl border border-border bg-secondary/40 p-3 text-left transition-colors hover:border-primary/40"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                {d === 7 ? "1ª avaliação" : d === 14 ? "Intermediária" : "Final"}
              </div>
              <div className="mt-1 text-base font-display text-primary">Dia {d}</div>
            </button>
          ))}
        </div>
      </div>

      <InfoCard tone="warn" icon={<AlertTriangle size={16} />}>
        Aplique no horário fresco, evite sol forte e não atinja diretamente as flores.
      </InfoCard>

      {diagnosisFresh && trackingPoints.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-secondary/40 p-5">
          <div className="flex items-center gap-2 text-primary">
            <Info size={16} />
            <div className="text-sm font-bold">Pontos do seu diagnóstico para acompanhar</div>
          </div>
          <ul className="mt-3 space-y-1.5">
            {trackingPoints.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-foreground/85">
                <ChevronRight size={16} className="mt-0.5 shrink-0 text-primary" /> {p}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setTab("diagnostico")}
            className="mt-3 text-xs font-semibold text-accent hover:underline"
          >
            Ver diagnóstico completo
          </button>
        </div>
      )}

      {!diagnosisFresh && (
        <div className="group relative overflow-hidden rounded-2xl border border-accent/20 bg-accent/5 p-6 shadow-sm transition-all hover:shadow-md">
          {/* Decorative element */}
          <div className="absolute -right-4 -top-4 text-accent/10 transition-transform group-hover:scale-110">
            <Stethoscope size={80} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={18} className="animate-pulse" />
              <div className="font-display text-lg font-bold">Diagnóstico Opcional</div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-primary/80">
              Para receber orientações específicas para a sua planta, complete o diagnóstico opcional.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                onClick={() => setStatus("needs_diagnosis")}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Fazer diagnóstico <ChevronRight size={16} />
              </button>
              <div className="flex items-center justify-center gap-4 text-[10px] font-bold tracking-widest text-accent/60 uppercase">
                <span className="flex items-center gap-1"><CheckCircle2 size={10} /> 5 Áreas</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={10} /> 2 Minutos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {diagnosisFresh && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Stethoscope size={16} />
              </div>
              <div className="text-sm font-bold text-primary">Diagnóstico Concluído</div>
            </div>
            <button
              onClick={() => setStatus("needs_diagnosis")}
              className="text-xs font-medium text-muted-foreground hover:text-accent hover:underline"
            >
              Refazer
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Seu exame está atualizado. Você pode revisar os detalhes ou atualizar o estado da sua planta a qualquer momento.
          </p>
          <button
            onClick={() => setTab("diagnostico")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            Ver detalhes <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <CalendarCheck size={16} className="text-accent" />
          Acesso Rápido ao Protocolo
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Consulte as tarefas e orientações de dias específicos do plano de 21 dias.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 7, 14, 21].map((d) => (
            <button
              key={d}
              onClick={() => {
                setCurrentDay(d, actorId);
                setTab("plano");
                toast.info(`Navegando para o Dia ${d}`);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-muted active:scale-95"
            >
              Dia {d}
              <ChevronRight size={12} className="text-muted-foreground/40" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => setTab("resumo")}
          className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left transition-all hover:bg-primary/10 sm:col-span-2"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary">
            <FileText size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-primary">Resumo & PDF</div>
            <div className="text-[10px] text-muted-foreground">Exportar meu progresso</div>
          </div>
          <ChevronRight size={16} className="text-primary/40" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Plano ---------------- */

type PlanoTabProps = {
  actorId: string;
  setTab: (tab: Tab) => void;
};


function PlanoTab({ actorId, setTab }: PlanoTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  useEffect(() => {
    // Ao entrar na aba plano via redirecionamento (ou tab change), foca no topo
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    
    // Melhora a acessibilidade movendo o foco para o título da aba
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  const { state, setCurrentDay, updateDay, toggleChecklist, toggleDayCompleted } =
    useProtocolStore();

  const day = state.currentDay;
  const [showMethod, setShowMethod] = useState(false);
  const meta = getProtocolDay(day);
  const entry = state.days[day] ?? { checklist: {}, note: "", completed: false };
  const isApplication = APPLICATION_DAYS.includes(day);
  const trackingPoints = state.diagnosisResult?.trackingPoints ?? [];
  const diagnosisFresh = isDiagnosisCurrent(state);

  const week = useMemo(() => getWeekForDay(day), [day]);
  const activeWeek = WEEKS.find((w) => w.id === week) ?? WEEKS[0];

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="absolute -right-4 -top-4 opacity-[0.08] text-primary rotate-12">
          <Flower2 size={120} />
        </div>
        <div className="relative z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">Meu plano</div>
          <motion.h1 
            ref={titleRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              opacity: { duration: 0.4 },
              y: { duration: 0.4 },
              scale: { duration: 0.6, delay: 0.2, ease: "easeOut" }
            }}
            className="text-2xl font-display tracking-tight text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg"
          >
            Plano de 21 dias
          </motion.h1>
        </div>
      </div>


      <WeekPicker
        currentWeek={week}
        onSelect={(w) => {
          const firstDay = w === 1 ? 1 : w === 2 ? 8 : 15;
          setCurrentDay(firstDay, actorId);
        }}
        currentDay={day}
        onSelectDay={(d) => setCurrentDay(d, actorId)}
        weekDays={activeWeek.days}
      />

      {!diagnosisFresh && day === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-6 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Stethoscope size={24} />
          </div>
          <h3 className="font-display text-lg text-primary">Personalize seu plano</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            O diagnóstico ajuda a identificar as necessidades específicas da sua orquídea hoje.
          </p>
          <button
            onClick={() => setTab("diagnostico")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-95"
          >
            Fazer diagnóstico agora
            <ChevronRight size={16} />
          </button>
        </motion.div>
      )}

      {meta.stages && meta.stages.length > 0 ? (
        <DayHeaderCard meta={meta} />
      ) : (
        <DayContentCard
          meta={meta}
          entry={entry}
          onToggleChecklist={(item) => toggleChecklist(day, item, actorId)}
          onUpdate={(patch) => updateDay(day, patch, actorId)}
          diagnosisFresh={diagnosisFresh}
          trackingPoints={trackingPoints}
        />
      )}

      {meta.stages && meta.stages.length > 0 && (
        <StagesList day={day} meta={meta} onOpenMethod={() => setShowMethod(true)} />
      )}

      {isApplication && day !== 1 && (
        <button
          onClick={() => setShowMethod(true)}
          className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Abrir Método de 2 Passos
        </button>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-2">
          {meta.checklist.map((item) => {
            const checked = !!entry.checklist[item];
            return (
              <button
                key={item}
                onClick={() => toggleChecklist(day, item, actorId)}
                aria-pressed={checked}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  checked
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {checked ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <Circle size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">{item}</span>
              </button>
            );
          })}
        </div>

        <RegisterField meta={meta} entry={entry} onChange={(note) => updateDay(day, { note }, actorId)} />

        <button
          onClick={() => toggleDayCompleted(day, actorId)}
          aria-pressed={entry.completed}
          className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            entry.completed
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {entry.completed ? "Tarefa concluída ✓ · Desmarcar" : "Concluir tarefa"}
        </button>

        {entry.completed && (
          <div className="mt-3 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => setTab("inicio")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-3 text-[12px] font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <Home size={14} />
              Início
            </button>
            <button
              onClick={() => setTab("diagnostico")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-accent/20 bg-accent/5 py-3 text-[12px] font-bold text-accent transition-colors hover:bg-accent/10"
            >
              <Stethoscope size={14} />
              Diagnóstico
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (day > 1) {
                  setCurrentDay(day - 1, actorId);
                }
              }}
              disabled={day === 1}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 py-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft size={13} />
              Dia Anterior
            </button>
            <button
              onClick={() => {
                const lastCompleted = Object.entries(state.days)
                  .filter(([_, d]) => d.completed)
                  .map(([day, _]) => parseInt(day))
                  .sort((a, b) => b - a)[0];
                
                if (lastCompleted) {
                  setCurrentDay(lastCompleted, actorId);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 py-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <RefreshCw size={13} />
              Último Concluído
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab("inicio")}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 py-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <Home size={13} />
              Início
            </button>
            <button
              onClick={() => setTab("diagnostico")}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 py-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <Stethoscope size={13} />
              Diagnóstico
            </button>
          </div>
          <button
            onClick={() => setTab("diario")}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 py-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <Images size={13} />
            Ver Diário (Evolução)
          </button>
        </div>
      </div>

      {day === 21 && <FinalEvaluation actorId={actorId} />}

      {showMethod && <MethodDrawer actorId={actorId} day={day} onClose={() => setShowMethod(false)} />}

    </div>
  );
}

function WeekPicker({
  currentWeek,
  onSelect,
  currentDay,
  onSelectDay,
  weekDays,
}: {
  currentWeek: 1 | 2 | 3;
  onSelect: (w: 1 | 2 | 3) => void;
  currentDay: number;
  onSelectDay: (day: number) => void;
  weekDays: number[];
}) {
  const { state } = useProtocolStore();
  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Semanas do plano"
        className="grid grid-cols-3 gap-1.5 rounded-full border border-border bg-card p-1"
      >
        {WEEKS.map((w) => {
          const active = w.id === currentWeek;
          return (
            <button
              key={w.id}
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(w.id)}
              className={`min-h-[44px] rounded-full px-2 text-[12px] font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {w.label}
            </button>
          );
        })}
      </div>
      <div
        className="grid grid-cols-4 gap-2"
        role="group"
        aria-label={`Dias da semana ${currentWeek}`}
      >
        {weekDays.map((d) => {
          const active = d === currentDay;
          const isApp = APPLICATION_DAYS.includes(d);
          const isCompleted = state.days[d]?.completed;
          return (
            <button
              key={d}
              onClick={() => onSelectDay(d)}
              aria-current={active ? "step" : undefined}
              aria-label={`${isApp ? `Dia ${d}, dia de aplicação` : `Dia ${d}`}${isCompleted ? ", concluído" : ""}`}
              className={`relative min-h-[44px] rounded-xl border px-2 py-2 text-[13px] font-semibold transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : isCompleted 
                    ? "border-primary/20 bg-primary/5 text-primary/80"
                    : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              Dia {d}
              {isCompleted && (
                <div className={`absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[8px] text-primary-foreground shadow-sm ${active ? 'ring-1 ring-primary-foreground' : ''}`}>
                  ✓
                </div>
              )}
              {isApp && !isCompleted && (
                <span
                  aria-hidden
                  className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${
                    active ? "bg-accent-foreground" : "bg-accent"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayHeaderCard({ meta }: { meta: ProtocolDay }) {
  const phase = phaseOf(meta.day);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className="absolute -right-6 -top-6 opacity-[0.05] text-primary rotate-12">
        <Sprout size={100} />
      </div>
      <div className="relative z-10">
        <div className="text-xs font-semibold uppercase tracking-wider text-accent">
          {phase.range}
        </div>
        <h2 className="mt-1 text-lg font-display text-primary">
          Dia {meta.day} — {meta.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta.objective}</p>
        <p className="mt-2 text-sm text-foreground/85">{meta.mainAction}</p>
        {meta.tip && (
          <div className="mt-3 rounded-xl bg-secondary/60 px-3 py-2 text-sm text-secondary-foreground">
            <span className="font-semibold text-primary">Dica: </span>
            {meta.tip}
          </div>
        )}
      </div>
    </div>
  );
}

function DayContentCard({
  meta,
  entry,
  onToggleChecklist: _onToggleChecklist,
  onUpdate: _onUpdate,
  diagnosisFresh,
  trackingPoints,
}: {
  meta: ProtocolDay;
  entry: { checklist: Record<string, boolean>; note: string; completed: boolean };
  onToggleChecklist: (item: string) => void;
  onUpdate: (patch: { note?: string }) => void;
  diagnosisFresh: boolean;
  trackingPoints: string[];
}) {
  void entry;
  const tracking = diagnosisFresh ? trackingPoints.slice(0, 3) : [];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className="absolute -right-6 -top-6 opacity-[0.05] text-primary rotate-12">
        <Leaf size={100} />
      </div>
      <div className="relative z-10">
        <div className="text-xs font-semibold uppercase tracking-wider text-accent">
          {phaseOf(meta.day).range}
        </div>
        <h2 className="mt-1 text-lg font-display text-primary">
          Dia {meta.day} — {meta.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta.objective}</p>
        <p className="mt-2 text-sm text-foreground/85">{meta.mainAction}</p>
        {meta.tip && (
          <div className="mt-3 rounded-xl bg-secondary/60 px-3 py-2 text-sm text-secondary-foreground">
            <span className="font-semibold text-primary">Dica: </span>
            {meta.tip}
          </div>
        )}

        <DetailAccordions
          howTo={meta.howTo}
          observe={meta.observe}
          avoid={meta.avoid}
          registerText={meta.registerText}
          attention={meta.attention}
          personalizedTracking={meta.personalizedContext ? tracking : []}
          customObserveTitle={meta.observeTitle}
        />
      </div>
    </div>
  );
}

function StagesList({
  day,
  meta,
  onOpenMethod,
}: {
  day: number;
  meta: ProtocolDay;
  onOpenMethod: () => void;
}) {
  const stages = meta.stages ?? [];
  return (
    <Accordion
      type="multiple"
      defaultValue={stages.length > 0 ? [stages[0].id] : []}
      className="space-y-2"
    >
      {stages.map((stage, idx) => {
        const isApplicationStage = APPLICATION_DAYS.includes(day) && idx === stages.length - 1;
        return (
          <AccordionItem
            key={stage.id}
            value={stage.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <AccordionTrigger className="px-5 py-4 text-left text-[15px] font-semibold text-primary hover:no-underline">
              {stage.title}
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-0">
              <StageBody
                stage={stage}
                onOpenMethod={isApplicationStage ? onOpenMethod : undefined}
              />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function StageBody({ stage, onOpenMethod }: { stage: DayStage; onOpenMethod?: () => void }) {
  return (
    <div className="space-y-3 text-sm text-foreground/85">
      {stage.objective && <p className="text-sm text-muted-foreground">{stage.objective}</p>}
      {stage.mainAction && (
        <p className="text-sm text-foreground/85">
          <span className="font-semibold text-primary">O que fazer: </span>
          {stage.mainAction}
        </p>
      )}
      {stage.tip && (
        <div className="rounded-2xl bg-secondary/60 px-3 py-2 text-sm text-secondary-foreground">
          <span className="font-semibold text-primary">Dica: </span>
          {stage.tip}
        </div>
      )}
      <DetailAccordions
        howTo={stage.howTo}
        observe={stage.observe}
        avoid={stage.avoid}
        registerText={stage.registerText}
        attention={stage.attention}
        personalizedTracking={[]}
        customObserveTitle={(stage as any).observeTitle as string | undefined}
      />
      {onOpenMethod && (
        <button
          onClick={onOpenMethod}
          className="mt-2 w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Abrir Método de 2 Passos
        </button>
      )}
    </div>
  );
}

function DetailAccordions({
  howTo,
  observe,
  avoid,
  registerText,
  attention,
  personalizedTracking,
  customObserveTitle,
}: {
  howTo?: string[];
  observe?: string[];
  avoid?: string[];
  registerText?: string;
  attention?: string[];
  personalizedTracking: string[];
  customObserveTitle?: string;
}) {
  const sections: Array<{ id: string; title: string; content: ReactNode }> = [];

  if (howTo && howTo.length > 0) {
    sections.push({
      id: "como-fazer",
      title: "Como fazer",
      content: <BulletList items={howTo} />,
    });
  }
  if (observe && observe.length > 0) {
    sections.push({
      id: "observe",
      title: customObserveTitle || "Observe",
      content: <BulletList items={observe} />,
    });
  }
  if (avoid && avoid.length > 0) {
    sections.push({
      id: "evite",
      title: "Evite",
      content: <BulletList items={avoid} />,
    });
  }
  if (registerText) {
    sections.push({
      id: "registre",
      title: "Registre",
      content: <p className="text-sm text-foreground/85">{registerText}</p>,
    });
  }
  if (attention && attention.length > 0) {
    sections.push({
      id: "atencao",
      title: "Atenção",
      content: <BulletList items={attention} />,
    });
  }
  if (personalizedTracking.length > 0) {
    sections.push({
      id: "no-seu-caso",
      title: "No seu caso",
      content: <BulletList items={personalizedTracking} />,
    });
  }

  if (sections.length === 0) return null;

  return (
    <Accordion type="multiple" className="mt-3 space-y-2">
      {sections.map((s) => (
        <AccordionItem
          key={s.id}
          value={s.id}
          className="overflow-hidden rounded-2xl border border-border bg-background/40"
        >
          <AccordionTrigger className="px-4 py-3 text-[14px] font-semibold text-primary hover:no-underline">
            {s.title}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0">{s.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-foreground/85">
      {items.map((it, i) => (
        <li key={`${i}-${it.slice(0, 20)}`} className="flex gap-2">
          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="min-w-0 flex-1">{it}</span>
        </li>
      ))}
    </ul>
  );
}

function RegisterField({
  meta,
  entry,
  onChange,
}: {
  meta: ProtocolDay;
  entry: { note: string };
  onChange: (v: string) => void;
}) {
  const label = meta.recordPrompt || "Registre sua observação de hoje.";
  const options: RegisterOption[] | undefined = meta.registerOptions;
  const inputId = `note-day-${meta.day}`;

  return (
    <div className="mt-4 space-y-2">
      <label htmlFor={inputId} className="block text-[13px] font-semibold text-primary">
        {label}
      </label>
      {options && options.length > 0 && (
        <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const active = entry.note.startsWith(opt.label);
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  const rest = entry.note.replace(/^[^\n]*\n?/, "");
                  onChange(rest ? `${opt.label}\n${rest}` : opt.label);
                }}
                className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
      <textarea
        id={inputId}
        value={entry.note}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          options && options.length > 0 ? "Observação complementar (opcional)" : "Sua anotação"
        }
        rows={3}
        className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function MethodDrawer({ actorId, day, onClose }: { actorId: string; day: number; onClose: () => void }) {
  const { registerApplication, state } = useProtocolStore();

  const applicationsForDay = state.applications.filter((a) => a.day === day);
  const entry = state.days[day] ?? { checklist: {}, note: "", completed: false };
  const checklist = getProtocolDay(day).checklist;
  const allChecked = checklist.every((item) => !!entry.checklist[item]);
  const canRegister = !APPLICATION_DAYS.includes(day) || allChecked;

  return (
    <Drawer onClose={onClose} title="Método de 2 Passos">
      <p className="text-sm text-foreground/85">
        Realize o Método de 2 Passos uma vez por semana, preferencialmente nos horários mais frescos
        do dia. Os produtos são prontos para uso e não precisam de diluição.
      </p>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-border bg-secondary/50 p-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <Sprout size={18} strokeWidth={2.2} />
            <span className="text-base font-bold">Enraizar</span>
          </div>
          <p className="mt-2 text-sm text-secondary-foreground/90">
            Aplique primeiro o Enraizador nas raízes e no substrato. Distribua o produto de forma
            uniforme até umedecer levemente as áreas indicadas, sem escorrer e sem encharcar.
          </p>
          <div className="mt-2 text-[12px] font-semibold uppercase tracking-wider text-primary/80">
            Enraizador Forte 500 ml Pronto Uso
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-lilac/60 p-4">
          <div className="flex items-center gap-2 text-lilac-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              2
            </span>
            <Leaf size={18} strokeWidth={2.2} />
            <span className="text-base font-bold">Nutrir</span>
          </div>
          <p className="mt-2 text-sm text-lilac-foreground/90">
            Em seguida, aplique o Bokashi nas raízes, folhas e substrato. Distribua o produto de
            forma uniforme até umedecer levemente, sem escorrer e sem encharcar. Evite aplicar
            diretamente nas flores.
          </p>
          <div className="mt-2 text-[12px] font-semibold uppercase tracking-wider text-primary/80">
            Bokashi Orquídeas Premium 500 ml Pronto Uso
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} />
          <span className="font-semibold">Cuidados</span>
        </div>
        <ul className="mt-2 space-y-1 text-[13px] text-accent">
          <li>Não diluir</li>
          <li>Preferir horários mais frescos</li>
          <li>Não aplicar sob sol forte, especialmente entre 9h e 16h</li>
          <li>Evitar aplicação direta nas flores</li>
          <li>Não deixar o produto escorrer</li>
          <li>Não encharcar raízes ou substrato</li>
          <li>Não misturar com outros produtos durante a aplicação</li>
          <li>Não repetir a aplicação por engano</li>
        </ul>
      </div>

      {applicationsForDay.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-secondary-foreground">
          <div className="font-semibold text-primary">Histórico de aplicações no Dia {day}</div>
          <ul className="mt-1 space-y-0.5">
            {applicationsForDay.map((a) => (
              <li key={a.id}>
                {a.timestamp && !a.migrated
                  ? new Date(a.timestamp).toLocaleString("pt-BR")
                  : "Aplicação registrada na versão anterior"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {!canRegister && (
          <p className="text-center text-[11px] font-medium text-accent">
            Complete todo o checklist para liberar o registro.
          </p>
        )}
        <button
          disabled={!canRegister}
          onClick={() => {
            registerApplication(day, actorId);
            onClose();
          }}
          className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {applicationsForDay.length > 0
            ? "Registrar nova aplicação"
            : "Registrar aplicação concluída"}
        </button>
      </div>
    </Drawer>
  );
}

/* ---------------- Diagnóstico Tab ---------------- */

function DiagnosticoTab({ actorId, onRedo, setTab }: { actorId: string; onRedo: () => void; setTab: (tab: Tab) => void }) {
  const { state } = useProtocolStore();

  const items: Array<{ key: DiagnosisCategory; label: string; values: string[] }> = (
    Object.keys(CATEGORY_LABEL) as DiagnosisCategory[]
  ).map((k) => ({ key: k, label: CATEGORY_LABEL[k], values: state.diagnosis[k] }));
  const result = state.diagnosisResult;
  const current = isDiagnosisCurrent(state);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="absolute -right-4 -top-4 opacity-[0.08] text-primary rotate-12">
          <Stethoscope size={120} />
        </div>
        <div className="relative z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">Diagnóstico</div>
          <h1 className="text-2xl font-display tracking-tight text-primary">Sinais observados</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Este resumo orienta sua observação. Um sinal isolado não fecha um diagnóstico.
          </p>
        </div>
      </div>

      {result && !current && (
        <InfoCard tone="warn" icon={<AlertTriangle size={16} />}>
          Você editou respostas depois de gerar o resultado. Refaça o diagnóstico para atualizar as
          orientações.
        </InfoCard>
      )}

      {items.map((it) => (
        <div key={it.key} className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-bold text-primary">{it.label}</div>
          {it.values.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Nada marcado.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {it.values.map((v) => (
                <span
                  key={v}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {result && <ResultBlocks result={result} />}

      <div className="space-y-3">
        <button
          onClick={onRedo}
          className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          Refazer diagnóstico
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab("plano")}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-accent/20 bg-accent/5 py-3 text-[12px] font-bold text-accent transition-colors hover:bg-accent/10"
          >
            <CalendarCheck size={14} />
            Ver meu plano
          </button>
          <button
            onClick={() => {
              setTab("plano");
            }}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-primary/20 bg-primary/5 py-3 text-[12px] font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <Sparkles size={14} />
            Ver tarefa do dia
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Diário ---------------- */

function DiarioTab({ actorId }: { actorId: string }) {
  const { state, updateDay } = useProtocolStore();


  const handlePhoto = async (day: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      updateDay(day, { photo: dataUrl }, actorId);
    } catch {
      alert(PHOTO_ERROR_MESSAGE);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="absolute -right-4 -top-4 opacity-[0.08] text-primary rotate-12">
          <Images size={120} />
        </div>
        <div className="relative z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">
            Diário fotográfico
          </div>
          <h1 className="text-2xl font-display tracking-tight text-primary">Linha do tempo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre fotos e observações nos Dias 1, 7, 14 e 21.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {PHOTO_DAYS.map((d: number) => {
          const entry = state.days[d] ?? { checklist: {}, note: "", completed: false };
          return (
            <div key={d} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
              <div className="absolute -right-6 -top-6 opacity-[0.03] text-primary rotate-12">
                <Camera size={80} />
              </div>
              <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    {phaseOf(d).range}
                  </div>
                  <div className="text-lg font-bold text-primary">Dia {d}</div>
                </div>
                {entry.photo ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    Registrado
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Aguardando
                  </span>
                )}
              </div>

              <label className="mt-3 block cursor-pointer">
                {entry.photo ? (
                  <img
                    src={entry.photo}
                    alt={`Foto do dia ${d}`}
                    className="h-48 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-40 place-items-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-center">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Camera size={22} />
                      <span className="text-xs font-medium">Adicionar foto</span>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handlePhoto(d, e)}
                />
              </label>

              <input
                value={entry.photoCaption ?? ""}
                onChange={(e) => updateDay(d, { photoCaption: e.target.value }, actorId)}
                placeholder="Legenda"
                className="mt-3 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <FieldSmall
                  label="Raízes"
                  value={entry.roots ?? ""}
                  onChange={(v) => updateDay(d, { roots: v }, actorId)}
                />
                <FieldSmall
                  label="Folhas"
                  value={entry.leavesObs ?? ""}
                  onChange={(v) => updateDay(d, { leavesObs: v }, actorId)}
                />
                <FieldSmall
                  label="Brotos/hastes"
                  value={entry.shoots ?? ""}
                  onChange={(v) => updateDay(d, { shoots: v }, actorId)}
                />
                <FieldSmall
                  label="Observações"
                  value={entry.observations ?? ""}
                  onChange={(v) => updateDay(d, { observations: v }, actorId)}
                />
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldSmall({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

/* ---------------- Final Evaluation ---------------- */

function FinalEvaluation({ actorId }: { actorId: string }) {
  const { state, updateFinalEval } = useProtocolStore();

  const fe = state.finalEval;

  const paths: Array<{
    id: typeof fe.path;
    label: string;
    desc: string;
    tone: "green" | "lilac" | "accent" | "warn";
  }> = [
    {
      id: "evolved",
      label: "Apresentou evolução",
      desc: "Sinais claros de melhora nas raízes, folhas ou brotos.",
      tone: "green",
    },
    {
      id: "stable",
      label: "Está estável",
      desc: "Sem mudança clara. Continue observando e mantendo o cuidado.",
      tone: "lilac",
    },
    {
      id: "worsening",
      label: "Está piorando",
      desc: "Procure orientação especializada com um profissional.",
      tone: "warn",
    },
    {
      id: "healthy-no-bloom",
      label: "Saudável, mas não floresceu",
      desc: "Vigor bom, sem floração. Ajuste luz e ciclo natural.",
      tone: "accent",
    },
  ];

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-accent">Avaliação final</div>
      <h2 className="mt-1 text-lg font-bold text-primary">Comparação e reflexão</h2>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {PHOTO_DAYS.map((d: number) => {
          const p = state.days[d]?.photo;
          return (
            <div
              key={d}
              className="aspect-square overflow-hidden rounded-lg border border-border bg-muted/40"
            >
              {p ? (
                <img src={p} alt={`Dia ${d}`} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-[10px] font-semibold text-muted-foreground">
                  Dia {d}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {[
          { key: "improved", label: "O que melhorou?" },
          { key: "same", label: "O que permaneceu igual?" },
          { key: "attention", label: "O que ainda precisa de atenção?" },
          { key: "keep", label: "Qual cuidado será mantido?" },
        ].map((q) => (
          <label key={q.key} className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {q.label}
            </span>
            <textarea
              value={fe[q.key as keyof typeof fe] as string}
              onChange={(e) => updateFinalEval({ [q.key]: e.target.value } as Partial<typeof fe>, actorId)}
              rows={2}
              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 text-sm font-semibold text-primary">
          Como sua planta chegou ao Dia 21?
        </div>
        <div className="grid gap-2">
          {paths.map((p) => {
            const active = fe.path === p.id;
            return (
              <button
                key={p.id}
                onClick={() => updateFinalEval({ path: p.id }, actorId)}
                className={`rounded-2xl border p-3 text-left text-sm transition-colors ${
                  active
                    ? p.tone === "warn"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <div className="font-bold">{p.label}</div>
                <div className="mt-0.5 text-xs opacity-90">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {fe.path === "worsening" && (
        <div className="mt-3">
          <InfoCard tone="warn" icon={<AlertTriangle size={16} />}>
            Recomendamos buscar ajuda de um profissional em orquídeas. Sinais persistentes de
            deterioração pedem avaliação presencial.
          </InfoCard>
        </div>
      )}
    </div>
  );
}

/* ---------------- Aprender ---------------- */

const LIBRARY: Array<{ id: string; title: string; icon: ReactNode; body: string }> = [
  {
    id: "raizes",
    title: "Raízes",
    icon: <Sprout size={18} />,
    body: "Raízes saudáveis são firmes e esverdeadas quando úmidas. Pontas claras indicam crescimento. Raízes muito moles, escuras ou com mau cheiro pedem atenção imediata: revise rega, drenagem e substrato.",
  },
  {
    id: "rega",
    title: "Rega",
    icon: <Droplets size={18} />,
    body: "Prefira verificar a umidade antes de regar. Substrato encharcado sufoca raízes. Rega por calendário fixo costuma encharcar em dias frios e faltar em dias quentes.",
  },
  {
    id: "luz",
    title: "Luz",
    icon: <Sun size={18} />,
    body: "Orquídeas gostam de luz clara e indireta. Sol forte direto queima folhas. Falta de luz reduz vigor e dificulta floração.",
  },
  {
    id: "ventilacao",
    title: "Ventilação",
    icon: <Wind size={18} />,
    body: "Ar parado favorece fungos e apodrecimento. Um ambiente com ventilação suave contribui para raízes saudáveis e folhas firmes.",
  },
  {
    id: "vaso",
    title: "Vaso e drenagem",
    icon: <FlowerIcon size={18} />,
    body: "O vaso deve permitir passagem de ar e drenagem eficiente. Água acumulada é uma das principais causas de perda de raízes.",
  },
  {
    id: "substrato",
    title: "Substrato",
    icon: <Leaf size={18} />,
    body: "Substrato bom se mantém aerado, drena rápido e não vira uma massa compactada. Quando compacta, é hora de repor.",
  },
  {
    id: "erros",
    title: "Erros comuns",
    icon: <AlertTriangle size={18} />,
    body: "Regar por calendário fixo, misturar vários produtos, mudar de local com frequência e usar sol direto forte são erros que enfraquecem a planta.",
  },
  {
    id: "evolucao",
    title: "Sinais de evolução",
    icon: <Sparkles size={18} />,
    body: "Pontas verdes ou avermelhadas nas raízes, folhas mais firmes, brotos novos e hastes florais em desenvolvimento são bons indícios.",
  },
  {
    id: "faq",
    title: "Perguntas frequentes",
    icon: <Info size={18} />,
    body: "‘Vai florescer em 21 dias?’ — Não prometemos floração garantida. O plano cria condições favoráveis. ‘Posso usar em qualquer orquídea?’ — Foco em espécies comuns cultivadas em casa. Em dúvida, procure um profissional.",
  },
];

function AprenderTab() {
  const [open, setOpen] = useState<string | null>(null);
  const current = LIBRARY.find((l) => l.id === open);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.03] to-transparent p-8">
        <div className="absolute -right-8 -top-8 opacity-[0.05] text-primary rotate-12">
          <BookOpen size={160} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            <BookOpen size={12} /> Biblioteca de Cuidado
          </div>
          <h1 className="mt-4 font-display text-3xl leading-tight tracking-tight text-primary">
            Dicas & Guia <br />
            <span className="text-accent">Botânico</span>
          </h1>
          <p className="mt-3 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
            Fundamentos e orientações práticas para sua orquídea florescer.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {LIBRARY.map((l) => (
          <button
            key={l.id}
            onClick={() => setOpen(l.id)}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              {l.icon}
            </div>
            <div className="flex-1 pr-6">
              <div className="text-sm font-bold text-primary">{l.title}</div>
              <div className="text-[11px] text-muted-foreground line-clamp-1">{l.body}</div>
            </div>
            <ChevronRight size={16} className="absolute right-4 text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </button>
        ))}
      </div>

      {current && (
        <Drawer onClose={() => setOpen(null)} title={current.title} icon={current.icon}>
          <p className="text-base leading-relaxed text-foreground/90">{current.body}</p>
        </Drawer>
      )}
    </div>
  );
}

/* ---------------- Drawer & Modal ---------------- */

function Drawer({
  title,
  onClose,
  children,
  icon,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-plantae-green)]/40 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[440px] overflow-hidden rounded-t-[32px] border-t border-white/20 bg-[var(--color-plantae-cream)] shadow-2xl animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de arraste visual para mobile */}
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-primary/10 sm:hidden" />

        <div className="px-6 pb-8 pt-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              {icon && (
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-plantae-lilac)] text-[var(--color-plantae-green)]">
                  {icon}
                </div>
              )}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                  Biblioteca
                </div>
                <div className="font-display text-2xl font-normal text-[var(--color-plantae-green)]">{title}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/50 text-[var(--color-plantae-green)] transition-colors hover:bg-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative">
            <div className="absolute -left-2 top-0 h-4 w-1 rounded-full bg-accent" />
            <div className="pl-4">{children}</div>
          </div>

          <button
            onClick={onClose}
            className="mt-8 w-full rounded-full bg-[var(--color-plantae-green)] py-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-plantae-cream)] transition-transform active:scale-[0.98]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-primary/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl">
        <div className="text-lg font-bold text-primary">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ---------------- Resumo ---------------- */

function ResumoTab({ actorId }: { actorId: string }) {
  const { state } = useProtocolStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const completedDays = Object.values(state.days).filter((d) => d.completed).length;
  const totalApplications = state.applications.length;
  const totalNotes = Object.values(state.days).filter((d) => d.note?.trim()).length;
  const totalPhotos = Object.values(state.days).filter((d) => d.photo).length;

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(23, 61, 50); // #173D32
      doc.text("Relatório: Guia Prático Orquídeas Floridas", 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);
      doc.text(`Planta: ${state.plant.name || "Não informada"}`, 14, 37);

      // Summary Table
      autoTable(doc, {
        startY: 45,
        head: [["Métrica", "Valor"]],
        body: [
          ["Dias Concluídos", `${completedDays} de 21`],
          ["Aplicações Realizadas", totalApplications.toString()],
          ["Registros de Observação", totalNotes.toString()],
          ["Fotos Registradas", totalPhotos.toString()],
        ],
        theme: "striped",
        headStyles: { fillColor: [23, 61, 50] },
      });

      // Detailed Records
      const records = Object.entries(state.days)
        .filter(([_, d]) => d.completed || d.note?.trim())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([day, d]) => [
          `Dia ${day}`,
          d.completed ? "Sim" : "Não",
          d.note || "-",
          d.applicationDone ? "Realizada" : "-"
        ]);

      if (records.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(23, 61, 50);
        doc.text("Detalhamento por Dia", 14, (doc as any).lastAutoTable.finalY + 15);

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [["Dia", "Concluído", "Observação", "Aplicação"]],
          body: records,
          theme: "grid",
          headStyles: { fillColor: [217, 70, 239] }, // Accent color
        });
      }

      doc.save(`protocolo-orquidea-${state.plant.name || "resumo"}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-display text-xl text-primary">Resumo da Jornada</h2>
            <p className="text-xs text-muted-foreground">Visão geral do seu progresso de 21 dias.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard label="Dias concluídos" value={`${completedDays}/21`} icon={<CalendarCheck size={16} />} />
          <StatCard label="Aplicações" value={totalApplications} icon={<Droplets size={16} />} />
          <StatCard label="Observações" value={totalNotes} icon={<BookOpen size={16} />} />
          <StatCard label="Fotos" value={totalPhotos} icon={<Images size={16} />} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-bold text-primary">Exportar Dados</h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Gere um arquivo PDF completo com todos os seus registros, observações e progresso para arquivar ou compartilhar.
        </p>
        
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download size={18} />
              Baixar Relatório em PDF
            </>
          )}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-bold text-primary">Linha do Tempo</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((weekNum) => {
            const weekDays = [1, 2, 3, 4, 5, 6, 7].map(d => (weekNum - 1) * 7 + d);
            const weekCompleted = weekDays.filter(d => state.days[d]?.completed).length;
            
            return (
              <div key={weekNum} className="relative pl-6">
                <div className="absolute left-0 top-1 h-full w-px bg-border" />
                <div className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Semana {weekNum}
                  </span>
                  <span className="text-[10px] font-medium text-accent">
                    {weekCompleted}/7 concluídos
                  </span>
                </div>
                
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {weekDays.map(d => (
                    <div 
                      key={d} 
                      className={`h-1.5 rounded-full ${state.days[d]?.completed ? 'bg-primary' : 'bg-secondary'}`}
                      title={`Dia ${d}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1 text-xl font-display text-primary">{value}</div>
    </div>
  );
}

// Unused imports guard: reference to keep certain icons in bundle for clarity/future.
export const _icons = { Plus };
