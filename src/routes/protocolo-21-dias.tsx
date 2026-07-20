import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode, type ChangeEvent } from "react";
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
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useProtocolStore, isDiagnosisCurrent } from "@/lib/protocol-store";
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

type Tab = "inicio" | "plano" | "diagnostico" | "diario" | "aprender";

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
  const [tab, setTab] = useState<Tab>("inicio");
  const [guestMode, setGuestMode] = useState(false);
  const [screen, setScreen] = useState<
    "welcome" | "signup" | "diagnosis" | "result" | "app" | null
  >(null);
  const [showReset, setShowReset] = useState(false);

  // Resolve which screen we're on:
  // If not onboarded, show welcome -> signup -> diagnosis flow gated by explicit screen state.
  const activeScreen = screen ?? (store.state.onboarded || guestMode ? "app" : "welcome");

  if (!store.hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando…</div>
      </div>
    );
  }

  if (activeScreen === "welcome") {
    return (
      <WelcomeScreen
        onStart={() => setScreen("signup")}
        onExplore={() => {
          setGuestMode(true);
          setScreen("app");
          setTab("aprender");
        }}
      />
    );
  }
  if (activeScreen === "signup") {
    return <SignupScreen onNext={() => setScreen("diagnosis")} />;
  }
  if (activeScreen === "diagnosis") {
    return (
      <DiagnosisScreen
        onBack={() => setScreen("signup")}
        onFinish={() => {
          const persistResult = store.saveDiagnosisResult();
          if (persistResult.ok) {
            setScreen("result");
          }
        }}
      />
    );
  }
  if (activeScreen === "result") {
    return (
      <DiagnosisResultScreen
        onBack={() => setScreen("diagnosis")}
        onFinish={() => {
          store.setOnboarded(true);
          setScreen("app");
          setTab("inicio");
        }}
      />
    );
  }

  return (
    <AppShell tab={tab} setTab={setTab} onReset={() => setShowReset(true)}>
      {tab === "inicio" && <InicioTab setTab={setTab} />}
      {tab === "plano" && <PlanoTab setTab={setTab} />}
      {tab === "diagnostico" && (
        <DiagnosticoTab onRedo={() => setScreen("diagnosis")} setTab={setTab} />
      )}
      {tab === "diario" && <DiarioTab />}
      {tab === "aprender" && <AprenderTab />}
      {showReset && (
        <ConfirmModal
          title="Reiniciar meu plano?"
          description="Isso apagará cadastro, diagnóstico, checklists, fotos e anotações salvas no seu navegador."
          confirmLabel="Reiniciar meu plano"
          onCancel={() => setShowReset(false)}
          onConfirm={() => {
            store.reset();
            setShowReset(false);
            setScreen("welcome");
          }}
        />
      )}
    </AppShell>
  );
}

/* ---------------- Shell ---------------- */

function AppShell({
  tab,
  setTab,
  onReset,
  children,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onReset: () => void;
  children: ReactNode;
}) {
  const { state, clearSaveError } = useProtocolStore();
  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col shadow-[0_30px_90px_-20px_rgba(23,61,50,0.2)] sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:rounded-2xl sm:border sm:border-border sm:bg-card">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:rounded-t-2xl">
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

        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">{children}</main>

        <nav className="sticky bottom-0 z-20 border-t border-border bg-card sm:rounded-b-2xl">
          <div className="grid grid-cols-5">
            <TabBtn
              active={tab === "inicio"}
              onClick={() => setTab("inicio")}
              icon={<Home size={18} />}
              label="Início"
            />
            <TabBtn
              active={tab === "plano"}
              onClick={() => setTab("plano")}
              icon={<CalendarCheck size={18} />}
              label="Meu plano"
            />
            <TabBtn
              active={tab === "diagnostico"}
              onClick={() => setTab("diagnostico")}
              icon={<Stethoscope size={18} />}
              label="Diagnóstico"
            />
            <TabBtn
              active={tab === "diario"}
              onClick={() => setTab("diario")}
              icon={<Images size={18} />}
              label="Diário"
            />
            <TabBtn
              active={tab === "aprender"}
              onClick={() => setTab("aprender")}
              icon={<BookOpen size={18} />}
              label="Aprender"
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
      className={`flex flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg transition-all ${
          active ? "bg-primary text-primary-foreground shadow-sm scale-105" : ""
        }`}
      >
        {icon}
      </span>
      {label}
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

/* ---------------- Signup ---------------- */

function SignupScreen({ onNext }: { onNext: () => void }) {
  const { state, updatePlant } = useProtocolStore();
  const plant = state.plant;

  const handlePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      updatePlant({ photo: dataUrl });
    } catch {
      alert(PHOTO_ERROR_MESSAGE);
    }
  };

  const canSave = plant.name.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-[440px] px-5 py-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:shadow-[0_15px_50px_-30px_rgba(23,61,50,0.25)]">
        <StepHeader
          step={1}
          total={3}
          title="Cadastro da orquídea"
          subtitle="Conte um pouco sobre sua planta."
        />

        <div className="mt-6 space-y-5">
          <Field label="Nome da planta *">
            <input
              value={plant.name}
              onChange={(e) => updatePlant({ name: e.target.value })}
              placeholder="Ex.: Minha Phalaenopsis"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <Field label="Espécie (opcional)">
            <input
              value={plant.species}
              onChange={(e) => updatePlant({ species: e.target.value, unknownSpecies: false })}
              disabled={plant.unknownSpecies}
              placeholder="Ex.: Phalaenopsis, Cattleya…"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={plant.unknownSpecies}
                onChange={(e) =>
                  updatePlant({
                    unknownSpecies: e.target.checked,
                    species: e.target.checked ? "" : plant.species,
                  })
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Não sei a espécie
            </label>
          </Field>

          <SelectField
            label="Local de cultivo"
            value={plant.location}
            onChange={(v) => updatePlant({ location: v })}
            options={["Varanda", "Janela interna", "Jardim externo", "Estufa", "Outro"]}
          />

          <SelectField
            label="Tipo de vaso"
            value={plant.pot}
            onChange={(v) => updatePlant({ pot: v })}
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
            onChange={(v) => updatePlant({ substrate: v })}
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
            onChange={(v) => updatePlant({ difficulty: v })}
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
                onClick={() => updatePlant({ photo: null })}
                className="mt-2 text-xs text-muted-foreground underline"
              >
                Remover foto
              </button>
            )}
          </Field>
        </div>

        <button
          onClick={onNext}
          disabled={!canSave}
          className="mt-8 w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          Salvar e fazer diagnóstico
        </button>
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

