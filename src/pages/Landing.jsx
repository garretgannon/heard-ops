import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  ArrowRight, CheckCircle2, AlertTriangle, Clock, Zap, Shield,
  Thermometer, ClipboardList, ArrowLeftRight, Bell, ChevronRight,
  Users, MapPin, Activity, Package, BarChart3, Star
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.09 } } };

function useScrollInView(threshold = 0.15) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return [ref, inView];
}

/* ─── LIVE OPERATIONAL TICKER ─── */
const TICKER_ITEMS = [
  { icon: '✅', text: 'Pantry prep approved — Photo verified', color: '#22C55E', time: '0:12s ago' },
  { icon: '🌡️', text: 'Walk-in cooler: 38°F — Within range', color: '#3B82F6', time: '0:34s ago' },
  { icon: '⚠️', text: 'Grill cleaning overdue — Escalating to KL', color: '#F59E0B', time: '1:02 ago' },
  { icon: '🔄', text: 'Shift handoff submitted — Dinner notified', color: '#A855F7', time: '2:15 ago' },
  { icon: '📋', text: 'Server side work 94% complete', color: '#22C55E', time: '3:41 ago' },
  { icon: '🚨', text: 'Ice machine alert — Maintenance dispatched', color: '#EF4444', time: '4:08 ago' },
  { icon: '👍', text: 'GM approved bar opening checklist', color: '#FF7A1A', time: '5:22 ago' },
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TICKER_ITEMS.length), 2800);
    return () => clearInterval(t);
  }, []);
  const item = TICKER_ITEMS[idx];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2.5 text-xs"
      >
        <span className="text-sm">{item.icon}</span>
        <span style={{ color: item.color }} className="font-semibold truncate">{item.text}</span>
        <span className="text-slate-500 shrink-0 ml-auto">{item.time}</span>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── ANIMATED OPERATIONAL NODES ─── */
const FLOW_NODES = [
  { label: 'Task Created', icon: ClipboardList, color: '#3B82F6' },
  { label: 'Station Assigned', icon: MapPin, color: '#A855F7' },
  { label: 'Routed to Staff', icon: Users, color: '#22C55E' },
  { label: 'Verification Required', icon: Shield, color: '#F59E0B' },
  { label: 'Escalated if Missed', icon: AlertTriangle, color: '#EF4444' },
  { label: 'Manager Approved', icon: CheckCircle2, color: '#22C55E' },
  { label: 'Logged Forever', icon: Activity, color: '#FF7A1A' },
];

