import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.09 } } };

function useScrollInView(threshold = 0.15) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return [ref, inView];
}

export default function Landing() {
  const [heroRef, heroIn] = useScrollInView(0.05);
  const [painRef, painIn] = useScrollInView();
  const [solutionRef, solutionIn] = useScrollInView();
  const [whoRef, whoIn] = useScrollInView();
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
            <a href="#pain" className="hover:text-white transition-colors">The Problem</a>
            <a href="#solution" className="hover:text-white transition-colors">Solution</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="text-sm font-bold text-slate-300 hover:text-white px-3 py-1.5 transition-colors">Sign In</button>
            <button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="text-sm font-bold bg-[#FF7A1A] text-white px-4 py-1.5 rounded-lg hover:brightness-110 transition-all active:scale-95" style={{ boxShadow: '0 0 16px rgba(255,122,26,0.35)' }}>
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12 overflow-hidden">
        {/* BG glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse, #FF7A1A44 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(ellipse, #3B82F655 0%, transparent 70%)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 mb-8"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A] animate-pulse" />
          <span className="text-xs font-bold text-[#FF7A1A] tracking-wide">OPERATIONAL PLATFORM</span>
        </motion.div>

        <motion.h1 ref={heroRef}
          initial={{ opacity: 0, y: 30 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-6xl font-extrabold text-center leading-[1.1] tracking-tight max-w-3xl mb-6"
        >
          Run every restaurant shift with clarity.
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg text-slate-400 max-w-2xl text-center leading-relaxed mb-8"
        >
          HeardOS turns handoffs, tasks, logs, prep, temps, and approvals into one clean shift command center.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mb-12"
        >
          <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg font-bold text-base text-white transition-all active:scale-95 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #FF7A1A, #C94D0A)', boxShadow: '0 0 20px rgba(255,122,26,0.4)' }}
          >
            Start Free
          </button>
          <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg font-bold text-base text-slate-300 border border-[#243041] hover:border-slate-500 hover:text-white transition-all active:scale-95"
            style={{ background: 'rgba(13,20,29,0.8)' }}
          >
            View Demo
          </button>
        </motion.div>

        {/* DASHBOARD PREVIEW */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={heroIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-2xl"
        >
          <div className="relative rounded-xl border border-[#243041] overflow-hidden" style={{ background: 'rgba(13,20,29,0.8)', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
            <div className="grid grid-cols-4 gap-px bg-[#243041]">
              {[
                { label: 'Active', val: '47', color: '#FF7A1A' },
                { label: 'Approvals', val: '5', color: '#F59E0B' },
                { label: 'Alerts', val: '2', color: '#EF4444' },
                { label: 'Progress', val: '78%', color: '#22C55E' },
              ].map(m => (
                <div key={m.label} className="bg-[#0D141D] px-3 py-4 text-center">
                  <p className="text-xl font-extrabold" style={{ color: m.color }}>{m.val}</p>
                  <p className="text-[8px] text-slate-600 font-bold mt-1">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-px bg-[#243041]">
              {[
                { station: 'Grill', pct: 88, icon: '🔥' },
                { station: 'Pantry', pct: 100, icon: '🥗' },
                { station: 'Fry', pct: 54, icon: '🍟' },
              ].map(s => (
                <div key={s.station} className="bg-[#0D141D] px-2.5 py-3 text-center">
                  <p className="text-sm mb-1.5">{s.icon}</p>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div style={{ width: `${s.pct}%`, height: '100%', background: '#FF7A1A' }} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400">{s.pct}%</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* PAIN SECTION */}
      <section id="pain" ref={painRef} className="py-20 px-4 border-t border-[#243041]">
        <div className="max-w-5xl mx-auto">
          <motion.h2 variants={fadeUp} initial="hidden" animate={painIn ? "show" : "hidden"}
            className="text-3xl md:text-4xl font-extrabold text-center mb-12"
          >
            Restaurant operations get messy fast.
          </motion.h2>

          <motion.div variants={stagger} initial="hidden" animate={painIn ? "show" : "hidden"}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { icon: '⚠️', title: 'Missed Tasks', desc: 'Work doesn\'t get done. Staff forget. Things slip.' },
              { icon: '📋', title: 'Scattered Logs', desc: 'Temps, incidents, and maintenance spread everywhere.' },
              { icon: '🤝', title: 'Weak Handoffs', desc: 'Incoming shifts don\'t know what happened last shift.' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-[#0D141D] border border-[#243041] rounded-xl p-6 text-center hover:border-red-500/40 transition-colors"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <p className="font-bold text-white mb-2">{item.title}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section id="solution" ref={solutionRef} className="py-20 px-4 border-t border-[#243041]">
        <div className="max-w-5xl mx-auto">
          <motion.h2 variants={fadeUp} initial="hidden" animate={solutionIn ? "show" : "hidden"}
            className="text-3xl md:text-4xl font-extrabold text-center mb-12"
          >
            One operating system for the shift.
          </motion.h2>

          <motion.div variants={stagger} initial="hidden" animate={solutionIn ? "show" : "hidden"}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { icon: '📋', title: 'Today', desc: 'Role-based shift tasks' },
              { icon: '📊', title: 'Pulse', desc: 'Live operational command center' },
              { icon: '📝', title: 'Logs', desc: 'Temps, incidents, maintenance, waste, 86s' },
              { icon: '✅', title: 'Templates', desc: 'Reusable checklists, prep lists, side work' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-[#0D141D] border border-[#243041] rounded-xl p-5 hover:border-[#FF7A1A]/40 transition-colors"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="font-bold text-white mb-1 text-sm">{item.title}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* VISUAL PROOF SECTION */}
      <section className="py-20 px-4 border-t border-[#243041]">
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={fadeUp} initial="hidden" animate={solutionIn ? "show" : "hidden"}
            className="text-3xl md:text-4xl font-extrabold text-center mb-12"
          >
            See it in action.
          </motion.h2>
          <motion.div variants={fadeUp} initial="hidden" animate={solutionIn ? "show" : "hidden"}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="relative rounded-lg border border-[#243041] overflow-hidden bg-[#0D141D] p-4" style={{ boxShadow: '0 0 30px rgba(0,0,0,0.4)' }}>
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase">Dashboard</p>
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-800/30 rounded" />)}
              </div>
            </div>
            <div className="relative rounded-lg border border-[#243041] overflow-hidden bg-[#0D141D] p-4" style={{ boxShadow: '0 0 30px rgba(0,0,0,0.4)' }}>
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase">Mobile App</p>
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-800/30 rounded" />)}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section ref={whoRef} className="py-20 px-4 border-t border-[#243041]">
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={fadeUp} initial="hidden" animate={whoIn ? "show" : "hidden"}
            className="text-3xl md:text-4xl font-extrabold text-center mb-12"
          >
            Built for every operation.
          </motion.h2>
          <motion.div variants={stagger} initial="hidden" animate={whoIn ? "show" : "hidden"}
            className="flex flex-wrap gap-3 justify-center"
          >
            {['Restaurants', 'Bars', 'Cafes', 'Hotels', 'Catering', 'Multi-Unit Operators'].map((item, i) => (
              <motion.div key={i} variants={fadeUp}
                className="px-4 py-2.5 bg-[#0D141D] border border-[#243041] rounded-lg text-sm font-semibold text-slate-300 hover:border-[#FF7A1A]/40 transition-colors"
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section ref={ctaRef} className="py-20 px-4 border-t border-[#243041] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at center, #FF7A1A22 0%, transparent 60%)' }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={ctaIn ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
              Make every shift easier to run.
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg font-bold text-base text-white transition-all active:scale-95 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #FF7A1A, #C94D0A)', boxShadow: '0 0 20px rgba(255,122,26,0.4)' }}
              >
                Start Free
              </button>
              <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg font-bold text-base text-slate-300 border border-[#243041] hover:border-slate-500 hover:text-white transition-all active:scale-95"
                style={{ background: 'rgba(13,20,29,0.8)' }}
              >
                View Demo
              </button>
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