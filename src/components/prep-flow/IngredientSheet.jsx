import { motion, AnimatePresence } from "framer-motion";
import { X, Package } from "lucide-react";

export default function IngredientSheet({ ingredients = [], open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-[#0E151E] rounded-t-3xl max-h-[75vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="h-1 w-10 rounded-full bg-white/10" />
            </div>

            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
              <p className="font-bold text-[17px]">Ingredients</p>
              <button onClick={onClose} className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center">
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 pb-10 space-y-2">
              {ingredients.length === 0 && (
                <p className="text-white/30 text-sm py-6 text-center">No ingredients listed</p>
              )}
              {ingredients.map((ing, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0"
                >
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{ing.name || ing.item_name}</p>
                    {(ing.quantity || ing.unit) && (
                      <p className="text-xs text-white/40 font-mono mt-0.5">{ing.quantity}{ing.unit ? ` ${ing.unit}` : ""}</p>
                    )}
                  </div>
                  {ing.note && <p className="text-xs text-white/30 text-right max-w-[100px]">{ing.note}</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}