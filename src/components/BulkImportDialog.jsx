import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

export default function BulkImportDialog({ open, onOpenChange, type, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const templates = {
    station_assignments: {
      filename: "station_assignments_template.csv",
      headers: ["date", "station_name", "user_email", "shift"],
      example: "2026-04-29,Grill,john@example.com,morning\n2026-04-29,Sauté,jane@example.com,night",
      instructions: "Columns: date (YYYY-MM-DD), station_name, user_email, shift (morning/night)"
    },
    prep_items: {
      filename: "prep_items_template.csv",
      headers: ["prep_list_name", "item_name", "quantity", "unit", "priority", "notes"],
      example: "Monday Grill Prep,Dice onions,5,lbs,high,Use yellow onions\nMonday Grill Prep,Portion steaks,20,ea,medium,",
      instructions: "Columns: prep_list_name, item_name, quantity, unit, priority (high/medium/low), notes"
    }
  };

  const config = templates[type];

  const downloadTemplate = () => {
    const csv = [config.headers.join(","), config.example].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = config.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const text = await f.text();
    const lines = text.trim().split("\n");
    const rows = lines.slice(0, 3).map(line => line.split(","));
    setPreview(rows);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
      });

      if (type === "station_assignments") {
        await importStationAssignments(rows);
      } else if (type === "prep_items") {
        await importPrepItems(rows);
      }

      toast.success(`${rows.length} records imported successfully`);
      setFile(null);
      setPreview(null);
      onOpenChange(false);
      onImportComplete();
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const importStationAssignments = async (rows) => {
    const stations = await base44.entities.Station.list();
    const users = await base44.entities.User.list();

    for (const row of rows) {
      if (!row.date || !row.station_name || !row.user_email || !row.shift) continue;

      const station = stations.find(s => s.name.toLowerCase() === row.station_name.toLowerCase());
      const user = users.find(u => u.email.toLowerCase() === row.user_email.toLowerCase());

      if (station && user) {
        await base44.entities.StationAssignment.create({
          station_id: station.id,
          station_name: station.name,
          user_email: user.email,
          user_name: user.full_name,
          shift: row.shift.toLowerCase(),
          date: row.date,
        });
      }
    }
  };

  const importPrepItems = async (rows) => {
    const prepLists = await base44.entities.PrepList.list();

    for (const row of rows) {
      if (!row.prep_list_name || !row.item_name) continue;

      const list = prepLists.find(pl => pl.name.toLowerCase() === row.prep_list_name.toLowerCase());

      if (list) {
        await base44.entities.PrepItem.create({
          prep_list_id: list.id,
          station_id: list.station_id,
          name: row.item_name,
          quantity: row.quantity || "",
          unit: row.unit || "",
          priority: row.priority || "medium",
          notes: row.notes || "",
          status: "pending",
          sort_order: 0,
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import {type === "station_assignments" ? "Station Assignments" : "Prep Items"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Instructions:</p>
            <p>{config.instructions}</p>
          </div>

          <div className="space-y-2">
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <label className="block">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors">
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
              </div>
              <input
                type="file"
                accept=".csv"
                className="ops-input hidden"
                onChange={handleFileSelect}
              />
            </label>

            {file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-900">✓ {file.name} selected</p>
                {preview && (
                  <div className="mt-2 text-xs text-green-800">
                    <p className="font-semibold mb-1">Preview (first 3 rows):</p>
                    <div className="bg-white rounded p-2 overflow-x-auto">
                      <table className="text-left border-collapse">
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i} className="border-b">
                              {row.map((cell, j) => (
                                <td key={j} className="px-2 py-1 border-r text-xs">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}