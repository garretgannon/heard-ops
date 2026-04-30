import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefHat, Plus, Trash2, CheckCircle2, ArrowRight, UtensilsCrossed, Tag, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATION_COLORS = ["red", "blue", "green", "orange", "purple", "teal", "pink", "yellow"];

const colorMap = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  teal: "bg-teal-500",
  pink: "bg-pink-500",
  yellow: "bg-yellow-500",
};

const STEPS = [
  { id: "stations", label: "Stations", icon: UtensilsCrossed, description: "Define your kitchen prep stations" },
  { id: "roles", label: "Job Roles", icon: Tag, description: "Set up staff job roles" },
  { id: "cash", label: "Cash Drawers", icon: DollarSign, description: "Configure your cash registers" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Stations
  const [stations, setStations] = useState([{ name: "", color: "blue" }]);

  // Roles
  const [roles, setRoles] = useState([{ name: "" }]);

  // Cash
  const [drawers, setDrawers] = useState([{ name: "", starting_amount: "" }]);

  const addStation = () => setStations(s => [...s, { name: "", color: "green" }]);
  const removeStation = (i) => setStations(s => s.filter((_, idx) => idx !== i));
  const updateStation = (i, field, val) => setStations(s => s.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  const addRole = () => setRoles(r => [...r, { name: "" }]);
  const removeRole = (i) => setRoles(r => r.filter((_, idx) => idx !== i));
  const updateRole = (i, val) => setRoles(r => r.map((x, idx) => idx === i ? { name: val } : x));

  const addDrawer = () => setDrawers(d => [...d, { name: "", starting_amount: "" }]);
  const removeDrawer = (i) => setDrawers(d => d.filter((_, idx) => idx !== i));
  const updateDrawer = (i, field, val) => setDrawers(d => d.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  const handleNext = async () => {
    if (step === 0) {
      const valid = stations.filter(s => s.name.trim());
      if (!valid.length) { toast.error("Add at least one station"); return; }
    }
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }
    // Final step — save everything
    setSaving(true);
    try {
      const validStations = stations.filter(s => s.name.trim());
      const validRoles = roles.filter(r => r.name.trim());
      const validDrawers = drawers.filter(d => d.name.trim());

      await Promise.all(validStations.map(s => base44.entities.Station.create({ name: s.name.trim(), color: s.color, is_active: true })));
      if (validRoles.length) {
        await base44.entities.Settings.create({ key: "job_roles", value: JSON.stringify(validRoles.map(r => r.name.trim())) });
      }
      await Promise.all(validDrawers.map(d => base44.entities.CashDrawerConfig.create({ name: d.name.trim(), starting_amount: parseFloat(d.starting_amount) || 0 })));
      await base44.entities.Settings.create({ key: "onboarding_complete", value: "true" });

      toast.success("Setup complete! Welcome to Heard 🎉");
      navigate("/");
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  const handleSkip = async () => {
    await base44.entities.Settings.create({ key: "onboarding_complete", value: "true" });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Heard</h1>
          <p className="text-muted-foreground mt-1">Let's get your restaurant set up in 3 quick steps.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-secondary text-muted-foreground"
              )}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <div className="ml-2 hidden sm:block">
                <p className={cn("text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && <div className={cn("flex-1 h-px mx-3", i < step ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>

        {/* Step Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
            <div>
              <h2 className="font-semibold">{STEPS[step].label}</h2>
              <p className="text-xs text-muted-foreground">{STEPS[step].description}</p>
            </div>
          </div>

          {/* Step 1: Stations */}
          {step === 0 && (
            <div className="space-y-3">
              {stations.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Station name (e.g. Grill, Salad)"
                    value={s.name}
                    onChange={e => updateStation(i, "name", e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    {STATION_COLORS.map(c => (
                      <button key={c} onClick={() => updateStation(i, "color", c)}
                        className={cn("h-5 w-5 rounded-full transition-all", colorMap[c], s.color === c ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110" : "opacity-50 hover:opacity-100")}
                      />
                    ))}
                  </div>
                  {stations.length > 1 && (
                    <button onClick={() => removeStation(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addStation} className="gap-2 mt-1">
                <Plus className="h-3.5 w-3.5" /> Add Station
              </Button>
            </div>
          )}

          {/* Step 2: Roles */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2">Add job roles for your staff (e.g. Server, Busser, Line Cook)</p>
              {roles.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Role name"
                    value={r.name}
                    onChange={e => updateRole(i, e.target.value)}
                    className="flex-1"
                  />
                  {roles.length > 1 && (
                    <button onClick={() => removeRole(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addRole} className="gap-2 mt-1">
                <Plus className="h-3.5 w-3.5" /> Add Role
              </Button>
            </div>
          )}

          {/* Step 3: Cash Drawers */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2">Add your cash registers or drawers with their starting amounts.</p>
              {drawers.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Drawer name (e.g. Main Register)"
                    value={d.name}
                    onChange={e => updateDrawer(i, "name", e.target.value)}
                    className="flex-1"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      placeholder="200"
                      value={d.starting_amount}
                      onChange={e => updateDrawer(i, "starting_amount", e.target.value)}
                      className="pl-6"
                    />
                  </div>
                  {drawers.length > 1 && (
                    <button onClick={() => removeDrawer(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addDrawer} className="gap-2 mt-1">
                <Plus className="h-3.5 w-3.5" /> Add Drawer
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Skip setup
          </button>
          <Button onClick={handleNext} disabled={saving} className="gap-2">
            {saving ? "Saving…" : step === STEPS.length - 1 ? "Finish Setup" : "Next"}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}