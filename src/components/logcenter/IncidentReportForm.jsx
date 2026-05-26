import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CATEGORIES = [
  'Guest injury',
  'Employee injury',
  'Security',
  'Property damage',
  'Food safety',
  'Guest complaint',
  'Policy violation',
  'Other',
];

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export default function IncidentReportForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    incident_category: '',
    incident_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    location_area: '',
    description: '',
    reported_by: user?.full_name || user?.email || '',
    severity: '',
    manager_notified: false,
    people_involved: '',
    witnesses: '',
    photo_url: '',
    follow_up_required: false,
    follow_up_owner: '',
    follow_up_due_date: '',
    resolution_notes: '',
  });

  const [areas, setAreas] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    base44.entities.Area.list('-updated_date', 50)
      .then(data => setAreas(data.filter(a => a.isActive)))
      .catch(() => setAreas([]));
  }, []);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setForm(f => ({ ...f, photo_url: '' }));
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      return file_url;
    } catch (error) {
      console.error('Photo upload failed:', error);
      return null;
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.incident_category) newErrors.incident_category = 'Category is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.severity) newErrors.severity = 'Severity is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    let photoUrl = form.photo_url;
    if (photoFile) {
      photoUrl = await uploadPhoto();
    }

    base44.entities.IncidentReport.create({
      incident_category: form.incident_category,
      incident_date: form.incident_date,
      location_area: form.location_area,
      description: form.description,
      reported_by: form.reported_by,
      severity: form.severity,
      manager_notified: form.manager_notified,
      people_involved: form.people_involved,
      witnesses: form.witnesses,
      photo_url: photoUrl,
      follow_up_required: form.follow_up_required,
      follow_up_owner: form.follow_up_owner,
      follow_up_due_date: form.follow_up_due_date || null,
      resolution_notes: form.resolution_notes,
    }).then(onSave).catch(err => {
      console.error('Failed to save incident report:', err);
      toast.error('Failed to save incident report');
    });
  };

  return (
    <div className="space-y-4">
      {/* Category */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.incident_category ? 'text-red-400' : 'text-secondary-text'}`}>
          Incident Category *
        </label>
        <select value={form.incident_category} onChange={e => setForm({ ...form, incident_category: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.incident_category ? 'border-red-500/50' : 'border-border'
          }`}>
          <option value="">Select category...</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {errors.incident_category && <p className="text-xs text-red-400 mt-0.5">{errors.incident_category}</p>}
      </div>

      {/* Incident Date & Time */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Date and Time of Incident *</label>
        <input type="datetime-local" value={form.incident_date}
          onChange={e => setForm({ ...form, incident_date: e.target.value })}
          className="w-full h-9 px-3 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>

      {/* Location / Area */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Location / Area</label>
        <select value={form.location_area} onChange={e => setForm({ ...form, location_area: e.target.value })}
          className="w-full h-9 px-3 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="">Select area...</option>
          {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.description ? 'text-red-400' : 'text-secondary-text'}`}>
          Description *
        </label>
        <textarea placeholder="Detailed description of the incident..." value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
          className={`w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none ${
            errors.description ? 'border-red-500/50' : 'border-border'
          }`} />
        {errors.description && <p className="text-xs text-red-400 mt-0.5">{errors.description}</p>}
      </div>

      {/* Severity */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.severity ? 'text-red-400' : 'text-secondary-text'}`}>
          Severity *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITY_LEVELS.map(level => (
            <button key={level} onClick={() => setForm({ ...form, severity: level })}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                form.severity === level
                  ? level === 'Critical' ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : level === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : level === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}>
              {level}
            </button>
          ))}
        </div>
        {errors.severity && <p className="text-xs text-red-400 mt-0.5">{errors.severity}</p>}
      </div>

      {/* Reported By */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Reported By</label>
        <input type="text" value={form.reported_by}
          onChange={e => setForm({ ...form, reported_by: e.target.value })}
          className="w-full h-9 px-3 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>

      {/* Manager Notified */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.manager_notified} onChange={e => setForm({ ...form, manager_notified: e.target.checked })} />
        <span className="text-xs font-bold text-foreground">Manager notified</span>
      </label>

      {/* People Involved (Optional) */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">People Involved (Optional)</label>
        <textarea placeholder="Names and roles of people involved..." value={form.people_involved}
          onChange={e => setForm({ ...form, people_involved: e.target.value })} rows={2}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Witnesses (Optional) */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Witnesses (Optional)</label>
        <textarea placeholder="Names of witnesses..." value={form.witnesses}
          onChange={e => setForm({ ...form, witnesses: e.target.value })} rows={2}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Photo Upload (Optional) */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Photo (Optional)</label>
        {photoPreview ? (
          <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-border">
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={handleRemovePhoto} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-all">
            <div className="text-center">
              <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground font-bold">Click to upload photo</p>
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="ops-input hidden" />
          </label>
        )}
      </div>

      {/* Follow-up Required */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.follow_up_required} onChange={e => setForm({ ...form, follow_up_required: e.target.checked })} />
        <span className="text-xs font-bold text-foreground">Follow-up required</span>
      </label>

      {/* Follow-up Owner (conditional) */}
      {form.follow_up_required && (
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Follow-up Owner</label>
          <input type="text" placeholder="Name or role..." value={form.follow_up_owner}
            onChange={e => setForm({ ...form, follow_up_owner: e.target.value })}
            className="w-full h-9 px-3 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      )}

      {/* Follow-up Due Date (conditional) */}
      {form.follow_up_required && (
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Follow-up Due Date</label>
          <input type="date" value={form.follow_up_due_date}
            onChange={e => setForm({ ...form, follow_up_due_date: e.target.value })}
            className="w-full h-9 px-3 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      )}

      {/* Resolution Notes (Optional) */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Resolution Notes (Optional)</label>
        <textarea placeholder="How was the incident resolved?..." value={form.resolution_notes}
          onChange={e => setForm({ ...form, resolution_notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 liquid-card rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Incident Report'}
      </button>
    </div>
  );
}