import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { motion } from "framer-motion";
import { Building2, Thermometer, Droplet, UtensilsCrossed, Plus, Trash2, CheckCircle2, Save, X, ChevronDown, DollarSign, Upload, ImageIcon, Clock, Users, Palette, Settings, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATION_COLORS = ["red","blue","green","orange","purple","teal","pink","yellow"];
const colorDot = { red:"bg-red-500", blue:"bg-blue-500", green:"bg-green-500", orange:"bg-orange-500", purple:"bg-purple-500", teal:"bg-teal-500", pink:"bg-pink-500", yellow:"bg-yellow-400" };

function SectionCard({ icon: Icon, title, color, count, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-3 border-b border-border transition-colors hover:bg-secondary/30 text-left ${color}`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <h3 className="font-semibold text-sm">{title}</h3>
          {count > 0 && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{count}</span>}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function InlineForm({ fields, onSave, onCancel, saving }) {
  const [values, setValues] = useState(fields.reduce((acc, f) => ({ ...acc, [f.key]: f.default ?? "" }), {}));
  return (
    <div className="bg-secondary/30 rounded-lg border border-border p-3 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          <Save className="h-3.5 w-3.5 mr-1" />{saving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export default function MyRestaurant() {
  const { isAdmin } = useCurrentUser();

  const [stations, setStations] = useState([]);
  const [tempLocations, setTempLocations] = useState([]);
  const [dishEquipment, setDishEquipment] = useState([]);
  const [cashDrawers, setCashDrawers] = useState([]);
  const [pettyCashAmount, setPettyCashAmount] = useState("");
  const [pettyCashId, setPettyCashId] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantNameId, setRestaurantNameId] = useState(null);
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [restaurantAddressId, setRestaurantAddressId] = useState(null);
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantPhoneId, setRestaurantPhoneId] = useState(null);
  const [timeZone, setTimeZone] = useState("");
  const [timeZoneId, setTimeZoneId] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUrlId, setLogoUrlId] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingStation, setAddingStation] = useState(false);
  const [addingTemp, setAddingTemp] = useState(false);
  const [addingDish, setAddingDish] = useState(false);
  const [addingDrawer, setAddingDrawer] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [s, tl, de, cd, settings, nameSettings, addressSettings, phoneSettings, tzSettings, logoSettings] = await Promise.all([
        base44.entities.Station.list(),
        base44.entities.TempLogLocation.list(),
        base44.entities.DishMachineEquipment.list(),
        base44.entities.CashDrawerConfig.list(),
        base44.entities.Settings.filter({ key: "petty_cash_amount" }),
        base44.entities.Settings.filter({ key: "restaurant_name" }),
        base44.entities.Settings.filter({ key: "restaurant_address" }),
        base44.entities.Settings.filter({ key: "restaurant_phone" }),
        base44.entities.Settings.filter({ key: "time_zone" }),
        base44.entities.Settings.filter({ key: "logo_url" }),
      ]);
      setStations(s);
      setTempLocations(tl);
      setDishEquipment(de);
      setCashDrawers(cd);
      if (settings.length > 0) { setPettyCashAmount(settings[0].value || ""); setPettyCashId(settings[0].id); }
      if (nameSettings.length > 0) { setRestaurantName(nameSettings[0].value || ""); setRestaurantNameId(nameSettings[0].id); }
      if (addressSettings.length > 0) { setRestaurantAddress(addressSettings[0].value || ""); setRestaurantAddressId(addressSettings[0].id); }
      if (phoneSettings.length > 0) { setRestaurantPhone(phoneSettings[0].value || ""); setRestaurantPhoneId(phoneSettings[0].id); }
      if (tzSettings.length > 0) { setTimeZone(tzSettings[0].value || ""); setTimeZoneId(tzSettings[0].id); }
      if (logoSettings.length > 0) { setLogoUrl(logoSettings[0].value || ""); setLogoUrlId(logoSettings[0].id); }
      setLoading(false);
    };
    load();
  }, []);

  if (!isAdmin) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Admin only</p></div>;
  }

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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLogoUrl(file_url);
    if (logoUrlId) {
      await base44.entities.Settings.update(logoUrlId, { value: file_url });
    } else {
      const rec = await base44.entities.Settings.create({ key: "logo_url", value: file_url });
      setLogoUrlId(rec.id);
    }
    setUploadingLogo(false);
    toast.success("Logo saved");
  };

  const saveSetting = async (id, setId, value, key) => {
    setSaving(true);
    if (id) {
      await base44.entities.Settings.update(id, { value });
    } else {
      const rec = await base44.entities.Settings.create({ key, value });
      setId(rec.id);
    }
    setSaving(false);
    toast.success("Saved");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" /> My Restaurant
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Admin setup and configuration.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
          <TabsTrigger value="profile" className="text-xs lg:text-sm gap-1"><Building2 className="h-4 w-4 hidden sm:block" /> Profile</TabsTrigger>
          <TabsTrigger value="hours" className="text-xs lg:text-sm gap-1"><Clock className="h-4 w-4 hidden sm:block" /> Hours</TabsTrigger>
          <TabsTrigger value="departments" className="text-xs lg:text-sm gap-1"><UtensilsCrossed className="h-4 w-4 hidden sm:block" /> Depts</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs lg:text-sm gap-1"><Users className="h-4 w-4 hidden sm:block" /> Roles</TabsTrigger>
          <TabsTrigger value="branding" className="text-xs lg:text-sm gap-1"><Palette className="h-4 w-4 hidden sm:block" /> Brand</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs lg:text-sm gap-1"><Settings className="h-4 w-4 hidden sm:block" /> Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Restaurant Profile</h2>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <div className="flex items-center gap-2">
                  <Input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="e.g. The Golden Fork" className="h-9 text-sm" />
                  <Button size="sm" onClick={() => saveSetting(restaurantNameId, setRestaurantNameId, restaurantName, "restaurant_name")} disabled={saving} className="h-9"><Save className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</Label>
                <div className="flex items-center gap-2">
                  <Input value={restaurantAddress} onChange={e => setRestaurantAddress(e.target.value)} placeholder="123 Main St, City, ST 12345" className="h-9 text-sm" />
                  <Button size="sm" onClick={() => saveSetting(restaurantAddressId, setRestaurantAddressId, restaurantAddress, "restaurant_address")} disabled={saving} className="h-9"><Save className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
                <div className="flex items-center gap-2">
                  <Input value={restaurantPhone} onChange={e => setRestaurantPhone(e.target.value)} placeholder="(555) 123-4567" className="h-9 text-sm" />
                  <Button size="sm" onClick={() => saveSetting(restaurantPhoneId, setRestaurantPhoneId, restaurantPhone, "restaurant_phone")} disabled={saving} className="h-9"><Save className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Time Zone</Label>
                <div className="flex items-center gap-2">
                  <select value={timeZone} onChange={e => setTimeZone(e.target.value)} className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Select timezone...</option>
                    <option value="America/Los_Angeles">Pacific</option>
                    <option value="America/Denver">Mountain</option>
                    <option value="America/Chicago">Central</option>
                    <option value="America/New_York">Eastern</option>
                  </select>
                  <Button size="sm" onClick={() => saveSetting(timeZoneId, setTimeZoneId, timeZone, "time_zone")} disabled={saving} className="h-9"><Save className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-primary" /> Operating Hours</h2>
            <p className="text-xs text-muted-foreground">Configure daily operating hours and shifts. Coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 mb-2"><UtensilsCrossed className="h-4 w-4 text-primary" /> Departments</h2>
            <p className="text-xs text-muted-foreground">Define departments (FOH, BOH, Bar, Management). Coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-primary" /> Default Roles</h2>
            <p className="text-xs text-muted-foreground">Configure default roles and permissions. Coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> Branding</h2>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-lg bg-secondary border border-border flex items-center justify-center overflow-hidden">
                  {logoUrl ? <img src={logoUrl} alt="logo" className="h-16 w-16 object-cover" /> : <ImageIcon className="h-7 w-7 text-muted-foreground" />}
                </div>
                <label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} /><span className="text-xs text-primary flex items-center gap-1 hover:underline"><Upload className="h-3 w-3" />{uploadingLogo ? "Uploading..." : "Upload Logo"}</span></label>
              </div>
              <div className="flex-1 space-y-1"><Label className="text-xs">Logo</Label><p className="text-xs text-muted-foreground">Displayed in header and sidebar.</p></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-3">Kitchen Setup</h3>
              <SectionCard icon={UtensilsCrossed} title="Prep Stations" color="text-blue-400" count={stations.length}>
                <div className="space-y-2">
                  {stations.length === 0 && <p className="text-xs text-muted-foreground">No stations yet.</p>}
                  {stations.map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${colorDot[s.color] || "bg-gray-400"}`} /><span className="text-xs font-medium">{s.name}</span></div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("Station", s.id, setStations)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
                {addingStation ? (
                  <InlineForm saving={saving} onCancel={() => setAddingStation(false)} onSave={saveStation} fields={[
                    { key: "name", label: "Name", placeholder: "e.g. Grill" },
                    { key: "color", label: "Color", type: "select", default: "blue", options: STATION_COLORS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })) },
                  ]} />
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setAddingStation(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
                )}
              </SectionCard>

              <SectionCard icon={Thermometer} title="Refrigeration" color="text-cyan-400" count={tempLocations.length}>
                <div className="space-y-2">
                  {tempLocations.length === 0 && <p className="text-xs text-muted-foreground">No locations yet.</p>}
                  {tempLocations.map(loc => (
                    <div key={loc.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                      <span className="text-xs font-medium">{loc.name}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("TempLogLocation", loc.id, setTempLocations)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
                {addingTemp ? (
                  <InlineForm saving={saving} onCancel={() => setAddingTemp(false)} onSave={saveTemp} fields={[
                    { key: "name", label: "Name", placeholder: "Walk-in Cooler" },
                    { key: "type", label: "Type", type: "select", options: [
                      { value: "refrigerator", label: "Refrigerator" },
                      { value: "freezer", label: "Freezer" },
                    ]},
                  ]} />
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setAddingTemp(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
                )}
              </SectionCard>

              <SectionCard icon={Droplet} title="Dish Machines" color="text-emerald-400" count={dishEquipment.length}>
                <div className="space-y-2">
                  {dishEquipment.length === 0 && <p className="text-xs text-muted-foreground">No equipment yet.</p>}
                  {dishEquipment.map(eq => (
                    <div key={eq.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0"><span className="text-xs font-medium truncate">{eq.name}</span></div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("DishMachineEquipment", eq.id, setDishEquipment)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
                {addingDish ? (
                  <InlineForm saving={saving} onCancel={() => setAddingDish(false)} onSave={saveDish} fields={[
                    { key: "name", label: "Name", placeholder: "Main Dish Machine" },
                    { key: "type", label: "Type", type: "select", options: [
                      { value: "dishwasher", label: "Dishwashing Machine" },
                      { value: "three_compartment_sink", label: "3-Compartment Sink" },
                    ]},
                  ]} />
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setAddingDish(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
                )}
              </SectionCard>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Cash and Operations</h3>
              <SectionCard icon={DollarSign} title="Cash Configuration" color="text-green-400" count={cashDrawers.length}>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold mb-2">Drawers</h4>
                    <div className="space-y-2">
                      {cashDrawers.length === 0 && <p className="text-xs text-muted-foreground">No drawers yet.</p>}
                      {cashDrawers.map(d => (
                        <div key={d.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                          <span className="text-xs font-medium">{d.name}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteItem("CashDrawerConfig", d.id, setCashDrawers)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>
                    {addingDrawer ? (
                      <InlineForm saving={saving} onCancel={() => setAddingDrawer(false)} onSave={saveDrawer} fields={[
                        { key: "name", label: "Name", placeholder: "Register 1" },
                      ]} />
                    ) : (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => setAddingDrawer(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
                    )}
                  </div>
                  <div className="border-t border-border pt-2">
                    <h4 className="text-xs font-semibold mb-2">Petty Cash</h4>
                    <div className="flex items-center gap-2">
                      <Input type="number" placeholder="0.00" value={pettyCashAmount} onChange={e => setPettyCashAmount(e.target.value)} className="h-8 w-32 text-sm" />
                      <Button size="sm" onClick={() => saveSetting(pettyCashId, setPettyCashId, pettyCashAmount, "petty_cash_amount")} disabled={saving}><Save className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4">
        <CheckCircle2 className="h-4 w-4 text-accent" />
        Changes take effect immediately.
      </div>
    </motion.div>
  );
}