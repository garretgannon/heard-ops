import { motion } from "framer-motion";
import { ClipboardList, Eye, Trash2 } from "lucide-react";

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
        className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center cursor-pointer group-hover:from-primary/30 group-hover:to-accent/30 transition-all"
        onClick={() => onSelect(pl)}
      >
        <div className="text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground font-medium">{items.length} items</p>
        </div>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>
      <div className="p-4 space-y-2">
        <p className="font-semibold text-sm truncate">{pl.name}</p>
        <p className="text-xs text-muted-foreground">{pl.date}</p>
        {items.length > 0 && (
          <span className="text-xs font-medium text-accent">{progress}%</span>
        )}
      </div>
    </motion.div>
  );
}