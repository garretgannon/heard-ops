import { motion } from 'framer-motion';

function SummaryCard({ title, count, detail, editLabel, onEdit }) {
  return (
    <div
      className="flex items-start justify-between p-4 rounded-xl gap-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
    >
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{title}</p>
          {count !== undefined && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}
            >
              {count}
            </span>
          )}
        </div>
        {detail && <p className="text-xs text-white/40 leading-relaxed">{detail}</p>}
      </div>
      <button
        onClick={onEdit}
        className="text-xs font-semibold shrink-0 transition-colors hover:opacity-80"
        style={{ color: '#FF6B00' }}
      >
        Edit
      </button>
    </div>
  );
}

export default function Step8_Review({ wizardData, onFinish, onGoToStep, finishing }) {
  const { departments, jobCodes, roles, stationLinks, responsibilities, access } = wizardData;

  const linkedCount = Object.values(stationLinks).filter((arr) => arr.length > 0).length;
  const configuredResps = Object.keys(responsibilities).filter(
    (k) => Object.values(responsibilities[k] || {}).some(Boolean)
  ).length;

  const visibleModules = Object.entries(access).filter(([, v]) => v === 'visible').length;
  const totalModules = Object.keys(access).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5 py-6 max-w-2xl"
    >
      <div>
        <h2 className="text-2xl font-extrabold text-white mb-1">Review Your Setup</h2>
        <p className="text-sm text-white/40">Everything looks good? Hit Finish to save your team structure.</p>
      </div>

      <div className="flex flex-col gap-3">
        <SummaryCard
          title="Departments"
          count={departments.length}
          detail={departments.map((d) => d.name).join(', ') || 'None selected'}
          onEdit={() => onGoToStep(1)}
        />
        <SummaryCard
          title="Job Codes"
          count={jobCodes.length}
          detail={jobCodes.map((j) => j.name).join(', ') || 'None added'}
          onEdit={() => onGoToStep(2)}
        />
        <SummaryCard
          title="Roles"
          count={roles.length}
          detail={roles.map((r) => r.name).join(', ') || 'None selected'}
          onEdit={() => onGoToStep(3)}
        />
        <SummaryCard
          title="Station Links"
          count={linkedCount}
          detail={linkedCount > 0 ? `${linkedCount} job code${linkedCount !== 1 ? 's' : ''} linked to stations` : 'No links configured'}
          onEdit={() => onGoToStep(4)}
        />
        <SummaryCard
          title="Responsibilities"
          count={configuredResps}
          detail={configuredResps > 0 ? `${configuredResps} job code${configuredResps !== 1 ? 's' : ''} configured` : 'Not configured'}
          onEdit={() => onGoToStep(5)}
        />
        <SummaryCard
          title="Access Control"
          count={totalModules > 0 ? `${visibleModules}/${totalModules}` : undefined}
          detail={totalModules > 0 ? `${visibleModules} module${visibleModules !== 1 ? 's' : ''} visible to all staff` : 'Not configured'}
          onEdit={() => onGoToStep(6)}
        />
      </div>

      {/* Finish button */}
      <div className="hidden lg:flex items-center gap-4 mt-2">
        <button
          onClick={onFinish}
          disabled={finishing}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)', borderRadius: 10 }}
        >
          {finishing && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {finishing ? 'Saving…' : 'Finish Setup ✓'}
        </button>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 z-20" style={{ background: 'rgba(5,8,14,0.97)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={onFinish}
          disabled={finishing}
          className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #CC4400 100%)' }}
        >
          {finishing && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {finishing ? 'Saving…' : 'Finish Setup ✓'}
        </button>
      </div>
    </motion.div>
  );
}
