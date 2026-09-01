export interface FrPrintTache {
  designation?: string | null;
  prelevement?: string | null;
  parametre?: string | null;
  technicien?: string | null;
  priorite?: string | null;
}

export interface FrPrintData {
  numero: string;
  date_fr?: string | null;
  laboratoire?: string | null;
  notes?: string | null;
  societe?: string | null;
  taches: FrPrintTache[];
}

const esc = (v: unknown) =>
  String(v ?? "—").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

/**
 * Field-optimised roadmap printout: one page, checkboxes per task, signature block.
 */
export function printFeuilleRoute(fr: FrPrintData) {
  const win = window.open("", "_blank", "width=900,height=900");
  if (!win) return;

  const dateStr = fr.date_fr ? new Date(fr.date_fr).toLocaleDateString("fr-FR") : "—";

  const rows = fr.taches.length
    ? fr.taches
        .map(
          (t, i) => `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(t.designation)}</td>
        <td class="mono">${esc(t.prelevement)}</td>
        <td>${esc(t.parametre)}</td>
        <td>${esc(t.technicien)}</td>
        <td class="c box"></td>
        <td class="obs"></td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="7" class="c muted">Aucune tâche planifiée</td></tr>`;

  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Feuille de route ${esc(fr.numero)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, system-ui, Arial, sans-serif; color: #111; font-size: 10pt; margin: 0; }
    header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 6px; }
    h1 { font-size: 15pt; margin: 0; }
    .sub { font-size: 9pt; color: #444; }
    .info { display: flex; gap: 24px; margin: 10px 0 8px; font-size: 10pt; }
    .info b { display: block; font-size: 8pt; color: #555; text-transform: uppercase; letter-spacing: .04em; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { border: 1px solid #999; padding: 5px 6px; vertical-align: top; }
    th { background: #f1f3f5; font-size: 8.5pt; text-align: left; text-transform: uppercase; letter-spacing: .03em; }
    td { font-size: 9.5pt; height: 22px; }
    .c { text-align: center; }
    .mono { font-family: ui-monospace, Menlo, monospace; font-size: 9pt; }
    .muted { color: #777; }
    .box { width: 34px; }
    .obs { width: 110px; }
    .notes { margin-top: 10px; font-size: 9pt; border: 1px dashed #999; padding: 6px; min-height: 34px; }
    .sign { display: flex; gap: 16px; margin-top: 16px; }
    .sign div { flex: 1; border: 1px solid #999; height: 68px; padding: 4px 6px; font-size: 8pt; color: #555; }
    footer { margin-top: 10px; font-size: 7.5pt; color: #666; display: flex; justify-content: space-between; border-top: 1px solid #ccc; padding-top: 4px; }
  </style></head><body>
    <header>
      <div>
        <h1>Feuille de route ${esc(fr.numero)}</h1>
        <div class="sub">${esc(fr.societe ?? "BALIMS")} — document terrain</div>
      </div>
      <div class="sub">Imprimée le ${new Date().toLocaleDateString("fr-FR")}</div>
    </header>
    <div class="info">
      <span><b>Date</b>${dateStr}</span>
      <span><b>Laboratoire</b>${esc(fr.laboratoire)}</span>
      <span><b>Tâches</b>${fr.taches.length}</span>
    </div>
    <table>
      <thead><tr>
        <th class="c">#</th><th>Désignation</th><th>Prélèvement</th><th>Paramètre</th>
        <th>Technicien</th><th class="c">Fait</th><th>Observation</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="notes"><b>Notes / incidents :</b> ${esc(fr.notes ?? "")}</div>
    <div class="sign">
      <div>Préleveur / technicien — nom, date et signature</div>
      <div>Responsable laboratoire — nom, date et signature</div>
    </div>
    <footer><span>Feuille de route ${esc(fr.numero)}</span><span>Page 1/1</span></footer>
  </body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 350);
}
