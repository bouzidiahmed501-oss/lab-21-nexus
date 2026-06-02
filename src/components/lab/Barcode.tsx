import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export function Barcode({
  value,
  format = "CODE128",
  width = 2,
  height = 60,
  displayValue = true,
  fontSize = 14,
  className,
}: BarcodeProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        margin: 4,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (e) {
      console.error("Barcode render error", e);
    }
  }, [value, format, width, height, displayValue, fontSize]);

  return <svg ref={ref} className={className} />;
}
