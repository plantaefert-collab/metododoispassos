import { useProtocolStore } from "@/lib/protocol-store";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function QuickTour({ actorId }: { actorId: string | "guest" }) {
  const { state, setTourCompleted } = useProtocolStore();
  const [tourStep, setTourStep] = useState<number | null>(null);

  useEffect(() => {
    if (state.onboarded && !state.tourCompleted && tourStep === null) {
      setTourStep(0);
    }
  }, [state.onboarded, state.tourCompleted, tourStep]);

  const tourSteps = [
    {
      title: "Começar diagnóstico",
      text: "Comece pelo diagnóstico para entender as necessidades específicas da sua orquídea.",
    },
    {
      title: "Cadastro da orquídea",
      text: "Registre os dados da sua planta em “Orquídea” para um acompanhamento preciso.",
    },
    {
      title: "Diário & Plano",
      text: "Em “Plano” você registra suas aplicações e acompanha a evolução diária.",
    }
  ];

  const handleNextTour = () => {
    if (tourStep !== null) {
      if (tourStep < tourSteps.length - 1) {
        setTourStep(tourStep + 1);
      } else {
        setTourStep(null);
        setTourCompleted(true, actorId);
        toast.success("Tour finalizado! Agora você está pronto para cuidar da sua orquídea.", {
          icon: <Sparkles size={16} className="text-primary" />
        });
      }
    }
  };

  if (tourStep === null) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-[320px] rounded-[28px] bg-card p-6 shadow-2xl border border-primary/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Dica Rápida</span>
            </div>
            <div className="text-[10px] font-bold text-muted-foreground">
              {tourStep + 1} / {tourSteps.length}
            </div>
          </div>
          
          <h3 className="font-display text-xl text-primary mb-2">{tourSteps[tourStep].title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {tourSteps[tourStep].text}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTourStep(null);
                setTourCompleted(true, actorId);
              }}
              className="flex-1 rounded-full border border-border py-3 text-xs font-bold text-muted-foreground"
            >
              Pular
            </button>
            <button
              onClick={handleNextTour}
              className="flex-[2] rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20"
            >
              {tourStep === tourSteps.length - 1 ? "Entendi!" : "Próximo"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
