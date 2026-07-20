import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hydrateStore, clearStore, defaultState, ProtocolState } from "@/lib/protocol-store";
import { AuthBootstrapStatus, UserProfile } from "@/lib/auth/types";
import { loadFromCache, saveToCache, getCacheTimestamp } from "@/lib/protocol-cache";
import { fetchUserProfile, fetchUserProgress, saveProgressRemote } from "@/lib/protocol-cloud";
import { isDiagnosisCurrent } from "@/lib/protocol-store";

export function useAuthBootstrap() {
  const [status, setStatus] = useState<AuthBootstrapStatus>("booting");
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const activeUserIdRef = useRef<string | null>(null);
  const bootstrapGenerationRef = useRef(0);

  const bootstrap = useCallback(async (userId: string | null) => {
    const generation = ++bootstrapGenerationRef.current;
    activeUserIdRef.current = userId;

    // Se o usuário mudou, limpa o store primeiro
    clearStore();

    if (!userId) {
      const guestState = loadFromCache("guest") || defaultState;
      hydrateStore(guestState);
      setStatus("signed_out");
      return;
    }

    setStatus("loading_remote_data");
    try {
      const [profileRes, progressRes] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserProgress(userId),
      ]);

      // Verifica se ainda somos a geração atual e o mesmo usuário
      if (generation !== bootstrapGenerationRef.current || userId !== activeUserIdRef.current) {
        return;
      }

      if (profileRes.error) throw new Error("Erro ao carregar perfil");
      
      const remoteProgress = progressRes.data;
      const remoteTimestamp = remoteProgress?.updated_at || null;
      const cachedState = loadFromCache(userId);
      const cachedTimestamp = getCacheTimestamp(userId);

      let finalState = defaultState;

      // Reconciliação Determinística
      if (remoteProgress && cachedState) {
        if (remoteTimestamp && cachedTimestamp && new Date(remoteTimestamp) > new Date(cachedTimestamp)) {
          // Banco vence
          finalState = { ...defaultState, ...remoteProgress }; // Necessário mapear corretamente se os nomes diferirem
          // TODO: Implementar normalizeRemoteProgress para mapear campos do banco para o estado
        } else {
          // Cache vence ou são iguais
          finalState = cachedState;
          // Sincroniza cache com o banco se for mais recente
          if (cachedTimestamp && (!remoteTimestamp || new Date(cachedTimestamp) > new Date(remoteTimestamp))) {
            await saveProgressRemote(userId, cachedState);
          }
        }
      } else if (remoteProgress) {
        // Apenas banco
        finalState = { ...defaultState, ...remoteProgress };
      } else if (cachedState) {
        // Apenas cache
        finalState = cachedState;
        await saveProgressRemote(userId, cachedState);
      }

      hydrateStore(finalState);

      // Determinar destino
      const hasPlant = profileRes.data?.plant_registered_at !== null;
      const diagnosisReady = isDiagnosisCurrent(finalState);

      if (!hasPlant) {
        setStatus("needs_plant_registration");
      } else if (!diagnosisReady) {
        setStatus("needs_diagnosis");
      } else {
        setStatus("ready");
      }
    } catch (err: any) {
      if (generation === bootstrapGenerationRef.current) {
        setError(err.message);
        setStatus("auth_error");
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;
      setUser(session?.user ?? null);
      bootstrap(userId);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      if (newUser?.id !== activeUserIdRef.current) {
        setUser(newUser);
        bootstrap(newUser?.id ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [bootstrap]);

  return { status, user, error, setStatus };
}
