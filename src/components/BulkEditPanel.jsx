import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function BulkEditPanel({ selectedIds, items, currentStationId, onSave, onCancel }) {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [targetStationId, setTargetStationId] = useState("");
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      base44.entities.Station.list(),
      base44.entities.PrepList.filter({ date: todayStr }),
    ]).then(([s, pl]) => {
      setStations(s.filter(st => st.id !== currentStationId));
      setPrepLists(pl);
    });
  }, []);

  const selected = items.filter(i => selectedIds.includes(i.id));

  const handleApply = async () => {
    if (!quantity && !unit && !targetStationId) {
      toast.error("Set at least one field to update");
      return;
    }
    setSaving(true);

    const updates = selected.map(async (item) => {
      const patch = {};
      if (quantity) patch.quantity = quantity;
      if (unit) patch.unit = unit;
      if (targetStationId) {
        const targetList = prepLists.find(pl => pl.station_id === targetStationId);
        if (targetList) {
          patch.station_id = targetStationId;
          patch.prep_list_id = targetList.id;
        }
      }
      return base44.entities.PrepItem.update(item.id, patch);
    });

    await Promise.all(updates);
    setSaving(false);
    toast.success(`Updated ${selected.length} item${selected.length !== 1 ? "s" : ""}`);
    onSave();
  };

  return (
    <div className="liquid-card -primary/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">Bulk Edit</p>
          <p className="text-xs text-muted-foreground">{selected.length} item{selected.length !== 1 ? "s" : ""} selected</p>
        </div>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Set Quantity</Label>
          <Input
            placeholder="e.g., 10"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Set Unit</Label>
          <Input
            placeholder="e.g., lbs"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="mt-1 h-9 text-sm"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Reassign to Station</Label>
        <Select value={targetStationId} onValueChange={setTargetStationId}>
          <SelectTrigger className="mt-1 h-9 text-sm">
            <SelectValue placeholder="Keep current station" />
          </SelectTrigger>
          <SelectContent>
            {stations.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {targetStationId && !prepLists.find(pl => pl.station_id === targetStationId) && (
          <p className="text-xs text-yellow-400 mt-1">⚠ No prep list found for that station today — items won't be reassigned.</p>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button size="sm" onClick={handleApply} disabled={saving || selected.length === 0} className="flex-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Apply to {selected.length} item{selected.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}