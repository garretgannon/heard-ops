import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChipSelect, YesNo, StepHeader, BigInput, BigTextarea, StickyNav } from "./ChipSelect";
import { Camera, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const LOCATIONS = [
  { value: "kitchen", label: "🍳 Kitchen" },
  { value: "bar", label: "🍺 Bar" },
  { value: "dining", label: "🪑 Dining" },
  { value: "restroom", label: "🚻 Restroom" },
  { value: "office", label: "🗂 Office" },
  { value: "exterior", label: "🌿 Exterior" },
  { value: "storage", label: "📦 Storage" },
  { value: "other", label: "📍 Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "🔶 Urgent" },
  { value: "emergency", label: "🔴 Emergency" },
];

const emptyForm = () => ({
  title: "",
  location: "",
  description: "",
  priority: "normal",
  reported_by: "",
  photo_url: "",
  notes: "",
  status: "new",
  follow_up_required: false,
});

export default function MaintenanceForm({ open, onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm());
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const reset = () => { setStep(1); setForm(emptyForm()); setPhotoPreview(null); };
  const handleClose = () => { reset(); onClose(); };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(false);
    toast.success("Photo uploaded");
  };

  const handleSubmit = async () => {
    setSaving(true);
    const created = await base44.entities.MaintenanceRequest.create(form);
    if (["urgent", "emergency"].includes(form.priority)) {
      base44.integrations.Core.SendEmail({
        to: "manager@restaurant.com",
        subject: `⚠️ ${form.priority.toUpperCase()} Maintenance: ${form.title}`,
        body: `Location: ${form.location}\nPriority: ${form.priority}\n\n${form.description}`,
      }).catch(() => {});
    }
    toast.success("Request submitted");
    setSaving(false);
    onSaved(created);
    handleClose();
  };

  const canNext = [
    form.title.trim() && form.location,
    form.priority,
    true,
  ][step - 1];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-6">

        {/* Step 1: What & Where */}
        {step === 1 && (
          <div className="space-y-5">
            <StepHeader step={1} total={3} title="What's the issue?" subtitle="Be specific so it can be fixed fast." />
            <BigInput label="Issue Title" required placeholder="e.g., Ice machine not working" value={form.title} onChange={set("title")} />
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Location *</label>
              <ChipSelect options={LOCATIONS} value={form.location} onChange={set("location")} />
            </div>
            <BigTextarea label="Description" placeholder="Describe what's happening..." value={form.description} onChange={set("description")} />
          </div>
        )}

        {/* Step 2: Priority */}
        {step === 2 && (
          <div className="space-y-5">
            <StepHeader step={2} total={3} title="How urgent is it?" subtitle="This determines response time." />
            <ChipSelect options={PRIORITIES} value={form.priority} onChange={set("priority")} />
            <BigInput label="Your Name" placeholder="Who's reporting this?" value={form.reported_by} onChange={set("reported_by")} />
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Needs follow-up?</label>
              <YesNo value={form.follow_up_required} onChange={set("follow_up_required")} />
            </div>
          </div>
        )}

        {/* Step 3: Photo */}
        {step === 3 && (
          <div className="space-y-5">
            <StepHeader step={3} total={3} title="Add a photo" subtitle="Optional but helps the repair team." />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full max-h-56 object-cover rounded-xl border-2 border-border" />
                <button onClick={() => { setPhotoPreview(null); setForm(f => ({ ...f, photo_url: "" })); }}
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"><X className="h-4 w-4 text-white" /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-10 cursor-pointer active:bg-secondary/40 transition-colors">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">{uploading ? "Uploading…" : "Tap to add photo"}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              </label>
            )}
            <BigTextarea label="Additional Notes" placeholder="Anything else to add?" value={form.notes} onChange={set("notes")} />
          </div>
        )}

        <StickyNav step={step} total={3} onBack={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onSubmit={handleSubmit} saving={saving} canNext={canNext} />
      </DialogContent>
    </Dialog>
  );
}