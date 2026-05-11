import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle,
  Beaker,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Droplets,
  ListChecks,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Thermometer,
  UserRound,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BottomSheet from '@/components/BottomSheet';

const WORKFLOWS = [
  { id: 'breakdown', label: 'Closing Sidework', icon: Droplets, status: 'status-neutral', route: '/side-work-templates' },
  { id: 'prep', label: 'Prep Queue', icon: ClipboardCheck, status: 'status-info', route: '/tasks?tab=prep' },
  { id: 'sidework', label: 'Sidework', icon: ListChecks, status: 'status-neutral', route: '/side-work-templates' },
  { id: 'temps', label: 'Temps', icon: Thermometer, status: 'status-info', route: '/temperature-dashboard' },
  { id: 'cleaning', label: 'Cleaning', icon: Sparkles, status: 'status-success', route: '/cleaning' },
  { id: 'chemicals', label: 'Chemicals / SDS', icon: Beaker, status: 'status-neutral', route: '/chemical-library' },
];

const EQUIPMENT_TYPES = [
  ['dish-machine', 'Dish Machine'],
  ['3-compartment-sink', '3-Comp Sink'],
  ['hand-sink', 'Hand Sink'],
  ['prep-sink', 'Prep Sink'],
  ['walk-in-cooler', 'Walk-in Cooler'],
  ['walk-in-freezer', 'Walk-in Freezer'],
  ['reach-in-cooler', 'Reach-in Cooler'],
  ['reach-in-freezer', 'Reach-in Freezer'],
  ['prep-table-cooler', 'Prep Table Cooler'],
  ['lowboy-cooler', 'Lowboy Cooler'],
  ['beer-cooler', 'Beer Cooler'],
  ['wine-cooler', 'Wine Cooler'],
  ['chest-freezer', 'Chest Freezer'],
  ['ice-machine', 'Ice Machine'],
  ['fryer', 'Fryer'],
  ['flat-top', 'Flat Top'],
  ['grill', 'Grill'],
  ['oven', 'Oven'],
  ['steam-table', 'Steam Table'],
  ['hot-holding-cabinet', 'Hot Holding'],
  ['soda-gun', 'Soda Gun'],
  ['glass-washer', 'Glass Washer'],
  ['hood-system', 'Hood System'],
  ['grease-trap', 'Grease Trap'],
  ['hvac', 'HVAC'],
  ['water-heater', 'Water Heater'],
  ['other', 'Other'],
];

const isActive = (item) => item?.isActive !== false;

const DEMO_STATION_ASSIGNMENTS = {
  pantry: [
    { name: 'Maya Chen', role: 'Prep Lead', shift: '9a-4p' },
    { name: 'Andre Ruiz', role: 'Line Prep', shift: '10a-5p' },
  ],
  salad: [
    { name: 'Jess Morgan', role: 'Station', shift: '9a-3p' },
  ],
  line: [
    { name: 'Taylor Kim', role: 'Expo', shift: '11a-7p' },
    { name: 'Chris Patel', role: 'Cook', shift: '11a-7p' },
  ],
  bar: [
    { name: 'Nina Brooks', role: 'Bar Lead', shift: '3p-close' },
  ],
  kitchen: [
    { name: 'Maya Chen', role: 'Prep Lead', shift: '9a-4p' },
    { name: 'Taylor Kim', role: 'Expo', shift: '11a-7p' },
  ],
};

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function stationAssignments(station, area) {
  const key = `${station?.name || ''} ${area?.name || ''}`.toLowerCase();
  const match = Object.entries(DEMO_STATION_ASSIGNMENTS).find(([name]) => key.includes(name));
  return match?.[1] || [
    { name: 'Maya Chen', role: 'Station', shift: '10a-4p' },
    { name: 'Andre Ruiz', role: 'Support', shift: '11a-5p' },
  ];
}

function sideworkTaskName(task) {
  return task.taskName || task.task_name || task.name || 'Station task';
}

function sideworkTaskDue(task) {
  return task.dueTime || task.due_time || '';
}

function sideworkTaskPhase(task) {
  return task.shiftPhase || task.shift_phase || task.shift || 'anytime';
}

