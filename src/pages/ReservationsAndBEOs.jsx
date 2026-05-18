import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Calendar, Plus, ChevronDown, ChevronLeft, Upload, X, FileText,
  CalendarPlus, Users, FileSpreadsheet, Sparkles,
  User, Star, Heart, ChefHat, ConciergeBell, CalendarDays,
  Bell, UserCircle,
} from 'lucide-react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import TodayTab from '@/components/reservations/TodayTab';
import ReservationsTab from '@/components/reservations/ReservationsTab';
import BEOsTab from '@/components/reservations/BEOsTab';
import CalendarTab from '@/components/reservations/CalendarTab';
import PrepImpactTab from '@/components/reservations/PrepImpactTab';
import BEODetail from '@/components/reservations/BEODetail';
import ReservationForm from '@/components/reservations/ReservationForm';
import BEOForm from '@/components/reservations/BEOForm';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const CARD_BG = 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)';
const TABS = ['Today', 'Reservations', 'BEOs', 'Calendar', 'Impact'];
const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Impact helpers ───────────────────────────────────────────────────────────
function impactLevel(beoCount, largeParties, covers) {
  return {
    prep:    beoCount > 2 ? 'High' : beoCount > 0 ? 'Medium' : largeParties > 2 ? 'Medium' : 'Low',
    service: covers > 100 ? 'High' : covers > 50 ? 'Medium' : 'Low',
  };
}

const IMPACT_STYLE = {
  High:   'text-red-400   bg-red-500/10',
  Medium: 'text-amber-400 bg-amber-500/10',
  Low:    'text-green-400 bg-green-500/10',
};

