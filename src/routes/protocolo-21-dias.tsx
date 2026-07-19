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
import { useProtocolStore } from "@/lib/protocol-store";
import {
  compressImage,
  PHOTO_ERROR_MESSAGE,
} from "@/lib/image-compress";
import {
  CATEGORY_LABEL,
  DIAGNOSIS_OPTIONS,
  GUIDANCE_BY_CATEGORY,
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

const KEY_DAYS = [1, 3, 7, 10, 14, 17, 21];
const APPLICATION_DAYS = [3, 10, 17];
const RECORD_DAYS = [1, 7, 14, 21];

function phaseOf(day: number): { label: string; range: string; tone: "green" | "lilac" | "accent" } {
  if (day <= 7) return { label: "Fase 1 — Diagnosticar e iniciar", range: "Dias 1–7", tone: "green" };
  if (day <= 14) return { label: "Fase 2 — Manter e acompanhar", range: "Dias 8–14", tone: "lilac" };
  return { label: "Fase 3 — Consolidar e avaliar", range: "Dias 15–21", tone: "accent" };
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
  const activeScreen =
    screen ?? (store.state.onboarded || guestMode ? "app" : "welcome");

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
          store.saveDiagnosisResult();
          setScreen("result");
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
      {tab === "plano" && <PlanoTab />}
      {tab === "diagnostico" && <DiagnosticoTab onRedo={() => setScreen("diagnosis")} />}
      {tab === "diario" && <DiarioTab />}
      {tab === "aprender" && <AprenderTab />}
      {showReset && (
        <ConfirmModal
          title="Reiniciar demonstração?"
          description="Isso apagará cadastro, diagnóstico, checklists, fotos e anotações salvas no seu navegador."
          confirmLabel="Reiniciar"
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
  const { state } = useProtocolStore();
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col shadow-[0_0_60px_-30px_rgba(0,80,40,0.25)] sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:rounded-3xl sm:border sm:border-border sm:bg-card">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:rounded-t-3xl">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Leaf size={18} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-primary">PlantaeFert</div>
              <div className="truncate text-[11px] text-muted-foreground">Nutrição Vegetal</div>
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
              aria-label="Reiniciar demonstração"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">{children}</main>

        <nav className="sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur sm:rounded-b-3xl">
          <div className="grid grid-cols-5">
            <TabBtn active={tab === "inicio"} onClick={() => setTab("inicio")} icon={<Home size={18} />} label="Início" />
            <TabBtn active={tab === "plano"} onClick={() => setTab("plano")} icon={<CalendarCheck size={18} />} label="Meu plano" />
            <TabBtn active={tab === "diagnostico"} onClick={() => setTab("diagnostico")} icon={<Stethoscope size={18} />} label="Diagnóstico" />
            <TabBtn active={tab === "diario"} onClick={() => setTab("diario")} icon={<Images size={18} />} label="Diário" />
            <TabBtn active={tab === "aprender"} onClick={() => setTab("aprender")} icon={<BookOpen size={18} />} label="Aprender" />
          </div>
        </nav>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
          active ? "bg-primary/10" : ""
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
      style={{ backgroundColor: "#F8F5EE", color: "#26352E" }}
    >
      <div
        className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 pb-8 pt-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-[28px] sm:px-6 sm:shadow-[0_20px_70px_-40px_rgba(23,61,50,0.35)]"
        style={{ backgroundColor: "#F8F5EE" }}
      >
        {/* Header */}
        <header className="flex items-center gap-2.5">
          <div
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{ backgroundColor: "#173D32", color: "#F8F5EE" }}
          >
            <Leaf size={18} strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight" style={{ color: "#173D32" }}>
              PlantaeFert
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "#66736C" }}>
              Nutrição Vegetal
            </div>
          </div>
        </header>

        {/* Photo */}
        <figure className="relative mt-5 overflow-hidden rounded-[22px]" style={{ backgroundColor: "#EEE8F2" }}>
          <img
            src={welcomeOrchid}
            alt="Orquídea Phalaenopsis saudável em vaso, com folhas verdes e raízes aéreas visíveis em ambiente doméstico claro."
            width={1024}
            height={1024}
            className="h-[220px] w-full object-cover sm:h-[240px]"
          />
          <span
            className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ backgroundColor: "#F3DCE7", color: "#B72D72" }}
          >
            <Sparkles size={11} /> Método de 2 passos
          </span>
        </figure>

        {/* Title */}
        <h1
          className="mt-6 font-display leading-[1.02] tracking-tight"
          style={{ color: "#173D32" }}
        >
          <span className="block text-[22px] font-normal" style={{ color: "#58705D" }}>
            Guia Prático
          </span>
          <span className="mt-1 block text-[36px] leading-[1.05] font-normal min-[390px]:text-[40px] sm:text-[44px] [word-spacing:0.02em]">
            <span className="whitespace-nowrap">Orquídeas</span>{" "}
            <em className="not-italic whitespace-nowrap" style={{ color: "#B72D72" }}>Floridas</em>
          </span>
        </h1>

        {/* Promise */}
        <p className="mt-4 text-[15px] font-semibold" style={{ color: "#173D32" }}>
          Seu plano guiado de 21 dias
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "#66736C" }}>
          Observe sua orquídea, fortaleça a base e acompanhe os sinais da planta com uma rotina simples.
        </p>

        {/* Two-step method */}
        <div className="mt-6 flex flex-col gap-2">
          <StepCard
            number="1"
            label="Enraizar"
            support="Fortalecer a base"
            text="Cuidar das raízes e preparar a planta para aproveitar melhor a rotina."
            bg="#DCEBDD"
            ink="#173D32"
            badge="#173D32"
            badgeInk="#F8F5EE"
            icon={<Sprout size={18} strokeWidth={2} />}
          />
          <div className="flex items-center gap-2 pl-6 text-[10px] uppercase tracking-[0.2em]" style={{ color: "#66736C" }}>
            <span className="h-px w-6" style={{ backgroundColor: "#66736C" }} />
            depois
          </div>
          <StepCard
            number="2"
            label="Nutrir"
            support="Apoiar o desenvolvimento"
            text="Oferecer suporte nutricional para o vigor e os próximos ciclos da planta."
            bg="#EEE8F2"
            ink="#173D32"
            badge="#B72D72"
            badgeInk="#F8F5EE"
            icon={<Leaf size={18} strokeWidth={2} />}
          />
        </div>

        {/* Benefit */}
        <div
          className="mt-5 rounded-2xl px-4 py-3"
          style={{ backgroundColor: "rgba(255,255,255,0.6)", color: "#26352E", border: "1px solid rgba(23,61,50,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <Stethoscope size={13} style={{ color: "#173D32" }} />
            <CalendarCheck size={13} style={{ color: "#173D32" }} />
            <Camera size={13} style={{ color: "#173D32" }} />
            <span className="ml-1 text-[12px] font-semibold uppercase tracking-[0.09em]" style={{ color: "#173D32" }}>
              Diagnóstico · Tarefas · Fotos
            </span>
          </div>
          <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "#66736C" }}>
            Acompanhe tudo em um só lugar.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onStart}
            className="rounded-full px-6 py-4 text-[15px] font-semibold uppercase tracking-[0.06em] transition-transform active:scale-[0.98]"
            style={{ backgroundColor: "#173D32", color: "#F8F5EE" }}
          >
            Começar meu plano
          </button>
          <button
            onClick={onExplore}
            className="rounded-full px-6 py-2.5 text-[13px] font-medium underline-offset-4 hover:underline"
            style={{ color: "#58705D" }}
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
    <div className="rounded-[20px] p-4" style={{ backgroundColor: bg }}>
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold"
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
          <p className="mt-1 text-[12.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: ink, opacity: 0.7 }}>
            {support}
          </p>
          <p className="mt-1.5 text-[14.5px] leading-[1.55]" style={{ color: "#26352E", opacity: 0.85 }}>
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
      <div className="mx-auto min-h-screen max-w-[440px] px-5 py-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-3xl sm:border sm:border-border sm:bg-card sm:shadow-[0_10px_60px_-30px_rgba(0,80,40,0.35)]">
        <StepHeader step={1} total={3} title="Cadastro da orquídea" subtitle="Conte um pouco sobre sua planta." />

        <div className="mt-6 space-y-5">
          <Field label="Nome da planta *">
            <input
              value={plant.name}
              onChange={(e) => updatePlant({ name: e.target.value })}
              placeholder="Ex.: Minha Phalaenopsis"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="Espécie (opcional)">
            <input
              value={plant.species}
              onChange={(e) => updatePlant({ species: e.target.value, unknownSpecies: false })}
              disabled={plant.unknownSpecies}
              placeholder="Ex.: Phalaenopsis, Cattleya…"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={plant.unknownSpecies}
                onChange={(e) => updatePlant({ unknownSpecies: e.target.checked, species: e.target.checked ? "" : plant.species })}
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
            options={["Vaso plástico transparente", "Vaso plástico comum", "Vaso de barro", "Vaso de madeira", "Cachepot", "Outro"]}
          />

          <SelectField
            label="Tipo de substrato"
            value={plant.substrate}
            onChange={(v) => updatePlant({ substrate: v })}
            options={["Casca de pinus", "Fibra de coco", "Musgo (sphagnum)", "Mistura", "Não sei", "Outro"]}
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
                <img src={plant.photo} alt="Sua orquídea" className="max-h-48 rounded-lg object-cover" />
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
              <button onClick={() => updatePlant({ photo: null })} className="mt-2 text-xs text-muted-foreground underline">
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
        className="w-full rounded-xl border border-input bg-card px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Selecione…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