function OperationalRing({ value }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
          style={{ filter: 'drop-shadow(0 0 10px rgba(230, 106, 31, 0.28))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black tracking-tight text-foreground">{value}%</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Ready</span>
      </div>
    </div>
  );
}

function StationRow({ station, equipment, selected, onClick }) {
  const tempCount = equipment.filter((item) => item.temp_enabled || item.requiresTemperatureLog).length;
  const issueCount = equipment.filter((item) => item.requiresMaintenanceChecklist).length;
  const readiness = isActive(station) ? 88 : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition-all duration-200 active:scale-[0.99]',
        selected ? 'glow-active' : 'border-border/60 bg-card/70 glow-interactive'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('status-marker status-marker-lg', isActive(station) ? 'status-success' : 'status-neutral')}>
          {readiness}%
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-black tracking-tight text-foreground">{station.name}</p>
            <span className="status-pill status-neutral shrink-0">{station.department || 'Ops'}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {equipment.length} equipment · {tempCount} temp checks · {issueCount} open issue{issueCount === 1 ? '' : 's'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>

      {equipment.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {equipment.slice(0, 4).map((item) => (
            <span key={item.id} className="shrink-0 rounded-full border border-border/50 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
              {item.name}
            </span>
          ))}
          {equipment.length > 4 && (
            <span className="shrink-0 rounded-full border border-border/50 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
              +{equipment.length - 4}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function SetupToggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/50 bg-black/20 px-3 py-2 text-left transition-all active:scale-[0.99]"
    >
      <span className="min-w-0">
        <span className="block text-xs font-bold text-foreground">{label}</span>
        <span className="block text-[10px] text-muted-foreground">{description}</span>
      </span>
      <span className={cn('h-5 w-9 rounded-full border p-0.5 transition-all', checked ? 'border-primary bg-primary/30' : 'border-border bg-muted/40')}>
        <span className={cn('block h-3.5 w-3.5 rounded-full bg-foreground transition-transform', checked && 'translate-x-4 bg-primary')} />
      </span>
    </button>
  );
}

function EquipmentSetupForm({ initialEquipment, station, area, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    name: initialEquipment?.name || '',
    equipmentType: initialEquipment?.equipmentType || 'other',
    modelNumber: initialEquipment?.modelNumber || '',
    serialNumber: initialEquipment?.serialNumber || '',
    notes: initialEquipment?.notes || '',
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const submit = () => {
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      name: form.name.trim(),
      area_id: area?.id || station.area_id || '',
      area_name: area?.name || station.area_name || '',
      station_id: station.id,
      station_name: station.name,
      department: station.department || '',
      isActive: true,
    });
  };

  return (
    <div className="space-y-2 rounded-xl border border-border/50 bg-black/20 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="Equipment name"
          className="col-span-2 h-9 rounded-lg border border-border/60 bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
        />
        <select
          value={form.equipmentType}
          onChange={(event) => update('equipmentType', event.target.value)}
          className="col-span-2 h-9 rounded-lg border border-border/60 bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
        >
          {EQUIPMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input
          value={form.modelNumber}
          onChange={(event) => update('modelNumber', event.target.value)}
          placeholder="Model #"
          className="h-9 rounded-lg border border-border/60 bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
        />
        <input
          value={form.serialNumber}
          onChange={(event) => update('serialNumber', event.target.value)}
          placeholder="Serial #"
          className="h-9 rounded-lg border border-border/60 bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
        />
      </div>
      <textarea
        value={form.notes}
        onChange={(event) => update('notes', event.target.value)}
        placeholder="Notes"
        rows={2}
        className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving || !form.name.trim()}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : initialEquipment ? 'Save Equipment' : 'Add Equipment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border/60 px-3 py-2 text-xs font-black text-muted-foreground transition-all hover:bg-muted/40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EquipmentSetupCard({ item, station, area, cleaningTemplates = [], maintenanceTemplates = [], inventoryItems = [], onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeConfig, setActiveConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  const updateField = async (field, value) => {
    setSaving(true);
    await base44.entities.Equipment.update(item.id, { [field]: value });
    await onRefresh?.();
    setSaving(false);
  };

  const updateFields = async (data) => {
    setSaving(true);
    await base44.entities.Equipment.update(item.id, data);
    await onRefresh?.();
    setSaving(false);
  };

  const saveEquipment = async (data) => {
    setSaving(true);
    await base44.entities.Equipment.update(item.id, data);
    await onRefresh?.();
    setEditing(false);
    setSaving(false);
  };

  const configStatus = {
    temps: (item.requiresTemperatureLog || item.temp_enabled)
      ? hasTempSchedule(item) ? 'scheduled' : 'missing'
      : 'off',
    cleaning: item.requiresCleaningChecklist
      ? item.cleaning_template_id ? 'linked' : 'missing'
      : 'off',
    maintenance: item.requiresMaintenanceChecklist
      ? item.maintenance_template_id ? 'linked' : 'missing'
      : 'off',
    stock: item.inInventory
      ? item.inventory_item_id ? 'linked' : 'missing'
      : 'off',
  };
  const summaryPills = [
    configStatus.temps !== 'off' && <EquipmentStatusPill key="temps" label="Temps" status={configStatus.temps} />,
    configStatus.cleaning !== 'off' && <EquipmentStatusPill key="cleaning" label="Clean" status={configStatus.cleaning} />,
    configStatus.maintenance !== 'off' && <EquipmentStatusPill key="maintenance" label="Maint" status={configStatus.maintenance} />,
    configStatus.stock !== 'off' && <EquipmentStatusPill key="stock" label="Stock" status={configStatus.stock} />,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-all hover:bg-muted/20"
      >
        <div className="status-marker status-marker-sm status-neutral">
          <Wrench className="h-3 w-3" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-foreground">{item.name}</p>
          <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
            <p className="shrink-0 text-[10px] text-muted-foreground">{item.equipmentType?.replace(/-/g, ' ') || 'Equipment'}</p>
            {summaryPills.length > 0 ? summaryPills.slice(0, 3) : <span className="status-pill status-neutral">No setup</span>}
            {summaryPills.length > 3 && <span className="status-pill status-neutral">+{summaryPills.length - 3}</span>}
          </div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border/40 px-3 py-3">
          {editing ? (
            <EquipmentSetupForm
              initialEquipment={item}
              station={station}
              area={area}
              saving={saving}
              onCancel={() => setEditing(false)}
              onSubmit={saveEquipment}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg bg-black/20 px-2.5 py-2">
                  <p className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Model</p>
                  <p className="mt-1 truncate text-xs font-bold text-foreground">{item.modelNumber || 'Not set'}</p>
                </div>
                <div className="rounded-lg bg-black/20 px-2.5 py-2">
                  <p className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Serial</p>
                  <p className="mt-1 truncate text-xs font-bold text-foreground">{item.serialNumber || 'Not set'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-black text-foreground transition-all hover:bg-muted/50"
              >
                Edit equipment details
              </button>

              <div className="space-y-2">
                <EquipmentConfigRow
                  icon={Thermometer}
                  title="Temps"
                  detail={(item.requiresTemperatureLog || item.temp_enabled) ? (hasTempSchedule(item) ? 'Schedule active' : 'Needs schedule') : 'Not tracked'}
                  status={configStatus.temps}
                  open={activeConfig === 'temps'}
                  onClick={() => setActiveConfig(activeConfig === 'temps' ? null : 'temps')}
                />
                {activeConfig === 'temps' && (
                  <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <SetupToggle label="Enabled" description="Show this equipment in temp workflows" checked={Boolean(item.requiresTemperatureLog || item.temp_enabled)} onChange={(value) => updateField('requiresTemperatureLog', value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Frequency</span>
                        <select
                          value={item.temp_check_frequency_minutes || ''}
                          onChange={(event) => updateField('temp_check_frequency_minutes', event.target.value ? Number(event.target.value) : null)}
                          className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
                        >
                          <option value="">Manual</option>
                          <option value="30">Every 30 min</option>
                          <option value="60">Every hour</option>
                          <option value="120">Every 2 hours</option>
                          <option value="240">Every 4 hours</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Grace</span>
                        <select
                          value={item.temp_grace_period_minutes || 15}
                          onChange={(event) => updateField('temp_grace_period_minutes', Number(event.target.value))}
                          className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
                        >
                          <option value="10">10 min</option>
                          <option value="15">15 min</option>
                          <option value="30">30 min</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <SetupToggle label="Opening check" description="Create opening temp task" checked={Boolean(item.required_on_opening)} onChange={(value) => updateField('required_on_opening', value)} />
                      <SetupToggle label="Closing check" description="Create closing temp task" checked={Boolean(item.required_on_closing)} onChange={(value) => updateField('required_on_closing', value)} />
                    </div>
                    <TempScheduleSummary item={item} />
                  </div>
                )}

                <EquipmentConfigRow
                  icon={Sparkles}
                  title="Cleaning"
                  detail={item.requiresCleaningChecklist ? (item.cleaning_template_name || 'Needs template') : 'Not tracked'}
                  status={configStatus.cleaning}
                  open={activeConfig === 'cleaning'}
                  onClick={() => setActiveConfig(activeConfig === 'cleaning' ? null : 'cleaning')}
                />
                {activeConfig === 'cleaning' && (
                  <div className="space-y-2 rounded-lg border border-border/50 bg-black/20 p-2">
                    <SetupToggle label="Enabled" description="Create recurring cleaning work" checked={Boolean(item.requiresCleaningChecklist)} onChange={(value) => updateField('requiresCleaningChecklist', value)} />
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Template</span>
                      <select
                        value={item.cleaning_template_id || ''}
                        onChange={(event) => {
                          const template = cleaningTemplates.find((option) => option.id === event.target.value);
                          updateFields({
                            cleaning_template_id: template?.id || '',
                            cleaning_template_name: template?.name || '',
                          });
                        }}
                        className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
                      >
                        <option value="">No template linked</option>
                        {cleaningTemplates.map((template) => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                <EquipmentConfigRow
                  icon={Wrench}
                  title="Maintenance"
                  detail={item.requiresMaintenanceChecklist ? (item.maintenance_template_name || 'Needs automation') : 'Not tracked'}
                  status={configStatus.maintenance}
                  open={activeConfig === 'maintenance'}
                  onClick={() => setActiveConfig(activeConfig === 'maintenance' ? null : 'maintenance')}
                />
                {activeConfig === 'maintenance' && (
                  <div className="space-y-2 rounded-lg border border-border/50 bg-black/20 p-2">
                    <SetupToggle label="Enabled" description="Create service checks and review tasks" checked={Boolean(item.requiresMaintenanceChecklist)} onChange={(value) => updateField('requiresMaintenanceChecklist', value)} />
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Automation</span>
                      <select
                        value={item.maintenance_template_id || ''}
                        onChange={(event) => {
                          const template = maintenanceTemplates.find((option) => option.id === event.target.value);
                          if (template) {
                            const appliesToEquipment = Array.isArray(template.applies_to_equipment) ? template.applies_to_equipment : [];
                            if (!appliesToEquipment.includes(item.id)) {
                              base44.entities.AutomationTemplate.update(template.id, {
                                applies_to_equipment: [...appliesToEquipment, item.id],
                              }).catch((error) => console.error('Failed to link automation to equipment:', error));
                            }
                          }
                          updateFields({
                            maintenance_template_id: template?.id || '',
                            maintenance_template_name: template?.template_name || '',
                          });
                        }}
                        className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
                      >
                        <option value="">No automation linked</option>
                        {maintenanceTemplates.map((template) => (
                          <option key={template.id} value={template.id}>{template.template_name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                <EquipmentConfigRow
                  icon={ClipboardCheck}
                  title="Stock"
                  detail={item.inInventory ? (item.inventory_item_name || 'Needs inventory item') : 'Not tracked'}
                  status={configStatus.stock}
                  open={activeConfig === 'stock'}
                  onClick={() => setActiveConfig(activeConfig === 'stock' ? null : 'stock')}
                />
                {activeConfig === 'stock' && (
                  <div className="space-y-2 rounded-lg border border-border/50 bg-black/20 p-2">
                    <SetupToggle label="Enabled" description="Create station readiness stocking work" checked={Boolean(item.inInventory)} onChange={(value) => updateField('inInventory', value)} />
                    <label className="block space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Inventory Item</span>
                      <select
                        value={item.inventory_item_id || ''}
                        onChange={(event) => {
                          const inventoryItem = inventoryItems.find((option) => option.id === event.target.value);
                          updateFields({
                            inventory_item_id: inventoryItem?.id || '',
                            inventory_item_name: inventoryItem?.name || '',
                          });
                        }}
                        className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
                      >
                        <option value="">No inventory item linked</option>
                        {inventoryItems.map((inventoryItem) => (
                          <option key={inventoryItem.id} value={inventoryItem.id}>{inventoryItem.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>

              {saving && <p className="text-[10px] font-bold text-primary">Saving...</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const isEquipmentConfigured = (item) => Boolean(
  item.requiresTemperatureLog ||
  item.temp_enabled ||
  item.requiresCleaningChecklist ||
  item.requiresMaintenanceChecklist ||
  item.inInventory
);

const hasTempSchedule = (item) => Boolean(
  item.temp_check_frequency_minutes ||
  item.required_on_opening ||
  item.required_on_closing
);

function TempScheduleSummary({ item }) {
  const schedule = [];
  if (item.required_on_opening) schedule.push('Opening');
  if (item.required_on_closing) schedule.push('Closing');
  if (item.temp_check_frequency_minutes) schedule.push(`Every ${item.temp_check_frequency_minutes} min`);

  return (
    <div className="rounded-lg border border-border/50 bg-black/20 px-3 py-2">
      <p className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Temp Schedule</p>
      <p className="mt-1 text-xs font-bold text-foreground">{schedule.length ? schedule.join(' + ') : 'Not scheduled'}</p>
    </div>
  );
}

function EquipmentStatusPill({ label, status }) {
  const statusClass = status === 'linked' || status === 'scheduled'
    ? 'status-success'
    : status === 'missing'
      ? 'status-info'
      : 'status-neutral';

  return <span className={cn('status-pill shrink-0', statusClass)}>{label}</span>;
}

function EquipmentConfigRow({ icon: Icon, title, detail, status, open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all active:scale-[0.99]',
        open ? 'border-primary/40 bg-primary/10' : 'border-border/50 bg-black/20'
      )}
    >
      <div className={cn('status-marker status-marker-sm', status === 'off' ? 'status-neutral' : status === 'missing' ? 'status-info' : 'status-success')}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-foreground">{title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{detail}</p>
      </div>
      <EquipmentStatusPill label={status === 'off' ? 'Off' : status === 'missing' ? 'Missing' : status === 'scheduled' ? 'Scheduled' : 'Linked'} status={status} />
      {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

function StationSetupPanel({ station, area, equipment, cleaningTemplates = [], maintenanceTemplates = [], inventoryItems = [], onRefresh }) {
  const [savingStation, setSavingStation] = useState(false);
  const [addingEquipment, setAddingEquipment] = useState(false);
  const [savingEquipment, setSavingEquipment] = useState(false);

  const toggleStationActive = async () => {
    setSavingStation(true);
    await base44.entities.Station.update(station.id, { isActive: !isActive(station) });
    await onRefresh?.();
    setSavingStation(false);
  };

  const addEquipment = async (data) => {
    setSavingEquipment(true);
    await base44.entities.Equipment.create(data);
    await onRefresh?.();
    setAddingEquipment(false);
    setSavingEquipment(false);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="metric-label">Station Setup</p>
          <h3 className="mt-1 text-lg font-black text-foreground">{station.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{area?.name || 'No area'} · {station.department || 'Operations'} · {equipment.length} equipment</p>
        </div>
        <button
          type="button"
          onClick={toggleStationActive}
          disabled={savingStation}
          className={cn('status-pill shrink-0', isActive(station) ? 'status-success' : 'status-neutral')}
        >
          {savingStation ? 'Saving' : isActive(station) ? 'Active' : 'Inactive'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg border border-border/50 bg-black/20 px-3 py-2">
          <p className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Area</p>
          <p className="mt-1 truncate text-xs font-bold text-foreground">{area?.name || 'Unassigned'}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-black/20 px-3 py-2">
          <p className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Role Group</p>
          <p className="mt-1 truncate text-xs font-bold text-foreground">{station.department || 'Operations'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="metric-label">Equipment Setup</p>
          {!addingEquipment && (
            <button
              type="button"
              onClick={() => setAddingEquipment(true)}
              className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary transition-all hover:bg-primary/15"
            >
              Add Equipment
            </button>
          )}
        </div>

        {addingEquipment && (
          <EquipmentSetupForm
            station={station}
            area={area}
            saving={savingEquipment}
            onCancel={() => setAddingEquipment(false)}
            onSubmit={addEquipment}
          />
        )}

        {equipment.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-black/10 px-3 py-4 text-center text-xs font-semibold text-muted-foreground">
            No equipment is attached to this station yet.
          </div>
        ) : (
          equipment.map((item) => (
            <EquipmentSetupCard
              key={item.id}
              item={item}
              station={station}
              area={area}
              cleaningTemplates={cleaningTemplates}
              maintenanceTemplates={maintenanceTemplates}
              inventoryItems={inventoryItems}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StationWorkflowPanel({ workflow, station, area, equipment, onOpenFull }) {
  const workflowId = workflow?.id;
  const isSideworkWorkflow = workflowId === 'sidework' || workflowId === 'breakdown';
  const [stationSidework, setStationSidework] = useState([]);
  const [loadingSidework, setLoadingSidework] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);

  const loadStationSidework = async () => {
    if (!station?.name || !isSideworkWorkflow) return;
    setLoadingSidework(true);
    try {
      const tasks = await base44.entities.DailySideWorkTask.list('-updated_date', 200).catch(() => []);
      const normalizedStation = station.name.toLowerCase();
      const phase = workflow.id === 'breakdown' ? 'end' : null;
      setStationSidework(tasks.filter((task) => {
        const taskStation = (task.station || task.role || '').toLowerCase();
        const stationMatch = task.station_id === station.id || taskStation === normalizedStation || taskStation.includes(normalizedStation);
        const phaseMatch = !phase || sideworkTaskPhase(task) === phase || task.shift === 'closing';
        return stationMatch && phaseMatch;
      }));
    } finally {
      setLoadingSidework(false);
    }
  };

  useEffect(() => {
    loadStationSidework();
  }, [station?.id, workflowId]);

  if (!workflow) return null;

  const tempEquipment = equipment.filter((item) => item.temp_enabled || item.requiresTemperatureLog);
  const cleaningEquipment = equipment.filter((item) => item.requiresCleaningChecklist);
  const configuredEquipment = equipment.filter(isEquipmentConfigured);

  const updateSideworkTask = async (task, data) => {
    setSavingTaskId(task.id);
    await base44.entities.DailySideWorkTask.update(task.id, data);
    await loadStationSidework();
    setSavingTaskId(null);
  };

  const addStationSideworkTask = async () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const phase = workflow.id === 'breakdown' ? 'end' : 'anytime';
    setSavingTaskId('new');
    await base44.entities.DailySideWorkTask.create({
      sideWorkTemplateId: `manual-${station.id}`,
      sideWorkTemplateItemId: `manual-${station.id}-${now.getTime()}`,
      date,
      shift: workflow.id === 'breakdown' ? 'closing' : 'all',
      department: station.department === 'FOH' ? 'FOH' : 'BOH',
      area_id: area?.id || station.area_id || '',
      area_name: area?.name || station.area_name || '',
      station_id: station.id,
      station: station.name,
      role: station.name,
      taskName: workflow.id === 'breakdown' ? 'New closing sidework' : 'New station sidework',
      task_name: workflow.id === 'breakdown' ? 'New closing sidework' : 'New station sidework',
      shiftPhase: phase,
      priority: 'medium',
      status: 'pending',
      requiresPhoto: false,
      requiresManagerReview: false,
    });
    await loadStationSidework();
    setSavingTaskId(null);
  };

  const panelContent = {
    temps: {
      eyebrow: 'Station Temps',
      title: tempEquipment.length ? `${tempEquipment.length} equipment checks` : 'No temp checks configured',
      description: tempEquipment.length ? 'Record station temperatures without leaving this sheet.' : 'Use Station setup to mark equipment that needs temp logs.',
      rows: tempEquipment.map(item => {
        const schedule = [];
        if (item.required_on_opening) schedule.push('Opening');
        if (item.required_on_closing) schedule.push('Closing');
        if (item.temp_check_frequency_minutes) schedule.push(`Every ${item.temp_check_frequency_minutes} min`);

        return {
          label: item.name,
          meta: schedule.length ? schedule.join(' + ') : 'Manual temp check',
          status: hasTempSchedule(item) ? 'Scheduled' : 'Setup',
        };
      }),
    },
    cleaning: {
      eyebrow: 'Station Cleaning',
      title: cleaningEquipment.length ? `${cleaningEquipment.length} cleaning task sources` : 'No cleaning tasks configured',
      description: cleaningEquipment.length ? 'Cleaning work attached to this station equipment.' : 'Use Station setup to attach cleaning checklists to equipment.',
      rows: cleaningEquipment.map(item => ({ label: item.name, meta: 'Cleaning checklist', status: 'Setup' })),
    },
    prep: {
      eyebrow: 'Station Prep',
      title: 'Prep queue preview',
      description: 'Show the next prep work tied to this station, then open the full queue when needed.',
      rows: [
        { label: station.name, meta: 'Station prep filter', status: 'Open' },
        { label: area?.name || 'All areas', meta: 'Area context', status: 'Context' },
      ],
    },
    sidework: {
      eyebrow: 'Station Sidework',
      title: stationSidework.length ? `${stationSidework.length} station task${stationSidework.length === 1 ? '' : 's'}` : 'No sidework assigned',
      description: 'Manager view for sidework assigned to this station. Edit it here without jumping to staff tasks.',
      rows: stationSidework.map((task) => ({ label: sideworkTaskName(task), meta: sideworkTaskDue(task) ? `Due ${sideworkTaskDue(task)}` : sideworkTaskPhase(task), status: task.status || 'pending' })),
    },
    breakdown: {
      eyebrow: 'Closing Flow',
      title: stationSidework.length ? `${stationSidework.length} closing task${stationSidework.length === 1 ? '' : 's'}` : 'No closing sidework assigned',
      description: 'Manager view for closing tasks attached to this station.',
      rows: stationSidework.map((task) => ({ label: sideworkTaskName(task), meta: sideworkTaskDue(task) ? `Due ${sideworkTaskDue(task)}` : sideworkTaskPhase(task), status: task.status || 'pending' })),
    },
    chemicals: {
      eyebrow: 'Chemicals / SDS',
      title: 'Station SDS preview',
      description: 'Quick access point for chemicals linked to this station and its equipment.',
      rows: [
        { label: station.name, meta: 'Station chemicals', status: 'Review' },
        { label: `${equipment.length} equipment`, meta: 'Potential SDS links', status: 'Library' },
      ],
    },
  }[workflow.id] || {
    eyebrow: workflow.label,
    title: workflow.label,
    description: 'Station-scoped workflow preview.',
    rows: [],
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="metric-label">{panelContent.eyebrow}</p>
          <h3 className="mt-1 text-lg font-black text-foreground">{panelContent.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{panelContent.description}</p>
        </div>
        <button
          type="button"
          onClick={onOpenFull}
          className="shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[10px] font-black text-primary transition-all hover:bg-primary/15"
        >
          {isSideworkWorkflow ? 'Manage templates' : 'Open full view'}
        </button>
      </div>

      {isSideworkWorkflow ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={addStationSideworkTask}
            disabled={savingTaskId === 'new'}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/35 bg-primary/5 px-3 py-2 text-xs font-black text-primary transition-all hover:bg-primary/10 disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            {savingTaskId === 'new' ? 'Adding...' : workflow.id === 'breakdown' ? 'Add closing task' : 'Add station task'}
          </button>

          {loadingSidework ? (
            <div className="rounded-xl border border-border/50 bg-black/20 px-3 py-4 text-center text-xs font-semibold text-muted-foreground">
              Loading station sidework...
            </div>
          ) : stationSidework.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-black/10 px-3 py-4 text-center text-xs font-semibold text-muted-foreground">
              No sidework tasks are assigned to this station yet.
            </div>
          ) : (
            stationSidework.map((task) => (
              <div key={task.id} className="space-y-2 rounded-xl border border-border/50 bg-black/20 p-3">
                <input
                  defaultValue={sideworkTaskName(task)}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (value && value !== sideworkTaskName(task)) {
                      updateSideworkTask(task, { taskName: value, task_name: value });
                    }
                  }}
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary/50"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={task.status || 'pending'}
                    onChange={(event) => updateSideworkTask(task, { status: event.target.value })}
                    className="h-9 rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="pending_review">Review</option>
                    <option value="approved">Approved</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <select
                    value={task.priority || 'medium'}
                    onChange={(event) => updateSideworkTask(task, { priority: event.target.value })}
                    className="h-9 rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <input
                    type="time"
                    defaultValue={sideworkTaskDue(task)}
                    onBlur={(event) => updateSideworkTask(task, { dueTime: event.target.value, due_time: event.target.value })}
                    className="h-9 rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground">
                  <span>{sideworkTaskPhase(task)} · {station.name}</span>
                  {savingTaskId === task.id && <span className="text-primary">Saving...</span>}
                </div>
              </div>
            ))
          )}
        </div>
      ) : panelContent.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-black/10 px-3 py-4 text-center text-xs font-semibold text-muted-foreground">
          Nothing configured for this station yet.
        </div>
      ) : (
        <div className="space-y-2">
          {panelContent.rows.map((row) => (
            <div key={`${workflow.id}-${row.label}-${row.meta}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-black/20 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{row.label}</p>
                <p className="text-[10px] text-muted-foreground">{row.meta}</p>
              </div>
              <span className="status-pill status-neutral shrink-0">{row.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StationDetailSheet({ station, area, equipment, cleaningTemplates, maintenanceTemplates, inventoryItems, open, onClose, onRefresh }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    setActiveSection('overview');
    setActivePanel(null);
  }, [station?.id, open]);

  if (!station) return null;

  const tempEquipment = equipment.filter((item) => item.temp_enabled || item.requiresTemperatureLog);
  const issueCount = equipment.filter((item) => item.requiresMaintenanceChecklist).length;
  const assignedEmployees = stationAssignments(station, area);
  const selectedWorkflow = WORKFLOWS.find((workflow) => workflow.id === activePanel);
  const configuredEquipment = equipment.filter(isEquipmentConfigured);
  const tempScheduleCount = tempEquipment.filter(hasTempSchedule).length;
  const setupTotal = equipment.length + 1;
  const completionPct = setupTotal > 0 ? Math.round(((configuredEquipment.length + (isActive(station) ? 1 : 0)) / setupTotal) * 100) : 100;
  const complianceTotal = tempEquipment.length + equipment.filter((item) => item.requiresCleaningChecklist).length;
  const complianceComplete = tempScheduleCount + equipment.filter((item) => item.requiresCleaningChecklist).length;
  const compliancePct = complianceTotal > 0 ? Math.round((complianceComplete / complianceTotal) * 100) : 100;
  const attentionItems = [
    !isActive(station) && 'Station is inactive',
    equipment.length === 0 && 'No equipment assigned',
    tempEquipment.length > tempScheduleCount && `${tempEquipment.length - tempScheduleCount} temp schedule${tempEquipment.length - tempScheduleCount === 1 ? '' : 's'} missing`,
    issueCount > 0 && `${issueCount} maintenance issue${issueCount === 1 ? '' : 's'} flagged`,
  ].filter(Boolean);
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'setup', label: 'Setup' },
    { id: 'work', label: 'Work' },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} className="bg-background/95 border-border/70">
      <div className="space-y-5 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="metric-label">{area?.name || 'Station'}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">{station.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{equipment.length} equipment · {station.department || 'Operations'}</p>
          </div>
          <div className={cn('status-marker status-marker-lg', isActive(station) ? 'status-success' : 'status-neutral')}>
            {isActive(station) ? 'On' : 'Off'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/50 bg-card/70 p-3 text-center">
            <p className="text-xl font-black text-foreground">{tempEquipment.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Temps</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/70 p-3 text-center">
            <p className="text-xl font-black text-foreground">{equipment.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Equipment</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/70 p-3 text-center">
            <p className={cn('text-xl font-black', issueCount > 0 ? 'text-red-400' : 'text-green-400')}>{issueCount}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Issues</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border/60 bg-black/20 p-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setActiveSection(section.id);
                setActivePanel(null);
              }}
              className={cn(
                'h-9 rounded-xl text-[11px] font-black transition-all active:scale-[0.98]',
                activeSection === section.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              {section.label}
            </button>
          ))}
        </div>

        {activeSection === 'overview' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="metric-label">Assigned Today</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {assignedEmployees.map((employee) => (
                  <div key={`${station.id}-${employee.name}`} className="shrink-0 rounded-full border border-border/50 bg-black/25 py-1.5 pl-1.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="status-marker status-marker-sm status-neutral">
                        {initials(employee.name)}
                      </span>
                      <span className="text-xs font-bold text-foreground">{employee.name}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground">{employee.role}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground">{employee.shift}</span>
                    </div>
                  </div>
                ))}
                <div className="shrink-0 rounded-full border border-dashed border-border/60 bg-black/10 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                  <UserRound className="mr-1 inline h-3 w-3" />
                  Demo crew
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                <p className="metric-label">Completion</p>
                <p className="mt-2 text-2xl font-black text-foreground">{completionPct}%</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{configuredEquipment.length} of {equipment.length} equipment configured</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                <p className="metric-label">Compliance</p>
                <p className="mt-2 text-2xl font-black text-foreground">{compliancePct}%</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{tempScheduleCount} of {tempEquipment.length} temp schedules active</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="metric-label">Attention</p>
              {attentionItems.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-black/20 px-3 py-3 text-xs font-bold text-muted-foreground">
                  No setup or compliance gaps for this station.
                </div>
              ) : (
                attentionItems.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-border/50 bg-black/20 px-3 py-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-xs font-bold text-foreground">{item}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSection === 'setup' && (
          <StationSetupPanel
            station={station}
            area={area}
            equipment={equipment}
            cleaningTemplates={cleaningTemplates}
            maintenanceTemplates={maintenanceTemplates}
            inventoryItems={inventoryItems}
            onRefresh={onRefresh}
          />
        )}

        {activeSection === 'work' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {WORKFLOWS.map(({ id, label, icon: Icon, status }) => {
                const selected = activePanel === id;

                return (
                  <button
                    key={id}
                    onClick={() => setActivePanel(selected ? null : id)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition-all active:scale-[0.98] glow-interactive',
                      selected ? 'border-primary/50 bg-primary/10' : 'border-border/60 bg-card/70'
                    )}
                  >
                    <div className={cn('status-marker status-marker-md mb-3', status)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-black text-foreground">{label}</p>
                  </button>
                );
              })}
            </div>

            {selectedWorkflow && (
              <StationWorkflowPanel
                workflow={selectedWorkflow}
                station={station}
                area={area}
                equipment={equipment}
                onOpenFull={() => {
                  const isSideworkWorkflow = selectedWorkflow.id === 'sidework' || selectedWorkflow.id === 'breakdown';
                  const route = isSideworkWorkflow
                    ? `${selectedWorkflow.route}?station=${encodeURIComponent(station.id)}`
                    : selectedWorkflow.route;
                  onClose?.();
                  navigate(route, { state: { stationId: station.id, stationName: station.name, areaId: area?.id, areaName: area?.name } });
                }}
              />
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

export default function OperationalMap() {
  const [areas, setAreas] = useState([]);
  const [stations, setStations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [cleaningTemplates, setCleaningTemplates] = useState([]);
  const [maintenanceTemplates, setMaintenanceTemplates] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('all');
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [areaData, stationData, equipmentData, cleaningTemplateData, automationTemplateData, inventoryData] = await Promise.all([
        base44.entities.Area.list().catch(() => []),
        base44.entities.Station.list().catch(() => []),
        base44.entities.Equipment.list().catch(() => []),
        base44.entities.CleaningTemplate.list().catch(() => []),
        base44.entities.AutomationTemplate.filter({ category: 'maintenance_check' }).catch(() => []),
        base44.entities.InventoryItem.list().catch(() => []),
      ]);
      setAreas(areaData);
      setStations(stationData);
      setEquipment(equipmentData);
      setCleaningTemplates(cleaningTemplateData.filter(isActive));
      setMaintenanceTemplates(automationTemplateData.filter((item) => item.is_active !== false));
      setInventoryItems(inventoryData);
    } catch (error) {
      console.error('Failed to load operational data:', error);
    }
    setLoading(false);
  };

  const activeAreas = useMemo(() => areas.filter(isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), [areas]);
  const activeStations = useMemo(() => stations.filter(isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), [stations]);
  const activeEquipment = useMemo(() => equipment.filter(isActive), [equipment]);

  const query = search.trim().toLowerCase();

  const visibleAreas = useMemo(() => {
    return activeAreas.filter((area) => {
      if (selectedAreaId !== 'all' && area.id !== selectedAreaId) return false;
      if (!query) return true;

      const areaStations = activeStations.filter((station) => station.area_id === area.id || station.area_name === area.name);
      const areaEquipment = activeEquipment.filter((item) => item.area_id === area.id || item.area_name === area.name);
      return [area.name, ...areaStations.map((station) => station.name), ...areaEquipment.map((item) => item.name)]
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [activeAreas, activeStations, activeEquipment, query, selectedAreaId]);

  const unassignedStations = useMemo(() => {
    if (selectedAreaId !== 'all') return [];
    return activeStations.filter((station) => {
      const hasArea = activeAreas.some((area) => station.area_id === area.id || station.area_name === area.name);
      if (hasArea) return false;
      if (!query) return true;
      return station.name?.toLowerCase().includes(query);
    });
  }, [activeAreas, activeStations, query, selectedAreaId]);

  const selectedStation = activeStations.find((station) => station.id === selectedStationId);
  const selectedArea = selectedStation ? activeAreas.find((area) => selectedStation.area_id === area.id || selectedStation.area_name === area.name) : null;
  const selectedEquipment = selectedStation ? activeEquipment.filter((item) => item.station_id === selectedStation.id || item.station_name === selectedStation.name) : [];

  const issueCount = activeEquipment.filter((item) => item.requiresMaintenanceChecklist).length;
  const readiness = activeStations.length > 0 ? Math.round((activeStations.filter(isActive).length / activeStations.length) * 100) : 100;

  return (
    <div className="app-screen">
      <main className="app-page mx-auto max-w-[620px] space-y-5">
        <header className="flex items-start justify-between gap-4 pt-1">
          <div>
            <p className="metric-label">Stations</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Operational map</h1>
          </div>
          <button onClick={loadData} className="status-marker status-marker-md status-neutral" aria-label="Refresh stations">
            <RefreshCw className="h-4 w-4" />
          </button>
        </header>

        <section className="app-card-lg flex items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="metric-label">Today</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Restaurant pulse</h2>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div>
                <p className="text-xl font-black text-foreground">{activeAreas.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Areas</p>
              </div>
              <div>
                <p className="text-xl font-black text-foreground">{activeStations.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Stations</p>
              </div>
              <div>
                <p className={cn('text-xl font-black', issueCount > 0 ? 'text-red-400' : 'text-green-400')}>{issueCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Issues</p>
              </div>
            </div>
          </div>
          <OperationalRing value={readiness} />
        </section>

        <div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search areas, stations, equipment"
            className="h-12 w-full rounded-xl border border-border/60 bg-card/70 px-4 text-sm text-foreground outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedAreaId('all')}
            className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all', selectedAreaId === 'all' ? 'glow-active' : 'border border-border/50 bg-card/70 text-muted-foreground glow-interactive')}
          >
            All Areas
          </button>
          {activeAreas.map((area) => (
            <button
              key={area.id}
              onClick={() => setSelectedAreaId(area.id)}
              className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all', selectedAreaId === area.id ? 'glow-active' : 'border border-border/50 bg-card/70 text-muted-foreground glow-interactive')}
            >
              {area.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="app-card py-12 text-center text-sm text-muted-foreground">Loading stations...</div>
        ) : (
          <div className="space-y-4">
            {visibleAreas.map((area) => {
              const areaStations = activeStations.filter((station) => station.area_id === area.id || station.area_name === area.name);
              const filteredStations = query
                ? areaStations.filter((station) => {
                    const stationEquipment = activeEquipment.filter((item) => item.station_id === station.id || item.station_name === station.name);
                    return [station.name, ...stationEquipment.map((item) => item.name)].some((value) => value?.toLowerCase().includes(query));
                  })
                : areaStations;

              if (filteredStations.length === 0 && query) return null;

              return (
                <section key={area.id} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h2 className="text-lg font-black tracking-tight text-foreground">{area.name}</h2>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{filteredStations.length} station{filteredStations.length === 1 ? '' : 's'}</span>
                  </div>

                  <div className="space-y-2">
                    {filteredStations.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/50 bg-card/40 p-5 text-sm text-muted-foreground">
                        No stations in this area yet.
                      </div>
                    ) : (
                      filteredStations.map((station) => {
                        const stationEquipment = activeEquipment.filter((item) => item.station_id === station.id || item.station_name === station.name);
                        return (
                          <StationRow
                            key={station.id}
                            station={station}
                            equipment={stationEquipment}
                            selected={station.id === selectedStationId}
                            onClick={() => setSelectedStationId(station.id)}
                          />
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}

            {unassignedStations.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <h2 className="text-lg font-black tracking-tight text-foreground">Unassigned</h2>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">Needs area</span>
                </div>
                <div className="space-y-2">
                  {unassignedStations.map((station) => {
                    const stationEquipment = activeEquipment.filter((item) => item.station_id === station.id || item.station_name === station.name);
                    return (
                      <StationRow
                        key={station.id}
                        station={station}
                        equipment={stationEquipment}
                        selected={station.id === selectedStationId}
                        onClick={() => setSelectedStationId(station.id)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {visibleAreas.length === 0 && unassignedStations.length === 0 && (
              <div className="app-card py-12 text-center">
                <div className="status-marker status-marker-lg status-neutral mx-auto mb-4">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No stations match your search.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <StationDetailSheet
        station={selectedStation}
        area={selectedArea}
        equipment={selectedEquipment}
        cleaningTemplates={cleaningTemplates}
        maintenanceTemplates={maintenanceTemplates}
        inventoryItems={inventoryItems}
        open={Boolean(selectedStation)}
        onClose={() => setSelectedStationId(null)}
        onRefresh={loadData}
      />
    </div>
  );
}

export const hideBase44Index = true;
