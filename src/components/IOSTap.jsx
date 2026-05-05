/**
 * IOSTap — wraps any child with iOS-style press animation + optional haptic.
 * Usage: <IOSTap onTap={fn}><SomeCard /></IOSTap>
 */
import { motion } from "framer-motion";
import { haptics } from "@/utils/haptics";

export default function IOSTap({ children, onTap, haptic = "light", className = "", disabled = false, style }) {
  const handleTap = () => {
    if (disabled) return;
    if (haptic === "light") haptics.success();
    else if (haptic === "medium") haptics.medium();
    else if (haptic === "warning") haptics.warning();
    if (onTap) onTap();
  };

  return (
    <motion.div
      className={className}
      style={{ cursor: disabled ? "default" : "pointer", ...style }}
      whileTap={disabled ? {} : { scale: 0.97, opacity: 0.85 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      onClick={handleTap}
    >
      {children}
    </motion.div>
  );
}