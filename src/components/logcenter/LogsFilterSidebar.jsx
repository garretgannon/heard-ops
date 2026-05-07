import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LOG_TYPES, STATUS_META } from '@/components/activity-logs/logConfig';
import { base44 } from '@/api/base44Client';

const PRIORITIES = ["critical", "high", "medium", "low"];

function Section({ label, open, onToggle, children }) {
  return (
    <div className="border-b border-border/40 last:border-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-2.5 text-left">
        <span className="text-xs font-bold text-foreground uppercase tracking-widest">{label}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function Chip({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-all",
        isActive
          ? "bg-primary/20 text-primary border-primary/40"
          : "bg-card border-border text-muted-foreground hover:border-muted-foreground/40"
      )}>
      {label}
    </button>
  );
}

export default function LogsFilterSidebar({ filters, onChange, currentUser }) {
  const [openSections, setOpenSections] = useState({
    type: true,
    status: false,
    priority: false,
    date: true,
    location: false,
  });
  const [stations, setStations] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    base44.entities.Station.list("-name", 50).then(d => setStations(d.filter(s => s.isActive))).catch(() => {});
    base44.entities.Area.list("-name", 50).then(d => setAreas(d.filter(a => a.isActive))).catch(() => {});
  }, []);

  const toggle = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));
  const set = (key, val) => onChange({ ...filters, [key]: val });

  const TYPE_OPTS = Object.entries(LOG_TYPES).map(([id, cfg]) => ({ id, label: cfg.label }));
  const STATUS_OPTS = Object.entries(STATUS_META).map(([id, m]) => ({ id, label: m.label }));

  return (
    <div className="w-64 border-r border-border/40 overflow-y-auto p-4 space-y-0 bg-card/50">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-4">Filters</h3>

      {/* Log Type */}
      <Section label="Type" open={openSections.type} onToggle={() => toggle('type')}>
        <div className="flex flex-wrap gap-1">
          {TYPE_OPTS.map(opt => (
            <Chip
              key={opt.id}
              label={opt.label}
              isActive={filters.types?.includes(opt.id)}
              onClick={() => set('types', filters.types?.includes(opt.id) ? filters.types.filter(t => t !== opt.id) : [...(filters.types || []), opt.id])}
            />
          ))}
        </div>
      </Section>

      {/* Status */}
      <Section label="Status" open={openSections.status} onToggle={() => toggle('status')}>
        <div className="flex flex-wrap gap-1">
          {STATUS_OPTS.map(opt => (
            <Chip
              key={opt.id}
              label={opt.label}
              isActive={filters.statuses?.includes(opt.id)}
              onClick={() => set('statuses', filters.statuses?.includes(opt.id) ? filters.statuses.filter(s => s !== opt.id) : [...(filters.statuses || []), opt.id])}
            />
          ))}
        </div>
      </Section>

      {/* Priority */}
      <Section label="Priority" open={openSections.priority} onToggle={() => toggle('priority')}>
        <div className="flex flex-wrap gap-1">
          {PRIORITIES.map(p => (
            <Chip
              key={p}
              label={p.charAt(0).toUpperCase() + p.slice(1)}
              isActive={filters.priorities?.includes(p)}
              onClick={() => set('priorities', filters.priorities?.includes(p) ? filters.priorities.filter(x => x !== p) : [...(filters.priorities || []), p])}
            />
          ))}
        </div>
      </Section>

      {/* Date Range */}
      <Section label="Date" open={openSections.date} onToggle={() => toggle('date')}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "this_week", label: "This Week" },
              { id: "last_7", label: "Last 7 Days" },
              { id: "this_month", label: "This Month" },
            ].map(p => (
              <Chip
                key={p.id}
                label={p.label}
                isActive={filters.datePreset === p.id}
                onClick={() => set('datePreset', filters.datePreset === p.id ? '' : p.id)}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => onChange({ ...filters, dateFrom: e.target.value, datePreset: '' })}
                className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none mt-0.5"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => onChange({ ...filters, dateTo: e.target.value, datePreset: '' })}
                className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none mt-0.5"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Location */}
      <Section label="Location" open={openSections.location} onToggle={() => toggle('location')}>
        <div className="space-y-2">
          <select
            value={filters.station}
            onChange={e => set('station', e.target.value)}
            className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none">
            <option value="">All Stations</option>
            {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select
            value={filters.area}
            onChange={e => set('area', e.target.value)}
            className="w-full h-7 px-2 bg-background border border-border rounded-lg text-[11px] text-foreground focus:border-primary focus:outline-none">
            <option value="">All Areas</option>
            {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </div>
      </Section>

      {/* Quick toggles */}
      <div className="border-t border-border/40 pt-3 space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-widest block">Quick Filters</label>
        {[
          { key: 'requiresReview', label: 'Needs Review' },
          { key: 'hasPhoto', label: 'Has Photo' },
          { key: 'assignedToMe', label: 'Assigned to Me' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => set(key, !filters[key])}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all',
              filters[key]
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
            )}>
            {label}
            <div className={cn('h-4 w-6 rounded-full border transition-all flex items-center', filters[key] ? 'bg-primary border-primary justify-end' : 'bg-muted border-border justify-start')}>
              <div className="h-2.5 w-2.5 rounded-full bg-white mx-0.5 shadow-sm" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}