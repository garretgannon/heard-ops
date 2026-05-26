import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Star, AlertTriangle, Users, Edit2, Trash2, Plus, Calendar, Upload, X, ChevronDown } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const STATUS_COLOR = {
  booked: 'bg-blue-500/15 text-blue-400',
  confirmed: 'bg-green-500/15 text-green-400',
  seated: 'bg-primary/15 text-primary',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-500/15 text-red-400',
  'no-show': 'bg-red-500/15 text-red-400',
};

const today = () => new Date().toISOString().split('T')[0];

function ReservationCard({ res, isAdmin, onEdit, onDelete }) {
  const isLarge = (res.partySize || 0) >= 8;
  return (
    <div className={`liquid-card p-4 transition-all ${isLarge ? 'border-amber-500/30' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-foreground">{res.name}</span>
            {res.isVIP && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
            {res.hasDietaryRestrictions && <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{res.date} {res.time}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{res.partySize}</span>
            {res.area && <span className="text-[10px] text-muted-foreground">· {res.area}</span>}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${STATUS_COLOR[res.status] || 'bg-muted text-muted-foreground'}`}>
              {res.status}
            </span>
            {isLarge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Large Party</span>}
          </div>
          {res.guestNotes && <p className="text-[10px] text-muted-foreground mt-1 italic">{res.guestNotes}</p>}
          {res.specialOccasion && <p className="text-[10px] text-primary mt-0.5">🎉 {res.specialOccasion}</p>}
          {res.hasDietaryRestrictions && res.dietaryNotes && (
            <p className="text-[10px] text-red-400 mt-0.5 flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" />{res.dietaryNotes}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => onEdit(res)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Edit2 className="h-3 w-3 text-muted-foreground" /></button>
            <button onClick={() => onDelete(res.id)} className="p-1.5 rounded-lg bg-muted hover:bg-red-500/15"><Trash2 className="h-3 w-3 text-red-400" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReservationsTab({ reservations, isAdmin, onEdit, onRefresh, onAdd, onImport }) {
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(today());
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = reservations.filter(r => {
    if (filterDate && r.date !== filterDate) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id) => {
    await base44.entities.Reservation.delete(id);
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
            placeholder="Search reservations…"
            className="w-full pl-9 pr-3 py-2 liquid-card text-sm text-foreground focus:outline-none focus:border-border"
          />
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="flex-1 px-3 py-1.5 liquid-card text-xs text-foreground focus:outline-none focus:border-border"
          />
          <div className="relative w-full sm:w-40 shrink-0">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full h-11 pl-4 pr-10 bg-transparent border-none text-sm text-foreground focus:outline-none appearance-none liquid-card"
            >
              <option value="all">All Status</option>
              {['booked','confirmed','seated','completed','cancelled','no-show'].map(s => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="liquid-card overflow-hidden p-8 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
              <X className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
          <p className="text-[14px] font-semibold text-foreground">No reservations found</p>
          <div className="flex flex-col gap-2 w-full max-w-[240px] mt-2">
            {onAdd && (
              <button
                onClick={() => { onAdd(); haptics.medium(); }}
                className="w-full btn-primary h-10 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Reservation
              </button>
            )}
            {onImport && (
              <button
                onClick={() => { onImport(); haptics.medium(); }}
                className="w-full btn-secondary h-10 flex items-center justify-center gap-1.5"
              >
                <Upload className="h-4 w-4" /> Import from Calendar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(r => (
            <ReservationCard key={r.id} res={r} isAdmin={isAdmin} onEdit={onEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}