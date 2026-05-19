import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Edit2, Check, X } from "lucide-react";

function getConfidence(row) {
  let score = 0;
  if (row.employee_name) score++;
  if (row.date && row.date.match(/\d{4}-\d{2}-\d{2}/)) score++;
  else if (row.date) score += 0.5;
  if (row.start_time) score++;
  if (row.end_time) score++;
  if (row.role) score++;
  const max = 5;
  const pct = (score / max) * 100;
  if (pct >= 80) return { label: "High", color: "text-green-500", bg: "bg-green-500/10" };
  if (pct >= 50) return { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10" };
  return { label: "Low", color: "text-destructive", bg: "bg-destructive/10" };
}

function needsReview(row) {
  return !row.employee_name || !row.date || !row.start_time || !row.end_time;
}

export default function PreviewStep({ rows, onNext, onBack }) {
  const [data, setData] = useState(rows);
  const [editIdx, setEditIdx] = useState(null);
  const [editRow, setEditRow] = useState({});

  const startEdit = (i) => { setEditIdx(i); setEditRow({ ...data[i] }); };
  const saveEdit = () => {
    const updated = [...data];
    updated[editIdx] = editRow;
    setData(updated);
    setEditIdx(null);
  };
  const removeRow = (i) => setData(data.filter((_, idx) => idx !== i));

  const reviewCount = data.filter(needsReview).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">{data.length} shifts detected</p>
          {reviewCount > 0 && (
            <p className="text-sm text-yellow-500 flex items-center gap-1 mt-0.5">
              <AlertCircle className="h-3.5 w-3.5" />{reviewCount} rows need review
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
          <Button size="sm" onClick={() => onNext(data)} disabled={data.length === 0}>
            Continue ({data.length} shifts)
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Status</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Employee</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Date</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Start</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">End</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Role</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Dept</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Station</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Confidence</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const conf = getConfidence(row);
              const review = needsReview(row);
              if (editIdx === i) {
                return (
                  <tr key={i} className="border-t border-border bg-primary/5">
                    <td className="px-3 py-1.5"><Edit2 className="h-4 w-4 text-primary" /></td>
                    {["employee_name","date","start_time","end_time","role","department","station"].map(f => (
                      <td key={f} className="px-1 py-1">
                        <Input value={editRow[f] || ""} onChange={e => setEditRow(r => ({ ...r, [f]: e.target.value }))} className="h-7 text-xs" />
                      </td>
                    ))}
                    <td className="px-3 py-1"></td>
                    <td className="px-2 py-1 flex items-center gap-1">
                      <button onClick={saveEdit}><Check className="h-4 w-4 text-green-500" /></button>
                      <button onClick={() => setEditIdx(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={i} className={`border-t border-border hover:bg-muted/20 ${review ? "bg-yellow-500/5" : ""}`}>
                  <td className="px-3 py-2">
                    {review
                      ? <AlertCircle className="h-4 w-4 text-yellow-500" />
                      : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </td>
                  <td className="px-3 py-2 font-medium">{row.employee_name || <span className="text-destructive">—</span>}</td>
                  <td className="px-3 py-2">{row.date || <span className="text-destructive">—</span>}</td>
                  <td className="px-3 py-2">{row.start_time || "—"}</td>
                  <td className="px-3 py-2">{row.end_time || "—"}</td>
                  <td className="px-3 py-2">{row.role || "—"}</td>
                  <td className="px-3 py-2">{row.department || "—"}</td>
                  <td className="px-3 py-2">{row.station || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conf.color} ${conf.bg}`}>{conf.label}</span>
                  </td>
                  <td className="px-2 py-2 flex items-center gap-1">
                    <button onClick={() => startEdit(i)} className="text-muted-foreground hover:text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}