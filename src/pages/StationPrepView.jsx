import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChefHat, CheckCircle2, Circle, Camera, ChevronDown, AlertCircle, HelpCircle } from "lucide-react";
import StationBadge from "../components/StationBadge";
import PrepItemCard from "../components/PrepItemCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const todayStr = new Date().toISOString().split("T")[0];

export default function StationPrepView() {
  const { stationId } = useParams();
  const [station, setStation] = useState(null);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [expandCompleted, setExpandCompleted] = useState(false);
  const [helpDialog, setHelpDialog] = useState(null);

  const load = async () => {
    const [s, pl, pi] = await Promise.all([
      base44.entities.Station.get(stationId),
      base44.entities.PrepList.filter({ station_id: stationId, status: "active", date: todayStr }),
      base44.entities.PrepItem.list("-created_date", 200),
    ]);
    setStation(s);
    setPrepLists(pl);
    
    // Filter items to today's lists only
    const todayItems = pi.filter(item => pl.some(list => list.id === item.prep_list_id));
    setPrepItems(todayItems);

    try {
      const me = await base44.auth.me();
      setUser(me);
    } catch {}

    setLoading(false);
  };

  useEffect(() => { load(); }, [stationId]);

  const handleItemUpdate = async (itemId, data) => {
    await base44.entities.PrepItem.update(itemId, data);
    load();
  };

  const handleHelpRequest = async (itemId, message) => {
    // Log help request (could trigger notification)
    console.log("Help requested for item:", itemId, message);
    await handleItemUpdate(itemId, { notes: `⚠️ HELP NEEDED: ${message}` });
    setHelpDialog(null);
  };

  const handleUnavailable = async (itemId) => {
    await handleItemUpdate(itemId, { status: "86d", notes: "Item unavailable" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Station not found.
      </div>
    );
  }

  const activeItems = prepItems.filter(pi => pi.status !== "completed" && pi.status !== "86d");
  const completedItems = prepItems.filter(pi => pi.status === "completed");
  const unavailableItems = prepItems.filter(pi => pi.status === "86d");

  // Sort by due time
  const sortByDueTime = (items) => {
    return items.sort((a, b) => {
      const aTime = a.due_time || "23:59";
      const bTime = b.due_time || "23:59";
      return aTime.localeCompare(bTime);
    });
  };

  const sortedActiveItems = sortByDueTime(activeItems);
  const progress = prepItems.length > 0 ? Math.round((completedItems.length / prepItems.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">Heard Ops</span>
          </div>
          <StationBadge name={station.name} color={station.color} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Progress Bar */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">Today's Progress</h2>
            <span className="text-3xl font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-xs font-semibold text-muted-foreground">
            <span>{completedItems.length} done</span>
            <span>{sortedActiveItems.length} to go</span>
            {unavailableItems.length > 0 && <span className="text-red-600">{unavailableItems.length} unavailable</span>}
          </div>
        </div>

        {/* No items state */}
        {prepItems.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No prep items for this station today.</p>
          </div>
        )}

        {/* Pending Items */}
        {sortedActiveItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-sm uppercase tracking-wider">To Do ({sortedActiveItems.length})</h3>
            </div>
            <div className="space-y-3">
              {sortedActiveItems.map(item => (
                <PrepItemTaskCard
                  key={item.id}
                  item={item}
                  prepList={prepLists.find(l => l.id === item.prep_list_id)}
                  onUpdate={handleItemUpdate}
                  onHelp={() => setHelpDialog(item.id)}
                  onUnavailable={() => handleUnavailable(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Unavailable Items */}
        {unavailableItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-red-600">Unavailable ({unavailableItems.length})</h3>
            <div className="space-y-2">
              {unavailableItems.map(item => (
                <div key={item.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-700">{item.name}</p>
                  <p className="text-xs text-red-600 mt-1">{item.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Items (Collapsible) */}
        {completedItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <button
              onClick={() => setExpandCompleted(!expandCompleted)}
              className="flex items-center justify-between w-full px-4 py-3 bg-card border border-border rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Completed ({completedItems.length})</h3>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expandCompleted && "rotate-180")} />
            </button>

            {expandCompleted && (
              <div className="space-y-2 mt-3 opacity-60">
                {completedItems.map(item => (
                  <div key={item.id} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold line-through">{item.name}</p>
                        {item.quantity && item.unit && (
                          <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                        )}
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Dialog */}
      <Dialog open={!!helpDialog} onOpenChange={() => setHelpDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Help</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">What do you need help with?</p>
            <Textarea
              placeholder="Describe the issue..."
              id="helpMessage"
              className="min-h-20"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHelpDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                const message = document.getElementById("helpMessage")?.value || "Help needed";
                handleHelpRequest(helpDialog, message);
              }}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;

// Individual prep item card optimized for cooks
function PrepItemTaskCard({ item, prepList, onUpdate, onHelp, onUnavailable }) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    await onUpdate(item.id, {
      status: "completed",
      completed_by: item.created_by,
      completed_at: new Date().toISOString(),
    });
    setIsCompleting(false);
  };

  const isOverdue = item.due_time && item.due_time < new Date().toTimeString().slice(0, 5);

  return (
    <div className={cn(
      "bg-card border-2 rounded-lg p-4 space-y-3",
      isOverdue ? "border-red-500/50 bg-red-500/5" : "border-border"
    )}>
      {/* Item Name & Details */}
      <div>
        <h4 className="text-lg font-bold">{item.name}</h4>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          {item.quantity && item.unit && (
            <span className="font-semibold text-foreground">{item.quantity} {item.unit}</span>
          )}
          {item.due_time && (
            <span className={cn("font-semibold", isOverdue && "text-red-600")}>
              Due: {item.due_time}
            </span>
          )}
          {item.priority === "high" && (
            <span className="px-2 py-1 bg-red-500/20 text-red-700 text-xs font-bold rounded">URGENT</span>
          )}
        </div>
      </div>

      {/* Master Photo Reference */}
      {item.master_photo_url && (
        <div className="border border-border rounded-lg overflow-hidden">
          <img src={item.master_photo_url} alt="Reference" className="w-full h-24 object-cover" />
          <p className="text-xs text-muted-foreground p-2 bg-secondary/20">Reference photo</p>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <p className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-lg">{item.notes}</p>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className="col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {isCompleting ? "Completing..." : "✓ Mark Complete"}
        </button>

        {item.requires_photo && !item.photo_url && (
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Camera className="h-4 w-4" />
            Upload Photo
          </button>
        )}

        <button
          onClick={onHelp}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </button>

        <button
          onClick={onUnavailable}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Unavailable
        </button>
      </div>
    </div>
  );
}