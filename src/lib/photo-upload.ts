import { supabase } from "@/integrations/supabase/client";
import { compressImageToBlob } from "./image-compress";

/** Bucket público (leitura) usado para as fotos das orquídeas. */
export const PHOTO_BUCKET = "plant-photos";

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Comprime a imagem e:
 *  - se o usuário estiver logado, envia ao Supabase Storage e devolve a URL
 *    pública (curta), evitando guardar base64 no localStorage e no banco;
 *  - se for visitante, ou se o upload falhar por qualquer motivo (bucket ainda
 *    não criado, rede, permissão), devolve o data URL (base64) — comportamento
 *    idêntico ao anterior. Nunca lança por falha de upload; só por falha de
 *    leitura/compressão da imagem, para o chamador exibir a mensagem adequada.
 */
export async function uploadOrEncodePhoto(
  file: File,
  actorId: string | "guest",
): Promise<string> {
  const { blob, dataUrl, mimeType } = await compressImageToBlob(file);

  // Visitante não autentica no Storage — mantém base64 local.
  if (actorId === "guest") return dataUrl;

  try {
    const ext = mimeType === "image/webp" ? "webp" : "jpg";
    const path = `${actorId}/${randomId()}.${ext}`;
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, blob, { contentType: mimeType, upsert: false });
    if (error) return dataUrl;

    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return data?.publicUrl || dataUrl;
  } catch {
    return dataUrl;
  }
}

/** True para fotos guardadas como URL remota (Storage), não base64. */
export function isRemotePhoto(photo: string | null | undefined): boolean {
  return typeof photo === "string" && /^https?:\/\//.test(photo);
}
