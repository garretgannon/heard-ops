import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Building2, Thermometer, Droplet, UtensilsCrossed, Plus, Trash2, CheckCircle2, Save, X, ChevronDown, Users, Mail } from "lucide-react";
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
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 border-b border-border transition-colors hover:bg-secondary/30 ${color}`}
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const [addingStation, setAddingStation] = useState(false);
  const [addingTemp, setAddingTemp] = useState(false);
  const [addingDish, setAddingDish] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [s, tl, de, u] = await Promise.all([
        base44.entities.Station.list(),
        base44.entities.TempLogLocation.list(),
        base44.entities.DishMachineEquipment.list(),
        base44.entities.User.list(),
      ]);
      setStations(s);
      setTempLocations(tl);
      setDishEquipment(de);
      setUsers(u);
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
        <p className="text-xs text-muted-foreground -mt-1">Refrigerators, freezers, hot wells — these appear in Temp Logs for monitoring.</p>
        <div className="space-y-2">
          {tempLocations.length === 0 && <p className="text-sm text-muted-foreground">No locations yet.</p>}
          {tempLocations.map(loc => (
            <div key={loc.id} className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{loc.name}</span>
                <span className="text-xs text-muted-foreground hidden sm:block capitalize">{loc.type?.replace("_"," ")}</span>
                {loc.target_min != null && loc.target_max != null && (
                  <span className="text-xs text-muted-foreground hidden md:block">{loc.target_min}°–{loc.target_max}°F</span>
                )}
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

      {/* Restaurant Team */}
      <SectionCard icon={Users} title="Restaurant Team" color="text-violet-400" count={users.length}>
        <div className="space-y-2">
          {users.length === 0 && <p className="text-sm text-muted-foreground">No team members yet.</p>}
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {(u.full_name || u.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{u.full_name || u.email}</p>
                  {u.full_name && <p className="text-xs text-muted-foreground">{u.email}</p>}
                </div>
              </div>
              <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-secondary rounded-full">{u.role || "user"}</span>
            </div>
          ))}
        </div>
        {showInvite ? (
          <div className="bg-secondary/30 rounded-xl border border-border p-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <Input className="h-8 text-xs" type="email" placeholder="team@restaurant.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={inviting || !inviteEmail.trim()} onClick={async () => {
                setInviting(true);
                await base44.users.inviteUser(inviteEmail.trim(), "user");
                setInviteEmail("");
                setShowInvite(false);
                setInviting(false);
                toast.success("Invite sent!");
              }}>
                <Mail className="h-3.5 w-3.5 mr-1" />{inviting ? "Sending…" : "Send Invite"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowInvite(false); setInviteEmail(""); }}><X className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowInvite(true)}><Plus className="h-3.5 w-3.5 mr-1" />Invite Team Member</Button>
        )}
      </SectionCard>

      <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4">
        <CheckCircle2 className="h-4 w-4 text-accent" />
        Changes take effect immediately across Prep Lists, Temp Logs, and Dish Machines.
      </div>
    </motion.div>
  );
}