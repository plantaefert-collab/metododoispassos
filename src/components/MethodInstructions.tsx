import { AlertTriangle, Flower2 } from "lucide-react";

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

/**
 * Reusable canonical "Modo de usar" for the Método de 2 Passos.
 * Any screen showing how to apply the kit MUST use this component.
 */
export function MethodInstructions({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
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

export default MethodInstructions;