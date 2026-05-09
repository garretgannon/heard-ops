import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Save } from 'lucide-react';

const CATEGORIES = [
  'temperature_check', 'cleaning_task', 'sanitizer_check', 'prep_verification',
  'opening_checklist', 'closing_checklist', 'maintenance_check', 'compliance_log',
  'station_readiness', 'custom'
];

const SHIFT_TYPES = ['opening', 'mid', 'closing', 'any'];

const PROOF_TYPES = [
  'checkbox', 'temperature_entry', 'number_entry', 'photo', 'text_note',
  'signature', 'manager_approval', 'corrective_action'
];

export default function AutomationTemplateBuilder({ template, onClose }) {
  const [formData, setFormData] = useState(template || {
    template_name: '',
    category: 'temperature_check',
    description: '',
    applies_to_role: [],
    applies_to_shift_type: ['any'],
    applies_to_station: [],
    applies_to_equipment: [],
    is_active: true,
    required_proof_type: [],
    requires_manager_approval: false,
    recurrence_rule: 'once_per_shift',
    due_time: '',
    due_window_minutes: 30,
    priority: 'medium',
  });

  const [roles, setRoles] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoles();
    loadStations();
    loadEquipment();
  }, []);

  const loadRoles = async () => {
    try {
      const data = await base44.entities.Role.list();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadStations = async () => {
    try {
      const data = await base44.entities.Station.list();
      setStations(data);
    } catch (error) {
      console.error('Failed to load stations:', error);
    }
  };

  const loadEquipment = async () => {
    try {
      const data = await base44.entities.Equipment.list();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const data = {
        ...formData,
        created_by: user.email,
      };

      if (template?.id) {
        await base44.entities.AutomationTemplate.update(template.id, data);
      } else {
        await base44.entities.AutomationTemplate.create(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
      setSaving(false);
    }
  };

  const toggleRole = (roleId) => {
    setFormData(prev => ({
      ...prev,
      applies_to_role: prev.applies_to_role.includes(roleId)
        ? prev.applies_to_role.filter(r => r !== roleId)
        : [...prev.applies_to_role, roleId]
    }));
  };

  const toggleStation = (stationId) => {
    setFormData(prev => ({
      ...prev,
      applies_to_station: prev.applies_to_station.includes(stationId)
        ? prev.applies_to_station.filter(s => s !== stationId)
        : [...prev.applies_to_station, stationId]
    }));
  };

  const toggleEquipment = (equipmentId) => {
    setFormData(prev => ({
      ...prev,
      applies_to_equipment: prev.applies_to_equipment.includes(equipmentId)
        ? prev.applies_to_equipment.filter(e => e !== equipmentId)
        : [...prev.applies_to_equipment, equipmentId]
    }));
  };

  const toggleProof = (proofType) => {
    setFormData(prev => ({
      ...prev,
      required_proof_type: prev.required_proof_type.includes(proofType)
        ? prev.required_proof_type.filter(p => p !== proofType)
        : [...prev.required_proof_type, proofType]
    }));
  };

  const toggleShiftType = (shift) => {
    setFormData(prev => ({
      ...prev,
      applies_to_shift_type: prev.applies_to_shift_type.includes(shift)
        ? prev.applies_to_shift_type.filter(s => s !== shift)
        : [...prev.applies_to_shift_type, shift]
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <h2 className="font-bold text-lg text-foreground">
          {template ? 'Edit Template' : 'Create Automation Template'}
        </h2>
        <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Basic Info */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Template Name</label>
          <input
            type="text"
            value={formData.template_name}
            onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            placeholder="e.g. Daily Fryer Temperature Check"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            rows="2"
            placeholder="What is this template for?"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Shift Types */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Applies to Shift Types</label>
          <div className="flex gap-2">
            {SHIFT_TYPES.map(shift => (
              <label key={shift} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.applies_to_shift_type.includes(shift)}
                  onChange={() => toggleShiftType(shift)}
                  className="rounded w-4 h-4"
                />
                <span className="text-foreground capitalize">{shift}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Applies to Roles</label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {roles.map(role => (
              <label key={role.id} className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.applies_to_role.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="rounded w-4 h-4"
                />
                <span className="text-foreground">{role.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Stations */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Applies to Stations</label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {stations.length === 0 ? (
              <p className="text-xs text-muted-foreground">No stations found</p>
            ) : (
              stations.map(station => (
                <label key={station.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.applies_to_station.includes(station.id)}
                    onChange={() => toggleStation(station.id)}
                    className="rounded w-4 h-4"
                  />
                  <span className="text-foreground">{station.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Equipment */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Applies to Equipment</label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {equipment.length === 0 ? (
              <p className="text-xs text-muted-foreground">No equipment found</p>
            ) : (
              equipment.map(eq => (
                <label key={eq.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.applies_to_equipment.includes(eq.id)}
                    onChange={() => toggleEquipment(eq.id)}
                    className="rounded w-4 h-4"
                  />
                  <span className="text-foreground">{eq.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Due Time (HH:MM)</label>
            <input
              type="time"
              value={formData.due_time}
              onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Due Window (min)</label>
            <input
              type="number"
              value={formData.due_window_minutes}
              onChange={(e) => setFormData({ ...formData, due_window_minutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
            />
          </div>
        </div>

        {/* Required Proof */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Required Proof Types</label>
          <div className="flex flex-wrap gap-2">
            {PROOF_TYPES.map(proof => (
              <button
                key={proof}
                onClick={() => toggleProof(proof)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                  formData.required_proof_type.includes(proof)
                    ? 'bg-primary/30 border border-primary/50 text-primary'
                    : 'bg-background border border-border/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {proof}
              </button>
            ))}
          </div>
        </div>

        {/* Approval */}
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={formData.requires_manager_approval}
            onChange={(e) => setFormData({ ...formData, requires_manager_approval: e.target.checked })}
            className="rounded w-4 h-4"
          />
          <span className="text-foreground">Requires Manager Approval</span>
        </label>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-sm text-foreground"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Footer */}
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
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  );
}