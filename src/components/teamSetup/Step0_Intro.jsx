import { motion } from 'framer-motion';

const VALUE_PROPS = [
  {
    icon: '🍽️',
    title: 'Built for restaurants',
    desc: 'Structured around the way your team actually works — FOH, BOH, bar, and leadership.',
  },
  {
    icon: '⚡',
    title: 'Operational first',
    desc: 'Every setting maps to a real shift — tasks, checklists, stations, and handoffs.',
  },
  {
    icon: '🔄',
    title: 'Works every shift',
    desc: 'Setup takes minutes, and your team gets a system that runs itself.',
  },
];

export default function Step0_Intro({ onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-8 py-6 max-w-2xl"
    >
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
          Let's build your <span style={{ color: '#FF6B00' }}>operating system.</span>
        </h1>
        <p className="text-base text-white/50 leading-relaxed max-w-xl">
          We'll set up departments, job codes, roles, station links, and permissions — so your
          team always knows what to do, where to be, and who approves what.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {VALUE_PROPS.map((vp) => (
          <div
            key={vp.title}
            className="flex flex-col gap-2 p-4 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span className="text-2xl">{vp.icon}</span>
            <p className="text-sm font-semibold text-white">{vp.title}</p>
            <p className="text-xs text-white/40 leading-relaxed">{vp.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={onNext}
          className="px-8 py-3 text-sm font-bold rounded-xl transition-opacity hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)',
            color: 'white',
            borderRadius: 10,
          }}
        >
          Start Setup →
        </button>
        <p className="text-xs text-white/30">Takes about 5 minutes. You can edit everything later.</p>
      </div>
    </motion.div>
  );
}
