import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Camera, ClipboardCheck, ChevronRight } from "lucide-react";
import StorageModule from "./StorageModule";
import useHaptic from "@/hooks/useHaptic";

export default function PrepCompletionScreen({ item, template, completionData, onDone, onReview }) {
  const haptic = useHaptic();

  useEffect(() => {
    haptic.success();
  }, []);

  const elapsed = completionData?.startedAt
    ? Math.round((Date.now() - completionData.startedAt) / 60000)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-[#070C10] flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Success burst */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
        className="mb-8 relative"
      >
        {/* Rings */}
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: 1 + i * 0.4, opacity: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
            className="absolute inset-0 rounded-full border border-green-500/30"
          />
        ))}
        <div className="h-20 w-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 mb-8"
      >
        <p className="text-4xl font-extrabold tracking-tight">Complete</p>
        <p className="text-white/50 text-lg">{item?.name}</p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-6 mb-8"
      >
        {elapsed !== null && (
          <div className="text-center">
            <p className="text-2xl font-extrabold text-primary">{elapsed}m</p>
            <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wide">Time</p>
          </div>
        )}
        {completionData?.photos?.length > 0 && (
          <div className="text-center">
            <p className="text-2xl font-extrabold text-primary">{completionData.photos.length}</p>
            <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wide">Photos</p>
          </div>
        )}
        {completionData?.qualityResults && (
          <div className="text-center">
            <p className="text-2xl font-extrabold text-green-400">
              {Object.values(completionData.qualityResults).filter(r => r === "pass").length}
            </p>
            <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wide">Checks</p>
          </div>
        )}
      </motion.div>

      {/* Storage reminder */}
      {(template?.storage_location || template?.shelf_life) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full mb-8"
        >
          <StorageModule
            storageLocation={template.storage_location}
            shelfLife={template.shelf_life}
            temperature={template.storage_temp}
          />
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full space-y-3"
      >
        {onReview && (
          <button
            onClick={onReview}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-white/5 text-white/70 font-bold text-sm"
          >
            <ClipboardCheck className="h-4 w-4" />
            Submit for Review
          </button>
        )}
        <button
          onClick={onDone}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-white font-extrabold text-base"
        >
          Back to Queue
          <ChevronRight className="h-5 w-5" />
        </button>
      </motion.div>
    </motion.div>
  );
}