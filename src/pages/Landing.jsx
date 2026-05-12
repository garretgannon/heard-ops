import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { redirectToLogin } from '@/lib/auth-urls';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Thermometer,
  Users,
  Wrench,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.09 } } };

const operations = [
  { title: 'Missed tasks', desc: 'Prep, side work, and cleaning fall through when service gets busy.', icon: ClipboardCheck },
  { title: 'Scattered logs', desc: 'Temps, incidents, waste, and maintenance live in too many places.', icon: FileText },
  { title: 'Weak handoffs', desc: 'Incoming managers need the real state of the shift, not a memory dump.', icon: Users },
];

const modules = [
  { title: 'Shift work', desc: 'Role-based tasks and station readiness.', icon: ClipboardCheck },
  { title: 'Logs', desc: 'Temps, incidents, maintenance, waste, and 86s.', icon: Thermometer },
  { title: 'Approvals', desc: 'Manager review for exceptions and submitted work.', icon: CheckCircle2 },
  { title: 'Planning', desc: 'Schedule, events, prep, and handoff context.', icon: CalendarDays },
];

function useScrollInView(threshold = 0.15) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return [ref, inView];
}

function ProductPreview() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#243041] bg-[#070D12] shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between border-b border-[#243041]/80 px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94A3B8]">Dashboard</p>
          <p className="mt-1 text-sm font-black text-white">Morning readiness</p>
        </div>
        <div className="rounded-full border border-[#E66A1F]/40 bg-[#E66A1F]/10 px-3 py-1 text-xs font-black text-[#E66A1F]">82%</div>
      </div>

      <div className="grid gap-px bg-[#243041]/70 md:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-[#0A1116] p-4">
          <div className="rounded-xl border border-[#243041]/80 bg-black/20 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#E66A1F]">Next Action</p>
                <p className="mt-1 text-lg font-black text-white">Check Pantry station</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#E66A1F]" />
            </div>
            <p className="text-sm leading-5 text-slate-400">Ranch is in progress and pico has not started. Both are due before lunch setup.</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Overdue', value: '4', tone: 'text-[#E66A1F]' },
              { label: 'Approvals', value: '7', tone: 'text-white' },
              { label: 'Issues', value: '2', tone: 'text-white' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[#243041]/70 bg-black/25 p-3 text-center">
                <p className={`text-lg font-black ${item.tone}`}>{item.value}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0A1116] p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
          <div className="space-y-2">
            {[
              { label: 'Finish Pantry prep', detail: 'Ranch and pico due before 11:00 AM', icon: ClipboardCheck, tone: 'border-[#E66A1F]/50 text-[#E66A1F]' },
              { label: 'Check Lowboy 1 temp', detail: 'Last log is close to service window', icon: Thermometer, tone: 'border-amber-500/50 text-amber-400' },
              { label: 'Resolve maintenance issue', detail: '2 open operational issues', icon: Wrench, tone: 'border-red-500/50 text-red-400' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border border-[#243041]/70 bg-black/20 px-3 py-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${item.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-white">{item.label}</span>
                    <span className="block truncate text-xs text-slate-500">{item.detail}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ item }) {
  const Icon = item.icon;
  return (
    <motion.div variants={fadeUp} className="rounded-lg border border-[#243041] bg-[#0D141D] p-5 transition-colors hover:border-[#E66A1F]/35">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#243041] bg-black/20 text-[#E66A1F]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mb-1 text-sm font-bold text-white">{item.title}</p>
      <p className="text-xs leading-5 text-slate-400">{item.desc}</p>
    </motion.div>
  );
}

export default function Landing() {
  const [heroRef, heroIn] = useScrollInView(0.05);
  const [painRef, painIn] = useScrollInView();
  const [solutionRef, solutionIn] = useScrollInView();
  const [whoRef, whoIn] = useScrollInView();
  const [ctaRef, ctaIn] = useScrollInView();

  const login = () => redirectToLogin(window.location.href);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050A0F] text-white">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#243041]/60 bg-[#050A0F]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/69f0c74de6e9ba52961af58a/4d2dcd0d8_HeardOS_pulse_mark.svg" alt="HeardOS" className="h-7 w-7" />
            <span className="text-[17px] font-extrabold tracking-tight">Heard<span className="text-[#E66A1F]">OS</span></span>
          </div>
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-400 md:flex">
            <a href="#pain" className="transition-colors hover:text-white">Problem</a>
            <a href="#solution" className="transition-colors hover:text-white">Product</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={login} className="px-3 py-1.5 text-sm font-bold text-slate-300 transition-colors hover:text-white">Sign In</button>
            <button onClick={login} className="rounded-lg bg-[#E66A1F] px-4 py-1.5 text-sm font-bold text-white transition-all active:scale-95">
              Start Free
            </button>
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-12 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(230,106,31,0.16),transparent_34rem)]" />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8 flex items-center gap-2 rounded-full border border-[#E66A1F]/30 bg-[#E66A1F]/10 px-3 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[#E66A1F]" />
          <span className="text-xs font-bold tracking-wide text-[#E66A1F]">RESTAURANT OPERATIONS</span>
        </motion.div>

        <motion.h1 ref={heroRef} initial={{ opacity: 0, y: 30 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-6 max-w-3xl text-center text-5xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
          Run every restaurant shift with clarity.
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 }} className="mb-8 max-w-2xl text-center text-lg leading-relaxed text-slate-400">
          HeardOS turns handoffs, tasks, logs, prep, temps, and approvals into one shift command center.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 }} className="mb-12 flex flex-col gap-3 sm:flex-row">
          <button onClick={login} className="flex items-center justify-center gap-2 rounded-lg bg-[#E66A1F] px-7 py-3.5 text-base font-bold text-white transition-all active:scale-95">
            Start Free
          </button>
          <button onClick={login} className="flex items-center justify-center gap-2 rounded-lg border border-[#243041] bg-[#0D141D]/80 px-7 py-3.5 text-base font-bold text-slate-300 transition-all hover:border-slate-500 hover:text-white active:scale-95">
            View Demo
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.4 }} className="relative w-full max-w-4xl">
          <ProductPreview />
        </motion.div>
      </section>

      <section id="pain" ref={painRef} className="border-t border-[#243041] px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.h2 variants={fadeUp} initial="hidden" animate={painIn ? 'show' : 'hidden'} className="mb-12 text-center text-3xl font-extrabold md:text-4xl">
            Restaurant operations get messy fast.
          </motion.h2>
          <motion.div variants={stagger} initial="hidden" animate={painIn ? 'show' : 'hidden'} className="grid gap-6 md:grid-cols-3">
            {operations.map((item) => <ModuleCard key={item.title} item={item} />)}
          </motion.div>
        </div>
      </section>

      <section id="solution" ref={solutionRef} className="border-t border-[#243041] px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.h2 variants={fadeUp} initial="hidden" animate={solutionIn ? 'show' : 'hidden'} className="mb-12 text-center text-3xl font-extrabold md:text-4xl">
            One operating system for the shift.
          </motion.h2>
          <motion.div variants={stagger} initial="hidden" animate={solutionIn ? 'show' : 'hidden'} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {modules.map((item) => <ModuleCard key={item.title} item={item} />)}
          </motion.div>
        </div>
      </section>

      <section className="border-t border-[#243041] px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.h2 variants={fadeUp} initial="hidden" animate={solutionIn ? 'show' : 'hidden'} className="mb-12 text-center text-3xl font-extrabold md:text-4xl">
            Built around real shift decisions.
          </motion.h2>
          <motion.div variants={fadeUp} initial="hidden" animate={solutionIn ? 'show' : 'hidden'} className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[#243041] bg-[#0D141D] p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Manager view</p>
              <ProductPreview />
            </div>
            <div className="rounded-xl border border-[#243041] bg-[#0D141D] p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Staff flow</p>
              <div className="space-y-3">
                {[
                  { label: 'Station brief', detail: 'Lineup, 86s, events, and station assignment' },
                  { label: 'Task execution', detail: 'Prep, cleaning, checks, and required proof' },
                  { label: 'Shift handoff', detail: 'Clean context for the next manager' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#243041]/70 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section ref={whoRef} className="border-t border-[#243041] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.h2 variants={fadeUp} initial="hidden" animate={whoIn ? 'show' : 'hidden'} className="mb-12 text-center text-3xl font-extrabold md:text-4xl">
            Built for every operation.
          </motion.h2>
          <motion.div variants={stagger} initial="hidden" animate={whoIn ? 'show' : 'hidden'} className="flex flex-wrap justify-center gap-3">
            {['Restaurants', 'Bars', 'Cafes', 'Hotels', 'Catering', 'Multi-Unit Operators'].map((item) => (
              <motion.div key={item} variants={fadeUp} className="rounded-lg border border-[#243041] bg-[#0D141D] px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-[#E66A1F]/40">
                {item}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section ref={ctaRef} className="relative overflow-hidden border-t border-[#243041] px-4 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,106,31,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={ctaIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <h2 className="mb-8 text-4xl font-extrabold leading-tight md:text-5xl">Make every shift easier to run.</h2>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={login} className="flex items-center justify-center gap-2 rounded-lg bg-[#E66A1F] px-7 py-3.5 text-base font-bold text-white transition-all active:scale-95">
                Start Free
              </button>
              <button onClick={login} className="flex items-center justify-center gap-2 rounded-lg border border-[#243041] bg-[#0D141D]/80 px-7 py-3.5 text-base font-bold text-slate-300 transition-all hover:border-slate-500 hover:text-white active:scale-95">
                View Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-[#243041] px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/69f0c74de6e9ba52961af58a/4d2dcd0d8_HeardOS_pulse_mark.svg" alt="HeardOS" className="h-6 w-6" />
            <span className="text-sm font-extrabold">Heard<span className="text-[#E66A1F]">OS</span></span>
            <span className="ml-2 text-xs text-slate-600">Restaurant shift operations</span>
          </div>
          <p className="text-xs text-slate-600">(c) 2026 HeardOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export const hideBase44Index = true;
