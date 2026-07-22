import type { ProtocolState } from "./protocol-store";

/**
 * Converte uma foto para dados que o jsPDF consegue embutir. Data URLs passam
 * direto; URLs remotas (Supabase Storage) são baixadas e convertidas. Retorna
 * null se não for possível obter a imagem.
 */
async function photoToImageData(photo: string): Promise<string | null> {
  if (photo.startsWith("data:")) return photo;
  if (!/^https?:\/\//.test(photo)) return null;
  try {
    const res = await fetch(photo);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function buildProtocolPDF(state: ProtocolState) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const brand: [number, number, number] = [23, 61, 50];
  const accent: [number, number, number] = [217, 70, 239];

  const completedDays = Object.values(state.days).filter((d) => d.completed).length;
  const totalApplications = state.applications.length;
  const totalNotes = Object.values(state.days).filter((d) => d.note?.trim()).length;
  const totalPhotos = Object.values(state.days).filter((d) => d.photo).length;

  doc.setFontSize(22);
  doc.setTextColor(...brand);
  doc.text("Relatório: Guia Prático Orquídeas Floridas", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);
  doc.text(`Planta: ${state.plant.name || "Não informada"}`, 14, 37);

  autoTable(doc, {
    startY: 45,
    head: [["Métrica", "Valor"]],
    body: [
      ["Dias Concluídos", `${completedDays} de 21`],
      ["Aplicações Realizadas", totalApplications.toString()],
      ["Registros de Observação", totalNotes.toString()],
      ["Fotos Registradas", totalPhotos.toString()],
    ],
    theme: "striped",
    headStyles: { fillColor: brand },
  });

  const records = Object.entries(state.days)
    .filter(([_, d]) => d.completed || d.note?.trim() || d.photo)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([day, d]) => [
      `Dia ${day}`,
      d.completed ? "Sim" : "Não",
      d.note || "-",
      d.applicationDone ? "Realizada" : "-",
      d.photo ? "Sim" : "-",
    ]);

  const lastY = () => (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;

  if (records.length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(...brand);
    doc.text("Detalhamento por Dia", 14, lastY() + 15);

    autoTable(doc, {
      startY: lastY() + 20,
      head: [["Dia", "Concluído", "Observação", "Aplicação", "Foto"]],
      body: records,
      theme: "grid",
      headStyles: { fillColor: accent },
      columnStyles: { 2: { cellWidth: 80 } },
    });
  }

  // Anexo de fotos
  const photoEntries = Object.entries(state.days)
    .filter(([_, d]) => !!d.photo)
    .sort(([a], [b]) => Number(a) - Number(b));

  if (photoEntries.length > 0) {
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(...brand);
    doc.text("Registro Fotográfico", 14, 20);

    let y = 32;
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgW = 80;
    const imgH = 80;

    for (const [day, d] of photoEntries) {
      if (!d.photo) continue;
      const imgData = await photoToImageData(d.photo);
      if (y + imgH + 14 > pageHeight - 10) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.setTextColor(...brand);
      doc.text(`Dia ${day}`, 14, y);
      if (imgData) {
        try {
          doc.addImage(imgData, "JPEG", 14, y + 4, imgW, imgH);
        } catch {
          try {
            doc.addImage(imgData, "PNG", 14, y + 4, imgW, imgH);
          } catch {
            doc.setTextColor(150);
            doc.text("(imagem indisponível)", 14, y + 20);
          }
        }
      } else {
        doc.setTextColor(150);
        doc.text("(imagem indisponível)", 14, y + 20);
      }
      y += imgH + 16;
    }
  }

  return doc;
}

export function protocolPdfFilename(state: ProtocolState) {
  return `protocolo-orquidea-${state.plant.name || "resumo"}.pdf`;
}

export async function exportProtocolPDF(state: ProtocolState) {
  const doc = await buildProtocolPDF(state);
  doc.save(protocolPdfFilename(state));
}

export async function previewProtocolPDF(state: ProtocolState): Promise<string> {
  const doc = await buildProtocolPDF(state);
  const blob = doc.output("blob") as Blob;
  return URL.createObjectURL(blob);
}
