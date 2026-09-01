import { createRoot } from "react-dom/client";
import { Barcode } from "./Barcode";

export interface LabelData {
  code_barre: string;
  numero: string;
  client?: string | null;
  date?: string | null;
  denomination?: string | null;
  lot?: string | null;
}

export type LabelFormat = "a6" | "roll";

export const LABEL_FORMAT_LABEL: Record<LabelFormat, string> = {
  a6: "A6 flacon (105 × 148 mm)",
  roll: "Rouleau 50 × 25 mm",
};

const STYLES: Record<LabelFormat, string> = {
  a6: `
    @page { size: A6; margin: 4mm; }
    .label {
      page-break-after: always; box-sizing: border-box;
      width: 97mm; min-height: 140mm; padding: 6mm;
      display: flex; flex-direction: column; gap: 6px;
    }
    .label h2 { margin: 0; font-size: 14pt; }
    .meta { font-size: 9pt; color: #333; }
    .barcode-wrap { display: flex; justify-content: center; padding: 4px 0; }
  `,
  roll: `
    @page { size: 50mm 25mm; margin: 0; }
    .label {
      page-break-after: always; box-sizing: border-box;
      width: 50mm; height: 25mm; padding: 1.5mm 2mm;
      display: flex; flex-direction: column; justify-content: space-between;
      overflow: hidden;
    }
    .label h2 { margin: 0; font-size: 8pt; line-height: 1.1; }
    .meta { font-size: 6pt; color: #333; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .barcode-wrap { display: flex; justify-content: center; }
  `,
};

/**
 * Opens a print window with one or more labels containing a Code128 barcode.
 * Supports A6 (bottle) and 50×25 mm roll formats, batch printing.
 */
export function printLabels(labels: LabelData[], format: LabelFormat = "a6") {
  if (labels.length === 0) return;
  const win = window.open("", "_blank", "width=680,height=820");
  if (!win) return;

  const roll = format === "roll";

  win.document.write(`<!doctype html><html><head><title>Étiquettes (${labels.length})</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 0; background: #fff; }
    ${STYLES[format]}
    .label:last-child { page-break-after: auto; }
    @media screen { .label { border: 1px solid #e5e7eb; margin: 4mm auto; } }
    @media print { .label { border: none; margin: 0; } }
  </style></head><body><div id="root"></div></body></html>`);
  win.document.close();

  const root = win.document.getElementById("root")!;
  createRoot(root).render(
    <>
      {labels.map((l, i) => (
        <div className="label" key={i}>
          <h2>{l.numero}</h2>
          {l.client && <div className="meta">{l.client}</div>}
          {!roll && l.denomination && <div className="meta">{l.denomination}</div>}
          {!roll && l.lot && <div className="meta">Lot : {l.lot}</div>}
          {l.date && <div className="meta">{roll ? l.date : `Date : ${l.date}`}</div>}
          <div className="barcode-wrap">
            <Barcode
              value={l.code_barre}
              height={roll ? 26 : 70}
              width={roll ? 1 : 2}
              fontSize={roll ? 7 : 12}
            />
          </div>
        </div>
      ))}
    </>
  );

  setTimeout(() => {
    win.focus();
    win.print();
  }, 450);
}