function DiagnosisScreen({ onFinish, onBack }: { onFinish: () => void; onBack: () => void }) {
  const { state, toggleDiagnosis, clearSaveError } = useProtocolStore();
  const [stepIdx, setStepIdx] = useState(0);
  const total = DIAG_CATEGORIES.length;
  const current = DIAG_CATEGORIES[stepIdx];
  const options = DIAGNOSIS_OPTIONS[current.key];
  const selected = state.diagnosis[current.key];
  const isLast = stepIdx === total - 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-[440px] px-5 py-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:shadow-[0_15px_50px_-30px_rgba(23,61,50,0.25)]">
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
                  onClick={() => toggleDiagnosis(current.key, opt)}
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

        <div className="mt-6 flex gap-2">
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

function DiagnosisResultScreen({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
  const { state } = useProtocolStore();
  const observations = totalObservations(state.diagnosis);
  const current = isDiagnosisCurrent(state);
  const result = current ? state.diagnosisResult : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-[440px] px-5 py-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:shadow-[0_15px_50px_-30px_rgba(23,61,50,0.25)]">
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

        {current && result ? (
          <ResultBlocks result={result} />
        ) : (
          <InfoCard tone="warn" icon={<AlertTriangle size={16} />}>
            Este resultado não está atualizado. Revise as respostas e gere o diagnóstico novamente.
          </InfoCard>
        )}

        <div className="mt-6 flex gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft size={16} /> Revisar respostas
          </button>
          {current && (
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
          Nenhuma alternativa foi marcada. Volte e selecione o que você observa para receber
          orientações personalizadas.
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

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
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

function InicioTab({ setTab }: { setTab: (t: Tab) => void }) {
  const { state, setCurrentDay } = useProtocolStore();
  const day = state.currentDay;
  const phase = phaseOf(day);
  const isApplicationDay = APPLICATION_DAYS.includes(day);
  const trackingPoints = state.diagnosisResult?.trackingPoints ?? [];
  const diagnosisFresh = isDiagnosisCurrent(state);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-plantae-cream/40 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-card">
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
          <ProgressBar className="mt-2" value={(day / 21) * 100} />
        </div>
      </div>

      {isApplicationDay ? (
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setTab("plano")}
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Ver tarefa
            </button>
            <button
              onClick={() => setTab("plano")}
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
            >
              Abrir protocolo
            </button>
            <button
              onClick={() => setTab("diario")}
              className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground"
            >
              Adicionar foto
            </button>
            <button
              onClick={() => setTab("plano")}
              className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground"
            >
              Ver tarefa do dia
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">
            Tarefa do dia
          </div>
          <h2 className="mt-1 text-lg font-display text-foreground">{getProtocolDay(day).title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{getProtocolDay(day).objective}</p>
          <button
            onClick={() => setTab("plano")}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Abrir meu plano <ChevronRight size={16} />
          </button>
        </div>
      )}

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
                setCurrentDay(d);
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

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-bold text-primary">Explorar dias do plano</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Escolha uma semana e um dia para consultar.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[1, 7, 14, 21].map((d) => (
            <button
              key={d}
              onClick={() => setCurrentDay(d)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                day === d
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground"
              }`}
            >
              Dia {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Plano ---------------- */

type PlanoTabProps = {
  setTab: (tab: Tab) => void;
};

function PlanoTab({ setTab }: PlanoTabProps) {
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
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="absolute -right-4 -top-4 opacity-[0.08] text-primary rotate-12">
          <Flower2 size={120} />
        </div>
        <div className="relative z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">Meu plano</div>
          <h1 className="text-2xl font-display tracking-tight text-primary">Plano de 21 dias</h1>
        </div>
      </div>

      {!diagnosisFresh && state.diagnosisResult && (
        <div className="mb-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-primary" size={18} />
            <div className="flex-1">
              <p className="text-[14px] font-medium leading-relaxed text-primary/90">
                Seu diagnóstico precisa ser atualizado para mostrar orientações personalizadas.
              </p>
              <button
                onClick={() => setTab("diagnostico")}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                Atualizar diagnóstico
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <WeekPicker
        currentWeek={week}
        onSelect={(w) => {
          const firstDay = w === 1 ? 1 : w === 2 ? 8 : 15;
          setCurrentDay(firstDay);
        }}
        currentDay={day}
        onSelectDay={setCurrentDay}
        weekDays={activeWeek.days}
      />

      {meta.stages && meta.stages.length > 0 ? (
        <DayHeaderCard meta={meta} />
      ) : (
        <DayContentCard
          meta={meta}
          entry={entry}
          onToggleChecklist={(item) => toggleChecklist(day, item)}
          onUpdate={(patch) => updateDay(day, patch)}
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
                onClick={() => toggleChecklist(day, item)}
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

        <RegisterField meta={meta} entry={entry} onChange={(note) => updateDay(day, { note })} />

        <button
          onClick={() => toggleDayCompleted(day)}
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
      </div>

      {day === 21 && <FinalEvaluation />}

      {showMethod && <MethodDrawer day={day} onClose={() => setShowMethod(false)} />}
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
          return (
            <button
              key={d}
              onClick={() => onSelectDay(d)}
              aria-current={active ? "step" : undefined}
              aria-label={isApp ? `Dia ${d}, dia de aplicação` : `Dia ${d}`}
              className={`relative min-h-[44px] rounded-xl border px-2 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              Dia {d}
              {isApp && (
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

function MethodDrawer({ day, onClose }: { day: number; onClose: () => void }) {
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
            registerApplication(day);
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

function DiagnosticoTab({
  onRedo,
  setTab,
}: {
  onRedo: () => void;
  setTab: (tab: Tab) => void;
}) {
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

      {current && result && <ResultBlocks result={result} />}

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

function DiarioTab() {
  const { state, updateDay } = useProtocolStore();

  const handlePhoto = async (day: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      updateDay(day, { photo: dataUrl });
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
            <div key={d} className="rounded-3xl border border-border bg-card p-4">
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
                onChange={(e) => updateDay(d, { photoCaption: e.target.value })}
                placeholder="Legenda"
                className="mt-3 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <FieldSmall
                  label="Raízes"
                  value={entry.roots ?? ""}
                  onChange={(v) => updateDay(d, { roots: v })}
                />
                <FieldSmall
                  label="Folhas"
                  value={entry.leavesObs ?? ""}
                  onChange={(v) => updateDay(d, { leavesObs: v })}
                />
                <FieldSmall
                  label="Brotos/hastes"
                  value={entry.shoots ?? ""}
                  onChange={(v) => updateDay(d, { shoots: v })}
                />
                <FieldSmall
                  label="Observações"
                  value={entry.observations ?? ""}
                  onChange={(v) => updateDay(d, { observations: v })}
                />
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

function FinalEvaluation() {
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
              onChange={(e) => updateFinalEval({ [q.key]: e.target.value } as Partial<typeof fe>)}
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
                onClick={() => updateFinalEval({ path: p.id })}
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
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="absolute -right-4 -top-4 opacity-[0.08] text-primary rotate-12">
          <BookOpen size={120} />
        </div>
        <div className="relative z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">Aprender</div>
          <h1 className="text-2xl font-display tracking-tight text-primary">Biblioteca educativa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conteúdo curto e prático para consultar quando precisar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LIBRARY.map((l) => (
          <button
            key={l.id}
            onClick={() => setOpen(l.id)}
            className="flex h-full flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary">
              {l.icon}
            </span>
            <div className="text-sm font-bold text-primary">{l.title}</div>
            <div className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-accent">
              Ler <ChevronRight size={12} />
            </div>
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

// Unused imports guard: reference to keep certain icons in bundle for clarity/future.
export const _icons = { Plus };
