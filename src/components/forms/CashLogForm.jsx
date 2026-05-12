import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChipSelect, StepHeader, BigInput, BigTextarea, StickyNav } from "./ChipSelect";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const todayStr = new Date().toISOString().split("T")[0];

const DENOMINATIONS = [
  { key: "hundreds", label: "$100", value: 100 },
  { key: "fifties", label: "$50", value: 50 },
  { key: "twenties", label: "$20", value: 20 },
  { key: "tens", label: "$10", value: 10 },
  { key: "fives", label: "$5", value: 5 },
  { key: "ones", label: "$1", value: 1 },
  { key: "quarters", label: "25¢", value: 0.25 },
  { key: "dimes", label: "10¢", value: 0.10 },
  { key: "nickels", label: "5¢", value: 0.05 },
  { key: "pennies", label: "1¢", value: 0.01 },
];

const SHIFTS = [
  { value: "morning", label: "🌅 Morning" },
  { value: "night", label: "🌙 Night" },
];

const DRAWER_NAMES = [
  { value: "Bar", label: "🍺 Bar" },
  { value: "Register 1", label: "🖥 Reg 1" },
  { value: "Register 2", label: "🖥 Reg 2" },
  { value: "Host", label: "🪑 Host" },
];

function calcTotal(form) {
  return DENOMINATIONS.reduce((s, d) => s + (Number(form[d.key]) || 0) * d.value, 0);
}

const emptyForm = () => ({
  date: todayStr,
  shift: "morning",
  drawer_name: "",
  ...Object.fromEntries(DENOMINATIONS.map(d => [d.key, 0])),
  expected: "",
  counted_by: "",
  manager_initials: "",
  manager_notes: "",
  closeout_photo: "",
});

export default function CashLogForm({ open, onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const setNum = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const reset = () => { setStep(1); setForm(emptyForm()); };
  const handleClose = () => { reset(); onClose(); };

  const total = calcTotal(form);
  const variance = form.expected !== "" ? total - Number(form.expected) : null;
  const isFlagged = variance !== null && Math.abs(variance) > 2;

  const handleSubmit = async () => {
    if (!form.drawer_name) { toast.error("Drawer name required"); return; }
    setSaving(true);
    const result = await base44.entities.DrawerCount.create({
      ...form,
      total,
      logged_at: new Date().toISOString(),
      variance: variance ?? undefined,
      expected: form.expected !== "" ? Number(form.expected) : undefined,
    });
    toast.success("Drawer count saved");
    setSaving(false);
    onSaved(result);
    handleClose();
  };

  const canNext = [
    form.drawer_name,
    true,
    true,
  ][step - 1];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-6">

        {/* Step 1: Drawer Setup */}
        {step === 1 && (
          <div className="space-y-5">
            <StepHeader step={1} total={3} title="Which drawer?" subtitle="Select the drawer and shift." />
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Shift</label>
              <ChipSelect options={SHIFTS} value={form.shift} onChange={set("shift")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Drawer *</label>
              <ChipSelect options={DRAWER_NAMES} value={form.drawer_name} onChange={set("drawer_name")} />
            </div>
            <BigInput label="Or type drawer name" placeholder="e.g., Bar, Register 3" value={DRAWER_NAMES.some(d => d.value === form.drawer_name) ? "" : form.drawer_name} onChange={set("drawer_name")} />
            <BigInput label="Expected amount ($)" placeholder="0.00" type="number" value={form.expected} onChange={set("expected")} />
          </div>
        )}

        {/* Step 2: Count Bills & Coins */}
        {step === 2 && (
          <div className="space-y-4">
            <StepHeader step={2} total={3} title="Count the cash" subtitle="Enter quantity of each denomination." />
            <div className="space-y-2">
              {DENOMINATIONS.map(d => {
                const subtotal = (Number(form[d.key]) || 0) * d.value;
                return (
                  <div key={d.key} className="flex items-center gap-3 card-glass border border-border rounded-xl px-4 py-3">
                    <span className="w-12 font-bold text-sm">{d.label}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="0"
                      value={form[d.key] || ""}
                      onChange={e => setNum(d.key)(e.target.value)}
                      className="flex-1 h-12 px-3 rounded-lg border border-input bg-background text-center text-lg font-bold focus:outline-none focus:border-primary"
                    />
                    <span className="w-16 text-right text-sm font-semibold text-muted-foreground">${subtotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Running total */}
            <div className="sticky bottom-20 bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between">
              <span className="font-bold">Total Counted</span>
              <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
            </div>

            {variance !== null && (
              <div className={cn("rounded-xl p-4 flex items-center justify-between font-bold", isFlagged ? "bg-red-500/10 text-red-600 border border-red-500/30" : "bg-green-500/10 text-green-600 border border-green-500/30")}>
                <span>Variance</span>
                <span className="text-xl">{variance >= 0 ? "+" : ""}${variance.toFixed(2)} {isFlagged ? "⚠️" : "✓"}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Sign-off */}
        {step === 3 && (
          <div className="space-y-5">
            <StepHeader step={3} total={3} title="Sign-off" subtitle="Who counted and any notes." />
            <BigInput label="Counted By" placeholder="Your name" value={form.counted_by} onChange={set("counted_by")} />
            <BigInput label="Manager Initials" placeholder="e.g., JD" value={form.manager_initials} onChange={set("manager_initials")} />
            <BigTextarea label="Manager Notes (for variance)" placeholder="Explain any discrepancy..." value={form.manager_notes} onChange={set("manager_notes")} />
          </div>
        )}

        <StickyNav step={step} total={3} onBack={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onSubmit={handleSubmit} saving={saving} canNext={canNext} />
      </DialogContent>
    </Dialog>
  );
}