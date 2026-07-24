import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getSociete, hexToRgb } from "./societe";


export interface PdfDevisLine {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  remise_pct: number;
  tva_pct: number;
  total_ht: number;
}

export interface PdfDevisData {
  numero: string;
  date_devis: string;
  validite_jours: number;
  client: { raison_sociale: string; adresse?: string; matricule_fiscal?: string };
  reference_client?: string | null;
  objet?: string | null;
  conditions?: string | null;
  lignes: PdfDevisLine[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

export async function generateDevisPdf(d: PdfDevisData): Promise<Blob> {
  const societe = await getSociete();
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  doc.setFontSize(16).setFont("helvetica", "bold");
  doc.text(societe.raison_sociale || "BALIMS", 14, 20);
  doc.setFontSize(9).setFont("helvetica", "normal");
  if (societe.adresse) doc.text(societe.adresse, 14, 26);
  if (societe.matricule_fiscal) doc.text(`MF: ${societe.matricule_fiscal}`, 14, 31);
  if (societe.telephone) doc.text(`Tél: ${societe.telephone}`, 14, 36);

  doc.setFontSize(14).setFont("helvetica", "bold");
  doc.text("DEVIS", w - 14, 20, { align: "right" });
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text(`N° ${d.numero}`, w - 14, 27, { align: "right" });
  doc.text(`Date: ${new Date(d.date_devis).toLocaleDateString("fr-FR")}`, w - 14, 32, { align: "right" });
  doc.text(`Validité: ${d.validite_jours} jours`, w - 14, 37, { align: "right" });

  doc.setDrawColor(200).line(14, 48, w - 14, 48);
  doc.setFontSize(10).setFont("helvetica", "bold");
  doc.text("Client:", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(d.client.raison_sociale, 14, 60);
  if (d.client.adresse) doc.text(d.client.adresse, 14, 65);
  if (d.client.matricule_fiscal) doc.text(`MF: ${d.client.matricule_fiscal}`, 14, 70);
  if (d.reference_client) doc.text(`Réf. client: ${d.reference_client}`, w - 14, 55, { align: "right" });
  if (d.objet) doc.text(`Objet: ${d.objet}`, w - 14, 60, { align: "right" });

  autoTable(doc, {
    startY: 80,
    head: [["Désignation", "Qté", "PU HT", "Remise %", "TVA %", "Total HT"]],
    body: d.lignes.map((l) => [
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
  doc.text(`Total HT: ${d.total_ht.toFixed(3)} TND`, w - 14, finalY, { align: "right" });
  doc.text(`Total TVA: ${d.total_tva.toFixed(3)} TND`, w - 14, finalY + 6, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(`Total TTC: ${d.total_ttc.toFixed(3)} TND`, w - 14, finalY + 14, { align: "right" });
  doc.setFont("helvetica", "normal");

  if (d.conditions) {
    doc.setFontSize(8);
    doc.text("Conditions:", 14, finalY + 28);
    const lines = doc.splitTextToSize(d.conditions, w - 28);
    doc.text(lines, 14, finalY + 33);
  }

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7).setTextColor(120);
  doc.text("BALIMS — Devis sans engagement", w / 2, pageH - 8, { align: "center" });

  return doc.output("blob");
}
