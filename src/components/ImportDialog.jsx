import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// type: "prep_items" | "sidework_tasks"
const CONFIGS = {
  prep_items: {
    label: "Prep Items",
    columns: ["name", "quantity", "unit", "notes", "priority"],
    hints: [
      "name — required (e.g. Dice onions)",
      "quantity — optional (e.g. 5)",
      "unit — optional (e.g. lbs, quarts)",
      "notes — optional",
      "priority — optional: high | medium | low (default: medium)",
    ],
    sampleRows: [
      ["Dice onions", "5", "lbs", "Medium dice", "high"],
      ["Portion steaks", "12", "each", "", "medium"],
      ["Make vinaigrette", "2", "quarts", "Shake well before service", "low"],
    ],
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "string" },
              unit: { type: "string" },
              notes: { type: "string" },
              priority: { type: "string" },
            },
          },
        },
      },
    },
  },
  sidework_tasks: {
    label: "Side Work Tasks",
    columns: ["name", "description", "role", "shift_type", "priority", "due_time", "requires_photo", "requires_approval"],
    hints: [
      "name — required (e.g. Roll silverware)",
      "description — optional",
      "role — server | bartender | host | busser | food_runner",
      "shift_type — opening | mid | closing",
      "priority — high | medium | low (default: medium)",
      "due_time — optional (e.g. 5:00 PM)",
      "requires_photo — true | false (default: false)",
      "requires_approval — true | false (default: false)",
    ],
    sampleRows: [
      ["Roll silverware", "Full roll, 50 per bundle", "server", "closing", "high", "5:00 PM", "false", "true"],
      ["Wipe menus", "Use sanitizer spray", "host", "opening", "medium", "", "false", "false"],
      ["Stock speed rail", "Check par levels", "bartender", "opening", "high", "10:00 AM", "true", "false"],
    ],
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              role: { type: "string" },
              shift_type: { type: "string" },
              priority: { type: "string" },
              due_time: { type: "string" },
              requires_photo: { type: "string" },
              requires_approval: { type: "string" },
            },
          },
        },
      },
    },
  },
};

function downloadCSV(filename, columns, rows) {
  const escape = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [columns.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportDialog({ open, onOpenChange, type, onImport }) {
  const config = CONFIGS[type];
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (f) => {
    setFile(f);
    setPreview(null);
    setError("");
    setParsing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: config.schema,
    });
    setParsing(false);
    if (result.status !== "success" || !result.output?.items?.length) {
      setError("Could not parse file. Make sure it matches the template format.");
      return;
    }
    setPreview(result.output.items);
  };

  const handleImport = async () => {
    if (!preview?.length) return;
    setImporting(true);
    await onImport(preview);
    setImporting(false);
    setFile(null);
    setPreview(null);
    onOpenChange(false);
    toast.success(`Imported ${preview.length} ${config.label.toLowerCase()}`);
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {config.label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Download template */}
          <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium">Step 1 — Download the template</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(`${type}_template.csv`, config.columns, config.sampleRows)}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
            <div className="space-y-1">
              {config.hints.map(h => (
                <p key={h} className="text-xs text-muted-foreground font-mono leading-relaxed">{h}</p>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Step 2 — Upload your filled file</p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary transition-colors">
              {parsing ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : file ? (
                <CheckCircle2 className="h-6 w-6 text-accent" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {parsing ? "Parsing…" : file ? file.name : "Click to upload CSV or Excel (.xlsx)"}
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="ops-input hidden"
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
              />
            </label>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-accent">
                <CheckCircle2 className="h-4 w-4 inline mr-1" />
                {preview.length} rows ready to import
              </p>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-border divide-y divide-border text-xs">
                {preview.slice(0, 8).map((row, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-2">
                    <span className="font-medium truncate">{row.name || "(no name)"}</span>
                    {row.quantity && <span className="text-muted-foreground">{row.quantity}{row.unit ? ` ${row.unit}` : ""}</span>}
                    {row.role && <span className="text-muted-foreground">{row.role}</span>}
                    {row.shift_type && <span className="text-muted-foreground">{row.shift_type}</span>}
                  </div>
                ))}
                {preview.length > 8 && (
                  <div className="px-3 py-2 text-muted-foreground">…and {preview.length - 8} more</div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={!preview?.length || importing}
          >
            {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {importing ? "Importing…" : `Import ${preview?.length ?? 0} rows`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}