import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Save } from 'lucide-react';

export default function VendorForm({ vendor, onClose, onSave }) {
  const [formData, setFormData] = useState(vendor || {
    name: '',
    category: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [equipment, setEquipment] = useState([]);
  const [linkedEquipment, setLinkedEquipment] = useState(vendor?.linked_equipment_ids || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await base44.entities.Equipment.list();
      setEquipment(data);
      // Pre-select equipment if vendor exists
      if (vendor?.id) {
        const linked = data.filter(eq => eq.vendorId === vendor.id);
        setLinkedEquipment(linked.map(eq => eq.id));
      }
    } catch (error) {
      console.error('Failed to load equipment:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...formData,
        linked_equipment_ids: linkedEquipment,
      };

      if (vendor?.id) {
        await base44.entities.Vendor.update(vendor.id, data);
        // Update equipment to link back
        for (const equipmentId of linkedEquipment) {
          await base44.entities.Equipment.update(equipmentId, { vendorId: vendor.id });
        }
        // Unlink equipment that was deselected
        const allLinked = equipment.filter(eq => eq.vendorId === vendor.id).map(eq => eq.id);
        for (const equipmentId of allLinked) {
          if (!linkedEquipment.includes(equipmentId)) {
            await base44.entities.Equipment.update(equipmentId, { vendorId: null });
          }
        }
      } else {
        const created = await base44.entities.Vendor.create(data);
        // Link selected equipment
        for (const equipmentId of linkedEquipment) {
          await base44.entities.Equipment.update(equipmentId, { vendorId: created.id });
        }
      }
      onSave();
    } catch (error) {
      console.error('Failed to save vendor:', error);
      setSaving(false);
    }
  };

  const toggleEquipment = (equipmentId) => {
    setLinkedEquipment(prev =>
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <h2 className="font-bold text-lg text-foreground">
          {vendor ? 'Edit Vendor' : 'Create Vendor'}
        </h2>
        <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Vendor Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Contact Person</label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            rows="2"
          />
        </div>

        <div className="space-y-2 border-t border-border/40 pt-4">
          <label className="text-xs font-bold text-foreground">Link Equipment</label>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {equipment.length === 0 ? (
              <p className="text-xs text-muted-foreground">No equipment found</p>
            ) : (
              equipment.map(eq => (
                <label key={eq.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkedEquipment.includes(eq.id)}
                    onChange={() => toggleEquipment(eq.id)}
                    className="rounded w-4 h-4"
                  />
                  <span className="text-foreground">{eq.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/40 px-6 py-4 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm font-bold text-muted-foreground border border-border/40 rounded-lg hover:bg-muted transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Vendor'}
        </button>
      </div>
    </div>
  );
}