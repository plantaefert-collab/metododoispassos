import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * ProtocolDialog — wrapper padronizado para todos os pop-ups do protocolo.
 * Garante foco, ESC, scroll-lock (via Radix), rolagem interna, safe-area
 * e estilo consistente (bottom-sheet no mobile, dialog no desktop).
 */
export interface ProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
}

export function ProtocolDialog({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  children,
  footer,
  contentClassName,
}: ProtocolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm flex-col gap-0 overflow-hidden rounded-3xl p-0",
          contentClassName
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
          <DialogHeader className="space-y-1 text-left">
            {eyebrow && (
              <div className="text-xs font-bold uppercase tracking-wider text-accent">
                {eyebrow}
              </div>
            )}
            <DialogTitle className="font-display text-xl text-primary">{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{typeof title === "string" ? title : "Ação do protocolo"}</DialogDescription>
            )}
          </DialogHeader>
          {children}
          {footer && (
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-col sm:space-x-0">
              {footer}
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProtocolDialog;