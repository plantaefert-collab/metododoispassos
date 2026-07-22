// Utility para reduzir e comprimir fotos antes de salvar no localStorage.
// Redimensiona proporcionalmente para no máximo `maxSide` px e retorna JPEG
// com qualidade padrão 0.78. Em caso de falha, rejeita a Promise para o
// chamador exibir uma mensagem clara.

export type CompressOptions = {
  maxSide?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
};

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<string> {
  const maxSide = opts.maxSide ?? 1280;
  const quality = opts.quality ?? 0.78;
  const mimeType = opts.mimeType ?? "image/jpeg";

  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo não é uma imagem.");
  }
  // Rejeita arquivos absurdamente grandes (>25 MB) sem tentar decodificar.
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Imagem muito grande. Escolha um arquivo menor.");
  }

  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const { width, height } = fitInside(img.naturalWidth, img.naturalHeight, maxSide);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(img, 0, 0, width, height);

  const out = canvas.toDataURL(mimeType, quality);
  if (!out || out === "data:,") {
    throw new Error("Não foi possível processar a imagem.");
  }
  return out;
}

/**
 * Igual a {@link compressImage}, mas devolve também um `Blob` — necessário para
 * enviar ao Supabase Storage. O `dataUrl` serve de fallback (visitante/offline).
 */
export async function compressImageToBlob(
  file: File,
  opts: CompressOptions = {},
): Promise<{ blob: Blob; dataUrl: string; mimeType: string }> {
  const maxSide = opts.maxSide ?? 1280;
  const quality = opts.quality ?? 0.78;
  const mimeType = opts.mimeType ?? "image/jpeg";

  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo não é uma imagem.");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Imagem muito grande. Escolha um arquivo menor.");
  }

  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const { width, height } = fitInside(img.naturalWidth, img.naturalHeight, maxSide);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(img, 0, 0, width, height);

  const outDataUrl = canvas.toDataURL(mimeType, quality);
  if (!outDataUrl || outDataUrl === "data:,") {
    throw new Error("Não foi possível processar a imagem.");
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), mimeType, quality),
  );
  if (!blob) throw new Error("Não foi possível processar a imagem.");

  return { blob, dataUrl: outDataUrl, mimeType };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao decodificar a imagem."));
    img.src = src;
  });
}

function fitInside(w: number, h: number, maxSide: number) {
  if (w <= maxSide && h <= maxSide) return { width: w, height: h };
  const ratio = w >= h ? maxSide / w : maxSide / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

export const PHOTO_ERROR_MESSAGE =
  "Não foi possível salvar esta fotografia no navegador. Tente utilizar uma imagem menor.";
