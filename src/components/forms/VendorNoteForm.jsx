import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChipSelect, YesNo, StepHeader, BigInput, BigTextarea, StickyNav } from "./ChipSelect";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "food", label: "🥩 Food" },
  { value: "beverage", label: "🧃 Beverage" },
  { value: "repairs", label: "🔧 Repairs" },
  { value: "equipment", label: "⚙️ Equipment" },
  { value: "linen", label: "🧺 Linen" },
  { value: "pest", label: "🐛 Pest" },
  { value: "plumbing", label: "🚿 Plumbing" },
  { value: "electrical", label: "⚡ Electrical" },
  { value: "pos", label: "💻 POS" },
  { value: "other", label: "📍 Other" },
];

const CONTACT_PREF = [
  { value: "phone", label: "📞 Phone" },
  { value: "email", label: "📧 Email" },
  { value: "text", label: "💬 Text" },
];

const emptyForm = () => ({
  name: "",
  category: "",
  contact_person: "",
  phone: "",
  email: "",
  emergency_number: "",
  preferred_contact: "phone",
  notes: "",
  emergency: false,
  active: true,
  account_number: "",
  hours: "",
});

export default function VendorNoteForm({ open, onClose, onSaved, initialData }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialData || emptyForm());
  const [saving, setSaving] = useState(false);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const reset = () => { setStep(1); if (!initialData) setForm(emptyForm()); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Vendor name required"); return; }
    setSaving(true);
    let result;
    if (initialData?.id) {
      result = await base44.entities.Vendor.update(initialData.id, form);
      toast.success("Vendor updated");
    } else {
      result = await base44.entities.Vendor.create(form);
      toast.success("Vendor added");
    }
    setSaving(false);
    onSaved(result);
    handleClose();
  };

  const canNext = [
    form.name.trim() && form.category,
    true,
    true,
  ][step - 1];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-6">

        {/* Step 1: Name & Category */}
        {step === 1 && (
          <div className="space-y-5">
            <StepHeader step={1} total={3} title="Vendor info" subtitle="Name and type of vendor." />
            <BigInput label="Vendor Name" required placeholder="e.g., ABC Foods Inc." value={form.name} onChange={set("name")} />
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Category *</label>
              <ChipSelect options={CATEGORIES} value={form.category} onChange={set("category")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Emergency vendor?</label>
              <YesNo value={form.emergency} onChange={set("emergency")} yesLabel="Yes, pin at top" noLabel="No" />
            </div>
          </div>
        )}

        {/* Step 2: Contact */}
        {step === 2 && (
          <div className="space-y-5">
            <StepHeader step={2} total={3} title="Contact details" subtitle="How do we reach them?" />
            <BigInput label="Contact Person" placeholder="Name" value={form.contact_person} onChange={set("contact_person")} />
            <BigInput label="Primary Phone" placeholder="(555) 123-4567" value={form.phone} onChange={set("phone")} type="tel" />
            <BigInput label="Emergency / After-Hours" placeholder="After-hours number" value={form.emergency_number} onChange={set("emergency_number")} type="tel" />
            <BigInput label="Email" placeholder="vendor@example.com" value={form.email} onChange={set("email")} type="email" />
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Preferred contact method</label>
              <ChipSelect options={CONTACT_PREF} value={form.preferred_contact} onChange={set("preferred_contact")} />
            </div>
          </div>
        )}

        {/* Step 3: Notes */}
        {step === 3 && (
          <div className="space-y-5">
            <StepHeader step={3} total={3} title="Account & Notes" subtitle="Account info and any notes." />
            <BigInput label="Account Number" placeholder="Your account #" value={form.account_number} onChange={set("account_number")} />
            <BigInput label="Hours / Availability" placeholder="Mon-Fri 8am-5pm" value={form.hours} onChange={set("hours")} />
            <BigTextarea label="Service History / Notes" placeholder="Last service date, issues, payment terms..." value={form.notes} onChange={set("notes")} />
          </div>
        )}

        <StickyNav step={step} total={3} onBack={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onSubmit={handleSubmit} saving={saving} canNext={canNext} />
      </DialogContent>
    </Dialog>
  );
}