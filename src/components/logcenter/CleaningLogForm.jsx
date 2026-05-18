import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['completed', 'incomplete', 'passed', 'failed'];

export default function CleaningLogForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    cleaning_area: '',
    template_id: '',
    template_name: '',
    completed_by: user?.full_name || user?.email || '',
    logged_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    status: 'completed',
    photo_url: '',
    notes: '',
    assigned_role: '',
    assigned_station: '',
    manager_review_required: false,
    supplies_needed: '',
    issues_found: '',
    safety_concerns: false,
  });

  const [areas, setAreas] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stations, setStations] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      base44.entities.Area.list('-updated_date', 50).then(data => setAreas(data.filter(a => a.isActive))).catch(() => setAreas([])),
      base44.entities.CleaningTemplate.list('-updated_date', 50).then(data => setTemplates(data.filter(t => t.isActive))).catch(() => setTemplates([])),
      base44.entities.Station.list('-updated_date', 50).then(data => setStations(data.filter(s => s.isActive))).catch(() => setStations([])),
    ]);
  }, []);

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setForm(f => ({
      ...f,
      template_id: templateId,
      template_name: template?.name || '',
    }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
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
    if (!form.cleaning_area.trim()) newErrors.cleaning_area = 'Cleaning area is required';
    if (!form.completed_by.trim()) newErrors.completed_by = 'Completed by is required';
    if (!form.status) newErrors.status = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    let photoUrl = form.photo_url;
    if (photoFile) {
      photoUrl = await uploadPhoto();
    }

    base44.entities.UnifiedLog.create({
      type: 'cleaning',
      title: form.cleaning_area,
      description: [
        form.notes,
        form.issues_found && `Issues: ${form.issues_found}`,
        form.supplies_needed && `Supplies needed: ${form.supplies_needed}`,
      ].filter(Boolean).join('\n\n'),
      location: form.cleaning_area,
      employee_name: form.completed_by,
      status: (form.status === 'failed' || form.status === 'incomplete') ? 'flagged' : 'resolved',
      priority: form.safety_concerns ? 'high' : 'medium',
      visibility: 'team_log',
      requires_review: form.manager_review_required,
      photo_urls: photoUrl ? [photoUrl] : [],
    }).then(onSave).catch(err => {
      console.error('Failed to save cleaning log:', err);
      toast.error('Failed to save cleaning log');
    });
  };

  return (
    <div className="space-y-3">
      {/* Cleaning Area */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.cleaning_area ? 'text-red-400' : 'text-secondary-text'}`}>
          Cleaning Area *
        </label>
        <select value={form.cleaning_area} onChange={e => setForm({ ...form, cleaning_area: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.cleaning_area ? 'border-red-500/50' : 'border-border'
          }`}>
          <option value="">Select area...</option>
          {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </select>
        {errors.cleaning_area && <p className="text-xs text-red-400 mt-0.5">{errors.cleaning_area}</p>}
      </div>

      {/* Template Used */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Checklist/Template Used</label>
        <select value={form.template_id} onChange={e => handleTemplateChange(e.target.value)}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="">Select template...</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Completed By & Date/Time */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={`text-xs font-bold block mb-1 ${errors.completed_by ? 'text-red-400' : 'text-secondary-text'}`}>
            Completed By *
          </label>
          <input type="text" value={form.completed_by}
            onChange={e => setForm({ ...form, completed_by: e.target.value })}
            className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
              errors.completed_by ? 'border-red-500/50' : 'border-border'
            }`} />
          {errors.completed_by && <p className="text-xs text-red-400 mt-0.5">{errors.completed_by}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Date/Time *</label>
          <input type="datetime-local" value={form.logged_at}
            onChange={e => setForm({ ...form, logged_at: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.status ? 'text-red-400' : 'text-secondary-text'}`}>
          Status *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button key={opt} onClick={() => setForm({ ...form, status: opt })}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                form.status === opt
                  ? opt === 'failed' || opt === 'incomplete' ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-green-500/20 text-green-300 border-green-500/40'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}>
              {opt}
            </button>
          ))}
        </div>
        {errors.status && <p className="text-xs text-red-400 mt-0.5">{errors.status}</p>}
      </div>

      {/* Assigned Role & Station */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Assigned Role</label>
          <input type="text" placeholder="e.g. Dishwasher, Busser..." value={form.assigned_role}
            onChange={e => setForm({ ...form, assigned_role: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Station</label>
          <select value={form.assigned_station} onChange={e => setForm({ ...form, assigned_station: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="">Select station...</option>
            {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Photo Proof */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Photo Proof (Optional)</label>
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
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </label>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Notes (Optional)</label>
        <textarea placeholder="Any observations or additional details..." value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Issues Found */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Issues Found (Optional)</label>
        <textarea placeholder="Any problems discovered during cleaning..." value={form.issues_found}
          onChange={e => setForm({ ...form, issues_found: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Supplies Needed */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Supplies Needed (Optional)</label>
        <textarea placeholder="Any supplies that need to be restocked..." value={form.supplies_needed}
          onChange={e => setForm({ ...form, supplies_needed: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Manager Review Required */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.manager_review_required} onChange={e => setForm({ ...form, manager_review_required: e.target.checked })} />
        <span className="text-xs font-bold text-foreground">Manager review required</span>
      </label>

      {/* Safety Concerns */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.safety_concerns} onChange={e => setForm({ ...form, safety_concerns: e.target.checked })} />
        <span className="text-xs font-bold text-foreground">Safety concerns found</span>
      </label>

      {/* Save Button */}
      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Cleaning Log'}
      </button>
    </div>
  );
}