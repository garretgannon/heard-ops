import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { X } from "lucide-react";

function QuickLogModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("shift_note");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.ManagerLog.create({
        title: title.trim(),
        category,
        shift: "morning",
        notes: notes.trim(),
        logged_by: user?.email,
        logged_by_name: user?.full_name,
        status: "open",
      });
      toast("Log entry saved");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast("Failed to save log");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold">Quick Log Entry</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="shift_note">Shift Note</option>
              <option value="incident">Incident</option>
              <option value="guest_issue">Guest Issue</option>
              <option value="team_note">Team Note</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details..."
              rows={4}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 px-5 py-3 border-t border-border flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Save Entry"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [station, setStation] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !station.trim()) {
      toast("Title and station are required");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.Task.create({
        title: title.trim(),
        station_id: station,
        station_name: station,
        location_id: "default",
        shift_id: "current",
        assigned_to_email: user?.email,
        assigned_to_name: user?.full_name,
        due_time: dueTime,
        priority,
        notes: notes.trim(),
        status: "pending",
      });
      toast("Task created");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast("Failed to create task");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold">Add Task</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Station *</label>
            <input
              type="text"
              value={station}
              onChange={(e) => setStation(e.target.value)}
              placeholder="e.g., Line 1, Prep..."
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Due Time</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 px-5 py-3 border-t border-border flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !station.trim()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40"
          >
            {submitting ? "Creating..." : "Create Task"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Add86Modal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [itemName, setItemName] = useState("");
  const [reason, setReason] = useState("86d");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      toast("Item name is required");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.EightySixItem.create({
        item_name: itemName.trim(),
        reason,
        quantity: quantity ? parseInt(quantity) : 1,
        notes: notes.trim(),
        marked_by: user?.email,
        marked_at: new Date().toISOString(),
        is_active: true,
      });
      toast("Item logged");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast("Failed to log item");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold">86 / Waste Item</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Item Name *</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Ribeye steak..."
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="86d">86'd</option>
              <option value="waste">Wasted</option>
              <option value="low_stock">Low Stock</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              min="1"
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details..."
              rows={3}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 px-5 py-3 border-t border-border flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting || !itemName.trim()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40"
          >
            {submitting ? "Logging..." : "Log Item"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPrepModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [itemName, setItemName] = useState("");
  const [station, setStation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!itemName.trim() || !station.trim()) {
      toast("Item name and station are required");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.PrepItem.create({
        name: itemName.trim(),
        station_id: station,
        station_name: station,
        prep_list_id: "current",
        quantity: quantity || "1",
        status: "pending",
        priority: "medium",
        completed_by: user?.email,
        notes: notes.trim(),
      });
      toast("Prep item added");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast("Failed to add prep item");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold">Add Prep Item</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Item Name *</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Diced onions..."
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Station *</label>
            <input
              type="text"
              value={station}
              onChange={(e) => setStation(e.target.value)}
              placeholder="e.g., Prep Station 1..."
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Quantity</label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 5 lbs, 10 servings..."
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Due Time</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details..."
              rows={3}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 px-5 py-3 border-t border-border flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting || !itemName.trim() || !station.trim()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40"
          >
            {submitting ? "Adding..." : "Add Item"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMaintenanceModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.MaintenanceRequest.create({
        title: title.trim(),
        priority,
        vendor_needed: !!vendor,
        preferred_vendor: vendor || null,
        description: notes.trim(),
        status: "open",
        created_by: user?.email,
      });
      toast("Maintenance issue created");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast("Failed to create issue");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold">Maintenance Issue</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title..."
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Vendor Needed</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Vendor name (optional)..."
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-text uppercase">Description</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 px-5 py-3 border-t border-border flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40"
          >
            {submitting ? "Creating..." : "Create Issue"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuickActionModals({
  activeModal,
  onCloseModal,
  onSuccess,
}) {
  return (
    <>
      <QuickLogModal isOpen={activeModal === "quickLog"} onClose={onCloseModal} onSuccess={onSuccess} />
      <AddTaskModal isOpen={activeModal === "addTask"} onClose={onCloseModal} onSuccess={onSuccess} />
      <Add86Modal isOpen={activeModal === "add86"} onClose={onCloseModal} onSuccess={onSuccess} />
      <AddPrepModal isOpen={activeModal === "addPrep"} onClose={onCloseModal} onSuccess={onSuccess} />
      <AddMaintenanceModal isOpen={activeModal === "addMaintenance"} onClose={onCloseModal} onSuccess={onSuccess} />
    </>
  );
}