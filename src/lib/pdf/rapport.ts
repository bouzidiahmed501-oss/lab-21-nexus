import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

interface Societe {
  raison_sociale?: string;
  adresse?: string;
  matricule_fiscal?: string;
  telephone?: string;
  email?: string;
  ville?: string;
  accreditation?: string;
}

async function getSociete(): Promise<Societe> {
  const { data } = await supabase.from("app_settings").select("settings").eq("category", "societe").maybeSingle();
  return ((data?.settings as Societe) ?? {}) as Societe;
}

export interface PdfRapportResultat {
  parametre: string;
  valeur: string;
  unite: string | null;
  methode: string | null;
  seuil_min: number | null;
  seuil_max: number | null;
  conformite: boolean | null;
}

export interface PdfRapportAnalyse {
  numero: string;
  prelevement: string | null;
  date_debut: string | null;
  resultats: PdfRapportResultat[];
}

export interface PdfRapportData {
  numero: string;
  titre: string;
  date_rapport: string;
  client: { raison_sociale: string; adresse?: string; matricule_fiscal?: string };
  bc_numero?: string | null;
  conclusion?: string | null;
  analyses: PdfRapportAnalyse[];
}

export async function generateRapportPdf(rap: PdfRapportData): Promise<Blob> {
  const societe = await getSociete();
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(15).setFont("helvetica", "bold");
  doc.text(societe.raison_sociale || "BALIMS", 14, 18);
  doc.setFontSize(8).setFont("helvetica", "normal");
  if (societe.adresse) doc.text(societe.adresse, 14, 24);
  if (societe.matricule_fiscal) doc.text(`MF: ${societe.matricule_fiscal}`, 14, 28);
  if (societe.telephone) doc.text(`Tél: ${societe.telephone}`, 14, 32);
  if (societe.accreditation) doc.text(`Accréditation: ${societe.accreditation}`, 14, 36);

  doc.setFontSize(13).setFont("helvetica", "bold");
  doc.text("RAPPORT D'ESSAI", w - 14, 18, { align: "right" });
  doc.setFontSize(9).setFont("helvetica", "normal");
  doc.text(`N° ${rap.numero}`, w - 14, 24, { align: "right" });
  doc.text(`Date: ${new Date(rap.date_rapport).toLocaleDateString("fr-FR")}`, w - 14, 28, { align: "right" });
  if (rap.bc_numero) doc.text(`BC: ${rap.bc_numero}`, w - 14, 32, { align: "right" });

  // Separator
  doc.setDrawColor(200).line(14, 42, w - 14, 42);

  // Client block
  doc.setFontSize(10).setFont("helvetica", "bold");
  doc.text("Client:", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.text(rap.client.raison_sociale, 14, 55);
  if (rap.client.adresse) doc.text(rap.client.adresse, 14, 60);
  if (rap.client.matricule_fiscal) doc.text(`MF: ${rap.client.matricule_fiscal}`, 14, 65);

  doc.setFont("helvetica", "bold");
  doc.text("Objet du rapport:", w - 14, 50, { align: "right" });
  doc.setFont("helvetica", "normal");
  const titreLines = doc.splitTextToSize(rap.titre, 90);
  doc.text(titreLines, w - 14, 55, { align: "right" });

  let y = 78;

  // Analyses
  for (const a of rap.analyses) {
    if (y > pageH - 50) { doc.addPage(); y = 20; }
    doc.setFontSize(10).setFont("helvetica", "bold");
    doc.text(`Analyse ${a.numero}${a.prelevement ? ` — Prélèvement ${a.prelevement}` : ""}`, 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Paramètre", "Méthode", "Résultat", "Unité", "Seuils", "Conf."]],
      body: a.resultats.map((r) => [
        r.parametre,
        r.methode ?? "—",
        r.valeur,
        r.unite ?? "—",
        `${r.seuil_min ?? "—"} / ${r.seuil_max ?? "—"}`,
        r.conformite === null ? "—" : r.conformite ? "OK" : "NC",
      ]),
      headStyles: { fillColor: [40, 60, 100], fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: { 5: { halign: "center" } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Conclusion
  if (rap.conclusion) {
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setFontSize(10).setFont("helvetica", "bold");
    doc.text("Conclusion", 14, y);
    y += 5;
    doc.setFontSize(9).setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(rap.conclusion, w - 28);
    doc.text(lines, 14, y);
  }

  // Footer + signature
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7).setTextColor(120);
    doc.text("BALIMS — Rapport d'essai", 14, pageH - 8);
    doc.text(`Page ${i}/${pages}`, w - 14, pageH - 8, { align: "right" });
  }

  return doc.output("blob");
}
