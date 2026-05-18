import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { toast } from 'sonner';
import LogTagManager from './LogTagManager';
import { createLogTags } from '@/hooks/useLogTags';

const WASTE_REASONS = [
  'Spoiled',
  'Overproduced',
  'Burned',
  'Dropped',
  'Expired',
  'Guest return',
  'Other',
];

const UNITS = ['oz', 'lb', 'g', 'kg', 'L', 'mL', 'cup', 'tbsp', 'tsp', 'piece', 'portion', 'case'];

export default function WasteLogForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    item_name: '',
    quantity: '',
    unit: 'oz',
    reason: '',
    station_area: '',
    logged_by: user?.full_name || user?.email || '',
    waste_date: format(new Date(), 'yyyy-MM-dd'),
    waste_time: format(new Date(), 'HH:mm'),
    estimated_cost: '',
    photo_url: '',
    purchased_item_id: '',
    recipe_id: '',
    manager_review_required: false,
    notes: '',
  });

  const [stations, setStations] = useState([]);
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      base44.entities.Station.list('-updated_date', 50).then(data => setStations(data.filter(s => s.isActive))).catch(() => setStations([])),
      base44.entities.PurchasedItem.list('-updated_date', 50).then(data => setItems(data.filter(i => i.active))).catch(() => setItems([])),
      base44.entities.Recipe.list('-updated_date', 50).then(data => setRecipes(data)).catch(() => setRecipes([])),
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
    if (!form.item_name.trim()) newErrors.item_name = 'Item name is required';
    if (!form.quantity || form.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!form.reason) newErrors.reason = 'Reason is required';
    if (!form.station_area.trim()) newErrors.station_area = 'Station/area is required';
    if (!form.logged_by.trim()) newErrors.logged_by = 'Logged by is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    let photoUrl = form.photo_url;
    if (photoFile) {
      photoUrl = await uploadPhoto();
    }

    base44.entities.WasteEntry.create({
      item_name: form.item_name,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      reason: form.reason,
      station_area: form.station_area,
      logged_by: form.logged_by,
      waste_date: form.waste_date,
      waste_time: form.waste_time || null,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      photo_url: photoUrl,
      purchased_item_id: form.purchased_item_id || null,
      recipe_id: form.recipe_id || null,
      manager_review_required: form.manager_review_required,
      notes: form.notes,
    }).then(async (created) => {
      if (selectedTags.length > 0) {
        await createLogTags(created.id, 'waste', selectedTags);
      }
      onSave();
    }).catch(err => {
      console.error('Failed to save waste entry:', err);
      toast.error('Failed to save waste entry');
    });
  };

  return (
    <div className="space-y-3">
      {/* Item Wasted */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.item_name ? 'text-red-400' : 'text-secondary-text'}`}>
          Item Wasted *
        </label>
        <input type="text" placeholder="e.g. Grilled chicken breast..." value={form.item_name}
          onChange={e => setForm({ ...form, item_name: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.item_name ? 'border-red-500/50' : 'border-border'
          }`} />
        {errors.item_name && <p className="text-xs text-red-400 mt-0.5">{errors.item_name}</p>}
      </div>

      {/* Quantity & Unit */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className={`text-xs font-bold block mb-1 ${errors.quantity ? 'text-red-400' : 'text-secondary-text'}`}>
            Quantity *
          </label>
          <input type="number" step="0.01" placeholder="0.00" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
              errors.quantity ? 'border-red-500/50' : 'border-border'
            }`} />
          {errors.quantity && <p className="text-xs text-red-400 mt-0.5">{errors.quantity}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Unit *</label>
          <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.reason ? 'text-red-400' : 'text-secondary-text'}`}>
          Reason *
        </label>
        <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.reason ? 'border-red-500/50' : 'border-border'
          }`}>
          <option value="">Select reason...</option>
          {WASTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.reason && <p className="text-xs text-red-400 mt-0.5">{errors.reason}</p>}
      </div>

      {/* Station/Area & Logged By */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={`text-xs font-bold block mb-1 ${errors.station_area ? 'text-red-400' : 'text-secondary-text'}`}>
            Station/Area *
          </label>
          <select value={form.station_area} onChange={e => setForm({ ...form, station_area: e.target.value })}
            className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
              errors.station_area ? 'border-red-500/50' : 'border-border'
            }`}>
            <option value="">Select station...</option>
            {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          {errors.station_area && <p className="text-xs text-red-400 mt-0.5">{errors.station_area}</p>}
        </div>
        <div>
          <label className={`text-xs font-bold block mb-1 ${errors.logged_by ? 'text-red-400' : 'text-secondary-text'}`}>
            Logged By *
          </label>
          <input type="text" value={form.logged_by}
            onChange={e => setForm({ ...form, logged_by: e.target.value })}
            className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
              errors.logged_by ? 'border-red-500/50' : 'border-border'
            }`} />
          {errors.logged_by && <p className="text-xs text-red-400 mt-0.5">{errors.logged_by}</p>}
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Waste Date *</label>
          <input type="date" value={form.waste_date}
            onChange={e => setForm({ ...form, waste_date: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Time</label>
          <input type="time" value={form.waste_time}
            onChange={e => setForm({ ...form, waste_time: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      {/* Estimated Cost */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Estimated Cost ($) (Optional)</label>
        <input type="number" step="0.01" placeholder="0.00" value={form.estimated_cost}
          onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>

      {/* Linked Purchased Item */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Linked Inventory Item (Optional)</label>
        <select value={form.purchased_item_id} onChange={e => setForm({ ...form, purchased_item_id: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="">Select item...</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.itemName || i.item_name}</option>)}
        </select>
      </div>

      {/* Linked Recipe */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Linked Recipe (Optional)</label>
        <select value={form.recipe_id} onChange={e => setForm({ ...form, recipe_id: e.target.value })}
          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="">Select recipe...</option>
          {recipes.map(r => <option key={r.id} value={r.id}>{r.name || r.title}</option>)}
        </select>
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
        <label className="text-xs font-bold text-secondary-text block mb-1">Notes (Optional)</label>
        <textarea placeholder="Additional context or details..." value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Manager Review Required */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.manager_review_required} onChange={e => setForm({ ...form, manager_review_required: e.target.checked })} />
        <span className="text-xs font-bold text-foreground">Manager review required</span>
      </label>

      {/* Tags */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-2">Tags (Optional)</label>
        <LogTagManager selectedTags={selectedTags} onChange={setSelectedTags} maxTags={5} />
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Waste Log'}
      </button>
    </div>
  );
}