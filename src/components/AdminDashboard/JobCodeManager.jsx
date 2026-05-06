import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, Copy } from 'lucide-react';
import { haptics } from '@/utils/haptics';

const DEFAULT_DEPARTMENTS = ['BOH', 'FOH', 'Bar', 'Management'];

const PRESET_JOB_CODES = [
  { name: 'General Manager', department: 'Management', description: 'Full system access and oversight' },
  { name: 'FOH Manager', department: 'FOH', description: 'Front of house operations' },
  { name: 'Kitchen Manager', department: 'BOH', description: 'Kitchen operations and prep' },
  { name: 'Kitchen Lead', department: 'BOH', description: 'Shift lead for kitchen' },
  { name: 'Cook', department: 'BOH', description: 'Line cook' },
  { name: 'Prep Cook', department: 'BOH', description: 'Prep station cook' },
  { name: 'Server', department: 'FOH', description: 'Front of house server' },
  { name: 'Bartender', department: 'Bar', description: 'Bar service' },
  { name: 'Host', department: 'FOH', description: 'Greeting and seating' },
  { name: 'Dishwasher', department: 'BOH', description: 'Dish station' },
];

export default function JobCodeManager({ jobCodes }) {
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [creatingNew, setCreatingNew] = useState(false);
  const [newJobCode, setNewJobCode] = useState({ name: '', department: 'BOH', description: '' });

  const handleCreate = async (preset) => {
    haptics.medium?.();
    try {
      await base44.entities.JobCode.create({
        name: preset.name,
        department: preset.department,
        description: preset.description,
        isActive: true,
      });
      setCreatingNew(false);
      setNewJobCode({ name: '', department: 'BOH', description: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id) => {
    haptics.medium?.();
    try {
      await base44.entities.JobCode.update(id, editValues);
      setEditingId(null);
      setEditValues({});
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this job code? This cannot be undone.')) return;
    haptics.medium?.();
    try {
      await base44.entities.JobCode.delete(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async (jobCode) => {
    haptics.light?.();
    try {
      await base44.entities.JobCode.create({
        name: `${jobCode.name} (Copy)`,
        department: jobCode.department,
        description: jobCode.description,
        isActive: jobCode.isActive,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Job Codes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase text-secondary-text">Active Job Codes ({jobCodes.filter(j => j.isActive).length})</h2>
          <button
            onClick={() => setCreatingNew(!creatingNew)}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {jobCodes.filter(j => j.isActive).map(jobCode => (
          <div key={jobCode.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
            {editingId === jobCode.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editValues.name || jobCode.name}
                  onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                  className="w-full p-2 rounded-lg bg-muted border border-border text-sm font-bold text-foreground"
                />
                <select
                  value={editValues.department || jobCode.department}
                  onChange={e => setEditValues({ ...editValues, department: e.target.value })}
                  className="w-full p-2 rounded-lg bg-muted border border-border text-sm text-foreground"
                >
                  {DEFAULT_DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <textarea
                  value={editValues.description || jobCode.description}
                  onChange={e => setEditValues({ ...editValues, description: e.target.value })}
                  rows={2}
                  className="w-full p-2 rounded-lg bg-muted border border-border text-sm text-foreground resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(jobCode.id)}
                    className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-95"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 h-8 rounded-lg border border-border bg-muted text-secondary-text text-xs font-bold active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-foreground">{jobCode.name}</p>
                    <p className="text-xs text-secondary-text mt-0.5">{jobCode.description}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/15 text-primary">
                    {jobCode.department}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingId(jobCode.id);
                      setEditValues(jobCode);
                    }}
                    className="flex-1 h-7 rounded text-xs font-bold text-primary border border-primary/30 bg-primary/10 active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(jobCode)}
                    className="flex-1 h-7 rounded text-xs font-bold text-blue-400 border border-blue-500/30 bg-blue-500/10 active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                  <button
                    onClick={() => handleDelete(jobCode.id)}
                    className="flex-1 h-7 rounded text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10 active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Create New from Presets */}
      {creatingNew && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-foreground text-sm">Add Job Code from Template</h3>
          <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
            {PRESET_JOB_CODES.filter(p => !jobCodes.some(j => j.name === p.name && j.isActive)).map(preset => (
              <button
                key={preset.name}
                onClick={() => handleCreate(preset)}
                className="text-left p-2.5 rounded-lg bg-card border border-border hover:border-primary/50 active:scale-95 transition-all"
              >
                <p className="font-semibold text-sm text-foreground">{preset.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setCreatingNew(false)}
            className="w-full h-8 rounded-lg border border-border bg-muted text-secondary-text text-xs font-bold active:scale-95"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}