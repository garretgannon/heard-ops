import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';

const TEMP_CATEGORIES = [
  { id: 'cooling', label: 'Cooling Log', min: 41, max: 70 },
  { id: 'fridge_freezer', label: 'Fridge / Freezer', min: -10, max: 41 },
  { id: 'hot_holding', label: 'Hot Holding', min: 135, max: 200 },
];

export default function TemperatureLogForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    category: 'fridge_freezer',
    equipment_name: '',
    area_station: '',
    temperature: '',
    unit: 'F',
    recorded_by: user?.full_name || user?.email || '',
    assigned_to: '',
    corrective_action: '',
    notes: '',
    photo_url: '',
    follow_up_required: false,
    requires_manager_review: false,
    logged_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
  });

  const [equipment, setEquipment] = useState([]);
  const [safeRanges, setSafeRanges] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});

  const selectedCategory = TEMP_CATEGORIES.find(c => c.id === form.category);

  useEffect(() => {
    base44.entities.Equipment.list('-updated_date', 100)
      .then(data => setEquipment(data.filter(e => e.isActive)))
      .catch(() => setEquipment([]));

    base44.entities.FoodSafetySettings.filter({ key: 'global' })
      .then(data => data.length > 0 ? setSafeRanges(data[0]) : null)
      .catch(() => {});
  }, []);

  const handlePhotoSelect = async (e) => {
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

  const getPassFailStatus = () => {
    if (form.temperature === '') return null;
    const temp = parseFloat(form.temperature);
    const min = selectedCategory?.min || 34;
    const max = selectedCategory?.max || 41;
    return temp >= min && temp <= max ? 'passed' : 'failed';
  };

  const passFailStatus = getPassFailStatus();
  const isFailed = passFailStatus === 'failed';

  const validate = () => {
    const newErrors = {};
    if (!form.temperature) newErrors.temperature = 'Temperature is required';
    if (form.temperature && isNaN(parseFloat(form.temperature))) newErrors.temperature = 'Must be a number';
    if (!form.equipment_name) newErrors.equipment_name = 'Equipment is required';
    if (isFailed && !form.corrective_action.trim()) newErrors.corrective_action = 'Corrective action is required for failed temperatures';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    let photoUrl = form.photo_url;
    if (photoFile) {
      photoUrl = await uploadPhoto();
    }

    base44.entities.TemperatureLog.create({
      category: form.category,
      equipment_name: form.equipment_name,
      area_station: form.area_station,
      temperature: parseFloat(form.temperature),
      unit: form.unit,
      recorded_by: form.recorded_by,
      assigned_to: form.assigned_to,
      corrective_action: form.corrective_action,
      notes: form.notes,
      photo_url: photoUrl,
      follow_up_required: form.follow_up_required,
      requires_manager_review: form.requires_manager_review || isFailed,
      pass_fail_status: passFailStatus,
      logged_at: form.logged_at,
      is_out_of_range: isFailed,
    }).then(onSave).catch(err => {
      console.error('Failed to save temperature log:', err);
      alert('Failed to save temperature log');
    });
  };

  return (
    <div className="space-y-4">
      {/* Category */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Temperature Category *</label>
        <div className="grid grid-cols-3 gap-1.5">
          {TEMP_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setForm({ ...form, category: cat.id })}
              className={`py-2 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                form.category === cat.id ? 'bg-primary/20 text-primary border-primary/40' : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.equipment_name ? 'text-red-400' : 'text-secondary-text'}`}>
          Equipment *
        </label>
        <select value={form.equipment_name} onChange={e => setForm({ ...form, equipment_name: e.target.value })}
         className={`w-full h-9 px-3 bg-background border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none ${
           errors.equipment_name ? 'border-red-500/50' : 'border-border'
         }`}>
          <option value="">Select equipment...</option>
          {equipment.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
        </select>
        {errors.equipment_name && <p className="text-xs text-red-400 mt-0.5">{errors.equipment_name}</p>}
      </div>

      {/* Area / Station */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Area / Station</label>
        <input type="text" placeholder="e.g. Walk-in Cooler, Line 2..." value={form.area_station}
          onChange={e => setForm({ ...form, area_station: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none" />
      </div>

      {/* Temperature Reading */}
      <div className="grid grid-cols-[1fr_60px] gap-2">
        <div>
          <label className={`text-xs font-bold block mb-1 ${errors.temperature ? 'text-red-400' : 'text-secondary-text'}`}>
            Temperature Reading *
          </label>
          <input type="number" step="0.1" placeholder="38.5" value={form.temperature}
            onChange={e => setForm({ ...form, temperature: e.target.value })}
            className={`w-full h-9 px-3 bg-background border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none ${
              errors.temperature ? 'border-red-500/50' : 'border-border'
            }`} />
          {errors.temperature && <p className="text-xs text-red-400 mt-0.5">{errors.temperature}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Unit</label>
          <input type="text" value="°F" disabled className="w-full h-9 px-3 bg-muted border border-border rounded-lg sm:text-sm text-base text-muted-foreground" />
        </div>
      </div>

      {/* Pass / Fail Status */}
      {form.temperature && !errors.temperature && (
        <div className={`p-3 rounded-lg border ${
          isFailed ? 'bg-red-500/15 border-red-500/30' : 'bg-green-500/15 border-green-500/30'
        }`}>
          <p className={`text-sm font-bold ${isFailed ? 'text-red-400' : 'text-green-400'}`}>
            {isFailed ? '❌ OUT OF RANGE' : '✅ IN RANGE'}
          </p>
          <p className={`text-xs ${isFailed ? 'text-red-300' : 'text-green-300'}`}>
            Safe range: {selectedCategory?.min}°F - {selectedCategory?.max}°F
          </p>
        </div>
      )}

      {/* Corrective Action (required if failed) */}
      {isFailed && (
        <div>
          <label className={`text-xs font-bold block mb-1 ${errors.corrective_action ? 'text-red-400' : 'text-secondary-text'}`}>
            Corrective Action Required *
          </label>
          <textarea placeholder="What action was taken to correct this?" value={form.corrective_action}
            onChange={e => setForm({ ...form, corrective_action: e.target.value })} rows={2}
            className={`w-full px-3 py-2 bg-background border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none resize-none ${
              errors.corrective_action ? 'border-red-500/50' : 'border-border'
            }`} />
          {errors.corrective_action && <p className="text-xs text-red-400 mt-0.5">{errors.corrective_action}</p>}
        </div>
      )}

      {/* Recorded By & Assigned To */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Recorded By</label>
          <input type="text" value={form.recorded_by}
            onChange={e => setForm({ ...form, recorded_by: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Assigned To</label>
          <input type="text" placeholder="Role / Station / Employee..." value={form.assigned_to}
            onChange={e => setForm({ ...form, assigned_to: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      {/* Date / Time */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Date / Time Recorded</label>
        <input type="datetime-local" value={form.logged_at}
          onChange={e => setForm({ ...form, logged_at: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none" />
      </div>

      {/* Photo Upload */}
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
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </label>
        )}
      </div>

      {/* Optional Toggles */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.follow_up_required} onChange={e => setForm({ ...form, follow_up_required: e.target.checked })} />
          <span className="text-xs font-bold text-foreground">Follow-up required</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.requires_manager_review} onChange={e => setForm({ ...form, requires_manager_review: e.target.checked })} />
          <span className="text-xs font-bold text-foreground">Manager review required</span>
        </label>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Notes</label>
        <textarea placeholder="Additional details..." value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg sm:text-sm text-base text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Temperature Log'}
      </button>
    </div>
  );
}