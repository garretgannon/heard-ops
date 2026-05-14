import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { X } from "lucide-react";

/* ── Shared shell ─────────────────────────────────────── */
function ModalShell({ title, onClose, children, footer }) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    const handleTouchMove = (e) => {
      const scrollable = e.target.closest('[data-scrollable]');
      if (!scrollable) e.preventDefault();
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('touchmove', handleTouchMove, { passive: false });
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden bg-black/70 sm:items-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex max-h-[90vh] w-full max-w-[500px] flex-col overflow-hidden rounded-t-3xl border border-border bg-card sm:rounded-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="sticky top-0 z-10 flex min-w-0 items-center justify-between border-b border-border bg-card px-5 py-4">
          <h2 className="min-w-0 truncate pr-3 text-base font-bold">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted active:scale-95 active:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-5 py-4 [&_input]:min-w-0 [&_select]:min-w-0 [&_textarea]:min-w-0" data-scrollable>{children}</div>
        <div className="sticky bottom-0 flex min-w-0 flex-col gap-2 border-t border-border bg-card px-5 py-4" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>{footer}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full min-w-0 max-w-full px-3 py-2.5 bg-muted border border-border rounded-lg sm:text-sm text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

/* ── 1. Manager Log ───────────────────────────────────── */
function ManagerLogModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [shift, setShift] = useState("AM");
  const [category, setCategory] = useState("General");
  const [notes, setNotes] = useState("");

  const reset = () => { setTitle(""); setShift("AM"); setCategory("General"); setNotes(""); };

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.UnifiedLog.create({
      type: 'manager_note',
      title: title.trim(),
      description: notes.trim(),
      status: "open",
      priority: "medium",
      created_by: user?.email,
      custom_metadata: {
        shift,
        category,
        logged_by_name: user?.full_name,
      },
    });
    toast("Manager log saved");
    onSuccess?.();
    reset();
    onClose();
    setSubmitting(false);
  };

  if (!isOpen) return null;
  return (
    <ModalShell
      title="Manager Log"
      onClose={onClose}
      footer={
        <>
          <button onClick={handleSubmit} disabled={submitting || !title.trim()} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 active:scale-95 transition-all">
            {submitting ? "Saving..." : "Save Log"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold text-sm active:scale-95">Cancel</button>
        </>
      }
    >
      <Field label="Title *">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What happened?" className={inputCls} autoFocus />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Shift">
          <select value={shift} onChange={e => setShift(e.target.value)} className={inputCls}>
            <option>AM</option>
            <option>PM</option>
            <option>Mid</option>
            <option>Closing</option>
          </select>
        </Field>
        <Field label="Category">
          <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
            <option>General</option>
            <option>Staffing</option>
            <option>Guest Issue</option>
            <option>Maintenance</option>
            <option>Food Quality</option>
            <option>86 Item</option>
            <option>Incident</option>
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add details..." rows={4} className={inputCls + " resize-none"} />
      </Field>
    </ModalShell>
  );
}

