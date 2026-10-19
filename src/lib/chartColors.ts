import { useEffect, useState } from "react";

/**
 * SVG presentation attributes (fill/stroke) do not resolve CSS variables,
 * so chart colors are read from the theme tokens at runtime.
 */
export function useThemeColors(names: string[], fallback = "currentColor"): string[] {
  const [colors, setColors] = useState<string[]>(() => names.map(() => fallback));
  const key = names.join("|");
  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      setColors(names.map((n) => s.getPropertyValue(n).trim() || fallback));
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fallback]);
  return colors;
}
