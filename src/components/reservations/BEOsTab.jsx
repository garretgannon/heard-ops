import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Users, ChevronRight, Edit2, Trash2, CheckCircle2, ClipboardList, Plus, Upload } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const STATUS_COLOR = {
  inquiry: 'bg-muted text-muted-foreground',
  tentative: 'bg-amber-500/15 text-amber-400',
  confirmed: 'bg-green-500/15 text-green-400',
  'in-production': 'bg-blue-500/15 text-blue-400',
  ready: 'bg-primary/15 text-primary',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-500/15 text-red-400',
};

function BEOCard({ beo, isAdmin, onSelect, onEdit, onDelete }) {
  return (
    <button
      onClick={() => onSelect(beo)}
      className="w-full text-left bg-card border border-blue-500/20 rounded-xl p-3 active:scale-[0.98] transition-all"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-sm font-bold text-foreground">{beo.eventName}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${STATUS_COLOR[beo.status] || 'bg-muted text-muted-foreground'}`}>
              {(beo.status || 'tentative').replace(/-/g, ' ')}
            </span>
            {beo.prepTasksGenerated && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 flex items-center gap-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" />Prep ✓
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{beo.eventDate}</span>
            {beo.startTime && <span className="text-xs text-muted-foreground">{beo.startTime}{beo.endTime ? `–${beo.endTime}` : ''}</span>}
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{beo.guestCount || '?'}</span>
            {(beo.area || beo.room) && <span className="text-[10px] text-muted-foreground">· {beo.area || beo.room}</span>}
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {beo.eventType && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 capitalize">{beo.eventType.replace(/-/g, ' ')}</span>}
            {beo.serviceStyle && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{beo.serviceStyle.replace(/-/g, ' ')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isAdmin && (
            <>
              <button onClick={e => { e.stopPropagation(); onEdit(beo); }} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80">
                <Edit2 className="h-3 w-3 text-muted-foreground" />
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(beo.id); }} className="p-1.5 rounded-lg bg-muted hover:bg-red-500/15">
                <Trash2 className="h-3 w-3 text-red-400" />
              </button>
            </>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}

export default function BEOsTab({ beos, isAdmin, onSelect, onEdit, onRefresh, onAdd, onImport }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = beos.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (search && !b.eventName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id) => {
    await base44.entities.BEO.delete(id);
    haptics.success();
    onRefresh();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events…"
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['all','tentative','confirmed','in-production','ready'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 h-7 px-2.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all duration-200 ${filterStatus === s ? 'glow-active' : 'card-glass border border-border/40 text-muted-foreground glow-interactive'}`}
            >
              {s.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
          <div className="flex flex-col items-center py-8 px-4 gap-3">
            <div className="h-14 w-14 rounded-full bg-white/[0.05] border border-border/30 flex items-center justify-center">
              <ClipboardList className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">No BEOs found</p>
            <div className="flex flex-col gap-2 w-full mt-1">
              {onAdd && (
                <button
                  onClick={() => { onAdd(); haptics.medium(); }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-bold text-white active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)' }}
                >
                  <Plus className="h-3.5 w-3.5" /> Create BEO
                </button>
              )}
              {onImport && (
                <button
                  onClick={() => { onImport(); haptics.medium(); }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-semibold text-foreground active:scale-[0.98] transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload PDF
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(b => (
            <BEOCard key={b.id} beo={b} isAdmin={isAdmin} onSelect={onSelect} onEdit={onEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}