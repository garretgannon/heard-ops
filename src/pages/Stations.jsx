import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Search, Layers } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import StationForm from '@/components/StationForm';

function StationCard({ station, onEdit, onDelete }) {
  const deptColors = {
    BOH: 'bg-red-500/20 text-red-300',
    FOH: 'bg-blue-500/20 text-blue-300',
    Bar: 'bg-purple-500/20 text-purple-300',
    Management: 'bg-gray-500/20 text-gray-300',
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex items-center justify-between">
      <div>
        <p className="font-bold text-sm text-foreground">{station.name}</p>
        <div className="flex gap-2 mt-1.5">
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${deptColors[station.department]}`}>
            {station.department}
          </span>
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${station.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
            {station.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(station.id)} className="p-2 hover:bg-muted rounded-lg transition-all">
          <Edit2 className="h-4 w-4 text-secondary-text" />
        </button>
        <button onClick={() => onDelete(station.id)} className="p-2 hover:bg-muted rounded-lg transition-all">
          <Trash2 className="h-4 w-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkRows, setBulkRows] = useState([{ name: '', department: 'BOH' }]);
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    loadStations();
    const unsub = base44.entities.Station.subscribe(() => loadStations());
    return () => unsub?.();
  }, []);

  const loadStations = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Station.list();
      setStations(data);
    } catch (error) {
      console.error('Failed to load stations:', error);
    }
    setLoading(false);
  };

  const filtered = stations.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id) => {
    haptics.light();
    if (confirm('Delete this station?')) {
      await base44.entities.Station.delete(id);
      await loadStations();
    }
  };

  const handleEdit = (station) => {
    haptics.light();
    setEditingStation(station);
    setShowForm(true);
  };

  const handleCreateClick = () => {
    haptics.medium();
    setEditingStation(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    await loadStations();
    setShowForm(false);
    setEditingStation(null);
  };

  const handleBulkSave = async () => {
    const valid = bulkRows.filter(r => r.name.trim());
    if (valid.length === 0) return;
    setBulkSaving(true);
    await Promise.all(valid.map(r => base44.entities.Station.create({ name: r.name.trim(), department: r.department, isActive: true })));
    setBulkSaving(false);
    setShowBulk(false);
    setBulkRows([{ name: '', department: 'BOH' }]);
    await loadStations();
  };

  return (
    <div className="pb-24">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-foreground mb-3">Stations</h1>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search stations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-secondary-text"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-secondary-text text-sm">
            {stations.length === 0 ? 'No stations yet' : 'No stations match your search'}
          </div>
        ) : (
          filtered.map(station => (
            <StationCard
              key={station.id}
              station={station}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <div className="fixed bottom-20 right-4 flex flex-col gap-2 items-end">
        <button
          onClick={() => { setShowBulk(true); setShowForm(false); }}
          className="h-10 px-3 rounded-full bg-card border border-border text-xs font-bold text-foreground flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
        >
          <Layers className="h-4 w-4" /> Bulk Add
        </button>
        <button
          onClick={handleCreateClick}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {showBulk && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="font-bold text-foreground">Bulk Add Stations</h2>
              <button onClick={() => setShowBulk(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              <p className="text-xs text-muted-foreground mb-3">Add multiple stations at once. Leave blank rows empty — they'll be skipped.</p>
              {bulkRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    autoFocus={i === 0}
                    value={row.name}
                    onChange={e => setBulkRows(prev => prev.map((r, ri) => ri === i ? { ...r, name: e.target.value } : r))}
                    onKeyDown={e => { if (e.key === 'Enter') setBulkRows(prev => [...prev, { name: '', department: 'BOH' }]); }}
                    placeholder={`Station name ${i + 1}`}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                  <select
                    value={row.department}
                    onChange={e => setBulkRows(prev => prev.map((r, ri) => ri === i ? { ...r, department: e.target.value } : r))}
                    className="px-2 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    {['BOH','FOH','Bar','Management'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button onClick={() => setBulkRows(prev => prev.length > 1 ? prev.filter((_, ri) => ri !== i) : prev)} className="text-red-400 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => setBulkRows(prev => [...prev, { name: '', department: 'BOH' }])} className="w-full mt-1 h-9 rounded-lg border border-dashed border-border text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
            <div className="p-4 border-t border-border flex gap-2 shrink-0">
              <button onClick={handleBulkSave} disabled={bulkSaving} className="flex-1 btn-primary text-sm disabled:opacity-50">
                {bulkSaving ? 'Saving...' : `Save ${bulkRows.filter(r => r.name.trim()).length} Station(s)`}
              </button>
              <button onClick={() => setShowBulk(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-card border-b border-border p-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-foreground">
                {editingStation ? 'Edit Station' : 'Create Station'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingStation(null); }}
                className="text-secondary-text hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <StationForm
                station={editingStation}
                onSave={handleSave}
                onClose={() => { setShowForm(false); setEditingStation(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;