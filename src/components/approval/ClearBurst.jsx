import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function ClearBurst() {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-green-400/25"
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-green-400/40"
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut', delay: 0.08 }}
          />
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            className="flex h-full w-full items-center justify-center rounded-full border border-green-400/40"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.06) 100%)',
              boxShadow: '0 0 60px rgba(34,197,94,0.35)',
            }}
          >
            <CheckCircle2
              className="h-14 w-14 text-green-400"
              style={{ filter: 'drop-shadow(0 0 14px rgba(34,197,94,0.9))' }}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="text-center"
        >
          <p
            className="text-4xl font-black tracking-tight text-white"
            style={{ textShadow: '0 0 30px rgba(34,197,94,0.4)' }}
          >
            Inbox Zero
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38 }}
            className="mt-1.5 text-sm font-bold text-green-400"
          >
            Queue cleared — nice work.
          </motion.p>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}
