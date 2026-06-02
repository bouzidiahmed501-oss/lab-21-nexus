import { useEffect, useRef } from "react";
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

/**
 * Opens a print window with one or more A6 labels containing a Code128 barcode.
 */
export function printLabels(labels: LabelData[]) {
  if (labels.length === 0) return;
  const win = window.open("", "_blank", "width=600,height=800");
  if (!win) return;

  win.document.write(`<!doctype html><html><head><title>Étiquettes</title>
  <style>
    @page { size: A6; margin: 4mm; }
    body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 0; }
    .label {
      page-break-after: always; padding: 8mm 6mm; box-sizing: border-box;
      display: flex; flex-direction: column; gap: 6px;
      border: 1px dashed #ccc; margin: 4mm;
    }
    .label:last-child { page-break-after: auto; }
    .row { display: flex; justify-content: space-between; font-size: 11pt; }
    .label h2 { margin: 0; font-size: 14pt; }
    .meta { font-size: 9pt; color: #444; }
    .barcode-wrap { display: flex; justify-content: center; padding: 4px 0; }
    @media print { .label { border: none; margin: 0; } }
  </style></head><body><div id="root"></div></body></html>`);
  win.document.close();

  const root = win.document.getElementById("root")!;
  const reactRoot = createRoot(root);
  reactRoot.render(
    <>
      {labels.map((l, i) => (
        <div className="label" key={i}>
          <h2>{l.numero}</h2>
          <div className="meta">{l.client ?? ""}</div>
          {l.denomination && <div className="meta">{l.denomination}</div>}
          {l.lot && <div className="meta">Lot : {l.lot}</div>}
          {l.date && <div className="meta">Date : {l.date}</div>}
          <div className="barcode-wrap">
            <Barcode value={l.code_barre} height={70} width={2} fontSize={12} />
          </div>
        </div>
      ))}
    </>
  );

  setTimeout(() => {
    win.focus();
    win.print();
  }, 400);
}
