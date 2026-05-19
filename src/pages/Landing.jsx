import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { redirectToLogin } from '@/lib/auth-urls';
import { BRAND_ASSETS } from '@/lib/brandAssets';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Flame,
  ListChecks,
  MessageSquareText,
  Shield,
  Thermometer,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

function useScrollInView(threshold = 0.12) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return [ref, inView];
}

const PAIN_POINTS = [
  { icon: ListChecks,       title: 'Tasks fall through',      desc: 'Prep, sidework, and cleaning get skipped when service gets busy. No one knows what was done.' },
  { icon: FileText,         title: 'Logs are everywhere',     desc: 'Temps, incidents, waste, and maintenance live in clipboards, texts, and memory.' },
  { icon: MessageSquareText, title: 'Handoffs are broken',    desc: 'The next manager walks in blind. No context, no follow-ups, no paper trail.' },
  { icon: Flame,            title: '86s hit without warning', desc: 'Staff hear about 86\'d items mid-service. No single place to communicate what\'s out.' },
];

const FEATURES = [
  { icon: ClipboardCheck,  color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/25', title: 'Shift Tasks',      desc: 'Role-based prep, sidework, and cleaning. Each person knows exactly what\'s theirs.' },
  { icon: Thermometer,     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/25',     title: 'Temp & Food Safety', desc: 'Structured temperature logs, cooling checks, and sanitizer records with timestamps.' },
  { icon: Shield,          color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/25',   title: 'Manager Approvals', desc: 'Review and approve task completions, exceptions, and maintenance requests.' },
  { icon: MessageSquareText, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25', title: 'Shift Handoff',   desc: 'Structured handoff notes, open issues, and follow-ups passed manager to manager.' },
  { icon: CalendarDays,    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/25',   title: 'Prep Planning',    desc: 'Par-based prep lists, inventory counts, and BEO context built for each shift.' },
  { icon: Users,           color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/25',     title: 'Team & Schedule',  desc: 'Staff schedule, role assignments, and station ownership — all in one place.' },
];

const STATS = [
  { value: '100%', label: 'Shift visibility' },
  { value: '0',    label: 'Paper checklists' },
  { value: '1',    label: 'Place for everything' },
];

const WHO = ['Restaurants', 'Bars', 'Hotels', 'Cafes', 'Catering', 'Multi-Unit Ops'];

function FeatureCard({ item }) {
  const Icon = item.icon;
  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]"
    >
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${item.bg} ${item.color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1.5 text-sm font-black text-white">{item.title}</h3>
      <p className="text-xs leading-relaxed text-slate-400">{item.desc}</p>
    </motion.div>
  );
}

function PainCard({ item }) {
  const Icon = item.icon;
  return (
    <motion.div variants={fadeUp} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="mb-1 text-sm font-black text-white">{item.title}</h3>
        <p className="text-xs leading-relaxed text-slate-400">{item.desc}</p>
      </div>
    </motion.div>
  );
}

function MockDashboard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#060C11] shadow-[0_32px_100px_rgba(0,0,0,0.6)]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#070D14] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-[#E66A1F] shadow-[0_0_8px_rgba(230,106,31,0.7)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#E66A1F]">Shift Active</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#E66A1F]/30 bg-[#E66A1F]/10 px-3 py-1">
          <Zap className="h-3 w-3 text-[#E66A1F]" />
          <span className="text-[11px] font-black text-[#E66A1F]">82% Ready</span>
        </div>
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-4 divide-x divide-white/[0.05] border-b border-white/[0.07]">
        {[
          { label: 'Overdue', val: '4', color: 'text-[#E66A1F]' },
          { label: 'Approvals', val: '7', color: 'text-white' },
          { label: 'Issues', val: '2', color: 'text-red-400' },
          { label: 'Staff On', val: '14', color: 'text-white' },
        ].map(m => (
          <div key={m.label} className="py-3 text-center">
            <p className={`text-lg font-black ${m.color}`}>{m.val}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid gap-px bg-white/[0.04] md:grid-cols-2">
        <div className="space-y-2 bg-[#060C11] p-4">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Next Action</p>
          <div className="rounded-xl border border-[#E66A1F]/25 bg-[#E66A1F]/6 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-black text-white">Check Pantry station</p>
              <ArrowRight className="h-3.5 w-3.5 text-[#E66A1F]" />
            </div>
            <p className="text-xs text-slate-400">Ranch in progress, pico not started. Both due before 11:00 AM.</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-black text-white">Review handoff from AM</p>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400">3 follow-up items from previous manager shift.</p>
          </div>
        </div>
        <div className="bg-[#060C11] p-4">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
          <div className="space-y-2">
            {[
              { label: 'Lowboy 1 temp — 41°F', detail: 'Warning range — log required', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', Icon: Thermometer },
              { label: '86\'d: Salmon + Risotto', detail: 'Updated 2 minutes ago', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25', Icon: Flame },
              { label: 'Maintenance: Walk-in fan', detail: 'Open issue — unresolved', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25', Icon: Wrench },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${item.bg} ${item.color}`}>
                  <item.Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-white">{item.label}</p>
                  <p className="truncate text-[10px] text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [heroRef, heroIn]       = useScrollInView(0.05);
  const [painRef, painIn]       = useScrollInView();
  const [featRef, featIn]       = useScrollInView();
  const [whoRef, whoIn]         = useScrollInView();
  const [ctaRef, ctaIn]         = useScrollInView();

  const login = () => redirectToLogin(window.location.href);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#04080D] text-white">

      {/* ── Nav ── */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#04080D]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <img src={BRAND_ASSETS.headerLogo} alt="HeardOS" className="h-10 w-auto object-contain" />
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-400 md:flex">
            <a href="#pain" className="transition-colors hover:text-white">Problem</a>
            <a href="#features" className="transition-colors hover:text-white">Product</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={login} className="px-3 py-1.5 text-sm font-bold text-slate-400 transition-colors hover:text-white">
              Sign In
            </button>
            <button onClick={login} className="rounded-lg bg-[#E66A1F] px-4 py-1.5 text-sm font-bold text-white transition-all hover:bg-[#d45f18] active:scale-95">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-24">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-5%,rgba(230,106,31,0.18),transparent)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#04080D] to-transparent" />

        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-5 flex items-center gap-2 rounded-full border border-[#E66A1F]/30 bg-[#E66A1F]/10 px-3.5 py-1.5"
        >
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E66A1F]" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E66A1F]">Restaurant Operations</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={heroIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 max-w-3xl text-center text-5xl font-black leading-[1.08] tracking-tight md:text-[64px]"
        >
          Run every shift<br />
          <span style={{ background: 'linear-gradient(135deg, #E66A1F 0%, #FF9A16 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            like a machine.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={heroIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8 max-w-xl text-center text-lg leading-relaxed text-slate-400"
        >
          heardOS replaces clipboards, group chats, and spreadsheets with one operating system built for restaurant shifts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={heroIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-14 flex flex-col gap-3 sm:flex-row"
        >
          <button
            onClick={login}
            className="flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-black text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #E66A1F 0%, #d45f18 100%)', boxShadow: '0 0 0 1px rgba(230,106,31,0.4), 0 0 24px rgba(230,106,31,0.25)' }}
          >
            Start Free <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={login}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-8 py-3.5 text-base font-black text-slate-300 transition-all hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white active:scale-95"
          >
            View Demo
          </button>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={heroIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-10 flex flex-wrap justify-center gap-6 md:gap-10"
        >
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Dashboard mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={heroIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl"
        >
          <MockDashboard />
        </motion.div>
      </section>

      {/* ── Pain ── */}
      <section id="pain" ref={painRef} className="border-t border-white/[0.06] px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" animate={painIn ? 'show' : 'hidden'} className="mb-4 text-center">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E66A1F]">The Problem</span>
          </motion.div>
          <motion.h2 variants={fadeUp} initial="hidden" animate={painIn ? 'show' : 'hidden'} className="mb-3 text-center text-3xl font-black md:text-4xl">
            Restaurant operations break down daily.
          </motion.h2>
          <motion.p variants={fadeUp} initial="hidden" animate={painIn ? 'show' : 'hidden'} className="mb-12 text-center text-slate-400">
            The same problems repeat every shift — because there's no system to stop them.
          </motion.p>
          <motion.div variants={stagger} initial="hidden" animate={painIn ? 'show' : 'hidden'} className="grid gap-4 sm:grid-cols-2">
            {PAIN_POINTS.map(item => <PainCard key={item.title} item={item} />)}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" ref={featRef} className="border-t border-white/[0.06] px-5 py-24">
        <div
          className="pointer-events-none absolute left-0 right-0 h-96 opacity-30"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(230,106,31,0.12), transparent)' }}
        />
        <div className="relative mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" animate={featIn ? 'show' : 'hidden'} className="mb-4 text-center">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E66A1F]">The Platform</span>
          </motion.div>
          <motion.h2 variants={fadeUp} initial="hidden" animate={featIn ? 'show' : 'hidden'} className="mb-3 text-center text-3xl font-black md:text-4xl">
            One system for the entire shift.
          </motion.h2>
          <motion.p variants={fadeUp} initial="hidden" animate={featIn ? 'show' : 'hidden'} className="mb-12 text-center text-slate-400">
            Everything managers and staff need — connected and in one place.
          </motion.p>
          <motion.div variants={stagger} initial="hidden" animate={featIn ? 'show' : 'hidden'} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(item => <FeatureCard key={item.title} item={item} />)}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-white/[0.06] px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.h2 variants={fadeUp} initial="hidden" animate={featIn ? 'show' : 'hidden'} className="mb-12 text-center text-3xl font-black md:text-4xl">
            Built for every role, every shift.
          </motion.h2>
          <motion.div variants={stagger} initial="hidden" animate={featIn ? 'show' : 'hidden'} className="grid gap-6 md:grid-cols-2">
            {/* Manager flow */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E66A1F]/30 bg-[#E66A1F]/10">
                  <Shield className="h-4 w-4 text-[#E66A1F]" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E66A1F]">Manager Flow</p>
              </div>
              <div className="space-y-3">
                {[
                  { step: '01', text: 'Review incoming handoff & open issues' },
                  { step: '02', text: 'Publish pre-shift briefing to staff' },
                  { step: '03', text: 'Walk stations, log checks, approve tasks' },
                  { step: '04', text: 'Write closing handoff for next manager' },
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                    <span className="text-[10px] font-black tabular-nums text-[#E66A1F]/70">{item.step}</span>
                    <p className="text-sm font-semibold text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            {/* Staff flow */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">Staff Flow</p>
              </div>
              <div className="space-y-3">
                {[
                  { step: '01', text: 'Read shift briefing — 86s, events, notes' },
                  { step: '02', text: 'Work through assigned prep and sidework' },
                  { step: '03', text: 'Log temps, submit required proof photos' },
                  { step: '04', text: 'Complete station sign-off and earn XP' },
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                    <span className="text-[10px] font-black tabular-nums text-blue-400/70">{item.step}</span>
                    <p className="text-sm font-semibold text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Who ── */}
      <section ref={whoRef} className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2 variants={fadeUp} initial="hidden" animate={whoIn ? 'show' : 'hidden'} className="mb-10 text-3xl font-black md:text-4xl">
            Built for every type of operation.
          </motion.h2>
          <motion.div variants={stagger} initial="hidden" animate={whoIn ? 'show' : 'hidden'} className="flex flex-wrap justify-center gap-3">
            {WHO.map(item => (
              <motion.div
                key={item}
                variants={fadeUp}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-bold text-slate-300 transition-all hover:border-[#E66A1F]/35 hover:text-white"
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
          <motion.p variants={fadeUp} initial="hidden" animate={whoIn ? 'show' : 'hidden'} className="mt-8 text-sm text-slate-500">
            From single locations to multi-unit groups — heardOS scales with your operation.
          </motion.p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} className="relative overflow-hidden border-t border-white/[0.06] px-5 py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,106,31,0.14),transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={ctaIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#E66A1F]">Get started today</p>
            <h2 className="mb-5 text-4xl font-black leading-tight md:text-5xl">
              Make every shift<br />easier to run.
            </h2>
            <p className="mb-8 text-lg text-slate-400">No setup fee. No long-term contract. Ready in minutes.</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={login}
                className="flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-black text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #E66A1F 0%, #d45f18 100%)', boxShadow: '0 0 0 1px rgba(230,106,31,0.4), 0 0 32px rgba(230,106,31,0.3)' }}
              >
                Start Free <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={login}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-black text-slate-300 transition-all hover:border-white/[0.18] hover:text-white active:scale-95"
              >
                View Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2.5">
            <img src={BRAND_ASSETS.appIcon} alt="HeardOS" className="h-7 w-7 rounded-lg object-contain" />
            <span className="text-sm font-extrabold">heard<span className="text-[#FF9A16]">OS</span></span>
            <span className="ml-2 text-xs text-slate-600">Restaurant shift operations</span>
          </div>
          <p className="text-xs text-slate-600">&copy; 2026 heardOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export const hideBase44Index = true;