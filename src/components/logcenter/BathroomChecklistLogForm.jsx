import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

const BATHROOM_LOCATIONS = ['Main Restroom', 'Patio Restroom', 'Staff Restroom', 'Other'];
const CHECKLIST_ITEMS = [
  { id: 'toilet_clean', label: 'Toilet clean' },
  { id: 'sink_clean', label: 'Sink clean' },
  { id: 'floors_clean', label: 'Floors clean' },
  { id: 'trash_emptied', label: 'Trash emptied' },
  { id: 'soap_stocked', label: 'Soap stocked' },
  { id: 'paper_towels_stocked', label: 'Paper towels stocked' },
  { id: 'toilet_paper_stocked', label: 'Toilet paper stocked' },
  { id: 'mirrors_clean', label: 'Mirrors clean' },
  { id: 'odor_check_passed', label: 'Odor check passed' },
];

export default function BathroomChecklistLogForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    location: 'Main Restroom',
    area: '',
    completed_by: user?.full_name || user?.email || '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    notes: '',
    photo_url: '',
    supply_issue: false,
    maintenance_needed: false,
    manager_review_required: false,
  });

  const [checklist, setChecklist] = useState(() => {
    const items = {};
    CHECKLIST_ITEMS.forEach(item => {
      items[item.id] = true;
    });
    return items;
  });

  const [areas, setAreas] = useState([]);

  useEffect(() => {
    base44.entities.Area.list('-updated_date', 50).then(data => {
      setAreas(data.map(a => a.name));
    }).catch(() => setAreas([]));
  }, []);

  const failedItems = CHECKLIST_ITEMS.filter(item => !checklist[item.id]);
  const overallPass = failedItems.length === 0;
  const overallStatus = overallPass ? 'passed' : 'failed';
  const requiresAttention = !overallPass;

  const handleChecklistToggle = (id) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!form.location) {
      toast.error('Please select a bathroom location');
      return;
    }

    if (requiresAttention && !form.notes.trim()) {
      toast.error('Bathroom checklist failed — add notes about what needs attention');
      return;
    }

    try {
      const logData = {
        location: form.location,
        area: form.area,
        completed_by: form.completed_by,
        checked_date: form.date,
        checked_time: form.time,
        checklist_items: JSON.stringify(checklist),
        failed_items: JSON.stringify(failedItems.map(i => i.label)),
        overall_pass: overallPass,
        overall_status: overallStatus,
        notes: form.notes,
        photo_url: form.photo_url,
        supply_issue: form.supply_issue,
        maintenance_needed: form.maintenance_needed,
        manager_review_required: form.manager_review_required || requiresAttention,
        requires_attention: requiresAttention,
      };

      await base44.entities.BathroomCheckLog.create(logData);

      // If maintenance is needed and checkbox is ticked, create a maintenance issue
      if (form.maintenance_needed && requiresAttention) {
        await base44.entities.Issue.create({
          title: `[Bathroom] ${form.location} - ${failedItems.map(i => i.label).join(', ')}`,
          department: 'Management',
          location: form.location,
          priority: 'high',
          status: 'open',
          notes: form.notes,
          created_by: user?.email || 'Unknown',
        }).catch(() => {});
      }

      onSave?.();
    } catch (error) {
      console.error('Failed to save bathroom checklist:', error);
      toast.error('Failed to save checklist');
    }
  };

  return (
    <div className="space-y-4">
      {/* Location & Basic Info */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Location *</label>
          <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
            className="w-full h-9 px-3 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {BATHROOM_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Area</label>
          <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
            className="w-full h-9 px-3 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="">Select area...</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Completed by</label>
          <input type="text" value={form.completed_by} disabled
            className="ops-input w-full bg-muted text-muted-foreground" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Date</label>
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
            className="w-full h-9 px-3 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Time</label>
          <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
            className="w-full h-9 px-3 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Checklist Items</p>
        <div className="space-y-1.5">
          {CHECKLIST_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleChecklistToggle(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all hover:border-primary/40"
              style={{
                borderColor: checklist[item.id] ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                backgroundColor: checklist[item.id] ? 'rgb(34, 197, 94, 0.1)' : 'rgb(239, 68, 68, 0.1)',
              }}
            >
              <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                checklist[item.id] ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'
              }`}>
                {checklist[item.id] && <CheckCircle2 className="h-4 w-4 text-green-400" />}
              </div>
              <span className={`text-sm font-bold flex-1 text-left ${
                checklist[item.id] ? 'text-green-400' : 'text-red-400'
              }`}>
                {item.label}
              </span>
              <span className={`text-[10px] font-bold uppercase ${
                checklist[item.id] ? 'text-green-400' : 'text-red-400'
              }`}>
                {checklist[item.id] ? '✓ Pass' : '✗ Fail'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Overall Status */}
      <div className={`rounded-lg p-3 border-2 flex items-center gap-3 ${
        overallPass
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        {overallPass ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />}
        <div>
          <p className={`text-sm font-bold ${overallPass ? 'text-green-400' : 'text-red-400'}`}>
            {overallPass ? 'All Clear' : `${failedItems.length} Item(s) Need Attention`}
          </p>
          {!overallPass && (
            <p className="text-xs text-red-300 mt-0.5">
              Failed: {failedItems.map(i => i.label).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Conditional Fields */}
      {requiresAttention && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-2">
          <label className="text-xs font-bold text-red-400 block">Required: Corrective Action Notes *</label>
          <textarea
            placeholder="What needs attention? What actions were taken or are needed?"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground focus:border-red-500 focus:outline-none resize-none"
          />
        </div>
      )}

      {/* Optional Fields */}
      <div className="space-y-2">
        {!requiresAttention && (
          <div>
            <label className="text-xs font-bold text-secondary-text block mb-1">Notes (Optional)</label>
            <textarea
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {[
            { key: 'supply_issue', label: '📦 Supply issue detected' },
            { key: 'maintenance_needed', label: '🔧 Maintenance needed' },
            { key: 'manager_review_required', label: '⭐ Manager review required' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs font-bold text-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Bathroom Checklist'}
      </button>
    </div>
  );
}