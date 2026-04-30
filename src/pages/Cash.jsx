import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, DollarSign, Wallet, BookOpen, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const todayStr = new Date().toISOString().split("T")[0];

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

// Rolled coin: each entry is (rolls × face value per roll)
const ROLLED_COINS = [
  { key: "rolled_quarters", label: "Quarters", valuePerRoll: 10 },
  { key: "rolled_dimes",    label: "Dimes",    valuePerRoll: 5 },
  { key: "rolled_nickels", label: "Nickels",   valuePerRoll: 2 },
  { key: "rolled_pennies", label: "Pennies",   valuePerRoll: 0.50 },
];

const emptyDrawer = { date: todayStr, shift: "morning", drawer_name: "", hundreds: 0, fifties: 0, twenties: 0, tens: 0, fives: 0, ones: 0, quarters: 0, dimes: 0, nickels: 0, pennies: 0, rolled_quarters: 0, rolled_dimes: 0, rolled_nickels: 0, rolled_pennies: 0, expected: "", notes: "", counted_by: "" };

function formatTimestamp(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

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
  const [txDialog, setTxDialog] = useState(false);
  const [drawerForm, setDrawerForm] = useState(emptyDrawer);
  const [txForm, setTxForm] = useState({ date: todayStr, type: "cash_log", amount: "", description: "", category: "other", logged_by: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [d, t] = await Promise.all([
      base44.entities.DrawerCount.list("-date", 100),
      base44.entities.CashTransaction.list("-date", 200),
    ]);
    setDrawers(d);
    setTransactions(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const drawerTotal = calcTotal(drawerForm);
  const drawerVariance = drawerForm.expected !== "" ? drawerTotal - Number(drawerForm.expected) : null;

  const handleSaveDrawer = async () => {
    setSaving(true);
    const total = calcTotal(drawerForm);
    const variance = drawerForm.expected !== "" ? total - Number(drawerForm.expected) : null;
    const logged_at = new Date().toISOString();
    await base44.entities.DrawerCount.create({ ...drawerForm, total, logged_at, variance: variance ?? undefined, expected: drawerForm.expected !== "" ? Number(drawerForm.expected) : undefined });
    setSaving(false);
    setDrawerDialog(false);
    setDrawerForm(emptyDrawer);
    toast.success("Drawer count saved");
    load();
  };

  const handleSaveTx = async () => {
    setSaving(true);
    const logged_at = new Date().toISOString();
    await base44.entities.CashTransaction.create({ ...txForm, amount: Number(txForm.amount), logged_at });
    setSaving(false);
    setTxDialog(false);
    setTxForm({ date: todayStr, type: "cash_log", amount: "", description: "", category: "other", logged_by: "", notes: "" });
    toast.success("Entry saved");
    load();
  };

  const handleDeleteDrawer = async (id) => {
    await base44.entities.DrawerCount.delete(id);
    toast.success("Deleted");
    load();
  };

  const handleDeleteTx = async (id) => {
    await base44.entities.CashTransaction.delete(id);
    toast.success("Deleted");
    load();
  };

  const pettyCashIn = transactions.filter(t => t.type === "petty_cash_in").reduce((s, t) => s + (t.amount || 0), 0);
  const pettyCashOut = transactions.filter(t => t.type === "petty_cash_out").reduce((s, t) => s + (t.amount || 0), 0);
  const pettyCashBalance = pettyCashIn - pettyCashOut;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Cash</h1>
        <p className="text-sm text-muted-foreground mt-1">Drawer counts, cash log, and petty cash</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/15 border border-green-500/30 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Drawer Total</p>
            <p className="text-lg font-bold">{drawers[0] ? `$${(drawers[0].total || 0).toFixed(2)}` : "—"}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Petty Cash Balance</p>
            <p className={cn("text-lg font-bold", pettyCashBalance < 0 ? "text-destructive" : "")}>${pettyCashBalance.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Log Entries (total)</p>
            <p className="text-lg font-bold">{transactions.length}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="drawers">
        <TabsList className="mb-4">
          <TabsTrigger value="drawers">Drawer Counts</TabsTrigger>
          <TabsTrigger value="cashlog">Cash Log</TabsTrigger>
          <TabsTrigger value="petty">Petty Cash</TabsTrigger>
        </TabsList>

        <TabsContent value="drawers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setDrawerForm(emptyDrawer); setDrawerDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Count Drawer
            </Button>
          </div>
          {drawers.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No drawer counts yet.</div>
          ) : (
            <div className="space-y-2">
              {drawers.map(d => (
                <div key={d.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{d.drawer_name || "Drawer"}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{d.shift}</span>
                      <span className="text-xs text-muted-foreground">{d.date}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm flex-wrap">
                      <span className="font-bold text-green-400">${(d.total || 0).toFixed(2)}</span>
                      {d.expected != null && (
                        <span className={cn("text-xs font-medium", d.variance > 0 ? "text-green-400" : d.variance < 0 ? "text-destructive" : "text-muted-foreground")}>
                          {d.variance >= 0 ? "+" : ""}${(d.variance || 0).toFixed(2)} variance
                        </span>
                      )}
                      {d.counted_by && <span className="text-xs text-muted-foreground">by {d.counted_by}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {d.logged_at && <span className="text-xs text-muted-foreground/60">{formatTimestamp(d.logged_at)}</span>}
                      {d.notes && <span className="text-xs text-muted-foreground">{d.notes}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteDrawer(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cashlog" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setTxForm({ date: todayStr, type: "cash_log", amount: "", description: "", category: "deposit", logged_by: "", notes: "" }); setTxDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add Entry
            </Button>
          </div>
          {transactions.filter(t => t.type === "cash_log").length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No cash log entries yet.</div>
          ) : (
            <div className="space-y-2">
              {transactions.filter(t => t.type === "cash_log").map(tx => (
                <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{tx.description}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{tx.category}</span>
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {tx.logged_by && <span className="text-xs text-muted-foreground">by {tx.logged_by}</span>}
                      {tx.logged_at && <span className="text-xs text-muted-foreground/60">{formatTimestamp(tx.logged_at)}</span>}
                    </div>
                    {tx.notes && <p className="text-xs text-muted-foreground">{tx.notes}</p>}
                  </div>
                  <span className="font-bold text-sm text-green-400">${(tx.amount || 0).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTx(tx.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="petty" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-muted-foreground">In:</span>
                <span className="font-semibold text-green-400">${pettyCashIn.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-muted-foreground">Out:</span>
                <span className="font-semibold text-destructive">${pettyCashOut.toFixed(2)}</span>
              </div>
              <div className="text-sm font-bold">Balance: <span className={pettyCashBalance < 0 ? "text-destructive" : "text-green-400"}>${pettyCashBalance.toFixed(2)}</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setTxForm({ date: todayStr, type: "petty_cash_in", amount: "", description: "", category: "other", logged_by: "", notes: "" }); setTxDialog(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" />In
              </Button>
              <Button size="sm" onClick={() => { setTxForm({ date: todayStr, type: "petty_cash_out", amount: "", description: "", category: "supplies", logged_by: "", notes: "" }); setTxDialog(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" />Out
              </Button>
            </div>
          </div>
          {transactions.filter(t => t.type !== "cash_log").length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No petty cash entries yet.</div>
          ) : (
            <div className="space-y-2">
              {transactions.filter(t => t.type !== "cash_log").map(tx => (
                <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border", tx.type === "petty_cash_in" ? "bg-green-500/15 border-green-500/30" : "bg-red-500/15 border-red-500/30")}>
                    {tx.type === "petty_cash_in" ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{tx.description}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{tx.category}</span>
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {tx.logged_by && <span className="text-xs text-muted-foreground">by {tx.logged_by}</span>}
                      {tx.logged_at && <span className="text-xs text-muted-foreground/60">{formatTimestamp(tx.logged_at)}</span>}
                    </div>
                    {tx.notes && <p className="text-xs text-muted-foreground">{tx.notes}</p>}
                  </div>
                  <span className={cn("font-bold text-sm", tx.type === "petty_cash_in" ? "text-green-400" : "text-destructive")}>
                    {tx.type === "petty_cash_in" ? "+" : "-"}${(tx.amount || 0).toFixed(2)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTx(tx.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Drawer Count Dialog */}
      <Dialog open={drawerDialog} onOpenChange={setDrawerDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Count Drawer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={drawerForm.date} onChange={e => setDrawerForm({ ...drawerForm, date: e.target.value })} />
              </div>
              <div>
                <Label>Shift</Label>
                <Select value={drawerForm.shift} onValueChange={v => setDrawerForm({ ...drawerForm, shift: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Drawer / Register Name</Label>
              <Input placeholder="e.g., Bar, Host, Register 1" value={drawerForm.drawer_name} onChange={e => setDrawerForm({ ...drawerForm, drawer_name: e.target.value })} />
            </div>
            <div>
              <Label className="mb-2 block">Bills and Coins</Label>
              <div className="space-y-2">
                {DENOMINATIONS.map(d => (
                  <div key={d.key} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">{d.label}</span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={drawerForm[d.key] || ""}
                      onChange={e => setDrawerForm({ ...drawerForm, [d.key]: e.target.value })}
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">= ${((Number(drawerForm[d.key]) || 0) * d.value).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Rolled Coin</Label>
              <div className="space-y-2">
                {ROLLED_COINS.map(d => (
                  <div key={d.key} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">{d.label}</span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 rolls"
                      value={drawerForm[d.key] || ""}
                      onChange={e => setDrawerForm({ ...drawerForm, [d.key]: e.target.value })}
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">= ${((Number(drawerForm[d.key]) || 0) * d.valuePerRoll).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3 flex items-center justify-between">
              <span className="font-semibold">Total Counted</span>
              <span className="text-xl font-bold text-green-400">${drawerTotal.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Expected ($)</Label>
                <Input type="number" placeholder="e.g., 200.00" value={drawerForm.expected} onChange={e => setDrawerForm({ ...drawerForm, expected: e.target.value })} />
              </div>
              <div className="flex flex-col justify-end">
                {drawerVariance !== null && (
                  <div className={cn("text-sm font-semibold text-center py-2 rounded-lg", drawerVariance === 0 ? "bg-green-500/15 text-green-400" : drawerVariance > 0 ? "bg-blue-500/15 text-blue-400" : "bg-red-500/15 text-destructive")}>
                    {drawerVariance >= 0 ? "+" : ""}${drawerVariance.toFixed(2)} variance
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Counted By</Label>
              <Input placeholder="Your name" value={drawerForm.counted_by} onChange={e => setDrawerForm({ ...drawerForm, counted_by: e.target.value })} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea rows={2} className="resize-none" value={drawerForm.notes} onChange={e => setDrawerForm({ ...drawerForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDrawerDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveDrawer} disabled={saving}>Save Count</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash Log / Petty Cash Dialog */}
      <Dialog open={txDialog} onOpenChange={setTxDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{txForm.type === "cash_log" ? "Cash Log Entry" : txForm.type === "petty_cash_in" ? "Petty Cash In" : "Petty Cash Out"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} />
              </div>
              <div>
                <Label>Amount ($)</Label>
                <Input type="number" placeholder="0.00" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input placeholder="What is this for?" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={txForm.category} onValueChange={v => setTxForm({ ...txForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {txForm.type === "cash_log" ? (
                    <>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="variance">Variance</SelectItem>
                      <SelectItem value="tips">Tips</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="tips">Tips</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Logged By</Label>
              <Input placeholder="Your name" value={txForm.logged_by} onChange={e => setTxForm({ ...txForm, logged_by: e.target.value })} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
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