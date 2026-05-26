import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Users, ChevronRight, ChevronDown, Edit2, Trash2, CheckCircle2, ClipboardList, Plus, Upload, X } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

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
      className="w-full text-left liquid-card p-4 hover:border-border transition-all active:scale-[0.98]"
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-transparent border-none text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/50 liquid-card"
            />
          </div>
          <div className="relative w-full sm:w-40 shrink-0">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full h-11 pl-4 pr-10 bg-transparent border-none text-sm text-foreground focus:outline-none appearance-none liquid-card"
            >
              <option value="all">All Status</option>
              <option value="tentative">Tentative</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-production">In Production</option>
              <option value="ready">Ready</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="liquid-card overflow-hidden p-8 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center">
              <ClipboardList className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
              <X className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
          <p className="text-[14px] font-semibold text-foreground">No BEOs found</p>
          <div className="flex flex-col gap-2 w-full max-w-[240px] mt-2">
            {onAdd && (
              <button
                onClick={() => { onAdd(); haptics.medium(); }}
                className="w-full btn-primary h-10 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create BEO
              </button>
            )}
            {onImport && (
              <button
                onClick={() => { onImport(); haptics.medium(); }}
                className="w-full btn-secondary h-10 flex items-center justify-center gap-1.5"
              >
                <Upload className="h-4 w-4" /> Upload PDF
              </button>
            )}
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