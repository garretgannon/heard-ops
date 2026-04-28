import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronRight, ImageIcon, CheckCircle2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StationBadge from "../components/StationBadge";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { toast } from "sonner";

export default function MasterPrepList() {
  const [stations, setStations] = useState([]);
  const [prepLists, setPrepLists] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openStations, setOpenStations] = useState({});
  const [photoModal, setPhotoModal] = useState(null);
  const [notesItem, setNotesItem] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploadingFor, setUploadingFor] = useState(null);
  const { user, isAdmin } = useCurrentUser();

  const todayStr = new Date().toISOString().split("T")[0];

  const load = async () => {
    const [s, pl, pi] = await Promise.all([
      base44.entities.Station.list(),
      base44.entities.PrepList.filter({ date: todayStr }),
      base44.entities.PrepItem.list("-created_date", 500),
    ]);
    setStations(s);
    setPrepLists(pl);
    setPrepItems(pi);
    const initial = {};
    s.forEach(st => { initial[st.id] = true; });
    setOpenStations(initial);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleStation = (id) => setOpenStations(prev => ({ ...prev, [id]: !prev[id] }));

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  const markComplete = async (item) => {
    await base44.entities.PrepItem.update(item.id, {
      status: item.status === "completed" ? "pending" : "completed",
      completed_by: item.status === "completed" ? "" : (user?.full_name || user?.email || "Staff"),
      completed_at: item.status === "completed" ? "" : new Date().toISOString(),
    });
    load();
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    await base44.entities.PrepItem.update(notesItem.id, { completion_notes: notesText });
    setNotesItem(null);
    setNotesText("");
    setSavingNotes(false);
    toast.success("Notes saved");
    load();
  };

  const uploadMasterPhoto = async (itemId, file) => {
    setUploadingFor(itemId);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.PrepItem.update(itemId, { master_photo_url: file_url });
    setUploadingFor(null);
    toast.success("Reference photo uploaded");
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Master Prep List</h1>
        <p className="text-muted-foreground mt-1">
          Today — {todayStr}
          {isAdmin && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Manager View</span>}
        </p>
      </div>

      {stations.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground">
          No stations set up yet.
        </div>
      )}

      <div className="space-y-4">
        {stations.map((station, si) => {
          const stationLists = prepLists.filter(pl => pl.station_id === station.id);
          const listIds = stationLists.map(pl => pl.id);
          const items = prepItems
            .filter(pi => listIds.includes(pi.prep_list_id))
            .sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
          const completed = items.filter(i => i.status === "completed").length;
          const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
          const isOpen = openStations[station.id];

          return (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: si * 0.06 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <button
                onClick={() => toggleStation(station.id)}
                className="w-full flex items-center gap-4 p-4 lg:p-5 hover:bg-secondary/40 transition-colors text-left"
              >
                <StationBadge name={station.name} color={station.color} />
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{completed}/{items.length}</span>
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    {items.length === 0 ? (
                      <p className="px-5 pb-5 text-sm text-muted-foreground">No prep items for today.</p>
                    ) : (
                      <div className="border-t border-border divide-y divide-border">
                        {items.map(item => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 px-4 lg:px-5 py-3 ${item.status === "completed" ? "bg-accent/5" : ""}`}
                          >
                            {/* Complete toggle */}
                            <button onClick={() => markComplete(item)} className="flex-shrink-0">
                              {item.status === "completed"
                                ? <CheckCircle2 className="h-5 w-5 text-accent" />
                                : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/50 hover:border-primary transition-colors" />
                              }
                            </button>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium text-sm ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                  {item.name}
                                </span>
                                <PriorityBadge priority={item.priority || "medium"} />
                              </div>
                              {(item.quantity || item.unit) && (
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                  {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                                </p>
                              )}
                              {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                              {item.completion_notes && (
                                <p className="text-xs text-primary mt-0.5 italic">"{item.completion_notes}"</p>
                              )}
                              {item.completed_by && (
                                <p className="text-xs text-accent mt-0.5">✓ {item.completed_by}</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Add notes button (users) */}
                              {!isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 px-2"
                                  onClick={() => { setNotesItem(item); setNotesText(item.completion_notes || ""); }}
                                >
                                  Note
                                </Button>
                              )}

                              {/* Master reference photo */}
                              {item.master_photo_url ? (
                                <button onClick={() => setPhotoModal(item.master_photo_url)} className="group relative">
                                  <img
                                    src={item.master_photo_url}
                                    alt="Reference"
                                    className="h-14 w-14 rounded-xl object-cover border border-border group-hover:border-primary transition-colors"
                                  />
                                  {isAdmin && (
                                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                      <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="h-4 w-4 text-white" />
                                        <input type="file" accept="image/*" className="hidden"
                                          onChange={e => e.target.files[0] && uploadMasterPhoto(item.id, e.target.files[0])} />
                                      </label>
                                    </div>
                                  )}
                                </button>
                              ) : (
                                <div className="h-14 w-14 rounded-xl border border-dashed border-border flex items-center justify-center">
                                  {isAdmin ? (
                                    <label className="cursor-pointer flex flex-col items-center gap-1">
                                      {uploadingFor === item.id
                                        ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        : <>
                                            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">Photo</span>
                                          </>
                                      }
                                      <input type="file" accept="image/*" className="hidden"
                                        onChange={e => e.target.files[0] && uploadMasterPhoto(item.id, e.target.files[0])} />
                                    </label>
                                  ) : (
                                    <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Photo fullscreen */}
      <AnimatePresence>
        {photoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPhotoModal(null)}
          >
            <button className="absolute top-4 right-4 text-white" onClick={() => setPhotoModal(null)}>
              <X className="h-6 w-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={photoModal}
              alt="Reference"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion notes modal */}
      <AnimatePresence>
        {notesItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
            onClick={() => setNotesItem(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-card rounded-2xl border border-border p-5 w-full max-w-md space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-semibold">Add Note — <span className="font-normal text-muted-foreground">{notesItem.name}</span></h3>
              <Textarea
                placeholder="e.g., Cut thicker than usual, ran short on quantity..."
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setNotesItem(null)}>Cancel</Button>
                <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                  {savingNotes ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}