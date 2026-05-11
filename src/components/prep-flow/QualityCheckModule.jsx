import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const RESULTS = [
  { key: "pass",  label: "Pass",  icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10",  activeBg: "bg-green-500/20 border-green-500/40" },
  { key: "fail",  label: "Fail",  icon: XCircle,      color: "text-red-400",    bg: "bg-red-500/10",    activeBg: "bg-red-500/20 border-red-500/40" },
  { key: "needs_review", label: "Review", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", activeBg: "bg-amber-500/20 border-amber-500/40" },
];

export default function QualityCheckModule({ checks = [], results, onChange }) {
  return (
    <div className="space-y-4">
      {checks.map((check, i) => {
        const current = results?.[i];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="space-y-2"
          >
            <p className="font-semibold text-sm text-white/80">{check}</p>
            <div className="flex gap-2">
              {RESULTS.map(r => {
                const Icon = r.icon;
                const active = current === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => onChange?.(i, r.key)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-transparent text-xs font-bold transition-all",
                      active ? r.activeBg : r.bg,
                      r.color
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}