/* ── 2. Add Task ──────────────────────────────────────── */
function AddTaskModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("Side Work");
  const [station, setStation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => { setTitle(""); setTaskType("Side Work"); setStation(""); setPriority("medium"); setDueTime(""); setNotes(""); };

  const handleSubmit = async () => {
    setSubmitting(true);
    const todayStr = new Date().toISOString().split("T")[0];
    if (taskType === "Side Work") {
      await base44.entities.SideWorkAssignment.create({
        task_name: title.trim(),
        role: station || "General",
        date: todayStr,
        due_time: dueTime,
        priority,
        completion_notes: notes.trim(),
        status: "pending",
        assigned_to_email: user?.email,
        assigned_to_name: user?.full_name,
      });
    } else if (taskType === "Prep") {
      await base44.entities.PrepItem.create({
        name: title.trim(),
        station_name: station || "Prep",
        status: "pending",
        priority,
        notes: notes.trim(),
        prep_list_id: "current",
        quantity: "1",
      });
    } else {
      await base44.entities.Task.create({
        title: title.trim(),
        station_name: station,
        due_time: dueTime,
        priority,
        notes: notes.trim(),
        status: "pending",
        task_type: taskType,
        assigned_to_email: user?.email,
        assigned_to_name: user?.full_name,
      });
    }
    toast("Task added");
    onSuccess?.();
    reset();
    onClose();
    setSubmitting(false);
  };

  if (!isOpen) return null;
  return (
    <ModalShell
      title="Add Task"
      onClose={onClose}
      footer={
        <>
          <button onClick={handleSubmit} disabled={submitting || !title.trim()} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 active:scale-95 transition-all">
            {submitting ? "Adding..." : "Add Task"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold text-sm active:scale-95">Cancel</button>
        </>
      }
    >
      <Field label="Task Name *">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" className={inputCls} autoFocus />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Type">
          <select value={taskType} onChange={e => setTaskType(e.target.value)} className={inputCls}>
            <option>Side Work</option>
            <option>Prep</option>
            <option>Cleaning</option>
            <option>Maintenance</option>
            <option>Admin</option>
            <option>Food Safety</option>
          </select>
        </Field>
        <Field label="Priority">
          <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Station / Role">
          <input type="text" value={station} onChange={e => setStation(e.target.value)} placeholder="e.g., Line, FOH..." className={inputCls} />
        </Field>
        <Field label="Due Time">
          <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional details..." rows={3} className={inputCls + " resize-none"} />
      </Field>
    </ModalShell>
  );
}

/* ── 3. Update Prep ───────────────────────────────────── */
function UpdatePrepModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [itemName, setItemName] = useState("");
  const [station, setStation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => { setItemName(""); setStation(""); setQuantity(""); setUnit(""); setDueTime(""); setNotes(""); };

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.PrepItem.create({
      name: itemName.trim(),
      station_name: station || "Prep",
      quantity: quantity || "1",
      unit: unit || "",
      due_time: dueTime,
      notes: notes.trim(),
      status: "pending",
      priority: "medium",
      prep_list_id: "current",
    });
    toast("Prep updated");
    onSuccess?.();
    reset();
    onClose();
    setSubmitting(false);
  };

  if (!isOpen) return null;
  return (
    <ModalShell
      title="Update Prep"
      onClose={onClose}
      footer={
        <>
          <button onClick={handleSubmit} disabled={submitting || !itemName.trim()} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 active:scale-95 transition-all">
            {submitting ? "Saving..." : "Save Prep Item"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold text-sm active:scale-95">Cancel</button>
        </>
      }
    >
      <Field label="Item Name *">
        <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g., Diced onions..." className={inputCls} autoFocus />
      </Field>
      <Field label="Station">
        <input type="text" value={station} onChange={e => setStation(e.target.value)} placeholder="e.g., Cold Prep, Sauté..." className={inputCls} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Quantity">
          <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Amount" className={inputCls} />
        </Field>
        <Field label="Unit">
          <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="lbs, ea, qt..." className={inputCls} />
        </Field>
      </div>
      <Field label="Due Time">
        <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions..." rows={3} className={inputCls + " resize-none"} />
      </Field>
    </ModalShell>
  );
}

/* ── 4. Log Waste ─────────────────────────────────────── */
function LogWasteModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [itemName, setItemName] = useState("");
  const [reason, setReason] = useState("Expired");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => { setItemName(""); setReason("Expired"); setQuantity(""); setUnit(""); setEstimatedCost(""); setNotes(""); };

  const handleSubmit = async () => {
    setSubmitting(true);
    const todayStr = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    await base44.entities.WasteEntry.create({
      itemName: itemName.trim(),
      reason,
      quantity: quantity ? parseFloat(quantity) : null,
      unit: unit || "",
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      notes: notes.trim(),
      wastedBy: user?.full_name || user?.email,
      wasteDate: todayStr,
      wasteTime: nowTime,
    });
    toast("Waste logged");
    onSuccess?.();
    reset();
    onClose();
    setSubmitting(false);
  };

  if (!isOpen) return null;
  return (
    <ModalShell
      title="Log Waste"
      onClose={onClose}
      footer={
        <>
          <button onClick={handleSubmit} disabled={submitting || !itemName.trim()} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 active:scale-95 transition-all">
            {submitting ? "Logging..." : "Log Waste"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold text-sm active:scale-95">Cancel</button>
        </>
      }
    >
      <Field label="Item *">
        <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g., Ribeye steak..." className={inputCls} autoFocus />
      </Field>
      <Field label="Reason">
        <select value={reason} onChange={e => setReason(e.target.value)} className={inputCls}>
          <option>Expired</option>
          <option>Overproduction</option>
          <option>Dropped</option>
          <option>Contaminated</option>
          <option>Trimming/Prep</option>
          <option>Temperature Abuse</option>
          <option>Other</option>
        </select>
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="col-span-2">
          <Field label="Quantity">
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" min="0" step="0.1" className={inputCls} />
          </Field>
        </div>
        <Field label="Unit">
          <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="lbs" className={inputCls} />
        </Field>
      </div>
      <Field label="Est. Cost ($)">
        <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} placeholder="0.00" min="0" step="0.01" className={inputCls} />
      </Field>
      <Field label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Details..." rows={3} className={inputCls + " resize-none"} />
      </Field>
    </ModalShell>
  );
}

