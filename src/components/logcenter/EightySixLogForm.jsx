import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';

const NOTIFY_ROLES = [
  { id: 'managers', label: 'Managers' },
  { id: 'servers', label: 'Servers' },
  { id: 'bartenders', label: 'Bartenders' },
  { id: 'cooks', label: 'Cooks' },
];

export default function EightySixLogForm({ onSave, loading }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({
    item_name: '',
    reason: '',
    area_menu_category: '',
    date_time_started: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    logged_by: user?.full_name || user?.email || '',
    expected_return_date: '',
    expected_return_time: '',
    linked_inventory_item_id: '',
    linked_recipe_id: '',
    notify_roles: ['managers', 'servers'],
    photo_url: '',
    notes: '',
  });

  const [recipes, setRecipes] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      base44.entities.Recipe.list('-updated_date', 50).catch(() => []),
      base44.entities.InventoryItem.list('-updated_date', 50).catch(() => []),
    ]).then(([recipeData, invData]) => {
      setRecipes(recipeData);
      setInventoryItems(invData);
    });
  }, []);

  const handleNotifyRoleToggle = (role) => {
    setForm(f => ({
      ...f,
      notify_roles: f.notify_roles.includes(role)
        ? f.notify_roles.filter(r => r !== role)
        : [...f.notify_roles, role],
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
    if (!form.item_name.trim()) newErrors.item_name = 'Item name is required';
    if (!form.reason.trim()) newErrors.reason = 'Reason is required';
    if (!form.area_menu_category.trim()) newErrors.area_menu_category = 'Area/Category is required';
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

    const expectedReturnDateTime = form.expected_return_date && form.expected_return_time
      ? `${form.expected_return_date}T${form.expected_return_time}`
      : null;

    base44.entities.EightySixItem.create({
      item_name: form.item_name,
      reason: form.reason,
      area_menu_category: form.area_menu_category,
      date_time_started: form.date_time_started,
      logged_by: form.logged_by,
      expected_return_date: form.expected_return_date,
      expected_return_time: form.expected_return_time,
      linked_inventory_item_id: form.linked_inventory_item_id || null,
      linked_recipe_id: form.linked_recipe_id || null,
      notify_roles: form.notify_roles,
      photo_url: photoUrl,
      notes: form.notes,
      status: 'active',
    }).then(onSave).catch(err => {
      console.error('Failed to save 86 item:', err);
      alert('Failed to save 86 item');
    });
  };

  return (
    <div className="space-y-3">
      {/* Item Name */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.item_name ? 'text-red-400' : 'text-secondary-text'}`}>
          Item Unavailable *
        </label>
        <input type="text" placeholder="e.g. Ribeye Steak..." value={form.item_name}
          onChange={e => setForm({ ...form, item_name: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.item_name ? 'border-red-500/50' : 'border-border'
          }`} />
        {errors.item_name && <p className="text-xs text-red-400 mt-0.5">{errors.item_name}</p>}
      </div>

      {/* Reason */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.reason ? 'text-red-400' : 'text-secondary-text'}`}>
          Reason *
        </label>
        <input type="text" placeholder="e.g. Out of stock, equipment down..." value={form.reason}
          onChange={e => setForm({ ...form, reason: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.reason ? 'border-red-500/50' : 'border-border'
          }`} />
        {errors.reason && <p className="text-xs text-red-400 mt-0.5">{errors.reason}</p>}
      </div>

      {/* Area / Menu Category */}
      <div>
        <label className={`text-xs font-bold block mb-1 ${errors.area_menu_category ? 'text-red-400' : 'text-secondary-text'}`}>
          Area / Menu Category *
        </label>
        <input type="text" placeholder="e.g. Entrees, Bar, Appetizers..." value={form.area_menu_category}
          onChange={e => setForm({ ...form, area_menu_category: e.target.value })}
          className={`w-full h-9 px-3 bg-background border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none ${
            errors.area_menu_category ? 'border-red-500/50' : 'border-border'
          }`} />
        {errors.area_menu_category && <p className="text-xs text-red-400 mt-0.5">{errors.area_menu_category}</p>}
      </div>

      {/* Date/Time Started & Logged By */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Date/Time Started *</label>
          <input type="datetime-local" value={form.date_time_started}
            onChange={e => setForm({ ...form, date_time_started: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
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

      {/* Expected Return Date & Time */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Expected Return Date (Optional)</label>
          <input type="date" value={form.expected_return_date}
            onChange={e => setForm({ ...form, expected_return_date: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Expected Return Time (Optional)</label>
          <input type="time" value={form.expected_return_time}
            onChange={e => setForm({ ...form, expected_return_time: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      {/* Linked Items */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Linked Recipe/Menu Item (Optional)</label>
          <select value={form.linked_recipe_id} onChange={e => setForm({ ...form, linked_recipe_id: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="">Select recipe...</option>
            {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-secondary-text block mb-1">Linked Inventory Item (Optional)</label>
          <select value={form.linked_inventory_item_id} onChange={e => setForm({ ...form, linked_inventory_item_id: e.target.value })}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="">Select item...</option>
            {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name || i.itemName}</option>)}
          </select>
        </div>
      </div>

      {/* Photo */}
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

      {/* Notify Roles */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-2">Notify Roles</label>
        <div className="grid grid-cols-2 gap-2">
          {NOTIFY_ROLES.map(role => (
            <button key={role.id} onClick={() => handleNotifyRoleToggle(role.id)}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                form.notify_roles.includes(role.id)
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}>
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-bold text-secondary-text block mb-1">Notes (Optional)</label>
        <textarea placeholder="Additional details..." value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={loading}
        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log 86 Item'}
      </button>
    </div>
  );
}