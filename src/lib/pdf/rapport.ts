import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getSociete, type Societe, hexToRgb } from "./societe";


export interface PdfRapportResultat {
  parametre: string;
  valeur: string;
  unite: string | null;
  methode: string | null;
  seuil_min: number | null;
  seuil_max: number | null;
  conformite: boolean | null;
  incertitude?: number | null;
}

export interface PdfRapportAnalyse {
  numero: string;
  prelevement: string | null;
  date_debut: string | null;
  tracabilite?: string | null;
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

function drawIsoHeader(doc: jsPDF, societe: Societe, rap: PdfRapportData, pr: number, pg: number, pb: number) {
  const w = doc.internal.pageSize.getWidth();

  // Top border line
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(1.2);
  doc.line(10, 10, w - 10, 10);
  doc.setLineWidth(0.3);
  doc.line(10, 11.5, w - 11, 11.5);

  // Laboratory info (left)
  let y = 18;
  doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(pr, pg, pb);
  doc.text(societe.raison_sociale || "BALIMS", 14, y);
  y += 5;
  doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(80);
  if (societe.accreditation) { doc.text(`Accréditation : ${societe.accreditation}`, 14, y); y += 4; }
  if (societe.adresse) { doc.text(societe.adresse, 14, y); y += 4; }
  if (societe.ville) { doc.text(societe.ville, 14, y); y += 4; }
  if (societe.telephone) { doc.text(`Tél : ${societe.telephone}`, 14, y); y += 4; }
  if (societe.email) { doc.text(`Email : ${societe.email}`, 14, y); y += 4; }
  if (societe.matricule_fiscal) { doc.text(`MF : ${societe.matricule_fiscal}`, 14, y); }

  // Title block (right)
  doc.setFontSize(16).setFont("helvetica", "bold").setTextColor(pr, pg, pb);
  doc.text("RAPPORT D'ESSAI", w - 14, 18, { align: "right" });
  doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(60);
  doc.text(`N° ${rap.numero}`, w - 14, 24, { align: "right" });
  doc.text(`Date : ${new Date(rap.date_rapport).toLocaleDateString("fr-FR")}`, w - 14, 29, { align: "right" });
  if (rap.bc_numero) doc.text(`Réf. BC : ${rap.bc_numero}`, w - 14, 34, { align: "right" });

  // ISO 17025 reference
  doc.setFontSize(7).setTextColor(130);
  doc.text("Conforme NF EN ISO/IEC 17025:2017 — LAB REF 21", w - 14, 40, { align: "right" });

  // Separator
  doc.setDrawColor(200).setLineWidth(0.5);
  doc.line(10, 46, w - 10, 46);

  return 50;
}

function drawClientBlock(doc: jsPDF, rap: PdfRapportData, startY: number, pr: number, pg: number, pb: number): number {
  const w = doc.internal.pageSize.getWidth();
  let y = startY;

  // Client box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y - 4, w - 28, 30, 2, 2, "F");

  doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(pr, pg, pb);
  doc.text("CLIENT / DEMANDEUR", 18, y + 2);
  doc.setFont("helvetica", "normal").setTextColor(50);
  doc.setFontSize(9);
  doc.text(rap.client.raison_sociale, 18, y + 8);
  if (rap.client.adresse) doc.text(rap.client.adresse, 18, y + 13);
  if (rap.client.matricule_fiscal) doc.text(`MF : ${rap.client.matricule_fiscal}`, 18, y + 18);

  // Objet
  doc.setFont("helvetica", "bold").setTextColor(pr, pg, pb);
  doc.text("OBJET :", w / 2 + 10, y + 2);
  doc.setFont("helvetica", "normal").setTextColor(50);
  const titreLines = doc.splitTextToSize(rap.titre, w / 2 - 30);
  doc.text(titreLines, w / 2 + 10, y + 8);

  return y + 34;
}

export async function generateRapportPdf(rap: PdfRapportData): Promise<Blob> {
  const societe = await getSociete();
  const [pr, pg, pb] = hexToRgb(societe.couleur_primaire);
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  let y = drawIsoHeader(doc, societe, rap, pr, pg, pb);
  y = drawClientBlock(doc, rap, y, pr, pg, pb);

  // Count conformity
  let totalParams = 0;
  let conforme = 0;
  for (const a of rap.analyses) {
    for (const r of a.resultats) {
      totalParams++;
      if (r.conformite === true) conforme++;
    }
  }

  // Summary box
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(14, y, w - 28, 12, 2, 2, "F");
  doc.setFontSize(8).setFont("helvetica", "bold").setTextColor(pr, pg, pb);
  doc.text(`Nombre d'analyses : ${rap.analyses.length}`, 18, y + 5);
  doc.text(`Paramètres testés : ${totalParams}`, 80, y + 5);
  doc.text(`Conformes : ${conforme}/${totalParams}`, 150, y + 5);
  const tauxConf = totalParams > 0 ? Math.round((conforme / totalParams) * 100) : 0;
  doc.text(`Taux : ${tauxConf}%`, 80, y + 10);
  y += 18;

  // Analyses tables
  for (const a of rap.analyses) {
    if (y > pageH - 60) { doc.addPage(); y = drawPageHeader(doc, societe, rap, pr, pg, pb); }
    doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(pr, pg, pb);
    doc.text(`Analyse ${a.numero}${a.prelevement ? ` — Prél. ${a.prelevement}` : ""}`, 14, y);
    if (a.date_debut) {
      doc.setFontSize(7).setFont("helvetica", "normal").setTextColor(120);
      doc.text(`Date début : ${new Date(a.date_debut).toLocaleDateString("fr-FR")}`, w - 14, y, { align: "right" });
    }
    y += 5;
    if (a.tracabilite) {
      doc.setFontSize(7).setFont("helvetica", "italic").setTextColor(120);
      doc.text(`Traçabilité : ${a.tracabilite}`, 14, y);
      y += 4;
    }

    autoTable(doc, {
      startY: y,
      head: [["Paramètre", "Méthode", "Résultat", "Unité", "Min", "Max", "Incert.", "Conf."]],
      body: a.resultats.map((r) => [
        r.parametre,
        r.methode ?? "—",
        r.valeur,
        r.unite ?? "—",
        r.seuil_min != null ? String(r.seuil_min) : "—",
        r.seuil_max != null ? String(r.seuil_max) : "—",
        r.incertitude != null ? `±${r.incertitude}` : "—",
        r.conformite === null ? "—" : r.conformite ? "C" : "NC",
      ]),
      headStyles: { fillColor: [pr, pg, pb], fontSize: 7, cellPadding: 2 },
      styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: {
        7: {
          halign: "center",
          fontStyle: "bold",
        },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 7) {
          const val = data.cell.raw as string;
          if (val === "C") { data.cell.styles.textColor = [0, 128, 0]; }
          else if (val === "NC") { data.cell.styles.textColor = [200, 0, 0]; }
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Conclusion
  if (rap.conclusion) {
    if (y > pageH - 50) { doc.addPage(); y = drawPageHeader(doc, societe, rap, pr, pg, pb); }
    doc.setFillColor(250, 250, 245);
    const concLines = doc.splitTextToSize(rap.conclusion, w - 36);
    const concH = concLines.length * 4 + 12;
    doc.roundedRect(14, y, w - 28, concH, 2, 2, "F");
    doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(pr, pg, pb);
    doc.text("CONCLUSION", 18, y + 6);
    doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(50);
    doc.text(concLines, 18, y + 12);
    y += concH + 6;
  }

  // Signature block
  if (y > pageH - 45) { doc.addPage(); y = drawPageHeader(doc, societe, rap, pr, pg, pb); }
  y += 5;
  doc.setDrawColor(200).setLineWidth(0.3);

  const sigW = (w - 40) / 3;
  const labels = ["Technicien", "Chef de laboratoire", "Responsable qualité"];
  for (let i = 0; i < 3; i++) {
    const x = 14 + i * (sigW + 6);
    doc.setFontSize(8).setFont("helvetica", "bold").setTextColor(80);
    doc.text(labels[i], x + sigW / 2, y, { align: "center" });
    doc.line(x, y + 18, x + sigW, y + 18);
    doc.setFontSize(7).setFont("helvetica", "normal").setTextColor(140);
    doc.text("Nom / Date / Signature", x + sigW / 2, y + 22, { align: "center" });
  }

  // Footer on all pages
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(pr, pg, pb).setLineWidth(0.5);
    doc.line(10, pageH - 14, w - 10, pageH - 14);
    doc.setFontSize(6).setTextColor(120);
    doc.text(`${societe.raison_sociale || "BALIMS"} — Rapport d'essai N° ${rap.numero}`, 14, pageH - 9);
    doc.text("Ce rapport ne concerne que les échantillons soumis à l'essai.", 14, pageH - 5);
    doc.text(`Page ${i}/${pages}`, w - 14, pageH - 9, { align: "right" });
    doc.text(`Émis le ${new Date(rap.date_rapport).toLocaleDateString("fr-FR")}`, w - 14, pageH - 5, { align: "right" });
  }

  return doc.output("blob");
}

function drawPageHeader(doc: jsPDF, societe: Societe, rap: PdfRapportData, pr: number, pg: number, pb: number): number {
  const w = doc.internal.pageSize.getWidth();
  doc.setDrawColor(pr, pg, pb).setLineWidth(0.5);
  doc.line(10, 10, w - 10, 10);
  doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(pr, pg, pb);
  doc.text(societe.raison_sociale || "BALIMS", 14, 16);
  doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(100);
  doc.text(`Rapport d'essai N° ${rap.numero} (suite)`, w - 14, 16, { align: "right" });
  doc.setDrawColor(200).line(10, 19, w - 10, 19);
  return 25;
}
