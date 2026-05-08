import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';

const LOG_CATEGORIES = [
  'Coaching', 'Praise', 'Attendance', 'Policy issue', 'Performance',
  'Training', 'Uniform', 'Guest compliment', 'Guest complaint', 'Documentation', 'Other'
];

export default function EmployeeLogForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    tagged_employee: '',
    log_category: 'Coaching',
    date_time: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    created_by: user?.full_name || user?.email || '',
    notes: '',
    follow_up_required: false,
    follow_up_date: '',
    acknowledgement_required: false,
    photo_url: '',
  });
  const [employees, setEmployees] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    base44.entities.User.list('-updated_date', 100)
      .then(data => setEmployees(data))
      .catch(() => setEmployees([]));
  }, []);

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
    if (!form.tagged_employee.trim()) newErrors.tagged_employee = 'Employee is required';
    if (!form.notes.trim()) newErrors.notes = 'Notes are required';
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
      type: 'employee',
      title: `${form.log_category} — ${form.tagged_employee}`,
      description: form.notes,
      employee_name: form.tagged_employee,
      status: 'open',
      priority: 'medium',
      visibility: 'manager_only',
      follow_up_required: form.follow_up_required,
      follow_up_due_date: form.follow_up_date || null,
      photo_urls: photoUrl ? [photoUrl] : [],
    }).then(onSave).catch(err => {
      console.error('Failed to save employee log:', err);
      alert('Failed to save employee log');
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.tagged_employee ? 'text-red-400' : 'text-secondary-text'}`}>
          Tagged Employee *
        </label>
        <select value={form.tagged_employee} onChange={e => setForm({ ...form, tagged_employee: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.tagged_employee ? 'border-red-500/50' : 'border-border'
          }`}>
          <option value="">Select employee...</option>
          {employees.map(emp => <option key={emp.id} value={emp.full_name || emp.email}>{emp.full_name || emp.email}</option>)}
        </select>
        {errors.tagged_employee && <p className="text-xs text-red-400 mt-0.5">{errors.tagged_employee}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Category *</label>
          <select value={form.log_category} onChange={e => setForm({ ...form, log_category: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {LOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Date/Time *</label>
          <input type="datetime-local" value={form.date_time}
            onChange={e => setForm({ ...form, date_time: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Created By</label>
        <input type="text" value={form.created_by}
          onChange={e => setForm({ ...form, created_by: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>

      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.notes ? 'text-red-400' : 'text-secondary-text'}`}>Notes *</label>
        <textarea placeholder="What's this about?" value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
          className={`w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none ${
            errors.notes ? 'border-red-500/50' : 'border-border'
          }`} />
        {errors.notes && <p className="text-xs text-red-400 mt-0.5">{errors.notes}</p>}
      </div>

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
          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30">
            <div className="text-center">
              <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground font-bold">Click to upload photo</p>
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </label>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.follow_up_required} onChange={e => setForm({ ...form, follow_up_required: e.target.checked })} />
        <span className="text-xs font-bold text-foreground">Follow-up required</span>
      </label>

      {form.follow_up_required && (
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Follow-up Date</label>
          <input type="date" value={form.follow_up_date}
            onChange={e => setForm({ ...form, follow_up_date: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.acknowledgement_required} onChange={e => setForm({ ...form, acknowledgement_required: e.target.checked })} />
        <span className="text-xs font-bold text-foreground">Requires employee acknowledgement</span>
      </label>

      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Employee Log'}
      </button>
    </div>
  );
}