/* ── 5. Report Issue ──────────────────────────────────── */
function ReportIssueModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Equipment");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");

  const reset = () => { setTitle(""); setCategory("Equipment"); setLocation(""); setPriority("medium"); setDescription(""); };

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.Issue.create({
      title: title.trim(),
      category: category.toLowerCase().replace(/\//g, "_").replace(/ /g, "_"),
      location: location.trim(),
      priority,
      description: description.trim(),
      status: "open",
      reported_by: user?.email,
      created_by_email: user?.email,
    });
    toast("Issue reported");
    onSuccess?.();
    reset();
    onClose();
    setSubmitting(false);
  };

  if (!isOpen) return null;
  return (
    <ModalShell
      title="Report Issue"
      onClose={onClose}
      footer={
        <>
          <button onClick={handleSubmit} disabled={submitting || !title.trim()} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 active:scale-95 transition-all">
            {submitting ? "Reporting..." : "Report Issue"}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold text-sm active:scale-95">Cancel</button>
        </>
      }
    >
      <Field label="Issue Title *">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief description of the issue..." className={inputCls} autoFocus />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
            <option>Equipment</option>
            <option>Maintenance</option>
            <option>Food Safety</option>
            <option>Guest</option>
            <option>Staffing</option>
            <option>Inventory</option>
            <option>Tech/POS</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Priority">
          <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>
      </div>
      <Field label="Location / Station">
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Walk-in, Bar, Line 2..." className={inputCls} />
      </Field>
      <Field label="Description">
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What happened? What needs to be fixed?" rows={4} className={inputCls + " resize-none"} />
      </Field>
    </ModalShell>
  );
}

/* ── 6. Quick Temp Log ────────────────────────────────── */
function TempLogModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const [logType, setLogType] = useState('fridge');
  const [location, setLocation] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => { setLogType('fridge'); setLocation(''); setTemperature(''); setNotes(''); };

  const handleSubmit = async () => {
    setSubmitting(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempVal = parseFloat(temperature);
    if (logType === 'fridge') {
      await base44.entities.RefrigeratorFreezerLog.create({
        location: location || 'Walk-in Cooler',
        temperature: tempVal,
        date: todayStr,
        time: nowTime,
        loggedBy: user?.full_name || user?.email,
        notes: notes.trim(),
        isOutOfRange: tempVal > 41 || tempVal < 28,
      });
    } else if (logType === 'hot') {
      await base44.entities.HotHoldingLog.create({
        itemName: location || 'Hot Item',
        temperature: tempVal,
        date: todayStr,
        time: nowTime,
        loggedBy: user?.full_name || user?.email,
        notes: notes.trim(),
        isOutOfRange: tempVal < 135,
      });
    } else {
      await base44.entities.TemperatureLog.create({
        location: location || 'General',
        temperature: tempVal,
        log_date: todayStr,
        log_time: nowTime,
        logged_by: user?.email,
        notes: notes.trim(),
      });
    }
    toast('Temperature logged');
    onSuccess?.();
    reset();
    onClose();
    setSubmitting(false);
  };

  if (!isOpen) return null;
  return (
    <ModalShell
      title="Log Temperature"
      onClose={onClose}
      footer={
        <>
          <button onClick={handleSubmit} disabled={submitting || !temperature} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 active:scale-95 transition-all">
            {submitting ? 'Saving...' : 'Save Temperature'}
          </button>
          <button onClick={onClose} className="w-full h-10 rounded-lg border border-border font-bold text-sm active:scale-95">Cancel</button>
        </>
      }
    >
      <Field label="Log Type">
        <select value={logType} onChange={e => setLogType(e.target.value)} className={inputCls}>
          <option value="fridge">Fridge / Freezer</option>
          <option value="hot">Hot Holding</option>
          <option value="general">General Temp</option>
        </select>
      </Field>
      <Field label={logType === 'hot' ? 'Item Name' : 'Location'}>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)}
          placeholder={logType === 'hot' ? 'e.g., Soup, Sauce...' : 'e.g., Walk-in Cooler...'} className={inputCls} autoFocus />
      </Field>
      <Field label="Temperature (°F) *">
        <input type="number" value={temperature} onChange={e => setTemperature(e.target.value)}
          placeholder="e.g., 38" step="0.1" className={inputCls} />
      </Field>
      <Field label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." rows={3} className={inputCls + ' resize-none'} />
      </Field>
    </ModalShell>
  );
}

/* ── Dispatcher ───────────────────────────────────────── */
export function QuickActionModals({ activeModal, onCloseModal, onSuccess }) {
  return (
    <>
      <ManagerLogModal    isOpen={activeModal === 'quick-log'}  onClose={onCloseModal} onSuccess={onSuccess} />
      <AddTaskModal       isOpen={activeModal === 'add-task'}   onClose={onCloseModal} onSuccess={onSuccess} />
      <UpdatePrepModal    isOpen={activeModal === 'add-prep'}   onClose={onCloseModal} onSuccess={onSuccess} />
      <LogWasteModal      isOpen={activeModal === 'add-waste'}  onClose={onCloseModal} onSuccess={onSuccess} />
      <ReportIssueModal   isOpen={activeModal === 'add-issue'}  onClose={onCloseModal} onSuccess={onSuccess} />
      <TempLogModal       isOpen={activeModal === 'temp-log'}   onClose={onCloseModal} onSuccess={onSuccess} />
    </>
  );
}
