import { AlertTriangle, Flower2, CheckCircle2, Circle, Sun, CalendarClock, Sprout, Leaf, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import raizImg from "@/assets/raiz-500ml.png";
import orkImg from "@/assets/ork-500ml.png";

const STORAGE_KEY = "plantae:method-usage-log:v1";

type UsageLog = {
  enraizadorDone: boolean;
  bokashiDone: boolean;
  notes: string;
  lastApplicationISO: string | null;
};

const DEFAULT_LOG: UsageLog = {
  enraizadorDone: false,
  bokashiDone: false,
  notes: "",
  lastApplicationISO: null,
};

function loadLog(): UsageLog {
  if (typeof window === "undefined") return DEFAULT_LOG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LOG;
    return { ...DEFAULT_LOG, ...(JSON.parse(raw) as Partial<UsageLog>) };
  } catch {
    return DEFAULT_LOG;
  }
}

function saveLog(log: UsageLog) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    /* ignore */
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  } catch {
    return iso;
  }
}

const STEPS: Array<{ n: number; text: React.ReactNode; tone: "primary" | "accent" }> = [
  {
    n: 1,
    tone: "primary",
    text: (
      <>
        Aplique primeiro o <strong>Enraizador Orgânico</strong> nas raízes e no substrato.
      </>
    ),
  },
  {
    n: 2,
    tone: "accent",
    text: (
      <>
        Em seguida, aplique o <strong>Bokashi Líquido Orquídeas</strong> nas raízes, folhas e substrato.
      </>
    ),
  },
];

const PRODUCT_CARDS = [
  {
    id: "enraizador" as const,
    name: "Enraizador Orgânico",
    tag: "Passo 1",
    tone: "primary" as const,
    image: raizImg,
    icon: Sprout,
    where: ["Raízes", "Substrato"],
    avoid: ["Flores", "Sol forte"],
  },
  {
    id: "bokashi" as const,
    name: "Bokashi Líquido Orquídeas",
    tag: "Passo 2",
    tone: "accent" as const,
    image: orkImg,
    icon: Leaf,
    where: ["Raízes", "Folhas", "Substrato"],
    avoid: ["Flores", "Sol forte"],
  },
];

/**
 * Reusable canonical "Modo de usar" for the Método de 2 Passos.
 * Any screen showing how to apply the kit MUST use this component.
 */
