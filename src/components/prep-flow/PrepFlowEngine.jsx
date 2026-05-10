/**
 * PrepFlowEngine — orchestrator.
 * Dynamically loads prep items from a PrepList or PrepPlanTemplate,
 * drives them through Queue → Active → QualityCheck → Complete.
 *
 * Usage:
 *   <PrepFlowEngine listId="abc123" userName="Maria" onClose={() => {}} />
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, ListChecks } from "lucide-react";
import PrepQueueCard from "./PrepQueueCard";
import ActivePrepStep from "./ActivePrepStep";
import QualityCheckModule from "./QualityCheckModule";
import PrepCompletionScreen from "./PrepCompletionScreen";
import StorageModule from "./StorageModule";
import { toast } from "sonner";

// Phases
const PHASE = { QUEUE: "queue", ACTIVE: "active", QUALITY: "quality", COMPLETE: "complete" };

export default function PrepFlowEngine({ listId, userName, onClose }) {
  const [items, setItems] = useState([]);
  const [steps, setSteps] = useState({});       // { itemId: [PrepStep] }
  const [templates, setTemplates] = useState({}); // { templateId: Template }
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState(PHASE.QUEUE);
  const [activeItem, setActiveItem] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [qualityResults, setQualityResults] = useState({});
  const [qualityNotes, setQualityNotes] = useState("");

  // Load items
  useEffect(() => {
    if (!listId) return;
    (async () => {
      setLoading(true);
      const itemList = await base44.entities.PrepItem.filter({ prep_list_id: listId }, "sort_order");
      setItems(itemList);

      // Load steps for each item
      const stepsMap = {};
      await Promise.all(itemList.map(async (it) => {
        const s = await base44.entities.PrepStep.filter({ prep_item_id: it.id }, "step_number").catch(() => []);
        stepsMap[it.id] = s;
      }));
      setSteps(stepsMap);

      // Load templates for items that have source_template_id
      const templateIds = [...new Set(itemList.map(it => it.source_template_id).filter(Boolean))];
      const tplMap = {};
      await Promise.all(templateIds.map(async (tId) => {
        try {
          const t = await base44.entities.PrepPlanTemplate.get(tId);
          tplMap[tId] = t;
        } catch {}
      }));
      setTemplates(tplMap);
      setLoading(false);
    })();
  }, [listId]);

  const startItem = (item) => {
    const tpl = templates[item.source_template_id] || null;
    setActiveItem(item);
    setActiveTemplate(tpl);
    setCompletionData({ startedAt: Date.now(), photos: [] });
    setQualityResults({});
    setQualityNotes("");
    setPhase(PHASE.ACTIVE);
  };

  const handleActiveComplete = (data) => {
    setCompletionData(prev => ({ ...prev, ...data }));
    const qualityChecks = activeTemplate?.quality_checks || activeItem?.quality_checks || [];
    if (qualityChecks.length > 0) {
      setPhase(PHASE.QUALITY);
    } else {
      finalizeItem();
    }
  };

  const finalizeItem = async () => {
    try {
      const updates = {
        status: "completed",
        completed_by: userName,
        completed_at: new Date().toISOString(),
        photo_url: completionData?.photos?.[0] || "",
      };
      await base44.entities.PrepItem.update(activeItem.id, updates);
      setItems(prev => prev.map(it => it.id === activeItem.id ? { ...it, ...updates } : it));
      toast.success("Prep completed!");
    } catch {
      toast.error("Failed to save completion");
    }
    setPhase(PHASE.COMPLETE);
  };

  const resetToQueue = () => {
    setPhase(PHASE.QUEUE);
    setActiveItem(null);
    setActiveTemplate(null);
    setCompletionData(null);
  };

  const qualityChecks = activeTemplate?.quality_checks || activeItem?.quality_checks || [];
  const ingredients = activeTemplate?.items || activeItem?.ingredients || [];

  // Queue stats
  const completed = items.filter(it => it.status === "completed").length;
  const total = items.length;
  const progress = total > 0 ? completed / total : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-white/40">Loading prep queue…</p>
      </div>
    );
  }

  return (
    <>
      {/* Queue View */}
      {phase === PHASE.QUEUE && (
        <div className="space-y-3">
          {/* Header stats */}
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <p className="font-bold text-sm text-white">{completed}/{total} Complete</p>
            </div>
            <div className="text-xs text-white/30 font-semibold">{Math.round(progress * 100)}%</div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mx-1 mb-4">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {items.length === 0 && (
            <div className="text-center py-16 text-white/20 text-sm">No prep items in this list.</div>
          )}

          {items.map((item, i) => (
            <PrepQueueCard key={item.id} item={item} onStart={startItem} index={i} />
          ))}
        </div>
      )}

      {/* Active Prep Steps */}
      <AnimatePresence>
        {phase === PHASE.ACTIVE && activeItem && (
          <ActivePrepStep
            item={activeItem}
            steps={steps[activeItem.id] || []}
            ingredients={ingredients}
            requiresPhoto={activeItem.requires_photo || activeTemplate?.requires_photo || false}
            onComplete={handleActiveComplete}
            onClose={() => setPhase(PHASE.QUEUE)}
          />
        )}
      </AnimatePresence>

      {/* Quality Checks */}
      <AnimatePresence>
        {phase === PHASE.QUALITY && activeItem && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-[#070C10] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-white/5">
              <p className="font-extrabold text-lg">Quality Check</p>
              <p className="text-sm text-white/30">{activeItem.name}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              <QualityCheckModule
                checks={qualityChecks}
                results={qualityResults}
                onChange={(i, val) => setQualityResults(prev => ({ ...prev, [i]: val }))}
              />

              {(activeTemplate?.storage_location || activeTemplate?.shelf_life) && (
                <StorageModule
                  storageLocation={activeTemplate.storage_location}
                  shelfLife={activeTemplate.shelf_life}
                  temperature={activeTemplate.storage_temp}
                />
              )}

              <div className="space-y-2">
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Notes (optional)</p>
                <textarea
                  value={qualityNotes}
                  onChange={e => setQualityNotes(e.target.value)}
                  rows={3}
                  placeholder="Any observations…"
                  className="w-full px-4 py-3 bg-[#111820] rounded-2xl text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex-shrink-0 px-5 pb-8 pt-3">
              <motion.button
                onClick={() => { setCompletionData(prev => ({ ...prev, qualityResults, qualityNotes })); finalizeItem(); }}
                whileTap={{ scale: 0.96 }}
                className="w-full h-14 rounded-2xl bg-primary text-white font-extrabold text-base"
              >
                Submit
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion */}
      <AnimatePresence>
        {phase === PHASE.COMPLETE && activeItem && (
          <PrepCompletionScreen
            item={activeItem}
            template={activeTemplate}
            completionData={completionData}
            onDone={resetToQueue}
          />
        )}
      </AnimatePresence>
    </>
  );
}