function OperationalFlow() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % FLOW_NODES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative">
      <div className="flex flex-col gap-0">
        {FLOW_NODES.map((node, i) => {
          const Icon = node.icon;
          const isActive = active === i;
          const isPast = i < active;
          return (
            <div key={i} className="flex items-center gap-0">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1, opacity: isPast || isActive ? 1 : 0.35 }}
                  transition={{ duration: 0.3 }}
                  className="h-9 w-9 rounded-xl flex items-center justify-center border transition-all"
                  style={{
                    background: isActive ? `${node.color}22` : isPast ? '#22C55E11' : 'transparent',
                    borderColor: isActive ? node.color : isPast ? '#22C55E44' : '#243041',
                    boxShadow: isActive ? `0 0 16px ${node.color}55` : 'none',
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: isActive ? node.color : isPast ? '#22C55E' : '#475569' }} />
                </motion.div>
                {i < FLOW_NODES.length - 1 && (
                  <div className="w-px h-6 transition-all duration-500" style={{ background: i < active ? '#22C55E66' : '#24304144' }} />
                )}
              </div>
              <motion.p
                animate={{ opacity: isPast || isActive ? 1 : 0.35, x: isActive ? 4 : 0 }}
                className="ml-3 text-sm font-semibold"
                style={{ color: isActive ? node.color : isPast ? '#22C55E' : '#64748B' }}
              >
                {node.label}
                {isPast && <span className="ml-2 text-xs text-green-400">✓</span>}
                {isActive && <span className="ml-2 text-xs" style={{ color: node.color }}>● live</span>}
              </motion.p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── ROLE CARDS ─── */
const ROLE_CARDS = [
  {
    role: 'Kitchen Command', emoji: '👨‍🍳', color: '#F59E0B',
    items: [
      { label: 'Grill Prep', pct: 88, status: 'on-track' },
      { label: 'Pantry Temp', pct: 100, status: 'done' },
      { label: 'Fry Station Clean', pct: 42, status: 'behind' },
    ],
    alert: { icon: '⚠️', text: 'Expo station unassigned' }
  },
  {
    role: 'Manager View', emoji: '🎯', color: '#FF7A1A',
    items: [
      { label: 'Approvals Pending', count: 5, color: '#F59E0B' },
      { label: 'Open Issues', count: 2, color: '#EF4444' },
      { label: 'Handoffs Today', count: 3, color: '#22C55E' },
    ],
    alert: { icon: '🔔', text: 'Vendor delivery requires GM sign-off' }
  },
  {
    role: 'FOH Mode', emoji: '🍽️', color: '#A855F7',
    items: [
      { label: 'Side Work', pct: 74, status: 'on-track' },
      { label: 'Opening Checklist', pct: 100, status: 'done' },
      { label: 'Guest Incident', pct: 0, status: 'pending' },
    ],
    alert: { icon: '✅', text: 'Section A ready for service' }
  },
];

function RoleCard({ card, delay }) {
  const [ref, inView] = useScrollInView();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="relative bg-[#0D141D] border border-[#243041] rounded-2xl p-4 overflow-hidden"
      style={{ boxShadow: `0 0 40px ${card.color}15` }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{card.emoji}</span>
        <p className="text-sm font-bold text-white">{card.role}</p>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-bold">LIVE</span>
        </div>
      </div>
      <div className="space-y-2.5 mb-3">
        {card.items.map((item, i) => (
          <div key={i}>
            {item.pct !== undefined ? (
              <>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <span className={`font-bold ${item.status === 'done' ? 'text-green-400' : item.status === 'behind' ? 'text-red-400' : 'text-white'}`}>
                    {item.pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${item.pct}%` } : {}}
                    transition={{ duration: 0.8, delay: delay + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ background: item.status === 'done' ? '#22C55E' : item.status === 'behind' ? '#EF4444' : card.color }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                <span className="text-sm font-extrabold" style={{ color: item.color }}>{item.count}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2">
        <span className="text-sm">{card.alert.icon}</span>
        <p className="text-xs text-slate-300 font-medium">{card.alert.text}</p>
      </div>
    </motion.div>
  );
}

/* ─── ECOSYSTEM NODES ─── */
const ECOSYSTEM = [
  { emoji: '👥', label: 'People' },
  { emoji: '🗺️', label: 'Stations' },
  { emoji: '⚙️', label: 'Equipment' },
  { emoji: '📋', label: 'Tasks' },
  { emoji: '✅', label: 'Approvals' },
  { emoji: '📊', label: 'Logs' },
  { emoji: '🔧', label: 'Maintenance' },
  { emoji: '🚚', label: 'Vendors' },
  { emoji: '🎯', label: 'Leadership' },
  { emoji: '💬', label: 'Comms' },
  { emoji: '🚀', label: 'Operations' },
];

/* ─── MAIN COMPONENT ─── */
export default function Landing() {
  const [heroRef, heroIn] = useScrollInView(0.05);
  const [probRef, probIn] = useScrollInView();
  const [howRef, howIn] = useScrollInView();
  const [ecoRef, ecoIn] = useScrollInView();
  const [ctaRef, ctaIn] = useScrollInView();

  const PAIN_POINTS = [
    'Run full service', 'Oversee prep quality', 'Manage labor in real-time',
    'Verify cleaning happened', 'Track food safety logs', 'Solve guest incidents',
    'Coach underperforming staff', 'Handle equipment failures', 'Communicate between shifts',
    'Complete daily reports', 'Manage vendors', 'Handle POS issues',
  ];

  return (
    <div className="min-h-screen bg-[#050A0F] text-white overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#243041]/60" style={{ background: 'rgba(5,10,15,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/69f0c74de6e9ba52961af58a/4d2dcd0d8_HeardOS_pulse_mark.svg" alt="HeardOS" className="h-7 w-7" />
            <span className="font-extrabold text-[17px] tracking-tight">Heard<span className="text-[#FF7A1A]">OS</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
            <a href="#problem" className="hover:text-white transition-colors">The Problem</a>
            <a href="#how" className="hover:text-white transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-white transition-colors">Roles</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => base44.auth.redirectToLogin()} className="text-sm font-bold text-slate-300 hover:text-white px-3 py-1.5 transition-colors">Sign In</button>
            <button onClick={() => base44.auth.redirectToLogin()} className="text-sm font-bold bg-[#FF7A1A] text-white px-4 py-1.5 rounded-xl hover:brightness-110 transition-all active:scale-95" style={{ boxShadow: '0 0 16px rgba(255,122,26,0.35)' }}>
              Book Demo
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
        {/* BG glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse, #FF7A1A44 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(ellipse, #3B82F655 0%, transparent 70%)' }} />
        </div>

        {/* Live system badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 mb-8"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A] animate-pulse" />
          <span className="text-xs font-bold text-[#FF7A1A] tracking-wide">OPERATIONAL INTELLIGENCE PLATFORM</span>
        </motion.div>

        <motion.h1 ref={heroRef}
          initial={{ opacity: 0, y: 30 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-center leading-[1.06] tracking-tight max-w-4xl mb-6"
        >
          Restaurants don't fail from<br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #FF7A1A, #FF4D4D)' }}>
            lack of effort.
          </span>
          <br />
          They fail from
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #94A3B8, #64748B)' }}> operational chaos.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl text-center leading-relaxed mb-10"
        >
          HeardOS connects people, stations, equipment, communication, tasks, approvals, and accountability into one operational nervous system.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3 mb-16"
        >
          <button onClick={() => base44.auth.redirectToLogin()}
            className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-extrabold text-base text-white transition-all active:scale-95 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #FF7A1A, #C94D0A)', boxShadow: '0 0 30px rgba(255,122,26,0.45)' }}
          >
            Book Operational Demo <ArrowRight className="h-5 w-5" />
          </button>
          <button onClick={() => base44.auth.redirectToLogin()}
            className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-extrabold text-base text-slate-300 border border-[#243041] hover:border-slate-500 hover:text-white transition-all active:scale-95"
            style={{ background: 'rgba(13,20,29,0.8)' }}
          >
            See It In Action
          </button>
        </motion.div>

        {/* LIVE OPERATIONAL PANEL */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.5 }}
          className="w-full max-w-3xl"
        >
          <div className="relative rounded-2xl border border-[#243041] overflow-hidden" style={{ background: 'rgba(13,20,29,0.95)', boxShadow: '0 0 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(36,48,65,0.5)' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#243041]">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A] animate-pulse" />
                <span className="text-xs font-bold text-slate-400">HeardOS — Operational Command Center</span>
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-4 gap-px bg-[#243041]">
              {[
                { label: 'Tasks Active', val: '47', color: '#FF7A1A' },
                { label: 'Pending Approvals', val: '5', color: '#F59E0B' },
                { label: 'Alerts', val: '2', color: '#EF4444' },
                { label: 'Shift Progress', val: '78%', color: '#22C55E' },
              ].map(m => (
                <div key={m.label} className="bg-[#0D141D] px-3 py-3 text-center">
                  <p className="text-lg font-extrabold" style={{ color: m.color }}>{m.val}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Live activity feed */}
            <div className="px-4 py-3 border-b border-[#243041]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-3 w-3 text-[#FF7A1A]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Operations Feed</span>
              </div>
              <LiveTicker />
            </div>

            {/* Station grid */}
            <div className="grid grid-cols-3 gap-px bg-[#243041]">
              {[
                { station: 'Grill', pct: 88, status: 'on-track', icon: '🔥' },
                { station: 'Pantry', pct: 100, status: 'done', icon: '🥗' },
                { station: 'Fry', pct: 54, status: 'behind', icon: '🍟' },
                { station: 'Bar', pct: 92, status: 'on-track', icon: '🍸' },
                { station: 'Expo', pct: 100, status: 'done', icon: '🎯' },
                { station: 'Dining', pct: 71, status: 'on-track', icon: '🍽️' },
              ].map(s => (
                <div key={s.station} className="bg-[#0D141D] px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-sm">{s.icon}</span>
                    <span className="text-xs font-bold text-slate-300">{s.station}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${s.pct}%`,
                      background: s.status === 'done' ? '#22C55E' : s.status === 'behind' ? '#EF4444' : '#FF7A1A'
                    }} />
                  </div>
                  <p className="text-[9px] mt-1 font-bold" style={{ color: s.status === 'done' ? '#22C55E' : s.status === 'behind' ? '#EF4444' : '#94A3B8' }}>
                    {s.pct}% {s.status === 'done' ? '✓' : s.status === 'behind' ? '↓ behind' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* PROBLEM */}
      <section id="problem" ref={probRef} className="py-24 px-4 border-t border-[#243041]">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={stagger} initial="hidden" animate={probIn ? "show" : "hidden"} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 mb-6">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-bold text-red-400 tracking-wide">THE REALITY</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              Restaurants are drowning<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #EF4444, #F59E0B)' }}>in operational complexity.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Managers are expected to do the impossible every single day.
            </motion.p>
          </motion.div>

          {/* Pain grid */}
          <motion.div variants={stagger} initial="hidden" animate={probIn ? "show" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 mb-16"
          >
            {PAIN_POINTS.map((p, i) => (
              <motion.div key={i} variants={fadeUp}
                className="flex items-center gap-2.5 bg-[#0D141D] border border-[#243041] rounded-xl px-3.5 py-3 hover:border-red-500/30 transition-colors"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-xs font-semibold text-slate-300">{p}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* The truth */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={probIn ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 }}
            className="relative rounded-2xl border border-[#243041] p-8 md:p-12 text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(13,20,29,1) 60%)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #EF4444, transparent)' }} />
            <p className="text-2xl md:text-3xl font-extrabold text-white mb-4 leading-tight">
              "Things don't fail because people don't care.<br />
              <span className="text-red-400">They fail because humans cannot manually manage operational chaos at scale."</span>
            </p>
            <p className="text-slate-400">
              The restaurant industry is the last major sector without operational infrastructure. Until now.
            </p>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" ref={howRef} className="py-24 px-4 border-t border-[#243041]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 mb-6">
              <Zap className="h-3.5 w-3.5 text-[#FF7A1A]" />
              <span className="text-xs font-bold text-[#FF7A1A] tracking-wide">HOW IT WORKS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Every operation follows a<br /><span className="text-[#FF7A1A]">closed-loop system.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">Nothing falls through the cracks. Every task is created, routed, verified, and logged.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="bg-[#0D141D] border border-[#243041] rounded-2xl p-6" style={{ boxShadow: '0 0 40px rgba(255,122,26,0.08)' }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2 w-2 rounded-full bg-[#FF7A1A] animate-pulse" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Operational Flow</p>
              </div>
              <OperationalFlow />
            </div>

            <div className="space-y-4">
              {[
                { icon: '🎯', title: 'Station-Based Routing', desc: 'Every task knows where it belongs. Grill tasks go to grill staff. Bar tasks go to bartenders. No confusion.' },
                { icon: '📸', title: 'Photo Verification', desc: 'Critical tasks require photo proof before marking complete. No more "I did it" without evidence.' },
                { icon: '📡', title: 'Real-Time Escalation', desc: 'Missed tasks escalate automatically to the next level of leadership. Nothing slips through.' },
                { icon: '🗃️', title: 'Permanent Audit Log', desc: 'Every action, approval, and exception is logged forever. Full accountability trail.' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={howIn ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 bg-[#0D141D] border border-[#243041] rounded-xl p-4 hover:border-[#FF7A1A]/30 transition-colors"
                >
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{item.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EVERYTHING CONNECTS */}
      <section ref={ecoRef} className="py-24 px-4 border-t border-[#243041]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Everything <span style={{ color: '#FF7A1A' }}>connects.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">No more disconnected systems, missing communication, or operational blind spots.</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
            {ECOSYSTEM.map((node, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={ecoIn ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 20 }}
                className="bg-[#0D141D] border border-[#243041] rounded-2xl p-3 text-center flex flex-col items-center gap-2 hover:border-[#FF7A1A]/40 hover:bg-[#FF7A1A]/5 transition-all cursor-default group"
              >
                <span className="text-2xl">{node.emoji}</span>
                <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{node.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={ecoIn ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.7 }}
            className="text-center bg-[#0D141D] border border-[#FF7A1A]/20 rounded-2xl p-8"
            style={{ boxShadow: '0 0 40px rgba(255,122,26,0.08)' }}
          >
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-extrabold text-white mb-2">One System. Every Layer.</h3>
            <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
              From the dishwasher's task list to the GM's approval inbox — every piece of your operation is connected, visible, and accountable in real time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ROLE CARDS */}
      <section id="roles" className="py-24 px-4 border-t border-[#243041]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 mb-6">
              <Users className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 tracking-wide">ROLE-BASED INTELLIGENCE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Every role gets exactly<br /><span className="text-purple-400">what they need.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">Kitchen staff see kitchen tasks. Managers see everything. No noise. No overwhelm.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {ROLE_CARDS.map((card, i) => <RoleCard key={i} card={card} delay={i * 0.12} />)}
          </div>
        </div>
      </section>

      {/* ACCOUNTABILITY */}
      <section className="py-24 px-4 border-t border-[#243041]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              "If it wasn't verified,<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #22C55E, #3B82F6)' }}>it wasn't completed."</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">HeardOS doesn't just assign tasks. It ensures operational execution — with proof.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '📸', title: 'Photo Verification', desc: 'Staff submit photo proof on critical tasks. Managers approve or reject with one tap.', color: '#22C55E' },
              { icon: '⚡', title: 'Auto-Escalation', desc: 'Missed deadlines escalate automatically. Leadership is notified before it becomes a problem.', color: '#F59E0B' },
              { icon: '🌡️', title: 'Equipment-Linked Logs', desc: 'Temperature logs are tied directly to specific coolers and equipment. No guessing, no gaps.', color: '#3B82F6' },
              { icon: '🔄', title: 'Recurring Automation', desc: 'Daily, shift-based, and weekly tasks generate automatically. Setup once, run forever.', color: '#A855F7' },
              { icon: '📊', title: 'Audit History', desc: 'Every action creates a permanent record. Compliance audit? You have everything.', color: '#FF7A1A' },
              { icon: '🎯', title: 'Approval Routing', desc: 'High-stakes tasks route to the right approver. Nothing gets signed off by the wrong person.', color: '#EF4444' },
            ].map((item, i) => (
              <div key={i} className="bg-[#0D141D] border border-[#243041] rounded-2xl p-5 hover:border-opacity-60 transition-all group"
                style={{ '--hover-color': item.color }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${item.color}18`, border: `1px solid ${item.color}33` }}>
                    {item.icon}
                  </div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISION */}
      <section className="py-24 px-4 border-t border-[#243041]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Restaurants already have systems.<br />
            <span className="text-[#FF7A1A]">HeardOS makes sure they actually happen.</span>
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-12">
            The restaurant industry still runs on memory, paper, verbal communication, and disconnected software. HeardOS is the operational infrastructure that replaces chaos with execution.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { emoji: '🧠', label: 'Operational Intelligence', desc: 'Know what\'s happening across every station in real time.' },
              { emoji: '⚙️', label: 'Accountability Engine', desc: 'Nothing gets missed. Everything gets verified. Everyone\'s responsible.' },
              { emoji: '🚀', label: 'Restaurant Nervous System', desc: 'Connect people, equipment, tasks, and communication into one living system.' },
            ].map((v, i) => (
              <div key={i} className="bg-[#0D141D] border border-[#243041] rounded-2xl p-6 text-center hover:border-[#FF7A1A]/30 transition-colors">
                <div className="text-4xl mb-3">{v.emoji}</div>
                <p className="text-sm font-bold text-white mb-2">{v.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section ref={ctaRef} className="py-24 px-4 border-t border-[#243041] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at center, #FF7A1A22 0%, transparent 60%)' }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={ctaIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              Launch your operational system.
            </h2>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
              See HeardOS run a real restaurant — live stations, real tasks, real accountability. No slides. No demos. Just operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button onClick={() => base44.auth.redirectToLogin()}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-lg text-white transition-all active:scale-95 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #FF7A1A, #C94D0A)', boxShadow: '0 0 40px rgba(255,122,26,0.5)' }}
              >
                Book Operational Demo <ArrowRight className="h-5 w-5" />
              </button>
              <button onClick={() => base44.auth.redirectToLogin()}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-lg text-slate-300 border border-[#243041] hover:border-slate-500 hover:text-white transition-all active:scale-95"
                style={{ background: 'rgba(13,20,29,0.8)' }}
              >
                Sign In
              </button>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Live system setup</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Built for operators</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#243041] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/69f0c74de6e9ba52961af58a/4d2dcd0d8_HeardOS_pulse_mark.svg" alt="HeardOS" className="h-6 w-6" />
            <span className="font-extrabold text-sm">Heard<span className="text-[#FF7A1A]">OS</span></span>
            <span className="text-slate-600 text-xs ml-2">The Operational Nervous System for Restaurants</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 HeardOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export const hideBase44Index = true;