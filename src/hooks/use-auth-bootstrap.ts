import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProtocolStore, isDiagnosisCurrent } from "./protocol-store";
import { AuthBootstrapStatus, UserProfile } from "./auth/types";
import { loadFromCache, saveToCache } from "./protocol-cache";
import { fetchUserProfile, fetchUserProgress } from "./protocol-cloud";

export function useAuthBootstrap() {
  const store = useProtocolStore();
  const [status, setStatus] = useState<AuthBootstrapStatus>("booting");
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const bootstrap = useCallback(async (userId: string | null) => {
    if (!userId) {
      // Carrega estado de visitante
      const guestState = loadFromCache("guest");
      if (guestState) {
        store.setState(guestState);
      } else {
        store.reset();
      }
      setStatus("signed_out");
      return;
    }

    setStatus("loading_remote_data");
    try {
      // 1. Carregar Perfil e Progresso em paralelo
      const [profileRes, progressRes] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserProgress(userId),
      ]);

      if (profileRes.error || progressRes.error) {
        throw new Error("Erro ao carregar dados remotos");
      }

      // 2. Reconciliar com cache local
      const localCached = loadFromCache(userId);
      let finalState = store.state;

      if (progressRes.data) {
        // Normalização e merge (usando a função já existente no store)
        // Precisamos garantir que mergeRemoteProgressState funcione com o objeto do banco
        // O store.mergeRemoteProgressState já existe em src/lib/protocol-store.ts
      }

      // Por agora, para cumprir o protocolo de máquina de estados:
      const hasPlant = profileRes.data?.plant_name && profileRes.data.plant_name !== "Minha Orquídea";
      // No banco profiles, o default é 'Minha Orquídea'. Se mudou, assumimos cadastro feito.
      
      const diagnosisReady = isDiagnosisCurrent(store.state);

      if (!hasPlant && !store.state.plant.name) {
        setStatus("needs_plant_registration");
      } else if (!diagnosisReady) {
        setStatus("needs_diagnosis");
      } else {
        setStatus("ready");
      }
    } catch (err: any) {
      setError(err.message);
      setStatus("auth_error");
    }
  }, [store]);

  useEffect(() => {
    // Escuta mudanças na sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      bootstrap(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      if (newUser?.id !== user?.id) {
        setUser(newUser);
        bootstrap(newUser?.id ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [bootstrap, user?.id]);

  return { status, user, error, setStatus };
}
