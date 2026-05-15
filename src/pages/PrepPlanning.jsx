import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChefHat, AlertCircle, CheckCircle2, Clock, Zap, Settings,
  ClipboardList, ArrowRight, Calendar, FileStack,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import BulkParEditorModal from '@/components/prep/BulkParEditorModal';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const ALLOWED_ROLES = ['admin', 'manager', 'chef', 'kitchen_lead'];

const cardStyle = {
  background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)",
};

export default function PrepPlanning() {
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [countSessions, setCountSessions] = useState([]);
  const [prepPlans, setPrepPlans]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [today]                           = useState(new Date());
  const [bulkEditOpen, setBulkEditOpen]   = useState(false);

  const isAllowed = isAdmin || ALLOWED_ROLES.includes(user?.role);

  useEffect(() => {
    if (!isAllowed) return;
    loadData();
  }, [isAllowed]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [counts, plans] = await Promise.all([
        base44.entities.PrepInventoryCount?.list?.('-created_date', 100).catch(() => []),
        base44.entities.PrepPlan?.list?.('-created_date', 100).catch(() => []),
      ]);
      setCountSessions(counts || []);
      setPrepPlans(plans || []);
    } catch {
      toast.error('Failed to load prep planning data');
    }
    setLoading(false);
  };

  const startCount = async () => {
    haptics.medium();
    try {
      const templates = await base44.entities.PrepPlanTemplate?.filter?.({ is_active: true }).catch(() => []);
      if (!templates?.length) {
        toast.error('No active prep templates — set up templates first');
        return;
      }
    } catch { /* proceed anyway */ }
    navigate('/prep-count');
  };

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-1">
            Available to admins, managers, chefs, and kitchen leads.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent"
        style={{ boxShadow: "0 0 20px rgba(230,106,31,0.35)" }}
      />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Loading prep data…
      </p>
    </div>
  );

  const todayStr  = today.toISOString().split('T')[0];
  const todayCount = countSessions.find(c => c.date === todayStr);
  const todayPlan  = prepPlans.find(p => p.date === todayStr);
  const dayLabel   = format(today, "EEE, MMM d");

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Prep Planning" subtitle="Plan production and set par levels" />

      {/* Sticky header */}
      <div
        className="lg:hidden sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{
          background: "linear-gradient(180deg, rgba(6,10,16,0.97) 0%, rgba(8,13,20,0.95) 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 16px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-2.5">
            <ChefHat className="h-5 w-5 text-primary" />
            <div>
              <p className="metric-label">Kitchen</p>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Prep Planning</h1>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-lg border border-border/40 px-2.5 py-1.5"
            style={cardStyle}
          >
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-bold text-muted-foreground">{dayLabel}</span>
          </div>
        </div>
      </div>

      <div className="app-page">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">

          {/* Left column: Status + Actions */}
          <div className="space-y-4">

            {/* Today's status */}
            <section className="space-y-2">
              <p className="metric-label px-1">Today's Status</p>
              <div className="grid grid-cols-2 gap-2">

                {/* Count */}
                <div
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border p-4",
                    todayCount ? "border-green-500/30" : "border-amber-500/30"
                  )}
                  style={{ background: todayCount ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)" }}
                >
                  <div className="flex items-center gap-2">
                    {todayCount
                      ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                      : <AlertCircle  className="h-4 w-4 text-amber-400 shrink-0" />
                    }
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Count</p>
                  </div>
                  <p className={cn("text-sm font-black leading-tight", todayCount ? "text-green-400" : "text-amber-400")}>
                    {todayCount ? "Submitted" : "Not Done"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {todayCount ? `${todayCount.shift} shift` : "No count today yet"}
                  </p>
                  {todayCount ? (
                    <button
                      onClick={() => { haptics.light(); navigate(`/prep-count/${todayCount.id}`); }}
                      className="mt-1 flex items-center gap-1 text-[11px] font-bold text-green-400 active:opacity-70"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      onClick={startCount}
                      className="mt-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 py-1.5 text-xs font-black text-amber-400 active:scale-[0.97] transition-all"
                      style={{ background: "rgba(245,158,11,0.08)" }}
                    >
                      <Zap className="h-3 w-3" /> Start Count
                    </button>
                  )}
                </div>

                {/* Prep plan */}
                <div
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border p-4",
                    todayPlan ? "border-blue-500/30" : "border-border/40"
                  )}
                  style={{
                    background: todayPlan
                      ? "rgba(96,165,250,0.06)"
                      : "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {todayPlan
                      ? <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                      : <Clock className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    }
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prep Plan</p>
                  </div>
                  <p className={cn("text-sm font-black leading-tight", todayPlan ? "text-blue-400" : "text-foreground/30")}>
                    {todayPlan ? "Ready" : "Pending"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {todayPlan ? `Status: ${todayPlan.status}` : "Awaiting count submission"}
                  </p>
                  {todayPlan && (
                    <button
                      onClick={() => { haptics.light(); navigate(`/prep-plan/${todayPlan.id}`); }}
                      className="mt-1 flex items-center gap-1 text-[11px] font-bold text-blue-400 active:opacity-70"
                    >
                      Review <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Actions */}
            <section className="space-y-2">
              <p className="metric-label px-1">Actions</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  {
                    icon: ClipboardList, label: "Review Plan", sub: "View generated tasks",
                    color: "text-blue-400", border: "border-blue-500/25", bg: "rgba(96,165,250,0.06)",
                    onClick: () => {
                      haptics.light();
                      todayPlan
                        ? navigate(`/prep-plan/${todayPlan.id}`)
                        : toast.info('No plan yet — submit a count first');
                    },
                  },
                  {
                    icon: FileStack, label: "Templates", sub: "Manage par-based recipes",
                    color: "text-primary", border: "border-primary/25", bg: "rgba(230,106,31,0.06)",
                    onClick: () => { haptics.light(); navigate('/prep-plan-templates'); },
                  },
                  {
                    icon: Settings, label: "Bulk Edit Pars", sub: "Edit multiple pars at once",
                    color: "text-violet-400", border: "border-violet-500/25", bg: "rgba(139,92,246,0.06)",
                    onClick: () => { haptics.light(); setBulkEditOpen(true); },
                  },
                ].map(({ icon: Icon, label, sub, color, border, bg, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left active:scale-[0.97] transition-all",
                      border
                    )}
                    style={{ background: bg, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                  >
                    <Icon className={cn("h-4 w-4", color)} />
                    <div>
                      <p className={cn("text-sm font-black", color)}>{label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

          </div>

          {/* Right column: Recent Sessions */}
          <div>
            <section className="space-y-2">
              <p className="metric-label px-1">Recent Sessions</p>
              {countSessions.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border/30 py-12 text-center"
                  style={cardStyle}
                >
                  <ChefHat className="h-8 w-8 text-muted-foreground/25" />
                  <p className="text-sm font-bold text-foreground">No sessions yet</p>
                  <p className="text-xs text-muted-foreground">Start your first count to generate a prep plan.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {countSessions.slice(0, 12).map(session => (
                    <button
                      key={session.id}
                      onClick={() => { haptics.light(); navigate(`/prep-count/${session.id}`); }}
                      className="flex w-full items-center gap-3 rounded-xl border border-border/40 px-3 py-2.5 text-left active:scale-[0.98] transition-all"
                      style={cardStyle}
                    >
                      <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate capitalize">
                          {session.shift} — {session.station || 'All Stations'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{session.date} · {session.status}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>

      {bulkEditOpen && (
        <BulkParEditorModal
          station="Prep"
          shift="opening"
          onClose={() => setBulkEditOpen(false)}
          onSave={loadData}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
