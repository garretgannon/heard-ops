import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import TemperatureLogForm from './TemperatureLogForm';
import WasteLogForm from './WasteLogForm';
import IssueLogForm from './IssueLogForm';
import ManagerLogForm from './ManagerLogForm';
import EightySixLogForm from './EightySixLogForm';
import BathroomChecklistLogForm from './BathroomChecklistLogForm';

const LOG_TYPES = [
  { id: 'temperature', label: 'Temperature Log', desc: 'Log equipment temps (cooler, fryer, etc)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '🌡️' },
  { id: 'waste', label: 'Waste Entry', desc: 'Track food waste and cost', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '🗑️' },
  { id: 'issue', label: 'Issue / Incident', desc: 'Report equipment, safety, or operational issue', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '⚠️' },
  { id: 'manager', label: 'Manager Note', desc: 'Shift notes, observations, follow-up items', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '📝' },
  { id: 'eighty_six', label: '86 Item', desc: 'Mark item as out of stock', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: '❌' },
  { id: 'bathroom', label: 'Bathroom Checklist', desc: 'Daily bathroom cleanliness & supply check', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '🚽' },
];

export default function LogCreateModal({ onClose, onCreated }) {
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleTypeSelect = (typeId) => {
    haptics.light?.();
    setSelectedType(typeId);
  };

  const handleFormSave = async () => {
    setSaving(false);
    onCreated?.();
    onClose();
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'temperature':
        return <TemperatureLogForm onSave={handleFormSave} loading={saving} />;
      case 'waste':
        return <WasteLogForm onSave={handleFormSave} loading={saving} />;
      case 'issue':
        return <IssueLogForm onSave={handleFormSave} loading={saving} />;
      case 'manager':
        return <ManagerLogForm onSave={handleFormSave} loading={saving} />;
      case 'eighty_six':
        return <EightySixLogForm onSave={handleFormSave} loading={saving} />;
      case 'bathroom':
        return <BathroomChecklistLogForm onSave={handleFormSave} loading={saving} />;
      default:
        return null;
    }
  };

  const selectedConfig = LOG_TYPES.find(t => t.id === selectedType);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-bold text-foreground">
              {selectedType ? 'New ' + selectedConfig?.label : 'New Log Entry'}
            </h2>
            {selectedType && <p className="text-xs text-muted-foreground mt-0.5">{selectedConfig?.desc}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!selectedType ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Select log type</p>
              {LOG_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 hover:scale-105 active:scale-95 transition-all text-left ${type.color}`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{type.label}</p>
                    <p className="text-xs opacity-80">{type.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </button>
              ))}
            </div>
          ) : (
            <>
              {renderForm()}
              <button
                onClick={() => setSelectedType(null)}
                className="mt-4 w-full h-8 rounded-lg border border-border bg-card text-muted-foreground text-xs font-bold hover:text-foreground transition-all"
              >
                ← Back to Type Selection
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}