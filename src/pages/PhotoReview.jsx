import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, Clock, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PhotoReview() {
  const [items, setItems] = useState([]);
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStation, setFilterStation] = useState("all");

  useEffect(() => {
    Promise.all([
      base44.entities.PrepItem.list("-updated_date", 500),
      base44.entities.Station.list(),
      base44.entities.PrepList.list("-date", 200),
    ]).then(([pi, s, pl]) => {
      setItems(pi.filter(i => i.photo_url));
      setStations(s);
      setPrepLists(pl);
      setLoading(false);
    });
  }, []);

  const stationMap = Object.fromEntries(stations.map(s => [s.id, s]));
  const listMap = Object.fromEntries(prepLists.map(l => [l.id, l]));

  const filtered = filterStation === "all"
    ? items
    : items.filter(i => i.station_id === filterStation);

  const selectedIdx = selected !== null ? filtered.findIndex(i => i.id === selected.id) : -1;

  const openNext = () => { if (selectedIdx < filtered.length - 1) setSelected(filtered[selectedIdx + 1]); };
  const openPrev = () => { if (selectedIdx > 0) setSelected(filtered[selectedIdx - 1]); };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Photo Review</h1>
          <p className="text-muted-foreground mt-1">All submitted prep completion photos in one place</p>
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} photo{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Station filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStation("all")}
          className={cn("px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
            filterStation === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
          )}
        >All Stations</button>
        {stations.filter(s => items.some(i => i.station_id === s.id)).map(s => (
          <button
            key={s.id}
            onClick={() => setFilterStation(s.id)}
            className={cn("px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              filterStation === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >{s.name}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-2">
          <Camera className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No completion photos found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(item => {
            const station = stationMap[item.station_id];
            const list = listMap[item.prep_list_id];
            return (
              <motion.div
                key={item.id}
                className="cursor-pointer group rounded-xl overflow-hidden border border-border bg-card"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(item)}
              >
                <div className="aspect-square overflow-hidden relative">
                  <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 right-2">
                    <span className={cn(
                      "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                      item.status === "completed" ? "bg-green-500/90 text-white" : "bg-yellow-500/90 text-white"
                    )}>
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {item.status === "completed" ? "Done" : item.status}
                    </span>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {station?.name || "Unknown"} · {list?.date || ""}
                  </p>
                  {item.completed_by && (
                    <p className="text-[10px] text-muted-foreground truncate">{item.completed_by}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="relative bg-card rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>

              <img src={selected.photo_url} alt={selected.name} className="w-full max-h-[60vh] object-contain bg-black" />

              <div className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base">{selected.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stationMap[selected.station_id]?.name || "Unknown station"} · {listMap[selected.prep_list_id]?.name || ""}
                    </p>
                  </div>
                  <span className={cn(
                    "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0",
                    selected.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  )}>
                    <CheckCircle2 className="h-3 w-3" />
                    {selected.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {selected.completed_by && <p>Completed by: <span className="text-foreground">{selected.completed_by}</span></p>}
                  {selected.completed_at && <p>At: <span className="text-foreground">{new Date(selected.completed_at).toLocaleString()}</span></p>}
                  {selected.completion_notes && <p>Notes: <span className="text-foreground">{selected.completion_notes}</span></p>}
                  {selected.quantity && <p>Quantity: <span className="text-foreground">{selected.quantity} {selected.unit || ""}</span></p>}
                </div>
              </div>

              {/* Prev / Next */}
              <div className="flex items-center justify-between px-5 pb-4">
                <Button variant="outline" size="sm" disabled={selectedIdx === 0} onClick={openPrev}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                </Button>
                <span className="text-xs text-muted-foreground">{selectedIdx + 1} / {filtered.length}</span>
                <Button variant="outline" size="sm" disabled={selectedIdx === filtered.length - 1} onClick={openNext}>
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}