// ─── Overview card ─────────────────────────────────────────────────────────
function OverviewChip({ label, value, icon: Icon, iconColor = 'text-muted-foreground', color = 'text-foreground', bg = 'bg-white/[0.04]' }) {
  return (
    <div className={cn('flex flex-col items-center px-2 py-3 rounded-xl gap-0.5 w-full', bg)}>
      {Icon && <Icon className={cn('h-4 w-4 mb-1', iconColor)} />}
      <span className={cn('text-xl font-extrabold leading-tight', color)}>{value}</span>
      <span className="text-[9px] font-bold text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function ImpactChip({ level, label, icon: Icon, emptyNote }) {
  return (
    <div className={cn('flex flex-col items-center px-2 py-3 rounded-xl gap-0.5 w-full', IMPACT_STYLE[level])}>
      {Icon && <Icon className="h-4 w-4 mb-1" />}
      <span className="text-sm font-extrabold leading-tight">{level}</span>
      <span className="text-[9px] font-bold text-center leading-tight opacity-80">{label}</span>
      {level === 'Low' && emptyNote && (
        <span className="text-[8px] text-center opacity-50 leading-tight mt-0.5">{emptyNote}</span>
      )}
    </div>
  );
}

function OverviewCard({ reservations, beos }) {
  const td           = todayStr();
  const todayRes     = reservations.filter(r => r.date === td && r.status !== 'cancelled');
  const todayBEOs    = beos.filter(b => b.eventDate === td && b.status !== 'cancelled');
  const totalCovers  = todayRes.reduce((s, r) => s + (r.partySize || 0), 0)
                     + todayBEOs.reduce((s, b) => s + (b.guestCount || 0), 0);
  const largeParties = todayRes.filter(r => (r.partySize || 0) >= 8).length;
  const vips         = todayRes.filter(r => r.isVIP).length;
  const dietAlerts   = todayRes.filter(r => r.hasDietaryRestrictions).length
                     + todayBEOs.filter(b => b.dietaryNotes).length;
  const { prep, service } = impactLevel(todayBEOs.length, largeParties, totalCovers);

  return (
    <div className="card-glass border border-border rounded-xl p-3 mb-3 w-full">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{"Today's Overview"}</p>
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        <OverviewChip
          label="Reservations" value={todayRes.length}
          icon={User} iconColor="text-blue-400"
          bg="bg-white/[0.04]"
        />
        <OverviewChip
          label="Covers" value={totalCovers}
          icon={Users} iconColor="text-primary" color="text-primary"
          bg={totalCovers > 0 ? 'bg-primary/10' : 'bg-white/[0.04]'}
        />
        <OverviewChip
          label="Large Parties" value={largeParties}
          icon={Users} iconColor={largeParties > 0 ? 'text-amber-400' : 'text-muted-foreground'}
          color={largeParties > 0 ? 'text-amber-400' : 'text-foreground'}
          bg={largeParties > 0 ? 'bg-amber-500/10' : 'bg-white/[0.04]'}
        />
        <OverviewChip
          label="BEOs" value={todayBEOs.length}
          icon={CalendarDays} iconColor={todayBEOs.length > 0 ? 'text-blue-400' : 'text-muted-foreground'}
          color={todayBEOs.length > 0 ? 'text-blue-400' : 'text-foreground'}
          bg={todayBEOs.length > 0 ? 'bg-blue-500/10' : 'bg-white/[0.04]'}
        />
        <OverviewChip
          label="VIPs" value={vips}
          icon={Star} iconColor={vips > 0 ? 'text-yellow-400' : 'text-muted-foreground'}
          color={vips > 0 ? 'text-yellow-400' : 'text-foreground'}
          bg={vips > 0 ? 'bg-yellow-500/10' : 'bg-white/[0.04]'}
        />
        <OverviewChip
          label="Diet Alerts" value={dietAlerts}
          icon={Heart} iconColor={dietAlerts > 0 ? 'text-teal-400' : 'text-muted-foreground'}
          color={dietAlerts > 0 ? 'text-teal-400' : 'text-foreground'}
          bg={dietAlerts > 0 ? 'bg-teal-500/10' : 'bg-white/[0.04]'}
        />
        <ImpactChip level={prep}    label="Prep Impact" icon={ChefHat}       emptyNote="No impact today" />
        <ImpactChip level={service} label="Svc Impact"  icon={ConciergeBell} emptyNote="No impact today" />
      </div>
    </div>
  );
}

// ─── Import modal ─────────────────────────────────────────────────────────────
const IMPORT_OPTIONS = [
  {
    id:     'csv',
    icon:   FileSpreadsheet,
    label:  'CSV / Spreadsheet',
    desc:   'Upload a spreadsheet with reservation or event data.',
    badge:  'Coming Soon',
    dim:    true,
  },
  {
    id:     'pdf',
    icon:   FileText,
    label:  'PDF / BEO Document',
    desc:   'Upload a banquet event order or PDF. heardOS will extract fields for your review.',
    badge:  'AI Extraction',
    badgeColor: 'text-primary border-primary/30 bg-primary/10',
    dim:    true,
  },
  {
    id:     'manual',
    icon:   CalendarPlus,
    label:  'Manual Entry',
    desc:   'Enter reservation or BEO details directly.',
    badge:  null,
    dim:    false,
  },
];

function ImportModal({ onClose, onManualReservation, onManualBEO }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border/50 overflow-hidden"
        style={{ background: CARD_BG, boxShadow: '0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Import</p>
            <h3 className="text-base font-black text-foreground mt-0.5">Import Events</h3>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Options */}
        <div className="divide-y divide-border/20 border-t border-border/20">
          {IMPORT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              disabled={opt.dim}
              onClick={() => {
                if (opt.id === 'manual') { onClose(); onManualReservation(); }
              }}
              className={cn(
                'flex w-full items-start gap-3 px-5 py-4 text-left transition-all',
                opt.dim
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/[0.03] active:scale-[0.99]',
              )}
            >
              <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-border/30 flex items-center justify-center shrink-0 mt-0.5">
                <opt.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-foreground">{opt.label}</p>
                  {opt.badge && (
                    <span className={cn(
                      'text-[9px] font-black px-1.5 py-0.5 rounded-full border',
                      opt.badgeColor || 'text-muted-foreground border-border/40 bg-muted/30',
                    )}>
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</p>
                {opt.id === 'pdf' && (
                  <p className="text-[10px] text-muted-foreground/50 mt-1 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    Fields confirmed before saving — no data saved without review.
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground/50 text-center">
            CSV and PDF import are in development. Use manual entry to add events now.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Add Event dropdown ───────────────────────────────────────────────────────
function AddEventDropdown({ onAddReservation, onAddBEO }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const OPTIONS = [
    {
      label: 'Reservation',
      sub:   'Dining, walk-in, or VIP table',
      icon:  Users,
      action: onAddReservation,
    },
    {
      label: 'BEO / Event',
      sub:   'Banquet, private dining, or function',
      icon:  CalendarPlus,
      action: onAddBEO,
    },
    {
      label: 'Private Dining',
      sub:   'Private room or exclusive booking',
      icon:  Calendar,
      action: onAddBEO,
    },
    {
      label: 'Catering / Off-site',
      sub:   'Off-premise or catering event',
      icon:  FileText,
      action: onAddBEO,
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(v => !v); haptics.medium(); }}
        className="btn-primary h-8 px-3 text-xs flex items-center gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Event
        <ChevronDown className={cn('h-3 w-3 ml-0.5 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border/50 shadow-xl overflow-hidden z-50"
          style={{ background: CARD_BG, boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)' }}
        >
          <p className="px-3.5 pt-3 pb-2 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">
            Event type
          </p>
          <div className="divide-y divide-border/20 border-t border-border/20">
            {OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => { opt.action(); setOpen(false); haptics.medium(); }}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.03] transition-colors active:scale-[0.99]"
              >
                <opt.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground/60">{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReservationsAndBEOs() {
  const navigate = useNavigate();
  const { isAdmin, user } = useCurrentUser();
  const [activeTab,           setActiveTab]           = useState('Today');
  const [reservations,        setReservations]        = useState([]);
  const [beos,                setBeos]                = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [selectedBEO,         setSelectedBEO]         = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [editingReservation,  setEditingReservation]  = useState(null);
  const [showBEOForm,         setShowBEOForm]         = useState(false);
  const [editingBEO,          setEditingBEO]          = useState(null);
  const [showImportModal,     setShowImportModal]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, beoList] = await Promise.all([
      base44.entities.Reservation.list('-date', 200).catch(() => []),
      base44.entities.BEO.list('-eventDate', 200).catch(() => []),
    ]);
    setReservations(res);
    setBeos(beoList);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = useCallback(() => {
    load();
    setShowReservationForm(false);
    setEditingReservation(null);
    setShowBEOForm(false);
    setEditingBEO(null);
    setSelectedBEO(null);
  }, [load]);

  const openReservationForm = useCallback(() => {
    setEditingReservation(null);
    setShowReservationForm(true);
  }, []);

  const openBEOForm = useCallback(() => {
    setEditingBEO(null);
    setShowBEOForm(true);
  }, []);

  // ── Form / detail overlays ────────────────────────────────────────────────
  if (selectedBEO) {
    return (
      <BEODetail
        beo={selectedBEO}
        isAdmin={isAdmin}
        user={user}
        onClose={() => setSelectedBEO(null)}
        onEdit={(b) => { setSelectedBEO(null); setEditingBEO(b); setShowBEOForm(true); }}
        onSave={handleSave}
      />
    );
  }

  if (showReservationForm) {
    return (
      <ReservationForm
        reservation={editingReservation}
        onSave={handleSave}
        onClose={() => { setShowReservationForm(false); setEditingReservation(null); }}
      />
    );
  }

  if (showBEOForm) {
    return (
      <BEOForm
        beo={editingBEO}
        onSave={handleSave}
        onClose={() => { setShowBEOForm(false); setEditingBEO(null); }}
      />
    );
  }

  // ── Main page ─────────────────────────────────────────────────────────────
  const td           = todayStr();
  const todayRes     = reservations.filter(r => r.date === td && r.status !== 'cancelled');
  const todayBEOs    = beos.filter(b => b.eventDate === td && b.status !== 'cancelled');
  const totalCovers  = todayRes.reduce((s, r) => s + (r.partySize || 0), 0)
                     + todayBEOs.reduce((s, b) => s + (b.guestCount || 0), 0);
  const largeParties = todayRes.filter(r => (r.partySize || 0) >= 8).length;
  const { prep: prepImpact, service: serviceImpact } = impactLevel(todayBEOs.length, largeParties, totalCovers);
  const todayEmpty   = todayRes.length === 0 && todayBEOs.length === 0;

  return (
    <div className="app-screen">
      {/* Desktop header */}
      <DesktopPageHeader
        title="Reservations & BEOs"
        subtitle="Events, reservations, and prep impact planning"
        actions={isAdmin && <AddEventDropdown onAddReservation={openReservationForm} onAddBEO={openBEOForm} />}
      />

      {/* ── MOBILE HEADER ─────────────────────────────────────────── */}
      <div
        className="lg:hidden sticky top-0 z-10"
        style={{ background: '#000000', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <button
            onClick={() => navigate(-1)}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-white/[0.06] border border-border/30"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <span className="text-[15px] font-black text-foreground">BEOs / Events</span>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>

        {/* Context-aware add button */}
        {isAdmin && activeTab !== 'Impact' && (
          <div className="flex justify-end px-4 pt-1 pb-1">
            <button
              onClick={() => {
                haptics.medium();
                if (activeTab === 'Reservations' || activeTab === 'Calendar') openReservationForm();
                else openBEOForm();
              }}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-bold text-primary"
              style={{ border: '1px solid rgba(230,106,31,0.55)', background: 'transparent' }}
            >
              <Plus className="h-3.5 w-3.5" />
              {activeTab === 'Reservations' || activeTab === 'Calendar'
                ? 'Add Reservation'
                : activeTab === 'BEOs' ? 'Add BEO' : 'Add Event'}
            </button>
          </div>
        )}

        {/* Tabs — underline style */}
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); haptics.light(); }}
              className={cn(
                'shrink-0 px-1 mr-6 pb-2.5 text-[14px] font-semibold whitespace-nowrap transition-colors border-b-2',
                activeTab === tab
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground/60 border-transparent'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── DESKTOP TABS ──────────────────────────────────────────── */}
      <div className="hidden lg:block bg-card border-b border-border sticky top-[112px] z-10">
        <div className="flex gap-1.5 overflow-x-auto pb-2 pt-4 px-6 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); haptics.light(); }}
              className={cn(
                'shrink-0 flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all duration-200',
                activeTab === tab
                  ? 'glow-active'
                  : 'border-transparent text-muted-foreground hover:text-foreground glow-interactive',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── MOBILE CONTENT ────────────────────────────────────────── */}
      <div className="lg:hidden px-4 pt-4 pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'Today' ? (
          todayEmpty ? (
            <div className="space-y-3">
              {/* Card 1: Today's Overview */}
              <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{"Today's Overview"}</p>
                </div>
                <div className="grid grid-cols-4 gap-2 px-3 pb-4">
                  <div className="flex flex-col items-center bg-white/[0.04] rounded-xl p-3 gap-0.5">
                    <User className="h-4 w-4 text-blue-400 mb-1" />
                    <span className="text-xl font-extrabold text-foreground">{todayRes.length}</span>
                    <span className="text-[9px] font-bold text-muted-foreground text-center">Reservations</span>
                  </div>
                  <div className="flex flex-col items-center bg-white/[0.04] rounded-xl p-3 gap-0.5">
                    <CalendarDays className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xl font-extrabold text-foreground">{todayBEOs.length}</span>
                    <span className="text-[9px] font-bold text-muted-foreground text-center">BEOs</span>
                  </div>
                  <div className="flex flex-col items-center bg-white/[0.04] rounded-xl p-3 gap-0.5">
                    <Users className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xl font-extrabold text-foreground">{totalCovers}</span>
                    <span className="text-[9px] font-bold text-muted-foreground text-center">Covers</span>
                  </div>
                  <div className="flex flex-col items-center bg-green-500/10 rounded-xl p-3 gap-0.5">
                    <ChefHat className="h-4 w-4 text-green-400 mb-1" />
                    <span className="text-sm font-extrabold text-green-400">{prepImpact}</span>
                    <span className="text-[9px] font-bold text-green-400/80 text-center">Prep Impact</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Upcoming Today */}
              <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Upcoming Today</p>
                </div>
                <div className="flex flex-col items-center py-6 px-4 gap-3">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full bg-white/[0.05] border border-border/30 flex items-center justify-center">
                      <Calendar className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground">Nothing scheduled for today</p>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => { openBEOForm(); haptics.medium(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-bold text-white active:scale-[0.98] transition-all"
                      style={{ background: 'linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)' }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Event
                    </button>
                    <button
                      onClick={() => { setShowImportModal(true); haptics.medium(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-semibold text-foreground active:scale-[0.98] transition-all"
                      style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
                    >
                      <Upload className="h-3.5 w-3.5" /> Import Events
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Recent Activity */}
              <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)' }}>
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Recent Activity</p>
                </div>
                <div className="flex flex-col items-center py-5 px-4 gap-3">
                  <p className="text-[12px] text-muted-foreground/60">No recent activity</p>
                  <button
                    className="w-full rounded-xl py-2.5 text-[13px] font-semibold text-foreground active:scale-[0.98] transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'transparent' }}
                  >
                    View All Activity
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <TodayTab
              reservations={reservations}
              beos={beos}
              isAdmin={isAdmin}
              onSelectBEO={setSelectedBEO}
              onEditReservation={(r) => { setEditingReservation(r); setShowReservationForm(true); }}
              onAddReservation={openReservationForm}
              onAddBEO={openBEOForm}
              onImport={() => setShowImportModal(true)}
              onViewCalendar={() => { setActiveTab('Calendar'); haptics.light(); }}
            />
          )
        ) : activeTab === 'Reservations' ? (
          <ReservationsTab
            reservations={reservations}
            isAdmin={isAdmin}
            onEdit={(r) => { setEditingReservation(r); setShowReservationForm(true); }}
            onRefresh={load}
            onAdd={openReservationForm}
            onImport={() => setShowImportModal(true)}
          />
        ) : activeTab === 'BEOs' ? (
          <BEOsTab
            beos={beos}
            isAdmin={isAdmin}
            onSelect={setSelectedBEO}
            onEdit={(b) => { setEditingBEO(b); setShowBEOForm(true); }}
            onRefresh={load}
            onAdd={openBEOForm}
            onImport={() => setShowImportModal(true)}
          />
        ) : activeTab === 'Calendar' ? (
          <CalendarTab
            reservations={reservations}
            beos={beos}
            onSelectBEO={setSelectedBEO}
            onAddEvent={openReservationForm}
          />
        ) : activeTab === 'Impact' ? (
          <PrepImpactTab
            beos={beos}
            reservations={reservations}
            isAdmin={isAdmin}
            onRefresh={load}
            onAddBEO={openBEOForm}
            onViewPrepPlanning={() => navigate('/prep-planning')}
          />
        ) : null}
      </div>

      {/* ── DESKTOP CONTENT ───────────────────────────────────────── */}
      <div className="hidden lg:block w-full pt-14 pb-10 space-y-3">
        {!loading && <OverviewCard reservations={reservations} beos={beos} />}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'Today' && (
              <TodayTab
                reservations={reservations}
                beos={beos}
                isAdmin={isAdmin}
                onSelectBEO={setSelectedBEO}
                onEditReservation={(r) => { setEditingReservation(r); setShowReservationForm(true); }}
                onAddReservation={openReservationForm}
                onAddBEO={openBEOForm}
                onImport={() => setShowImportModal(true)}
                onViewCalendar={() => { setActiveTab('Calendar'); haptics.light(); }}
              />
            )}
            {activeTab === 'Reservations' && (
              <ReservationsTab
                reservations={reservations}
                isAdmin={isAdmin}
                onEdit={(r) => { setEditingReservation(r); setShowReservationForm(true); }}
                onRefresh={load}
                onAdd={openReservationForm}
                onImport={() => setShowImportModal(true)}
              />
            )}
            {activeTab === 'BEOs' && (
              <BEOsTab
                beos={beos}
                isAdmin={isAdmin}
                onSelect={setSelectedBEO}
                onEdit={(b) => { setEditingBEO(b); setShowBEOForm(true); }}
                onRefresh={load}
                onAdd={openBEOForm}
                onImport={() => setShowImportModal(true)}
              />
            )}
            {activeTab === 'Calendar' && (
              <CalendarTab
                reservations={reservations}
                beos={beos}
                onSelectBEO={setSelectedBEO}
                onAddEvent={openReservationForm}
              />
            )}
            {activeTab === 'Impact' && (
              <PrepImpactTab
                beos={beos}
                reservations={reservations}
                isAdmin={isAdmin}
                onRefresh={load}
                onAddBEO={openBEOForm}
                onViewPrepPlanning={() => navigate('/prep-planning')}
              />
            )}
          </>
        )}
      </div>

      {/* Import modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onManualReservation={openReservationForm}
          onManualBEO={openBEOForm}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
