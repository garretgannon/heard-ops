import { motion } from "framer-motion";
import { Eye, Trash2 } from "lucide-react";
import TaskVisual from "@/components/TaskVisual";

export default function PrepListCard({ pl, items, i, onSelect, onDelete }) {
  const done = items.filter(pi => pi.status === "completed").length;
  const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  return (
    <motion.div
      className="bg-card rounded-2xl border border-border overflow-hidden group"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: i * 0.04 }}
    >
      <div
        className="relative h-32 overflow-hidden cursor-pointer"
        onClick={() => onSelect(pl)}
      >
        <TaskVisual
          type="prep"
          name={pl.name}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={e => { e.stopPropagation(); onSelect(pl); }}
            className="bg-black/60 rounded-full p-1.5 hover:bg-black/80"
          >
            <Eye className="h-3 w-3 text-white" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(pl.id); }}
            className="bg-black/60 rounded-full p-1.5 hover:bg-red-600/80"
          >
            <Trash2 className="h-3 w-3 text-white" />
          </button>
        </div>
        <div className="absolute bottom-2 left-3 right-3 z-10">
          <p className="font-black text-sm text-white truncate leading-tight">{pl.name}</p>
          {items.length > 0 && (
            <p className="text-[11px] text-white/60">{done}/{items.length} done · {progress}%</p>
          )}
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs text-muted-foreground">{pl.date}</p>
      </div>
    </motion.div>
  );
}
