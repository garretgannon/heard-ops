import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['Open', 'In Progress', 'Waiting on Vendor', 'Completed', 'Cancelled'];

export default function MaintenanceRequestForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    title: '',
    equipment_area: '',
    location: '',
    priority: 'Medium',
    status: 'Open',
    reported_by: user?.full_name || user?.email || '',
    reported_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    equipment_tag: '',
    vendor_tag: '',
    estimated_cost: '',
    assigned_person: '',
    due_date: '',
    notes: '',
    resolution_notes: '',
    follow_up_date: '',
    photo_url: '',
  });

  const [equipment, setEquipment] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      base44.entities.Equipment.list('-updated_date', 100).then(data => setEquipment(data.filter(e => e.isActive))).catch(() => {}),
      base44.entities.Vendor.list('-updated_date', 100).then(data => setVendors(data.filter(v => v.active))).catch(() => {}),
    ]);
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
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.equipment_area.trim()) newErrors.equipment_area = 'Equipment or area is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    let photoUrl = form.photo_url;
    if (photoFile) {
      photoUrl = await uploadPhoto();
    }

    base44.entities.MaintenanceRequest.create({
      title: form.title,
      equipment_area: form.equipment_area,
      location: form.location,
      priority: form.priority,
      status: form.status,
      reported_by: form.reported_by,
      reported_at: form.reported_at,
      equipment_tag: form.equipment_tag,
      vendor_tag: form.vendor_tag,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      assigned_person: form.assigned_person,
      due_date: form.due_date || null,
      notes: form.notes,
      resolution_notes: form.resolution_notes,
      follow_up_date: form.follow_up_date || null,
      photo_url: photoUrl,
    }).then(onSave).catch(err => {
      console.error('Failed to save maintenance request:', err);
      toast.error('Failed to save maintenance request');
    });
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.title ? 'text-red-400' : 'text-secondary-text'}`}>
          Title / Issue Summary *
        </label>
        <input type="text" placeholder="e.g. Fryer not heating, Cooler door hinge broken..." value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.title ? 'border-red-500/50' : 'border-border'
          }`} />
        {errors.title && <p className="text-xs text-red-400 mt-0.5">{errors.title}</p>}
      </div>

      {/* Equipment or Area */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.equipment_area ? 'text-red-400' : 'text-secondary-text'}`}>
          Equipment or Area Affected *
        </label>
        <input type="text" placeholder="e.g. Walk-in Cooler, Fryer #2, Hood System..." value={form.equipment_area}
          onChange={e => setForm({ ...form, equipment_area: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.equipment_area ? 'border-red-500/50' : 'border-border'
          }`} />
        {errors.equipment_area && <p className="text-xs text-red-400 mt-0.5">{errors.equipment_area}</p>}
      </div>

      {/* Location */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.location ? 'text-red-400' : 'text-secondary-text'}`}>
          Location *
        </label>
        <input type="text" placeholder="Kitchen, Dining Room, BOH..." value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.location ? 'border-red-500/50' : 'border-border'
          }`} />
        {errors.location && <p className="text-xs text-red-400 mt-0.5">{errors.location}</p>}
      </div>

      {/* Priority & Status */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Priority *</label>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
            className="w-full h-9 px-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Status *</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
            className="w-full h-9 px-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Reported By & Date */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Reported By</label>
          <input type="text" value={form.reported_by}
            onChange={e => setForm({ ...form, reported_by: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Date / Time Reported</label>
          <input type="datetime-local" value={form.reported_at}
            onChange={e => setForm({ ...form, reported_at: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      {/* Equipment & Vendor Tags */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Equipment Tag</label>
          <select value={form.equipment_tag} onChange={e => setForm({ ...form, equipment_tag: e.target.value })}
            className="w-full h-9 px-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="">Select equipment...</option>
            {equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Vendor Tag</label>
          <select value={form.vendor_tag} onChange={e => setForm({ ...form, vendor_tag: e.target.value })}
            className="w-full h-9 px-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="">Select vendor...</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>

      {/* Assigned Person & Due Date */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Assigned Person</label>
          <input type="text" placeholder="Name or email..." value={form.assigned_person}
            onChange={e => setForm({ ...form, assigned_person: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Due Date</label>
          <input type="date" value={form.due_date}
            onChange={e => setForm({ ...form, due_date: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      {/* Estimated Cost */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Estimated Cost ($)</label>
        <input type="number" min="0" step="0.01" placeholder="0.00" value={form.estimated_cost}
          onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
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

      {/* Notes */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Notes</label>
        <textarea placeholder="Details about the issue..." value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Resolution Notes */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Resolution Notes</label>
        <textarea placeholder="How was this resolved?..." value={form.resolution_notes}
          onChange={e => setForm({ ...form, resolution_notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Follow-up Date */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Follow-up Date</label>
        <input type="date" value={form.follow_up_date}
          onChange={e => setForm({ ...form, follow_up_date: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Maintenance Request'}
      </button>
    </div>
  );
}