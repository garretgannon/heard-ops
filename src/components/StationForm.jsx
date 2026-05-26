import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const departments = ['BOH', 'FOH', 'Bar', 'Management'];

export default function StationForm({ station, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: station?.name || '',
    department: station?.department || 'BOH',
    description: station?.description || '',
    isActive: station?.isActive !== false,
    assignedJobCodes: [],
  });
  const [jobCodes, setJobCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadJobCodes();
  }, []);

  const loadJobCodes = async () => {
    try {
      const codes = await base44.entities.JobCode.list('-updated_date', 100);
      setJobCodes(codes.filter(j => j.isActive));
      
      if (station?.id) {
        // Load assigned job codes for this station if editing
        const stationJobCodes = codes.filter(j => j.assignedStations?.includes(station.id));
        setFormData(prev => ({
          ...prev,
          assignedJobCodes: stationJobCodes.map(j => j.id),
        }));
      }
    } catch (error) {
      console.error('Failed to load job codes:', error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleJobCode = (jobCodeId) => {
    setFormData(prev => ({
      ...prev,
      assignedJobCodes: prev.assignedJobCodes.includes(jobCodeId)
        ? prev.assignedJobCodes.filter(id => id !== jobCodeId)
        : [...prev.assignedJobCodes, jobCodeId],
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Station name is required');
      return;
    }

    setSaving(true);
    try {
      let stationId = station?.id;

      if (station?.id) {
        // Update existing station
        await base44.entities.Station.update(stationId, {
          name: formData.name,
          department: formData.department,
          description: formData.description,
          isActive: formData.isActive,
        });
      } else {
        // Create new station
        const created = await base44.entities.Station.create({
          name: formData.name,
          department: formData.department,
          description: formData.description,
          isActive: formData.isActive,
        });
        stationId = created.id;
      }

      // Update job code assignments
      for (const jobCode of jobCodes) {
        const isAssigned = formData.assignedJobCodes.includes(jobCode.id);
        const currentAssignments = jobCode.assignedStations || [];
        let newAssignments = currentAssignments;

        if (isAssigned && !currentAssignments.includes(stationId)) {
          newAssignments = [...currentAssignments, stationId];
        } else if (!isAssigned && currentAssignments.includes(stationId)) {
          newAssignments = currentAssignments.filter(id => id !== stationId);
        }

        if (newAssignments !== currentAssignments) {
          await base44.entities.JobCode.update(jobCode.id, {
            assignedStations: newAssignments,
          });
        }
      }

      await onSave();
    } catch (error) {
      console.error('Failed to save station:', error);
      toast.error('Failed to save station');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-secondary-text">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase text-secondary-text mb-2">
          Station Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="ops-input w-full"
          placeholder="e.g., Grill, Fryer, Host Stand"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-secondary-text mb-2">
          Department
        </label>
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground"
        >
          {departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-secondary-text mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="2"
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground resize-none"
          placeholder="Optional notes about this station"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="ops-input rounded"
        />
        <label className="text-sm font-semibold text-foreground">Active</label>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-secondary-text mb-2">
          Assigned Job Codes
        </label>
        <div className="space-y-2">
          {jobCodes.length === 0 ? (
            <p className="text-xs text-secondary-text">No job codes available</p>
          ) : (
            jobCodes.map(jobCode => (
              <label key={jobCode.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.assignedJobCodes.includes(jobCode.id)}
                  onChange={() => toggleJobCode(jobCode.id)}
                  className="rounded"
                />
                <span className="text-sm text-foreground">{jobCode.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 btn-primary text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : station ? 'Update' : 'Create'}
        </button>
        <button
          onClick={onClose}
          className="flex-1 btn-secondary text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}