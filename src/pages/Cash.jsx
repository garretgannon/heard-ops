import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, DollarSign, Trash2, Upload, Download, AlertCircle } from "lucide-react";
import CashLogForm from "../components/forms/CashLogForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const todayStr = new Date().toISOString().split("T")[0];
const THRESHOLD = 2; // Flag variances outside +/- $2

const DENOMINATIONS = [
  { key: "hundreds", label: "$100", value: 100 },
  { key: "fifties", label: "$50", value: 50 },
  { key: "twenties", label: "$20", value: 20 },
  { key: "tens", label: "$10", value: 10 },
  { key: "fives", label: "$5", value: 5 },
  { key: "ones", label: "$1", value: 1 },
  { key: "quarters", label: "Quarters", value: 0.25 },
  { key: "dimes", label: "Dimes", value: 0.10 },
  { key: "nickels", label: "Nickels", value: 0.05 },
  { key: "pennies", label: "Pennies", value: 0.01 },
];

const ROLLED_COINS = [
  { key: "rolled_quarters", label: "Quarters", valuePerRoll: 10 },
  { key: "rolled_dimes", label: "Dimes", valuePerRoll: 5 },
  { key: "rolled_nickels", label: "Nickels", valuePerRoll: 2 },
  { key: "rolled_pennies", label: "Pennies", valuePerRoll: 0.50 },
];

const emptyDrawer = { date: todayStr, shift: "morning", drawer_name: "", hundreds: 0, fifties: 0, twenties: 0, tens: 0, fives: 0, ones: 0, quarters: 0, dimes: 0, nickels: 0, pennies: 0, rolled_quarters: 0, rolled_dimes: 0, rolled_nickels: 0, rolled_pennies: 0, expected: "", counted_by: "", manager_initials: "", manager_notes: "", closeout_photo: "" };

function calcTotal(form) {
  const bills = DENOMINATIONS.reduce((sum, d) => sum + (Number(form[d.key]) || 0) * d.value, 0);
  const rolled = ROLLED_COINS.reduce((sum, d) => sum + (Number(form[d.key]) || 0) * d.valuePerRoll, 0);
  return bills + rolled;
}

