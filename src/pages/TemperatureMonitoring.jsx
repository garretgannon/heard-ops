import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Thermometer } from 'lucide-react';
import TemperatureMonitoringForm from '@/components/temperature/TemperatureMonitoringForm';

export default function TemperatureMonitoring() {
  const { user, isAdmin } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const loadItems = async () => {
      try {
        const allItems = await base44.entities.MonitoredTemperatureItem.list('-created_date', 100).catch(() => []);
        if (isMounted.current) {
          setItems(allItems);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load temperature items:', err);
        if (isMounted.current) setLoading(false);
      }
    };
    loadItems();
    return () => {
      isMounted.current = false;
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleDelete = async (itemId) => {
    if (!confirm('Delete this monitored item?')) return;
    try {
      await base44.entities.MonitoredTemperatureItem.delete(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success('Item deleted');
    } catch (err) {
      toast.error('Failed to delete item');
      console.error(err);
    }
  };

  const activeItems = items.filter((i) => i.status === 'active');

  // Group items by type
  const itemsByType = activeItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const typeLabels = {
    refrigerator: 'Refrigerators',
    freezer: 'Freezers',
    hot_holding: 'Hot Holding',
    cooling_log: 'Cooling Logs',
    custom: 'Custom',
  };

  return (
    <div className="pb-32 bg-background min-h-screen lg:flex lg:flex-col">
      {/* Header */}
      <div className="border-b border-border/20 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Temperature Monitoring</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage recurring temperature checks</p>
          </div>
          <button
            onClick={() => { setSelectedItem(null); setShowForm(true); }}
            className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" /> Add Item
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full">
        {Object.keys(itemsByType).length === 0 ? (
          <div className="text-center py-12">
            <Thermometer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">No temperature items yet</p>
            <p className="text-muted-foreground text-sm">Create monitored items to enable recurring temperature checks</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(itemsByType).map(([type, typeItems]) => (
              <div key={type} className="space-y-3">
                <h2 className="text-lg font-bold text-foreground capitalize">{typeLabels[type] || type}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {typeItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border bg-card border-blue-500/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.location}
                            {item.station && ` • ${item.station}`}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/15 text-green-400">
                          active
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-muted-foreground mb-3">
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span className="font-mono font-bold">{item.min_temperature}°F – {item.max_temperature}°F</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Frequency:</span>
                          <span className="font-bold">Every {item.check_frequency_hours} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Assigned:</span>
                          <span className="font-bold">{item.assigned_role}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedItem(item); setShowForm(true); }}
                          className="flex-1 h-8 text-xs font-bold rounded bg-primary/20 text-primary hover:bg-primary/30 active:scale-95 transition-all"
                        >
                          <Edit2 className="h-3 w-3 inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 h-8 text-xs font-bold rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 active:scale-95 transition-all"
                        >
                          <Trash2 className="h-3 w-3 inline mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <TemperatureMonitoringForm
          item={selectedItem}
          onClose={() => { setShowForm(false); setSelectedItem(null); }}
          onSuccess={async () => {
            const updated = await base44.entities.MonitoredTemperatureItem.list('-created_date', 100);
            setItems(updated);
            setShowForm(false);
            setSelectedItem(null);
            toast.success(selectedItem ? 'Item updated' : 'Item created');
          }}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;