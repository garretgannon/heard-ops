import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { MessageCircle, Settings, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function HelpButton() {
  const { isAdmin } = useCurrentUser();
  const [managerPhone, setManagerPhone] = useState("");
  const [settingId, setSettingId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPhone = async () => {
    const results = await base44.entities.Settings.filter({ key: "manager_phone" });
    if (results.length > 0) {
      setManagerPhone(results[0].value || "");
      setSettingId(results[0].id);
    }
  };

  useEffect(() => { loadPhone(); }, []);

  const handleSave = async () => {
    setSaving(true);
    if (settingId) {
      await base44.entities.Settings.update(settingId, { value: phoneInput });
    } else {
      const rec = await base44.entities.Settings.create({ key: "manager_phone", value: phoneInput });
      setSettingId(rec.id);
    }
    setManagerPhone(phoneInput);
    setSaving(false);
    setEditOpen(false);
    toast.success("Manager number saved");
  };

  const handleHelp = () => {
    if (!managerPhone) {
      if (isAdmin) {
        setPhoneInput("");
        setEditOpen(true);
      } else {
        toast.error("Manager number not configured yet.");
      }
      return;
    }
    window.open(`sms:${managerPhone}?body=Hey, I need some help at the station!`, "_blank");
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {isAdmin && (
          <button
            onClick={() => { setPhoneInput(managerPhone); setEditOpen(true); }}
            className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow"
            title="Configure manager number"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        )}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleHelp}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex flex-col items-center justify-center gap-0.5 hover:bg-primary/90 transition-colors"
          title="Text the manager"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[9px] font-semibold leading-none">HELP</span>
        </motion.button>
      </div>

      {/* Edit phone modal */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setEditOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Manager / Chef Number</h3>
                </div>
                <button onClick={() => setEditOpen(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-muted-foreground">Staff will text this number when they need help at the station.</p>
              <Input
                placeholder="+1 (555) 000-0000"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !phoneInput.trim()}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}