export default function Cash() {
  const [drawers, setDrawers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerDialog, setDrawerDialog] = useState(false);
  const [cashFormOpen, setCashFormOpen] = useState(false);
  const [txDialog, setTxDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [drawerForm, setDrawerForm] = useState(emptyDrawer);
  const [txForm, setTxForm] = useState({ date: todayStr, type: "cash_log", amount: "", description: "", category: "other", logged_by: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const [d, t] = await Promise.all([
        base44.entities.DrawerCount.list("-date", 100),
        base44.entities.CashTransaction.list("-date", 200),
      ]);
      setDrawers(d);
      setTransactions(t);
      setLoading(false);
    } catch (err) {
      console.error("Load error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const todayDrawers = drawers.filter(d => d.date === todayStr);
  const olderDrawers = drawers.filter(d => d.date !== todayStr);
  const pettyCashIn = transactions.filter(t => t.type === "petty_cash_in").reduce((s, t) => s + (t.amount || 0), 0);
  const pettyCashOut = transactions.filter(t => t.type === "petty_cash_out").reduce((s, t) => s + (t.amount || 0), 0);
  const pettyCashBalance = pettyCashIn - pettyCashOut;

  const drawerTotal = calcTotal(drawerForm);
  const drawerVariance = drawerForm.expected !== "" ? drawerTotal - Number(drawerForm.expected) : null;
  const isVarianceFlagged = drawerVariance !== null && Math.abs(drawerVariance) > THRESHOLD;

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDrawerForm(prev => ({ ...prev, closeout_photo: file_url }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Photo upload failed");
    }
    setUploadingPhoto(false);
  };

  const handleSaveDrawer = async () => {
    if (!drawerForm.drawer_name.trim()) {
      toast.error("Drawer name required");
      return;
    }
    setSaving(true);
    try {
      const total = calcTotal(drawerForm);
      const variance = drawerForm.expected !== "" ? total - Number(drawerForm.expected) : null;
      const logged_at = new Date().toISOString();
      await base44.entities.DrawerCount.create({ ...drawerForm, total, logged_at, variance: variance ?? undefined, expected: drawerForm.expected !== "" ? Number(drawerForm.expected) : undefined });
      toast.success("Drawer count saved");
      setDrawerDialog(false);
      setDrawerForm(emptyDrawer);
      load();
    } catch (err) {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const handleSaveTx = async () => {
    if (!txForm.amount || !txForm.description.trim()) {
      toast.error("Amount and description required");
      return;
    }
    setSaving(true);
    try {
      const logged_at = new Date().toISOString();
      await base44.entities.CashTransaction.create({ ...txForm, amount: Number(txForm.amount), logged_at });
      toast.success("Entry saved");
      setTxDialog(false);
      setTxForm({ date: todayStr, type: "cash_log", amount: "", description: "", category: "other", logged_by: "", notes: "" });
      load();
    } catch (err) {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const handleDeleteDrawer = async (id) => {
    try {
      await base44.entities.DrawerCount.delete(id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleDeleteTx = async (id) => {
    try {
      await base44.entities.CashTransaction.delete(id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleExportDaily = async () => {
    const todayData = todayDrawers.map(d => ({
      Drawer: d.drawer_name,
      Shift: d.shift,
      Expected: `$${(d.expected || 0).toFixed(2)}`,
      Counted: `$${(d.total || 0).toFixed(2)}`,
      Variance: `$${(d.variance || 0).toFixed(2)}`,
      "Manager Initials": d.manager_initials || "—",
      "Counted By": d.counted_by || "—",
    }));
    const csv = [Object.keys(todayData[0] || {}), ...todayData.map(r => Object.values(r))].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cash-report-${todayStr}.csv`;
    a.click();
    toast.success("Report exported");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Cash Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Drawer counts, drops, and discrepancies</p>
        </div>
        <Button onClick={() => setCashFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Count Drawer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-semibold">TODAY'S TOTAL</p>
          <p className="text-2xl font-bold mt-1">${todayDrawers.reduce((s, d) => s + (d.total || 0), 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{todayDrawers.length} drawer{todayDrawers.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-semibold">FLAGGED VARIANCES</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{todayDrawers.filter(d => d.variance !== null && Math.abs(d.variance) > THRESHOLD).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Outside ±${THRESHOLD}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-semibold">PETTY CASH BALANCE</p>
          <p className={cn("text-2xl font-bold mt-1", pettyCashBalance < 0 ? "text-red-600" : "text-green-600")}>${pettyCashBalance.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="today">
        <TabsList className="mb-4">
          <TabsTrigger value="today">Today's Drawers</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="petty">Petty Cash</TabsTrigger>
          <TabsTrigger value="log">Log</TabsTrigger>
        </TabsList>

        {/* Today's Drawers */}
        <TabsContent value="today" className="space-y-3">
          {todayDrawers.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              No drawer counts logged yet today.
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleExportDaily}>
                  <Download className="h-4 w-4 mr-2" /> Export Report
                </Button>
              </div>
              {todayDrawers.map(d => {
                const isFlagged = d.variance !== null && Math.abs(d.variance) > THRESHOLD;
                return (
                  <div key={d.id} className={cn("rounded-xl border-2 p-4 space-y-3", isFlagged ? "bg-red-500/5 border-red-500/40" : "bg-card border-border")}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base">{d.drawer_name}</h3>
                        <p className="text-xs text-muted-foreground">{d.shift} shift</p>
                      </div>
                      {isFlagged && <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
                    </div>

                    {/* Expected vs Counted */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Expected</p>
                        <p className="font-bold">${(d.expected || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Counted</p>
                        <p className="font-bold text-green-600">${(d.total || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Variance</p>
                        <p className={cn("font-bold", d.variance === 0 ? "text-green-600" : d.variance > 0 ? "text-blue-600" : "text-red-600")}>
                          {d.variance >= 0 ? "+" : ""}${(d.variance || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Manager Section */}
                    <div className="bg-secondary/40 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        {d.manager_initials && <span className="font-bold">Manager: {d.manager_initials}</span>}
                        {d.counted_by && <span className="text-muted-foreground">Counted by: {d.counted_by}</span>}
                      </div>
                      {d.manager_notes && <p className="text-xs text-muted-foreground italic">"{d.manager_notes}"</p>}
                    </div>

                    {/* Photo */}
                    {d.closeout_photo && (
                      <a href={d.closeout_photo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        📸 View closeout photo
                      </a>
                    )}

                    <button onClick={() => handleDeleteDrawer(d.id)} className="text-xs text-destructive hover:text-destructive/80">
                      Delete
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-3">
          {olderDrawers.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              No older drawer counts.
            </div>
          ) : (
            olderDrawers.map(d => (
              <div key={d.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{d.drawer_name}</h3>
                    <p className="text-xs text-muted-foreground">{d.date} · {d.shift} shift</p>
                  </div>
                  <p className="font-bold text-sm">${(d.total || 0).toFixed(2)}</p>
                </div>
                {d.variance !== null && <p className="text-xs text-muted-foreground">{d.variance >= 0 ? "+" : ""}${d.variance.toFixed(2)} variance</p>}
                <button onClick={() => handleDeleteDrawer(d.id)} className="text-xs text-destructive hover:text-destructive/80">
                  Delete
                </button>
              </div>
            ))
          )}
        </TabsContent>

        {/* Petty Cash */}
        <TabsContent value="petty" className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={cn("text-2xl font-bold mt-1", pettyCashBalance < 0 ? "text-red-600" : "text-green-600")}>${pettyCashBalance.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setTxForm({ date: todayStr, type: "petty_cash_in", amount: "", description: "", category: "other", logged_by: "", notes: "" }); setTxDialog(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> In
              </Button>
              <Button size="sm" onClick={() => { setTxForm({ date: todayStr, type: "petty_cash_out", amount: "", description: "", category: "supplies", logged_by: "", notes: "" }); setTxDialog(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Out
              </Button>
            </div>
          </div>
          {transactions.filter(t => t.type !== "cash_log").length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              No petty cash entries.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.filter(t => t.type !== "cash_log").map(tx => (
                <div key={tx.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                  <div className={cn("h-7 w-7 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold", tx.type === "petty_cash_in" ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600")}>
                    {tx.type === "petty_cash_in" ? "+" : "−"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <p className={cn("font-bold text-sm", tx.type === "petty_cash_in" ? "text-green-600" : "text-red-600")}>${(tx.amount || 0).toFixed(2)}</p>
                  <button onClick={() => handleDeleteTx(tx.id)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cash Log */}
        <TabsContent value="log" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setTxForm({ date: todayStr, type: "cash_log", amount: "", description: "", category: "deposit", logged_by: "", notes: "" }); setTxDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Entry
            </Button>
          </div>
          {transactions.filter(t => t.type === "cash_log").length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              No cash log entries.
            </div>
          ) : (
            transactions.filter(t => t.type === "cash_log").map(tx => (
              <div key={tx.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date} · {tx.category}</p>
                </div>
                <p className="font-bold text-sm text-green-600">${(tx.amount || 0).toFixed(2)}</p>
                <button onClick={() => handleDeleteTx(tx.id)} className="text-destructive hover:text-destructive/80 p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <CashLogForm
        open={cashFormOpen}
        onClose={() => setCashFormOpen(false)}
        onSaved={() => { setCashFormOpen(false); load(); }}
      />

      {/* Transaction Dialog */}
      <Dialog open={txDialog} onOpenChange={setTxDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{txForm.type === "cash_log" ? "Cash Log Entry" : txForm.type === "petty_cash_in" ? "Petty Cash In" : "Petty Cash Out"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold block mb-1">Date</label>
                <Input type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Amount ($)</label>
                <Input type="number" placeholder="0.00" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Description</label>
              <Input placeholder="What is this for?" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Category</label>
              <Select value={txForm.category} onValueChange={v => setTxForm({ ...txForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {txForm.type === "cash_log" ? (
                    <>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="variance">Variance</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Logged By</label>
              <Input placeholder="Your name" value={txForm.logged_by} onChange={e => setTxForm({ ...txForm, logged_by: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Notes (optional)</label>
              <Textarea rows={2} className="resize-none" value={txForm.notes} onChange={e => setTxForm({ ...txForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTx} disabled={saving || !txForm.amount || !txForm.description}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;