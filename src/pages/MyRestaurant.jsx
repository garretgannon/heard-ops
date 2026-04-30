import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Building2, Thermometer, Droplet, UtensilsCrossed, Plus, Trash2, CheckCircle2, Save, X, ChevronDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATION_COLORS = ["red","blue","green","orange","purple","teal","pink","yellow"];
const colorDot = { red:"bg-red-500", blue:"bg-blue-500", green:"bg-green-500", orange:"bg-orange-500", purple:"bg-purple-500", teal:"bg-teal-500", pink:"bg-pink-500", yellow:"bg-yellow-400" };

function SectionCard({ icon: Icon, title, color, count, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 border-b border-border transition-colors hover:bg-secondary/30 text-left ${color}`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <h2 className="font-semibold text-base">{title}</h2>
          {count > 0 && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{count}</span>}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

function InlineForm({ fields, onSave, onCancel, saving }) {
  const [values, setValues] = useState(fields.reduce((acc, f) => ({ ...acc, [f.key]: f.default ?? "" }), {}));
  return (
    <div className="bg-secondary/30 rounded-xl border border-border p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            {f.type === "select" ? (
              <Select value={values[f.key]} onValueChange={v => setValues(p => ({ ...p, [f.key]: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={f.placeholder} /></SelectTrigger>
                <SelectContent>
                  {f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="h-8 text-xs"
                type={f.type || "text"}
                placeholder={f.placeholder}
                value={values[f.key]}
                onChange={e => setValues(p => ({ ...p, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(values)} disabled={saving}>
          <Save className="h-3.5 w-3.5 mr-1" />{saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export default function MyRestaurant() {
  const [stations, setStations] = useState([]);
  const [tempLocations, setTempLocations] = useState([]);
  const [dishEquipment, setDishEquipment] = useState([]);
  const [cashDrawers, setCashDrawers] = useState([]);
  const [pettyCashAmount, setPettyCashAmount] = useState("");
  const [pettyCashId, setPettyCashId] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantNameId, setRestaurantNameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addingStation, setAddingStation] = useState(false);
  const [addingTemp, setAddingTemp] = useState(false);
  const [addingDish, setAddingDish] = useState(false);
  const [addingDrawer, setAddingDrawer] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [s, tl, de, cd, settings, nameSettings] = await Promise.all([
        base44.entities.Station.list(),
        base44.entities.TempLogLocation.list(),
        base44.entities.DishMachineEquipment.list(),
        base44.entities.CashDrawerConfig.list(),
        base44.entities.Settings.filter({ key: "petty_cash_amount" }),
        base44.entities.Settings.filter({ key: "restaurant_name" }),
      ]);
      setStations(s);
      setTempLocations(tl);
      setDishEquipment(de);
      setCashDrawers(cd);
      if (settings.length > 0) {
        setPettyCashAmount(settings[0].value || "");
        setPettyCashId(settings[0].id);
      }
      if (nameSettings.length > 0) {
        setRestaurantName(nameSettings[0].value || "");
        setRestaurantNameId(nameSettings[0].id);
      }
      setLoading(false);
    };
    load();
  }, []);

  const deleteItem = async (entity, id, setter) => {
    await base44.entities[entity].delete(id);
    setter(prev => prev.filter(x => x.id !== id));
    toast.success("Removed");
  };

  const saveStation = async (values) => {
    if (!values.name) return;
    setSaving(true);
    const rec = await base44.entities.Station.create({ name: values.name, color: values.color || "blue", description: values.description, is_active: true });
    setStations(p => [...p, rec]);
    setAddingStation(false);
    setSaving(false);
    toast.success("Station added");
  };

  const saveTemp = async (values) => {
    if (!values.name || !values.type) return;
    setSaving(true);
    const rec = await base44.entities.TempLogLocation.create({
      name: values.name,
      type: values.type,
      target_min: values.target_min ? Number(values.target_min) : undefined,
      target_max: values.target_max ? Number(values.target_max) : undefined,
      check_interval_minutes: values.check_interval_minutes ? Number(values.check_interval_minutes) : 240,
      is_active: true,
    });
    setTempLocations(p => [...p, rec]);
    setAddingTemp(false);
    setSaving(false);
    toast.success("Location added");
  };

  const saveDish = async (values) => {
    if (!values.name || !values.type) return;
    setSaving(true);
    const rec = await base44.entities.DishMachineEquipment.create({ name: values.name, type: values.type, location: values.location, is_active: true });
    setDishEquipment(p => [...p, rec]);
    setAddingDish(false);
    setSaving(false);
    toast.success("Equipment added");
  };

  const saveDrawer = async (values) => {
    if (!values.name) return;
    setSaving(true);
    const rec = await base44.entities.CashDrawerConfig.create({ name: values.name, starting_amount: values.starting_amount ? Number(values.starting_amount) : 0, notes: values.notes });
    setCashDrawers(p => [...p, rec]);
    setAddingDrawer(false);
    setSaving(false);
    toast.success("Drawer added");
  };

  const saveRestaurantName = async () => {
    setSaving(true);
    if (restaurantNameId) {
      await base44.entities.Settings.update(restaurantNameId, { value: restaurantName });
    } else {
      const rec = await base44.entities.Settings.create({ key: "restaurant_name", value: restaurantName });
      setRestaurantNameId(rec.id);
    }
    setSaving(false);
    toast.success("Restaurant name saved");
  };

  const savePettyCash = async () => {
    setSaving(true);
    if (pettyCashId) {
      await base44.entities.Settings.update(pettyCashId, { value: pettyCashAmount });
    } else {
      const rec = await base44.entities.Settings.create({ key: "petty_cash_amount", value: pettyCashAmount });
      setPettyCashId(rec.id);
    }
    setSaving(false);
    toast.success("Petty cash amount saved");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" /> My Restaurant
        </h1>
        <p className="text-muted-foreground mt-1">Configure your kitchen layout — stations, refrigeration, and dish equipment. These flow into Prep Lists, Temp Logs, and Dish Machines.</p>
      </div>

      {/* Restaurant Name */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-base mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Restaurant Name</h2>
        <div className="flex items-center gap-3">
          <Input
            placeholder="e.g. The Golden Fork"
            value={restaurantName}
            onChange={e => setRestaurantName(e.target.value)}
            className="max-w-sm"
          />
          <Button size="sm" onClick={saveRestaurantName} disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1" />{saving ? "Saving…" : "Save"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">This name appears in the app header and sidebar.</p>
      </div>

      {/* Prep Stations */}
      <SectionCard icon={UtensilsCrossed} title="Prep Stations" color="text-blue-400" count={stations.length}>
        <div className="space-y-2">
          {stations.length === 0 && <p className="text-sm text-muted-foreground">No stations yet.</p>}
          {stations.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${colorDot[s.color] || "bg-gray-400"}`} />
                <span className="text-sm font-medium">{s.name}</span>
                {s.description && <span className="text-xs text-muted-foreground hidden sm:block">{s.description}</span>}
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("Station", s.id, setStations)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {addingStation ? (
          <InlineForm
            saving={saving}
            onCancel={() => setAddingStation(false)}
            onSave={saveStation}
            fields={[
              { key: "name", label: "Station Name", placeholder: "e.g. Grill, Salad, Fryer" },
              { key: "description", label: "Description", placeholder: "Optional" },
              { key: "color", label: "Color", type: "select", default: "blue", options: STATION_COLORS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })) },
            ]}
          />
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAddingStation(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add Station</Button>
        )}
      </SectionCard>

      {/* Refrigeration & Temperature Locations */}
      <SectionCard icon={Thermometer} title="Refrigeration & Temperature Locations" color="text-cyan-400" count={tempLocations.length}>
        <p className="text-xs text-muted-foreground -mt-1 text-left">Refrigerators, freezers, hot wells — these appear in Temp Logs for monitoring.</p>
        <div className="space-y-2">
          {tempLocations.length === 0 && <p className="text-sm text-muted-foreground">No locations yet.</p>}
          {tempLocations.map(loc => (
            <div key={loc.id} className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-2.5 text-left">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{loc.name}</span>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => deleteItem("TempLogLocation", loc.id, setTempLocations)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {addingTemp ? (
          <InlineForm
            saving={saving}
            onCancel={() => setAddingTemp(false)}
            onSave={saveTemp}
            fields={[
              { key: "name", label: "Name", placeholder: "e.g. Walk-in Cooler, Reach-in #1" },
              { key: "type", label: "Type", type: "select", options: [
                { value: "refrigerator", label: "Refrigerator" },
                { value: "freezer", label: "Freezer" },
                { value: "hot_well", label: "Hot Well" },
                { value: "cooling", label: "Cooling Log" },
              ]},
              { key: "target_min", label: "Min Safe Temp (°F)", type: "number", placeholder: "e.g. 33" },
              { key: "target_max", label: "Max Safe Temp (°F)", type: "number", placeholder: "e.g. 41" },
              { key: "check_interval_minutes", label: "Check Every (minutes)", type: "number", placeholder: "e.g. 240" },
            ]}
          />
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAddingTemp(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add Location</Button>
        )}
      </SectionCard>

      {/* Dish Machines */}
      <SectionCard icon={Droplet} title="Dish Machines & Sinks" color="text-emerald-400" count={dishEquipment.length}>
        <p className="text-xs text-muted-foreground -mt-1">Dishwashing machines and 3-compartment sinks — these appear in the Dish Machines chemical log.</p>
        <div className="space-y-2">
          {dishEquipment.length === 0 && <p className="text-sm text-muted-foreground">No equipment yet.</p>}
          {dishEquipment.map(eq => (
            <div key={eq.id} className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{eq.name}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">{eq.type === "dishwasher" ? "Dishwashing Machine" : "3-Compartment Sink"}</span>
                {eq.location && <span className="text-xs text-muted-foreground hidden md:block">{eq.location}</span>}
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => deleteItem("DishMachineEquipment", eq.id, setDishEquipment)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {addingDish ? (
          <InlineForm
            saving={saving}
            onCancel={() => setAddingDish(false)}
            onSave={saveDish}
            fields={[
              { key: "name", label: "Equipment Name", placeholder: "e.g. Main Dish Machine" },
              { key: "type", label: "Type", type: "select", options: [
                { value: "dishwasher", label: "Dishwashing Machine" },
                { value: "three_compartment_sink", label: "3-Compartment Sink" },
              ]},
              { key: "location", label: "Location/Area", placeholder: "e.g. Back Kitchen" },
            ]}
          />
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAddingDish(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add Equipment</Button>
        )}
      </SectionCard>


      {/* Cash Configuration */}
      <SectionCard icon={DollarSign} title="Cash Configuration" color="text-green-400" count={cashDrawers.length}>
        <p className="text-xs text-muted-foreground -mt-1">Set up your cash drawers and petty cash starting amounts. These are used as reference in the Cash section.</p>

        <div>
          <h3 className="text-sm font-semibold mb-2">Cash Drawers</h3>
          <div className="space-y-2">
            {cashDrawers.length === 0 && <p className="text-sm text-muted-foreground">No drawers configured yet.</p>}
            {cashDrawers.map(d => (
              <div key={d.id} className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{d.name}</span>
                  {d.starting_amount != null && <span className="text-xs text-green-400 font-medium">${Number(d.starting_amount).toFixed(2)} starting</span>}
                  {d.notes && <span className="text-xs text-muted-foreground hidden sm:block">{d.notes}</span>}
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("CashDrawerConfig", d.id, setCashDrawers)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          {addingDrawer ? (
            <InlineForm
              saving={saving}
              onCancel={() => setAddingDrawer(false)}
              onSave={saveDrawer}
              fields={[
                { key: "name", label: "Drawer Name", placeholder: "e.g. Bar, Host, Register 1" },
                { key: "starting_amount", label: "Starting Amount ($)", type: "number", placeholder: "e.g. 200" },
                { key: "notes", label: "Notes", placeholder: "Optional" },
              ]}
            />
          ) : (
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setAddingDrawer(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add Drawer</Button>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold mb-2">Petty Cash</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={pettyCashAmount}
                onChange={e => setPettyCashAmount(e.target.value)}
                className="pl-7 w-40"
              />
            </div>
            <Button size="sm" onClick={savePettyCash} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" />{saving ? "Saving…" : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total petty cash float kept in the restaurant.</p>
        </div>
      </SectionCard>

      <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4">
        <CheckCircle2 className="h-4 w-4 text-accent" />
        Changes take effect immediately across Prep Lists, Temp Logs, and Dish Machines.
      </div>
    </motion.div>
  );
}