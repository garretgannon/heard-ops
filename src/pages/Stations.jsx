import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
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

      <button
        onClick={handleCreateClick}
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
      >
        <Plus className="h-5 w-5" />
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="font-bold text-foreground">
                {editingStation ? 'Edit Station' : 'Create Station'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingStation(null);
                }}
                className="text-secondary-text hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <StationForm
                station={editingStation}
                onSave={handleSave}
                onClose={() => {
                  setShowForm(false);
                  setEditingStation(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;