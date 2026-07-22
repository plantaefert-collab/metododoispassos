import { useEffect } from "react";
import { useProtocolStore } from "@/lib/protocol-store";

/**
 * Sincroniza a preferência de alto contraste (persistida no localStorage
 * via protocol-store) com a classe global `high-contrast` no <html>.
 * Aplica em qualquer rota do app, incluindo landing e telas fora do shell.
 */
export function useHighContrastSync() {
  const { state } = useProtocolStore();
  const highContrast = !!state.settings?.highContrast;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [highContrast]);
}
