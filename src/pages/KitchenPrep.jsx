import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Search, AlertTriangle, Clock, Zap, Building2, ArrowUp, ArrowLeft } from "lucide-react";
import PrepItemCard from "../components/KitchenPrep/PrepItemCard";
import UpdateQuantityModal from "../components/KitchenPrep/UpdateQuantityModal";
import { cn } from "@/lib/utils";
import { format, isPast, differenceInMinutes } from "date-fns";

const STATIONS = ["All", "Grill", "Pantry", "Fry", "Prep", "Bar", "Expo", "Pastry"];
const SORT_OPTIONS = [
  { id: "due_time", label: "Due Time" },
  { id: "station", label: "Station" },
  { id: "completion", label: "Completion %" },
  { id: "assigned", label: "Assigned" },
  { id: "status", label: "Status" },
];

export default function KitchenPrep() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [prepItems, setPrepItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("due_time");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [scrollToTop, setScrollToTop] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [items, emps] = await Promise.all([
        base44.entities.PrepItem.list("-created_date", 500).catch(() => []),
        base44.entities.User.list().catch(() => []),
      ]);
      setPrepItems(items);
      setEmployees(emps);
      setLoading(false);
    };
    load();
  }, []);

  const getItemStatus = (item) => {
    if (item.status === "rejected") return "rejected";
    if (item.status === "approved") return "complete";
    if (item.completion_status === "missed") return "missed";
    
    const now = new Date();
    const dueTime = item.due_time ? new Date(`${new Date().toISOString().split('T')[0]}T${item.due_time}`) : null;
    const completed = item.completed_at ? new Date(item.completed_at) : null;
    
    if (item.status === "completed" || item.status === "pending_review") {
      return item.status === "pending_review" ? "needs_review" : "complete";
    }
    
    if (!dueTime) return "on_track";
    
    const minutesTilDue = differenceInMinutes(dueTime, now);
    const completion = item.quantity && item.quantity > 0 ? (item.completed_qty || 0) / item.quantity : 0;
    
    if (isPast(dueTime) && item.status !== "completed") return "overdue";
    if (minutesTilDue <= 60 && minutesTilDue > 0 && completion < 1) return "due_soon";
    if (completion < 0.5 && minutesTilDue <= 120) return "behind";
    
    return "on_track";
  };

  const getStatusColor = (status) => {
    const colors = {
      complete: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      on_track: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      due_soon: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      behind: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      overdue: "bg-red-500/10 text-red-400 border-red-500/20",
      needs_review: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      missed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    return colors[status] || colors.on_track;
  };

  const getStatusLabel = (status) => {
    const labels = {
      complete: "Complete",
      on_track: "On Track",
      due_soon: "Due Soon",
      behind: "Behind",
      overdue: "Overdue",
      needs_review: "Needs Review",
      missed: "Missed",
    };
    return labels[status] || "Unknown";
  };

  const filtered = useMemo(() => {
    return prepItems.filter(item => {
      if (filter !== "All" && item.station_name !== filter) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return item.status !== "rejected";
    });
  }, [prepItems, filter, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "due_time") {
      copy.sort((a, b) => (a.due_time || "").localeCompare(b.due_time || ""));
    } else if (sort === "station") {
      copy.sort((a, b) => (a.station_name || "").localeCompare(b.station_name || ""));
    } else if (sort === "completion") {
      copy.sort((a, b) => {
        const aComp = a.quantity ? (a.completed_qty || 0) / a.quantity : 0;
        const bComp = b.quantity ? (b.completed_qty || 0) / b.quantity : 0;
        return bComp - aComp;
      });
    } else if (sort === "status") {
      const statusOrder = { overdue: 0, behind: 1, due_soon: 2, on_track: 3, complete: 4 };
      copy.sort((a, b) => (statusOrder[getItemStatus(a)] || 5) - (statusOrder[getItemStatus(b)] || 5));
    }
    return copy;
  }, [filtered, sort]);

  const stats = useMemo(() => {
    const total = prepItems.filter(i => i.status !== "rejected").length;
    const complete = prepItems.filter(i => i.status === "completed" || i.status === "approved").length;
    const overdue = prepItems.filter(i => {
      const st = getItemStatus(i);
      return st === "overdue";
    }).length;
    const stations = new Set(prepItems.filter(i => i.status !== "rejected").map(i => i.station_name)).size;

    return {
      completion: total > 0 ? Math.round((complete / total) * 100) : 0,
      dueSoon: prepItems.filter(i => getItemStatus(i) === "due_soon").length,
      overdue,
      stations,
    };
  }, [prepItems]);

  const needsAttention = useMemo(() => {
    return sorted.filter(item => {
      const st = getItemStatus(item);
      const completion = item.quantity ? (item.completed_qty || 0) / item.quantity : 0;
      return st === "overdue" || st === "behind" || st === "due_soon" || st === "needs_review" ||
             (item.requires_photo && !item.photo_url) || (item.requires_approval && item.status === "completed");
    });
  }, [sorted]);

  const handleUpdateQty = async (newQty) => {
    if (!selectedItem) return;
    const updated = await base44.entities.PrepItem.update(selectedItem.id, { 
      completed_qty: newQty,
      status: newQty >= selectedItem.quantity ? "completed" : "in_progress",
      completed_at: newQty >= selectedItem.quantity ? new Date().toISOString() : null,
      completed_by: user?.email,
    });
    setPrepItems(prev => prev.map(i => i.id === selectedItem.id ? updated : i));
    setSelectedItem(null);
  };

  const handlePhotoUpload = async (itemId, photoUrl) => {
    const updated = await base44.entities.PrepItem.update(itemId, { photo_url: photoUrl });
    setPrepItems(prev => prev.map(i => i.id === itemId ? updated : i));
  };

  const handleReject = async (itemId) => {
    const updated = await base44.entities.PrepItem.update(itemId, { 
      status: "rejected",
      rejection_notes: "Marked can't complete",
    });
    setPrepItems(prev => prev.filter(i => i.id !== itemId));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pb-32 bg-background min-h-screen">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors active:scale-95">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Kitchen Prep</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">Production tracker for active shift</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 grid grid-cols-4 gap-1.5">
        <div className="bg-card border border-border rounded-lg p-2">
          <p className="text-2xl font-bold text-primary">{stats.completion}%</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Complete</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2">
          <p className="text-2xl font-bold text-yellow-400">{stats.dueSoon}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Due Soon</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2">
          <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Overdue</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2">
          <p className="text-2xl font-bold text-blue-400">{stats.stations}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">Active</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="px-4 py-3 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search prep items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Station Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STATIONS.map(station => (
            <button
              key={station}
              onClick={() => setFilter(station)}
              className={cn(
                "flex-shrink-0 h-8 px-3 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                filter === station
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card border-border text-muted-foreground"
              )}
            >
              {station}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="w-full h-8 px-2 text-xs border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* NEEDS ATTENTION */}
      {needsAttention.length > 0 && (
        <div className="px-4 py-3 bg-red-500/5 border-b border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-xs font-bold text-red-400 uppercase">Needs Attention ({needsAttention.length})</p>
          </div>
          <div className="space-y-1.5">
            {needsAttention.slice(0, 3).map(item => {
              const st = getItemStatus(item);
              const emp = employees.find(e => e.email === item.completed_by);
              return (
                <div key={item.id} className="bg-card border border-red-500/20 rounded-lg p-2 flex items-start gap-2">
                  <div className={cn("h-6 w-6 rounded flex items-center justify-center shrink-0 text-[10px] font-bold", getStatusColor(st))}>
                    {st === "overdue" ? "!" : st === "behind" ? "↓" : "⏱"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                      <span>{item.station_name}</span>
                      {item.due_time && <span>• {item.due_time}</span>}
                    </div>
                  </div>
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", getStatusColor(st))}>
                    {getStatusLabel(st)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PREP ITEMS */}
      <div className="px-4 py-3 space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">No prep items for this filter</div>
        ) : (
          sorted.map(item => (
            <PrepItemCard
              key={item.id}
              item={item}
              status={getItemStatus(item)}
              statusColor={getStatusColor(getItemStatus(item))}
              statusLabel={getStatusLabel(getItemStatus(item))}
              assignedEmployee={employees.find(e => e.email === item.completed_by)}
              onUpdateQty={() => setSelectedItem(item)}
              onPhotoUpload={(url) => handlePhotoUpload(item.id, url)}
              onReject={() => handleReject(item.id)}
            />
          ))
        )}
      </div>

      {/* UPDATE QUANTITY MODAL */}
      {selectedItem && (
        <UpdateQuantityModal
          item={selectedItem}
          onSave={handleUpdateQty}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* SCROLL TO TOP BUTTON */}
      {scrollToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-4 h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform z-20"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export const hideBase44Index = true;