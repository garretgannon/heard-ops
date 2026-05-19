import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { AlertCircle, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

function detectConflicts(rows) {
  const issues = [];
  const seen = {};
  rows.forEach((row, i) => {
    if (!row.employee_name) issues.push({ row: i, msg: "Missing employee name" });
    if (!row.date) issues.push({ row: i, msg: `${row.employee_name}: Missing date` });
    if (!row.start_time) issues.push({ row: i, msg: `${row.employee_name} (${row.date}): Missing start time` });
    if (!row.end_time) issues.push({ row: i, msg: `${row.employee_name} (${row.date}): Missing end time` });
    if (!row.role) issues.push({ row: i, msg: `${row.employee_name} (${row.date}): Missing role` });
    const key = `${row.employee_name}-${row.date}-${row.start_time}`;
    if (seen[key]) issues.push({ row: i, msg: `Duplicate shift: ${row.employee_name} on ${row.date} at ${row.start_time}` });
    else seen[key] = true;
  });
  return issues;
}

export default function PublishStep({ rows, fileName, onBack, onDone }) {
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const conflicts = detectConflicts(rows);

  // Group by date for summary
  const byDate = {};
  rows.forEach(r => { if (!byDate[r.date]) byDate[r.date] = []; byDate[r.date].push(r); });
  const dates = Object.keys(byDate).sort();

  const handlePublish = async () => {
    setPublishing(true);
    const now = new Date().toISOString();
    const me = await base44.auth.me();

    for (const row of rows) {
      // Create StaffShift
      await base44.entities.StaffShift.create({
        ...row,
        source_file: fileName,
        imported_by: me?.email || "",
        import_date: now,
        status: conflicts.some(c => c.row === rows.indexOf(row)) ? "needs_review" : "published"
      }).catch(() => {});

      // Create CalendarEvent for ops calendar
      await base44.entities.CalendarEvent.create({
        title: `${row.employee_name} — ${row.role || "Staff"}`,
        date: row.date,
        time: row.start_time ? `${row.start_time}${row.end_time ? " – " + row.end_time : ""}` : "",
        category: "staff_meeting",
        employee_email: row.employee_email || "",
        employee_name: row.employee_name,
        notes: `Shift: ${row.start_time || "?"} – ${row.end_time || "?"}\nStation: ${row.station || "—"}\nImported from: ${fileName}`,
        is_sensitive: false
      }).catch(() => {});
    }

    setPublishing(false);
    setDone(true);
    onDone();
  };

  if (done) {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
        <h3 className="text-xl font-bold">Schedule Published!</h3>
        <p className="text-muted-foreground">{rows.length} shifts added to the app.</p>
        <p className="text-sm text-muted-foreground">Shifts appear in Staff Home, Today's Command Center, and the Operations Calendar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{rows.length} shifts ready to publish</p>
          <p className="text-sm text-muted-foreground">{dates.length} days · {new Set(rows.map(r => r.employee_name)).size} employees</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack} disabled={publishing}>Back</Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing}>
            {publishing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing...</> : "Publish Schedule"}
          </Button>
        </div>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl space-y-2">
          <p className="font-semibold text-yellow-500 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{conflicts.length} issue{conflicts.length > 1 ? "s" : ""} detected</p>
          <p className="text-xs text-muted-foreground">These shifts will be marked "Needs Review" but will still be published.</p>
          <ul className="space-y-1">
            {conflicts.map((c, i) => <li key={i} className="text-sm text-yellow-500">• {c.msg}</li>)}
          </ul>
        </div>
      )}

      {/* Schedule summary by date */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Schedule Summary</h3>
        <div className="space-y-3">
          {dates.map(date => (
            <div key={date} className="border border-border rounded-xl p-4">
              <p className="font-semibold text-sm mb-2">
                {date ? (() => { try { return format(new Date(date + "T12:00:00"), "EEEE, MMM d"); } catch { return date; } })() : "Unknown Date"}
                <span className="text-muted-foreground font-normal ml-2">({byDate[date].length} shifts)</span>
              </p>
              <div className="space-y-1">
                {byDate[date].map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-medium w-32 truncate">{r.employee_name}</span>
                    <span className="text-muted-foreground">{r.start_time} – {r.end_time}</span>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{r.role || "—"}</span>
                    {r.station && <span className="text-xs text-muted-foreground">{r.station}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}