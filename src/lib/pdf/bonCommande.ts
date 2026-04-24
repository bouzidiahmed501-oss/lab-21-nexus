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
}

async function getSociete(): Promise<Societe> {
  const { data } = await supabase
    .from("app_settings")
    .select("settings")
    .eq("category", "societe")
    .maybeSingle();
  return ((data?.settings as Societe) ?? {}) as Societe;
}

export interface PdfBcLine {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  remise_pct: number;
  tva_pct: number;
  total_ht: number;
}

export interface PdfBcData {
  numero: string;
  date_bc: string;
  client: { raison_sociale: string; adresse?: string; matricule_fiscal?: string };
  reference_client?: string | null;
  objet?: string | null;
  conditions?: string | null;
  lignes: PdfBcLine[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

export async function generateBcPdf(bc: PdfBcData): Promise<Blob> {
  const societe = await getSociete();
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16).setFont("helvetica", "bold");
  doc.text(societe.raison_sociale || "BALIMS", 14, 20);
  doc.setFontSize(9).setFont("helvetica", "normal");
  if (societe.adresse) doc.text(societe.adresse, 14, 26);
  if (societe.matricule_fiscal) doc.text(`MF: ${societe.matricule_fiscal}`, 14, 31);
  if (societe.telephone) doc.text(`Tél: ${societe.telephone}`, 14, 36);

  doc.setFontSize(14).setFont("helvetica", "bold");
  doc.text("BON DE COMMANDE", w - 14, 20, { align: "right" });
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text(`N° ${bc.numero}`, w - 14, 27, { align: "right" });
  doc.text(`Date: ${new Date(bc.date_bc).toLocaleDateString("fr-FR")}`, w - 14, 32, { align: "right" });

  // Client
  doc.setDrawColor(200).line(14, 45, w - 14, 45);
  doc.setFontSize(10).setFont("helvetica", "bold");
  doc.text("Client:", 14, 52);
  doc.setFont("helvetica", "normal");
  doc.text(bc.client.raison_sociale, 14, 57);
  if (bc.client.adresse) doc.text(bc.client.adresse, 14, 62);
  if (bc.client.matricule_fiscal) doc.text(`MF: ${bc.client.matricule_fiscal}`, 14, 67);
  if (bc.reference_client) doc.text(`Réf. client: ${bc.reference_client}`, w - 14, 52, { align: "right" });
  if (bc.objet) doc.text(`Objet: ${bc.objet}`, w - 14, 57, { align: "right" });

  // Lignes
  autoTable(doc, {
    startY: 78,
    head: [["Désignation", "Qté", "PU HT", "Remise %", "TVA %", "Total HT"]],
    body: bc.lignes.map((l) => [
      l.designation,
      String(l.quantite),
      l.prix_unitaire.toFixed(3),
      l.remise_pct.toFixed(2),
      l.tva_pct.toFixed(2),
      l.total_ht.toFixed(3),
    ]),
    headStyles: { fillColor: [40, 60, 100] },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total HT: ${bc.total_ht.toFixed(3)} TND`, w - 14, finalY, { align: "right" });
  doc.text(`Total TVA: ${bc.total_tva.toFixed(3)} TND`, w - 14, finalY + 6, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(`Total TTC: ${bc.total_ttc.toFixed(3)} TND`, w - 14, finalY + 14, { align: "right" });
  doc.setFont("helvetica", "normal");

  if (bc.conditions) {
    doc.setFontSize(8);
    doc.text("Conditions:", 14, finalY + 28);
    const lines = doc.splitTextToSize(bc.conditions, w - 28);
    doc.text(lines, 14, finalY + 33);
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7).setTextColor(120);
  doc.text("BALIMS — Système de gestion de laboratoire", w / 2, pageH - 8, { align: "center" });

  return doc.output("blob");
}
