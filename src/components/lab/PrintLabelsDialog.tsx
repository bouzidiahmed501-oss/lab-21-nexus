import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { printLabels, LABEL_FORMAT_LABEL, type LabelData, type LabelFormat } from "./PrintLabels";

interface Props {
  labels: LabelData[];
  triggerLabel?: string;
  disabled?: boolean;
}

/** Batch label printing with format choice (A6 bottle / 50×25 mm roll). */
export function PrintLabelsDialog({ labels, triggerLabel = "Imprimer étiquettes", disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<LabelFormat>("a6");
  const [copies, setCopies] = useState(1);

  const valid = labels.filter((l) => !!l.code_barre);

  const handlePrint = () => {
    const expanded = valid.flatMap((l) => Array.from({ length: Math.max(1, copies) }, () => l));
    printLabels(expanded, format);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled || valid.length === 0}>
          <Printer className="h-3.5 w-3.5" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Impression d'étiquettes</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {valid.length} étiquette{valid.length > 1 ? "s" : ""} à imprimer
            {valid.length !== labels.length && ` (${labels.length - valid.length} sans code-barres ignorée(s))`}.
          </p>
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as LabelFormat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(LABEL_FORMAT_LABEL) as LabelFormat[]).map((f) => (
                  <SelectItem key={f} value={f}>{LABEL_FORMAT_LABEL[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Exemplaires par étiquette</Label>
            <Input type="number" min={1} max={10} value={copies}
              onChange={(e) => setCopies(Math.min(10, Math.max(1, Number(e.target.value) || 1)))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={handlePrint} disabled={valid.length === 0}>
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
