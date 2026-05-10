import { motion } from "framer-motion";
import { MapPin, Clock, Thermometer } from "lucide-react";

export default function StorageModule({ storageLocation, shelfLife, temperature, notes }) {
  const items = [
    storageLocation && { icon: MapPin,     label: "Storage",    value: storageLocation, color: "text-blue-400" },
    shelfLife       && { icon: Clock,       label: "Shelf Life", value: shelfLife,       color: "text-amber-400" },
    temperature     && { icon: Thermometer, label: "Temp",       value: temperature,     color: "text-primary" },
  ].filter(Boolean);

  if (items.length === 0 && !notes) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[#111820] p-5 space-y-4"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-white/30">Storage + Shelf Life</p>

      <div className="grid grid-cols-1 gap-3">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {notes && (
        <p className="text-xs text-white/40 leading-relaxed border-t border-white/5 pt-3">{notes}</p>
      )}
    </motion.div>
  );
}