function StepHeader({ step, total, title, subtitle }: { step: number; total: number; title: string; subtitle: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-accent">
        Passo {step} de {total}
      </div>
      <h1 className="mt-1 text-2xl font-black tracking-tight text-primary">{title}</h1>
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
  const { state, toggleDiagnosis } = useProtocolStore();
  const [stepIdx, setStepIdx] = useState(0);
  const total = DIAG_CATEGORIES.length;
  const current = DIAG_CATEGORIES[stepIdx];
  const options = DIAGNOSIS_OPTIONS[current.key];
  const selected = state.diagnosis[current.key];
  const isLast = stepIdx === total - 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-[440px] px-5 py-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-3xl sm:border sm:border-border sm:bg-card sm:shadow-[0_10px_60px_-30px_rgba(0,80,40,0.35)]">
        <StepHeader
          step={2}
          total={3}
          title="Diagnóstico guiado"
          subtitle="Marque tudo que você observa na sua orquídea."
        />

        <ProgressBar value={((stepIdx + 1) / total) * 100} className="mt-4" />
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
            <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary">{current.icon}</span>
            <h2 className="text-xl font-bold">{CATEGORY_LABEL[current.key]}</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Selecione todas as alternativas que descrevem sua observação atual.
          </p>
          <div className="mt-4 grid gap-2" role="group" aria-label={`Alternativas de ${CATEGORY_LABEL[current.key]}`}>
            {options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleDiagnosis(current.key, opt)}
                  aria-pressed={active}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-[15px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
          Um sinal isolado não fecha um diagnóstico. Estas escolhas orientam a observação nos próximos dias.
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

function DiagnosisResultScreen({
  onBack,
  onFinish,
}: {
  onBack: () => void;
  onFinish: () => void;
}) {
  const { state } = useProtocolStore();
  const result = state.diagnosisResult;
  const observations = totalObservations(state.diagnosis);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-[440px] px-5 py-6 sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-3xl sm:border sm:border-border sm:bg-card sm:shadow-[0_10px_60px_-30px_rgba(0,80,40,0.35)]">
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
          {observations} {observations === 1 ? "sinal observado" : "sinais observados"}. Este resultado orienta o acompanhamento — não é um diagnóstico definitivo.
        </div>

        {result && <ResultBlocks result={result} />}

        <div className="mt-6 flex gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft size={16} /> Revisar respostas
          </button>
          <button
            onClick={onFinish}
            className="ml-auto flex items-center gap-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ir para meu plano <ChevronRight size={16} />
          </button>
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
          Nenhuma alternativa foi marcada. Volte e selecione o que você observa para receber orientações personalizadas.
        </InfoCard>
      )}
      {priorities.length > 0 && (
        <ResultSection
          title="Pontos que merecem atenção próxima"
          tone="warn"
          items={priorities}
        />
      )}
      {adjustments.length > 0 && (
        <ResultSection
          title="Ajustes recomendados"
          tone="accent"
          items={adjustments}
        />
      )}
      {favorable.length > 0 && (
        <ResultSection
          title="Sinais favoráveis"
          tone="green"
          items={favorable}
        />
      )}
      {insufficientInformation.length > 0 && (
        <ResultSection
          title="Ainda não observado"
          tone="muted"
          items={insufficientInformation}
        />
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
        Um sinal isolado não fecha um diagnóstico. Utilize estas orientações como apoio à observação.
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
      <h3 className="text-sm font-bold text-primary">{title}</h3>
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
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function InfoCard({ tone, icon, children }: { tone: "lilac" | "warn" | "green"; icon: ReactNode; children: ReactNode }) {
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
  const diagnosisFresh = state.diagnosisStatus === "fresh";

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary to-lilac/60 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-card">
            {state.plant.photo ? (
              <img src={state.plant.photo} alt={state.plant.name} className="h-full w-full object-cover" />
            ) : (
              <Flower2 size={22} className="text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold text-primary">{state.plant.name || "Sua orquídea"}</div>
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
        <div className="rounded-3xl border border-accent/30 bg-accent/10 p-5">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Dia de aplicação</span>
          </div>
          <h2 className="mt-2 text-xl font-black text-primary">
            Hoje é dia de aplicar o Método de 2 Passos
          </h2>
          <p className="mt-1 text-sm text-primary/80">
            Enraizar primeiro, depois nutrir. Prefira horário fresco e evite sol forte.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setTab("plano")} className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              Ver tarefa
            </button>
            <button onClick={() => setTab("plano")} className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
              Registrar aplicação
            </button>
            <button onClick={() => setTab("diario")} className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground">
              Adicionar foto
            </button>
            <button onClick={() => setTab("plano")} className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground">
              Fazer anotação
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">Tarefa do dia</div>
          <h2 className="mt-1 text-lg font-bold text-foreground">Observe sua orquídea hoje</h2>
          <p className="mt-1 text-sm text-muted-foreground">Confira raízes, folhas e ambiente. Registre no seu plano.</p>
          <button onClick={() => setTab("plano")} className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            Abrir meu plano <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-primary">Próximos marcos</div>
          <button onClick={() => setTab("plano")} className="text-xs font-medium text-accent hover:underline">
            Ver todos
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 21].map((d) => (
            <button
              key={d}
              onClick={() => { setCurrentDay(d); setTab("plano"); }}
              className="rounded-2xl border border-border bg-secondary/40 p-3 text-left transition-colors hover:border-primary/40"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                {d === 7 ? "1ª avaliação" : d === 14 ? "Intermediária" : "Final"}
              </div>
              <div className="mt-1 text-base font-bold text-primary">Dia {d}</div>
            </button>
          ))}
        </div>
      </div>

      <InfoCard tone="warn" icon={<AlertTriangle size={16} />}>
        Aplique no horário fresco, evite sol forte e não atinja diretamente as flores.
      </InfoCard>

      {diagnosisFresh && trackingPoints.length > 0 && (
        <div className="rounded-3xl border border-primary/20 bg-secondary/40 p-5">
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

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="text-sm font-bold text-primary">Simular outro dia</div>
        <p className="mt-1 text-xs text-muted-foreground">Esta versão é uma demonstração local. Escolha um dia para explorar.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {KEY_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setCurrentDay(d)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                day === d ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
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

const DAY_META: Record<number, { title: string; goal: string; hint: string; checklist: string[] }> = {
  1: {
    title: "Dia 1 — Diagnóstico e foto inicial",
    goal: "Registrar o ponto de partida da sua orquídea.",
    hint: "Fotografe raízes, folhas e a planta inteira em luz natural.",
    checklist: ["Fotografei a planta inteira", "Anotei observação inicial", "Revisei o resumo do diagnóstico"],
  },
  3: {
    title: "Dia 3 — Primeira aplicação",
    goal: "Aplicar o Método de 2 Passos pela primeira vez.",
    hint: "Horário fresco, sem sol forte, sem atingir as flores.",
    checklist: ["Preparei ambiente e planta", "Apliquei Passo 1 (Enraizar)", "Apliquei Passo 2 (Nutrir)"],
  },
  7: {
    title: "Dia 7 — Primeira avaliação",
    goal: "Comparar com o Dia 1 e registrar a evolução.",
    hint: "Observe cor das raízes, firmeza das folhas e novos sinais.",
    checklist: ["Fotografei a planta", "Anotei observações", "Comparei com o Dia 1"],
  },
  10: {
    title: "Dia 10 — Segunda aplicação",
    goal: "Reforçar o método após uma semana de acompanhamento.",
    hint: "Mantenha o intervalo semanal em horário fresco.",
    checklist: ["Preparei ambiente", "Apliquei Passo 1 (Enraizar)", "Apliquei Passo 2 (Nutrir)"],
  },
  14: {
    title: "Dia 14 — Avaliação intermediária",
    goal: "Verificar continuidade do progresso.",
    hint: "Se algo piorou, registre e ajuste a observação.",
    checklist: ["Fotografei a planta", "Comparei com Dia 7", "Registrei observações"],
  },
  17: {
    title: "Dia 17 — Terceira aplicação",
    goal: "Consolidar o ciclo com a última aplicação do protocolo.",
    hint: "Mesmo cuidado das aplicações anteriores.",
    checklist: ["Preparei ambiente", "Apliquei Passo 1 (Enraizar)", "Apliquei Passo 2 (Nutrir)"],
  },
  21: {
    title: "Dia 21 — Avaliação final",
    goal: "Comparar o antes e depois do plano de 21 dias.",
    hint: "Preencha a avaliação final para consolidar o aprendizado.",
    checklist: ["Fotografei a planta", "Comparei com Dia 1", "Preenchi a avaliação final"],
  },
};

function PlanoTab() {
  const { state, setCurrentDay, updateDay, toggleChecklist, toggleDayCompleted } = useProtocolStore();
  const [showMethod, setShowMethod] = useState(false);
  const day = state.currentDay;
  const meta = DAY_META[day] ?? DAY_META[1];
  const entry = state.days[day] ?? { checklist: {}, note: "", completed: false };
  const isApplication = APPLICATION_DAYS.includes(day);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-accent">Meu plano</div>
        <h1 className="text-2xl font-black tracking-tight text-primary">Tela do dia</h1>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {KEY_DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setCurrentDay(d)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              day === d
                ? "bg-primary text-primary-foreground"
                : APPLICATION_DAYS.includes(d)
                ? "border border-accent/40 bg-accent/10 text-accent"
                : "border border-border bg-card text-foreground"
            }`}
          >
            Dia {d}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-accent">{phaseOf(day).range}</div>
        <h2 className="mt-1 text-lg font-bold text-primary">{meta.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta.goal}</p>
        <p className="mt-2 text-sm text-foreground/80">{meta.hint}</p>

        <div className="mt-4 space-y-2">
          {meta.checklist.map((item) => {
            const checked = !!entry.checklist[item];
            return (
              <button
                key={item}
                onClick={() => toggleChecklist(day, item)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                  checked ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground"
                }`}
              >
                {checked ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-muted-foreground" />}
                <span>{item}</span>
              </button>
            );
          })}
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Anotação</span>
          <textarea
            value={entry.note}
            onChange={(e) => updateDay(day, { note: e.target.value })}
            placeholder="O que você observou hoje?"
            rows={3}
            className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        {isApplication && (
          <button
            onClick={() => setShowMethod(true)}
            className="mt-4 w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground active:scale-[0.98]"
          >
            Abrir Método de 2 Passos
          </button>
        )}

        <button
          onClick={() => toggleDayCompleted(day)}
          aria-pressed={entry.completed}
          className={`mt-2 w-full rounded-full px-4 py-3 text-sm font-semibold active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            entry.completed ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {entry.completed ? "Tarefa concluída ✓ · Desfazer" : "Concluir tarefa"}
        </button>
      </div>

      {day === 21 && <FinalEvaluation />}

      {showMethod && <MethodDrawer day={day} onClose={() => setShowMethod(false)} />}
    </div>
  );
}

function MethodDrawer({ day, onClose }: { day: number; onClose: () => void }) {
  const { registerApplication, state } = useProtocolStore();
  const applicationsForDay = state.applications.filter((a) => a.day === day);
  return (
    <Drawer onClose={onClose} title="Método de 2 Passos">
      <p className="text-sm text-muted-foreground">
        Uma vez por semana, nos Dias 3, 10 e 17. Produtos prontos para uso. Prefira horário fresco, evite sol forte e não atinja diretamente as flores.
      </p>

      <div className="mt-4 space-y-4">
        <div className="rounded-2xl border border-border bg-secondary/50 p-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <span className="text-base font-bold">Enraizar</span>
          </div>
          <p className="mt-1.5 text-sm text-secondary-foreground/90">
            Aplicar em raízes e substrato. Ajuda a fortalecer o sistema radicular e criar condições favoráveis ao vigor.
          </p>
          <ProductPlaceholder title="Enraizador Forte 500 ml Pronto Uso" />
        </div>

        <div className="rounded-2xl border border-border bg-lilac/60 p-4">
          <div className="flex items-center gap-2 text-lilac-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">2</span>
            <span className="text-base font-bold">Nutrir</span>
          </div>
          <p className="mt-1.5 text-sm text-lilac-foreground/90">
            Aplicar depois do Enraizador em raízes, folhas e substrato. Auxilia na nutrição e contribui para novos ciclos de floração.
          </p>
          <ProductPlaceholder title="Bokashi Orquídeas Premium 500 ml Pronto Uso" />
        </div>
      </div>

      <InfoCard tone="warn" icon={<AlertTriangle size={16} />}>
        Sem indicação de quantidade nesta versão. Siga sempre o rótulo do produto e evite aplicação direta nas flores.
      </InfoCard>

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
      <button
        onClick={() => {
          registerApplication(day);
          onClose();
        }}
        className="mt-4 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {applicationsForDay.length > 0 ? "Registrar nova aplicação" : "Registrar aplicação concluída"}
      </button>
    </Drawer>
  );
}

function ProductPlaceholder({ title }: { title: string }) {
  return (
    <div className="mt-3 grid gap-2 rounded-xl border-2 border-dashed border-border bg-card/70 p-3 text-center">
      <div className="grid h-28 place-items-center rounded-lg bg-muted/60">
        <div className="text-xs font-medium text-muted-foreground">Inserir imagem real do produto</div>
      </div>
      <div className="text-xs font-semibold text-foreground">{title}</div>
    </div>
  );
}

/* ---------------- Diagnóstico Tab ---------------- */

function DiagnosticoTab({ onRedo }: { onRedo: () => void }) {
  const { state } = useProtocolStore();
  const items: Array<{ key: DiagnosisCategory; label: string; values: string[] }> = (
    Object.keys(CATEGORY_LABEL) as DiagnosisCategory[]
  ).map((k) => ({ key: k, label: CATEGORY_LABEL[k], values: state.diagnosis[k] }));
  const result = state.diagnosisResult;
  const isOutdated = state.diagnosisStatus === "outdated";

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-accent">Diagnóstico</div>
        <h1 className="text-2xl font-black tracking-tight text-primary">Sinais observados</h1>
        <p className="mt-1 text-sm text-muted-foreground">Este resumo orienta sua observação. Um sinal isolado não fecha um diagnóstico.</p>
      </div>

      {isOutdated && (
        <InfoCard tone="warn" icon={<AlertTriangle size={16} />}>
          Você editou respostas depois de gerar o resultado. Refaça o diagnóstico para atualizar as orientações.
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
                <span key={v} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {result && !isOutdated && <ResultBlocks result={result} />}

      <button onClick={onRedo} className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
        Refazer diagnóstico
      </button>
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
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-accent">Diário fotográfico</div>
        <h1 className="text-2xl font-black tracking-tight text-primary">Linha do tempo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Registre fotos e observações nos Dias 1, 7, 14 e 21.</p>
      </div>

      <div className="space-y-3">
        {RECORD_DAYS.map((d) => {
          const entry = state.days[d] ?? { checklist: {}, note: "", completed: false };
          return (
            <div key={d} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-accent">{phaseOf(d).range}</div>
                  <div className="text-lg font-bold text-primary">Dia {d}</div>
                </div>
                {entry.photo ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">Registrado</span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Aguardando</span>
                )}
              </div>

              <label className="mt-3 block cursor-pointer">
                {entry.photo ? (
                  <img src={entry.photo} alt={`Foto do dia ${d}`} className="h-48 w-full rounded-xl object-cover" />
                ) : (
                  <div className="grid h-40 place-items-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-center">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Camera size={22} />
                      <span className="text-xs font-medium">Adicionar foto</span>
                    </div>
                  </div>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => handlePhoto(d, e)} />
              </label>

              <input
                value={entry.photoCaption ?? ""}
                onChange={(e) => updateDay(d, { photoCaption: e.target.value })}
                placeholder="Legenda"
                className="mt-3 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <FieldSmall label="Raízes" value={entry.roots ?? ""} onChange={(v) => updateDay(d, { roots: v })} />
                <FieldSmall label="Folhas" value={entry.leavesObs ?? ""} onChange={(v) => updateDay(d, { leavesObs: v })} />
                <FieldSmall label="Brotos/hastes" value={entry.shoots ?? ""} onChange={(v) => updateDay(d, { shoots: v })} />
                <FieldSmall label="Observações" value={entry.observations ?? ""} onChange={(v) => updateDay(d, { observations: v })} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldSmall({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
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

  const paths: Array<{ id: typeof fe.path; label: string; desc: string; tone: "green" | "lilac" | "accent" | "warn" }> = [
    { id: "evolved", label: "Apresentou evolução", desc: "Sinais claros de melhora nas raízes, folhas ou brotos.", tone: "green" },
    { id: "stable", label: "Está estável", desc: "Sem mudança clara. Continue observando e mantendo o cuidado.", tone: "lilac" },
    { id: "worsening", label: "Está piorando", desc: "Procure orientação especializada com um profissional.", tone: "warn" },
    { id: "healthy-no-bloom", label: "Saudável, mas não floresceu", desc: "Vigor bom, sem floração. Ajuste luz e ciclo natural.", tone: "accent" },
  ];

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-accent">Avaliação final</div>
      <h2 className="mt-1 text-lg font-bold text-primary">Comparação e reflexão</h2>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {RECORD_DAYS.map((d) => {
          const p = state.days[d]?.photo;
          return (
            <div key={d} className="aspect-square overflow-hidden rounded-lg border border-border bg-muted/40">
              {p ? (
                <img src={p} alt={`Dia ${d}`} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-[10px] font-semibold text-muted-foreground">Dia {d}</div>
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{q.label}</span>
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
        <div className="mb-2 text-sm font-semibold text-primary">Como sua planta chegou ao Dia 21?</div>
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
            Recomendamos buscar ajuda de um profissional em orquídeas. Sinais persistentes de deterioração pedem avaliação presencial.
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
    body:
      "Raízes saudáveis são firmes e esverdeadas quando úmidas. Pontas claras indicam crescimento. Raízes muito moles, escuras ou com mau cheiro pedem atenção imediata: revise rega, drenagem e substrato.",
  },
  {
    id: "rega",
    title: "Rega",
    icon: <Droplets size={18} />,
    body:
      "Prefira verificar a umidade antes de regar. Substrato encharcado sufoca raízes. Rega por calendário fixo costuma encharcar em dias frios e faltar em dias quentes.",
  },
  {
    id: "luz",
    title: "Luz",
    icon: <Sun size={18} />,
    body:
      "Orquídeas gostam de luz clara e indireta. Sol forte direto queima folhas. Falta de luz reduz vigor e dificulta floração.",
  },
  {
    id: "ventilacao",
    title: "Ventilação",
    icon: <Wind size={18} />,
    body:
      "Ar parado favorece fungos e apodrecimento. Um ambiente com ventilação suave contribui para raízes saudáveis e folhas firmes.",
  },
  {
    id: "vaso",
    title: "Vaso e drenagem",
    icon: <FlowerIcon size={18} />,
    body:
      "O vaso deve permitir passagem de ar e drenagem eficiente. Água acumulada é uma das principais causas de perda de raízes.",
  },
  {
    id: "substrato",
    title: "Substrato",
    icon: <Leaf size={18} />,
    body:
      "Substrato bom se mantém aerado, drena rápido e não vira uma massa compactada. Quando compacta, é hora de repor.",
  },
  {
    id: "erros",
    title: "Erros comuns",
    icon: <AlertTriangle size={18} />,
    body:
      "Regar por calendário fixo, misturar vários produtos, mudar de local com frequência e usar sol direto forte são erros que enfraquecem a planta.",
  },
  {
    id: "evolucao",
    title: "Sinais de evolução",
    icon: <Sparkles size={18} />,
    body:
      "Pontas verdes ou avermelhadas nas raízes, folhas mais firmes, brotos novos e hastes florais em desenvolvimento são bons indícios.",
  },
  {
    id: "faq",
    title: "Perguntas frequentes",
    icon: <Info size={18} />,
    body:
      "‘Vai florescer em 21 dias?’ — Não prometemos floração garantida. O plano cria condições favoráveis. ‘Posso usar em qualquer orquídea?’ — Foco em espécies comuns cultivadas em casa. Em dúvida, procure um profissional.",
  },
];

function AprenderTab() {
  const [open, setOpen] = useState<string | null>(null);
  const current = LIBRARY.find((l) => l.id === open);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-accent">Aprender</div>
        <h1 className="text-2xl font-black tracking-tight text-primary">Biblioteca educativa</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conteúdo curto e prático para consultar quando precisar.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LIBRARY.map((l) => (
          <button
            key={l.id}
            onClick={() => setOpen(l.id)}
            className="flex h-full flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary">{l.icon}</span>
            <div className="text-sm font-bold text-primary">{l.title}</div>
            <div className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-accent">
              Ler <ChevronRight size={12} />
            </div>
          </button>
        ))}
      </div>

      {current && (
        <Drawer onClose={() => setOpen(null)} title={current.title}>
          <p className="text-sm leading-relaxed text-foreground/90">{current.body}</p>
        </Drawer>
      )}
    </div>
  );
}

/* ---------------- Drawer & Modal ---------------- */

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/30 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-bold text-primary">{title}</div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>
        {children}
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
          <button onClick={onCancel} className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Unused imports guard: reference to keep certain icons in bundle for clarity/future.
export const _icons = { Plus };