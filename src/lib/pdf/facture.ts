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
  rib?: string;
  banque?: string;
}

async function getSociete(): Promise<Societe> {
  const { data } = await supabase.from("app_settings").select("settings").eq("category", "societe").maybeSingle();
  return ((data?.settings as Societe) ?? {}) as Societe;
}

export interface PdfFactureLigne {
  reference: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  tva: number;
  total_ht: number;
}

export interface PdfFactureData {
  numero: string;
  date_facture: string;
  date_echeance?: string | null;
  client: { raison_sociale: string; adresse?: string; matricule_fiscal?: string; code_tva?: string };
  lignes: PdfFactureLigne[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  timbre: number;
  retenue_source: number;
  net_a_payer: number;
  net_a_payer_texte?: string | null;
  mode_reglement?: string | null;
}

function numberToFrench(n: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
    "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
  if (n === 0) return "zéro";
  if (n < 0) return "moins " + numberToFrench(-n);
  let result = "";
  if (n >= 1000) { result += numberToFrench(Math.floor(n / 1000)) + " mille "; n %= 1000; }
  if (n >= 100) { const h = Math.floor(n / 100); result += (h === 1 ? "cent " : units[h] + " cent "); n %= 100; }
  if (n >= 20) {
    const t = Math.floor(n / 10);
    if (t === 7 || t === 9) { result += tens[t] + "-"; n = n - t * 10 + 10; }
    else { result += tens[t]; n %= 10; if (n === 1 && t !== 8) result += " et"; if (n > 0) result += "-"; }
  }
  if (n > 0) result += units[n];
  return result.trim();
}

function amountToWords(amount: number): string {
  const int = Math.floor(amount);
  const dec = Math.round((amount - int) * 1000);
  let text = numberToFrench(int) + " dinars";
  if (dec > 0) text += " et " + numberToFrench(dec) + " millimes";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function generateFacturePdf(fac: PdfFactureData): Promise<Blob> {
  const societe = await getSociete();
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Header
  doc.setDrawColor(40, 60, 100).setLineWidth(1.2);
  doc.line(10, 10, w - 10, 10);

  doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(40, 60, 100);
  doc.text(societe.raison_sociale || "BALIMS", 14, 20);
  doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(80);
  let sy = 25;
  if (societe.adresse) { doc.text(societe.adresse, 14, sy); sy += 4; }
  if (societe.ville) { doc.text(societe.ville, 14, sy); sy += 4; }
  if (societe.telephone) { doc.text(`Tél : ${societe.telephone}`, 14, sy); sy += 4; }
  if (societe.matricule_fiscal) { doc.text(`MF : ${societe.matricule_fiscal}`, 14, sy); }

  // Title
  doc.setFontSize(18).setFont("helvetica", "bold").setTextColor(40, 60, 100);
  doc.text("FACTURE", w - 14, 20, { align: "right" });
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(60);
  doc.text(`N° ${fac.numero}`, w - 14, 27, { align: "right" });
  doc.text(`Date : ${new Date(fac.date_facture).toLocaleDateString("fr-FR")}`, w - 14, 33, { align: "right" });
  if (fac.date_echeance) doc.text(`Échéance : ${new Date(fac.date_echeance).toLocaleDateString("fr-FR")}`, w - 14, 39, { align: "right" });

  // Client box
  doc.setDrawColor(200).line(10, 46, w - 10, 46);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(w / 2 + 5, 50, w / 2 - 19, 28, 2, 2, "F");
  doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(40, 60, 100);
  doc.text("DOIT :", w / 2 + 10, 56);
  doc.setFont("helvetica", "normal").setTextColor(50);
  doc.text(fac.client.raison_sociale, w / 2 + 10, 62);
  if (fac.client.adresse) doc.text(fac.client.adresse, w / 2 + 10, 67);
  if (fac.client.matricule_fiscal) doc.text(`MF : ${fac.client.matricule_fiscal}`, w / 2 + 10, 72);
  if (fac.client.code_tva) doc.text(`Code TVA : ${fac.client.code_tva}`, w / 2 + 10, 77);

  // Mode reglement
  if (fac.mode_reglement) {
    doc.setFontSize(8).setTextColor(80);
    doc.text(`Mode de règlement : ${fac.mode_reglement}`, 14, 56);
  }

  // Table
  autoTable(doc, {
    startY: 84,
    head: [["Réf.", "Désignation", "Qté", "P.U. HT", "Rem.%", "TVA%", "Total HT"]],
    body: fac.lignes.map((l) => [
      l.reference || "",
      l.designation,
      String(l.quantite),
      l.prix_unitaire.toFixed(3),
      l.remise.toFixed(1) + "%",
      l.tva.toFixed(0) + "%",
      l.total_ht.toFixed(3),
    ]),
    headStyles: { fillColor: [40, 60, 100], fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: {
      2: { halign: "right" }, 3: { halign: "right" },
      4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" },
    },
  });
  let y = (doc as any).lastAutoTable.finalY + 8;

  // Totals box
  const totX = w - 80;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(totX - 4, y - 2, 70, 42, 2, 2, "F");

  doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(50);
  const tots: [string, string][] = [
    ["Total HT", `${fac.total_ht.toFixed(3)} DT`],
    ["TVA 19%", `${fac.total_tva.toFixed(3)} DT`],
    ["Total TTC", `${fac.total_ttc.toFixed(3)} DT`],
    ["Timbre fiscal", `${fac.timbre.toFixed(3)} DT`],
    ["Retenue source", `${fac.retenue_source.toFixed(3)} DT`],
  ];
  let ty = y + 2;
  for (const [lbl, val] of tots) {
    doc.text(lbl, totX, ty);
    doc.text(val, w - 18, ty, { align: "right" });
    ty += 6;
  }
  doc.setFont("helvetica", "bold").setTextColor(40, 60, 100);
  doc.text("NET À PAYER", totX, ty + 2);
  doc.setFontSize(11);
  doc.text(`${fac.net_a_payer.toFixed(3)} DT`, w - 18, ty + 2, { align: "right" });
  y = ty + 12;

  // Amount in words
  const words = fac.net_a_payer_texte || amountToWords(fac.net_a_payer);
  doc.setFontSize(8).setFont("helvetica", "italic").setTextColor(80);
  doc.text(`Arrêtée la présente facture à la somme de : ${words}`, 14, y);
  y += 8;

  // Bank details
  if (societe.rib || societe.banque) {
    doc.setFontSize(7).setFont("helvetica", "normal").setTextColor(100);
    if (societe.banque) { doc.text(`Banque : ${societe.banque}`, 14, y); y += 3.5; }
    if (societe.rib) { doc.text(`RIB : ${societe.rib}`, 14, y); }
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(40, 60, 100).setLineWidth(0.3);
    doc.line(10, pageH - 12, w - 10, pageH - 12);
    doc.setFontSize(6).setTextColor(120);
    doc.text(`${societe.raison_sociale || "BALIMS"} — Facture N° ${fac.numero}`, 14, pageH - 7);
    doc.text(`Page ${i}/${pages}`, w - 14, pageH - 7, { align: "right" });
  }

  return doc.output("blob");
}