export function MethodInstructions({ compact = false }: { compact?: boolean }) {
  const [log, setLog] = useState<UsageLog>(DEFAULT_LOG);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setLog(loadLog());
    setHydrated(true);
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (hydrated) saveLog(log);
  }, [log, hydrated]);

  const isPeakSun = useMemo(() => {
    if (!now) return false;
    const h = now.getHours();
    return h >= 9 && h < 16;
  }, [now]);

  const nextApplication = useMemo(() => {
    if (!log.lastApplicationISO) return null;
    const next = new Date(log.lastApplicationISO);
    next.setDate(next.getDate() + 7);
    return next.toISOString();
  }, [log.lastApplicationISO]);

  const update = (patch: Partial<UsageLog>) => setLog((prev) => ({ ...prev, ...patch }));

  const registerApplication = () => {
    const iso = new Date().toISOString();
    update({ lastApplicationISO: iso, enraizadorDone: true, bokashiDone: true });
  };

  const resetChecklist = () => update({ enraizadorDone: false, bokashiDone: false });

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Aviso contextual — sol forte 9h-16h */}
      {isPeakSun && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border-2 border-accent bg-accent/15 p-4"
        >
          <Sun className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div className="text-sm text-foreground/90">
            <div className="font-bold text-accent">Atenção: horário de sol forte</div>
            <p className="mt-1">
              Agora são <strong>{now?.getHours()}h</strong>. Evite aplicar entre 9h e 16h e
              <strong> não aplique diretamente nas flores</strong>. Prefira o início da manhã ou o fim da tarde.
            </p>
          </div>
        </div>
      )}

      {/* Uso em conjunto */}
      <div className="rounded-2xl border border-border bg-secondary/50 p-4">
        <div className="text-[12px] font-bold uppercase tracking-wider text-primary/80">
          Uso em conjunto
        </div>
        <ul className="mt-2 space-y-1 text-sm text-secondary-foreground/90">
          <li className="flex gap-2">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>Aplicar <strong>1 vez por semana</strong>.</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>Preferir as <strong>horas mais frescas do dia</strong>.</span>
          </li>
        </ul>
      </div>

      {/* Cards de produtos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PRODUCT_CARDS.map((p) => {
          const Icon = p.icon;
          const isPrimary = p.tone === "primary";
          return (
            <div
              key={p.id}
              className={`overflow-hidden rounded-2xl border bg-card ${
                isPrimary ? "border-primary/25" : "border-accent/25"
              }`}
            >
              <div className={`flex items-center gap-3 p-3 ${isPrimary ? "bg-primary/5" : "bg-accent/5"}`}>
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-xl object-contain"
                />
                <div className="min-w-0">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isPrimary ? "text-primary" : "text-accent"}`}>
                    {p.tag}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <Icon className={`h-4 w-4 ${isPrimary ? "text-primary" : "text-accent"}`} aria-hidden />
                    <span className="truncate">{p.name}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 p-3 text-xs">
                <div>
                  <div className="mb-1 font-bold text-primary/80">Onde aplicar</div>
                  <div className="flex flex-wrap gap-1">
                    {p.where.map((w) => (
                      <span key={w} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                        <CheckCircle2 className="h-3 w-3" aria-hidden /> {w}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1 font-bold text-destructive/80">Onde não aplicar</div>
                  <div className="flex flex-wrap gap-1">
                    {p.avoid.map((w) => (
                      <span key={w} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
                        <XCircle className="h-3 w-3" aria-hidden /> {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Como aplicar - passos numerados */}
      <div>
        <div className="text-sm font-bold text-primary">Como aplicar</div>
        <ol className="mt-3 space-y-3">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  step.tone === "primary"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {step.n}
              </span>
              <p className="text-sm text-foreground/90">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Checklist de aplicação */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-primary">Checklist da aplicação</div>
          {(log.enraizadorDone || log.bokashiDone) && (
            <button
              type="button"
              onClick={resetChecklist}
              className="text-[11px] font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Marque na ordem correta: Enraizador primeiro, Bokashi depois.
        </p>
        <div className="mt-3 space-y-2">
          <ChecklistRow
            checked={log.enraizadorDone}
            onToggle={() => update({ enraizadorDone: !log.enraizadorDone })}
            index={1}
            label="Apliquei o Enraizador Orgânico nas raízes e substrato"
            tone="primary"
          />
          <ChecklistRow
            checked={log.bokashiDone}
            disabled={!log.enraizadorDone}
            onToggle={() => update({ bokashiDone: !log.bokashiDone })}
            index={2}
            label="Apliquei o Bokashi Líquido nas raízes, folhas e substrato"
            tone="accent"
          />
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent/10 p-2.5 text-[12px] text-accent">
          <Flower2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span><strong>Lembrete:</strong> evite aplicar diretamente nas flores.</span>
        </div>
        <button
          type="button"
          onClick={registerApplication}
          disabled={!log.enraizadorDone || !log.bokashiDone}
          className="mt-3 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          Registrar aplicação de hoje
        </button>
      </div>

      {/* Anotações + Próxima aplicação */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <label htmlFor="method-notes" className="text-sm font-bold text-primary">
          Minhas anotações
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Registre observações da orquídea (raízes, folhas, floração).
        </p>
        <textarea
          id="method-notes"
          value={log.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={3}
          placeholder="Ex.: raízes verdes após rega, folhas mais firmes..."
          className="mt-2 w-full resize-none rounded-xl border border-border bg-background p-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="text-foreground/90">
            <div className="font-bold text-primary">Próxima aplicação</div>
            {nextApplication ? (
              <p className="mt-0.5 capitalize">{formatDate(nextApplication)}</p>
            ) : (
              <p className="mt-0.5 text-muted-foreground">
                Registre a aplicação de hoje para eu calcular a próxima (1 vez por semana).
              </p>
            )}
            {log.lastApplicationISO && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Última aplicação: <span className="capitalize">{formatDate(log.lastApplicationISO)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Alertas em destaque */}
      <div
        role="note"
        className="rounded-2xl border-2 border-accent bg-accent/10 p-4 shadow-[0_0_0_1px_hsl(var(--accent)/0.15)]"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-accent">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Atenção
        </div>
        <ul className="mt-2 space-y-2 text-sm text-foreground/90">
          <li className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span>
              <strong>Não aplicar sob sol forte</strong>, especialmente entre{" "}
              <strong>9h e 16h</strong>.
            </span>
          </li>
          <li className="flex gap-2">
            <Flower2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span>
              <strong>Evite aplicar diretamente nas flores.</strong>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ChecklistRow({
  checked,
  onToggle,
  index,
  label,
  tone,
  disabled = false,
}: {
  checked: boolean;
  onToggle: () => void;
  index: number;
  label: string;
  tone: "primary" | "accent";
  disabled?: boolean;
}) {
  const isPrimary = tone === "primary";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={checked}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? isPrimary
            ? "border-primary bg-primary/10 text-primary"
            : "border-accent bg-accent/10 text-accent"
          : "border-border bg-background text-foreground hover:border-primary/40"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {checked ? (
          <CheckCircle2 className={`h-5 w-5 ${isPrimary ? "text-primary" : "text-accent"}`} />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <span className="mt-0.5 text-[11px] font-bold text-muted-foreground">{index}.</span>
      <span className={`min-w-0 flex-1 ${checked ? "line-through opacity-70" : ""}`}>{label}</span>
    </button>
  );
}

export default MethodInstructions;