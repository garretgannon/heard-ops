import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { haptics } from '@/utils/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Beaker, Search, Plus, Edit2, Trash2, X, Download, ChevronRight,
  Upload, AlertTriangle, FileText, Shield, MapPin, Wrench, ClipboardList, Package,
  ChevronLeft, Link2, Users,
} from 'lucide-react';

const CARD_BG = 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)';
const CARD_GLASS = { background: CARD_BG, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.28)' };

// ─── Categories (no purple) ───────────────────────────────────────────────────
const CATEGORIES = {
  degreaser:    { label: 'Degreaser',    color: 'bg-orange-500/20 text-orange-400',   border: 'border-orange-500/30' },
  sanitizer:    { label: 'Sanitizer',    color: 'bg-green-500/20 text-green-400',     border: 'border-green-500/30' },
  delimer:      { label: 'Delimer',      color: 'bg-blue-500/20 text-blue-400',       border: 'border-blue-500/30' },
  disinfectant: { label: 'Disinfectant', color: 'bg-teal-500/20 text-teal-400',       border: 'border-teal-500/30' },
  floor_cleaner:{ label: 'Floor Cleaner',color: 'bg-slate-500/20 text-slate-400',     border: 'border-slate-500/30' },
  glass_cleaner:{ label: 'Glass Cleaner',color: 'bg-cyan-500/20 text-cyan-400',       border: 'border-cyan-500/30' },
  rinse_aid:    { label: 'Rinse Aid',    color: 'bg-sky-500/20 text-sky-400',         border: 'border-sky-500/30' },
  detergent:    { label: 'Detergent',    color: 'bg-rose-500/20 text-rose-400',       border: 'border-rose-500/30' },
  lubricant:    { label: 'Lubricant',    color: 'bg-amber-500/20 text-amber-400',     border: 'border-amber-500/30' },
  other:        { label: 'Other',        color: 'bg-muted text-muted-foreground',     border: 'border-border/40' },
};

const PPE_OPTIONS = ['Gloves', 'Apron', 'Goggles', 'Respirator', 'Face Shield', 'Boots'];

// ─── SDS status helpers ───────────────────────────────────────────────────────
function sdsInfo(chemical) {
  if (!chemical.sds_url) return { label: 'Missing', dot: 'bg-red-400', cls: 'text-red-400', badge: 'bg-red-500/15 text-red-400' };
  if (chemical.expiration_date) {
    const exp  = new Date(chemical.expiration_date);
    const now  = new Date();
    const days = Math.ceil((exp - now) / 86400000);
    if (days > 0 && days <= 60) return {
      label:   `Expiring Soon`,
      sub:     `Expires ${exp.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}`,
      dot:     'bg-amber-400',
      cls:     'text-amber-400',
      badge:   'bg-amber-500/15 text-amber-400',
    };
    if (days <= 0) return { label: 'Expired', dot: 'bg-red-400', cls: 'text-red-400', badge: 'bg-red-500/15 text-red-400' };
  }
  return { label: 'Attached', dot: 'bg-green-400', cls: 'text-green-400', badge: 'bg-green-500/15 text-green-400' };
}

// ─── PPE badge ────────────────────────────────────────────────────────────────
function PpeBadge({ ppe }) {
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
      {ppe}
    </span>
  );
}

// ─── Chemical detail panel (tabbed) ──────────────────────────────────────────
const DETAIL_TABS = ['Overview', 'SDS', 'Usage', 'Assignments'];

function ChemicalDetailPanel({ chemical, areas, stations, equipment, onClose, onEdit }) {
  const [tab, setTab] = useState('Overview');
  const cat           = CATEGORIES[chemical.category] || CATEGORIES.other;
  const sds           = sdsInfo(chemical);

  const areaNames   = (chemical.assigned_areas    || []).map(id => areas.find(a => a.id === id)?.name    || id);
  const stNames     = (chemical.assigned_stations || []).map(id => stations.find(s => s.id === id)?.name  || id);
  const equipNames  = (chemical.assigned_equipment|| []).map(id => equipment.find(e => e.id === id)?.name || id);
  const allLocations = [...areaNames, ...stNames];

  return (
    <div
      className="flex flex-col h-full border-l border-border/30"
      style={{ ...CARD_GLASS }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3 border-b border-border/20 shrink-0">
        <div className={cn('h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 text-lg', cat.color)}>
          <Beaker className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-black text-foreground truncate">{chemical.name}</p>
            {chemical.active !== false && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">Active</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{cat.label}</p>
          {chemical.vendor && <p className="text-[10px] text-muted-foreground/60 mt-0.5">Vendor {chemical.vendor}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(chemical)} className="h-10 w-10 rounded-2xl border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="h-10 w-10 rounded-2xl border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-3 border-b border-border/20">
        <div className="view-slider-container w-full max-w-sm">
          {DETAIL_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('view-slider-tab', tab === t && 'active')}
            >
              {t}
              <div className="view-slider-dot" />
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* ── Overview ─────────────────────────────────────────── */}
        {tab === 'Overview' && (
          <>
            {[
              { icon: Beaker,       label: 'Chemical Type', value: cat.label },
              { icon: FileText,     label: 'Dilution / Usage', value: chemical.dilution_ratio ? `1 oz per 1 gallon of water (${chemical.dilution_ratio})\n${chemical.dilution_instructions || 'Follow manufacturer instructions.'}` : chemical.dilution_instructions || '—' },
              { icon: Shield,       label: 'PPE Requirements', value: chemical.ppe_required?.length > 0 ? chemical.ppe_required.join(', ') : 'None specified' },
              { icon: Package,      label: 'Storage', value: [chemical.storage_location, chemical.storage_requirements].filter(Boolean).join(' · ') || '—' },
              { icon: AlertTriangle,label: 'First Aid', value: chemical.first_aid || '—' },
              { icon: Wrench,       label: 'Emergency', value: chemical.emergency_procedures || '—' },
            ].map(({ icon: Icon, label, value }) => value && value !== '—' && (
              <div key={label} className="flex items-start gap-3 py-2 border-b border-border/10 last:border-0">
                <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/50" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-0.5">{label}</p>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{value}</p>
                </div>
              </div>
            ))}
            {chemical.hazard_warnings && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400 mb-1">Hazard Warnings</p>
                <p className="text-xs text-red-300/80 leading-relaxed">{chemical.hazard_warnings}</p>
              </div>
            )}
          </>
        )}

        {/* ── SDS ─────────────────────────────────────────────── */}
        {tab === 'SDS' && (
          <>
            <div className={cn('flex items-center gap-2 p-3 rounded-2xl border', sds.dot === 'bg-green-400' ? 'bg-green-500/10 border-green-500/25' : 'bg-red-500/10 border-red-500/25')}>
              <div className={cn('h-2 w-2 rounded-full', sds.dot)} />
              <p className={cn('text-xs font-bold', sds.cls)}>{sds.label}</p>
              {sds.sub && <p className="text-[10px] text-muted-foreground ml-auto">{sds.sub}</p>}
            </div>
            {chemical.sds_url ? (
              <a
                href={chemical.sds_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/25 rounded-2xl hover:bg-blue-500/15 transition-colors"
              >
                <FileText className="h-5 w-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-400">View SDS / MSDS Document</p>
                  <p className="text-[10px] text-muted-foreground">Opens in new tab</p>
                </div>
                <Download className="h-4 w-4 text-blue-400 ml-auto" />
              </a>
            ) : (
              <div className="p-4 rounded-2xl border border-border/30 bg-white/[0.02] text-center">
                <FileText className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-bold text-foreground">No SDS attached</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Add an SDS URL in the chemical form.</p>
              </div>
            )}
            {chemical.expiration_date && (
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl border border-border/30 bg-white/[0.02]">
                <p className="text-xs text-muted-foreground">Expiration Date</p>
                <p className="text-xs font-bold text-foreground">{new Date(chemical.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            )}
          </>
        )}

        {/* ── Usage ───────────────────────────────────────────── */}
        {tab === 'Usage' && (
          <>
            {chemical.description && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-1.5">Description</p>
                <p className="text-xs text-foreground leading-relaxed">{chemical.description}</p>
              </div>
            )}
            {(chemical.dilution_ratio || chemical.dilution_instructions) && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-2xl">
                <p className="text-[10px] font-black text-blue-400 mb-1">
                  Dilution{chemical.dilution_ratio ? ` — 1:${chemical.dilution_ratio}` : ''}
                </p>
                {chemical.dilution_instructions && (
                  <p className="text-xs text-blue-300/80 leading-relaxed">{chemical.dilution_instructions}</p>
                )}
              </div>
            )}
            {chemical.ppe_required?.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Required PPE</p>
                <div className="flex flex-wrap gap-1.5">
                  {chemical.ppe_required.map(p => <PpeBadge key={p} ppe={p} />)}
                </div>
              </div>
            )}
            {!chemical.description && !chemical.dilution_ratio && !chemical.dilution_instructions && (
              <p className="text-xs text-muted-foreground">No usage instructions added.</p>
            )}
          </>
        )}

        {/* ── Assignments ──────────────────────────────────────── */}
        {tab === 'Assignments' && (
          <>
            {allLocations.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Used At Stations</p>
                <div className="flex flex-wrap gap-1.5">
                  {allLocations.map(name => (
                    <span key={name} className="text-[10px] font-bold px-2.5 py-1 rounded-2xl bg-white/[0.05] border border-border/40 text-foreground">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {equipNames.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">Linked Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                  {equipNames.map(name => (
                    <span key={name} className="text-[10px] font-bold px-2.5 py-1 rounded-2xl bg-white/[0.05] border border-border/40 text-foreground">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {allLocations.length === 0 && equipNames.length === 0 && (
              <p className="text-xs text-muted-foreground">Not assigned to any stations or equipment yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Chemical table row (desktop) ─────────────────────────────────────────────
function ChemicalRow({ chemical, areas, stations, onSelect, onEdit, onDelete, isSelected }) {
  const cat          = CATEGORIES[chemical.category] || CATEGORIES.other;
  const sds          = sdsInfo(chemical);
  const stNames      = (chemical.assigned_stations || []).map(id => stations.find(s => s.id === id)?.name).filter(Boolean);
  const areaNames    = (chemical.assigned_areas    || []).map(id => areas.find(a => a.id === id)?.name).filter(Boolean);
  const locations    = [...areaNames, ...stNames];
  const topLocations = locations.slice(0, 2);
  const extraCount   = locations.length - 2;

  return (
    <div
      className={cn(
        'flex items-center gap-0 border-b border-border/15 hover:bg-white/[0.02] transition-colors cursor-pointer',
        isSelected && 'bg-primary/5',
      )}
      onClick={() => onSelect(chemical)}
    >
      <div className="hidden lg:grid flex-1 items-center gap-3 px-4 py-3"
        style={{ gridTemplateColumns: '3fr 110px 130px 160px 140px 80px 90px' }}>
        {/* Chemical */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('h-7 w-7 rounded-2xl flex items-center justify-center shrink-0', cat.color)}>
            <Beaker className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{chemical.name}</p>
            {chemical.vendor && <p className="text-[9px] text-muted-foreground/60 truncate">{chemical.vendor}</p>}
          </div>
        </div>

        {/* Type */}
        <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full w-fit', cat.color)}>
          {cat.label}
        </span>

        {/* SDS Status */}
        <div className="flex items-start gap-1.5">
          <div className={cn('h-1.5 w-1.5 rounded-full mt-1 shrink-0', sds.dot)} />
          <div>
            <p className={cn('text-[10px] font-bold', sds.cls)}>{sds.label}</p>
            {sds.sub && <p className="text-[9px] text-muted-foreground">{sds.sub}</p>}
          </div>
        </div>

        {/* Used At */}
        <div className="min-w-0">
          {topLocations.length > 0 ? (
            <>
              <p className="text-[10px] text-foreground font-bold truncate">{topLocations.join(', ')}</p>
              {extraCount > 0 && <p className="text-[9px] text-muted-foreground">{locations.length} stations</p>}
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground/40">Not assigned</p>
          )}
        </div>

        {/* Vendor */}
        <div className="min-w-0">
          {chemical.vendor ? (
            <>
              <p className="text-[10px] text-foreground truncate">{chemical.vendor}</p>
              {chemical.vendor_contact && <p className="text-[9px] text-muted-foreground/60 truncate">{chemical.vendor_contact}</p>}
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground/40">—</p>
          )}
        </div>

        {/* PPE */}
        <div className="flex flex-wrap gap-0.5">
          {(chemical.ppe_required || []).slice(0, 2).map(p => (
            <span key={p} className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-400">{p.slice(0, 3)}</span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onSelect(chemical)}
            className="h-9 px-2 rounded-2xl bg-white/[0.05] border border-border/30 text-[10px] font-bold text-foreground hover:bg-white/[0.08] transition-colors"
          >
            View
          </button>
          <button
            onClick={() => onDelete(chemical.id)}
            className="h-9 w-9 rounded-2xl flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Mobile row */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 w-full">
        <div className={cn('h-8 w-8 rounded-2xl flex items-center justify-center shrink-0', cat.color)}>
          <Beaker className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{chemical.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full', cat.color)}>{cat.label}</span>
            <div className="flex items-center gap-1">
              <div className={cn('h-1.5 w-1.5 rounded-full', sds.dot)} />
              <span className={cn('text-[9px] font-bold', sds.cls)}>{sds.label}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyChemicals({ onAdd, isAdmin }) {
  return (
    <>
      {/* ── MOBILE empty state (matches screenshot) ─────────────────── */}
      <div className="lg:hidden flex flex-col items-center px-4 pt-4 pb-16 text-center">
        {/* Flask icon with orange diamond sparkle dots */}
        <div className="relative mb-5 mt-3">
          <span className="absolute -top-4 right-5 h-3 w-3 rotate-45 rounded-sm bg-primary/70" />
          <span className="absolute -top-1 right-0 h-2 w-2 rotate-45 rounded-sm bg-primary/45" />
          <Beaker className="h-24 w-24 text-muted-foreground/35" strokeWidth={1.2} />
        </div>
        <h2 className="text-[21px] font-black text-foreground mb-3">No chemicals added yet</h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-7 max-w-[300px]">
          Add chemicals to connect SDS sheets, usage instructions, PPE requirements, and safety notes to the stations and equipment where they are used.
        </p>

        {/* 2×2 action card grid */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-3 w-full mb-8">
            {/* Add Chemical — orange */}
            <button
              onClick={onAdd}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-5 px-3 text-white active:scale-[0.97] transition-all"
              style={{ background: 'linear-gradient(160deg, #CC4400 0%, #0055AA 100%)', border: '1px solid rgba(255,107,0,0.45)' }}
            >
              <Plus className="h-7 w-7 mb-0.5" />
              <span className="text-[14px] font-black leading-tight">Add Chemical</span>
              <span className="text-[11px] font-normal opacity-70">Manual entry</span>
            </button>
            {/* Upload SDS */}
            <button onClick={onAdd} className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-5 px-3 text-foreground active:scale-[0.97] transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <Upload className="h-7 w-7 mb-0.5 text-muted-foreground" />
              <span className="text-[14px] font-black leading-tight">Upload SDS</span>
              <span className="text-[11px] text-muted-foreground font-normal">Attach PDF</span>
            </button>
            {/* Import List */}
            <button onClick={onAdd} className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-5 px-3 text-foreground active:scale-[0.97] transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <ClipboardList className="h-7 w-7 mb-0.5 text-muted-foreground" />
              <span className="text-[14px] font-black leading-tight">Import List</span>
              <span className="text-[11px] text-muted-foreground font-normal">CSV or Spreadsheet</span>
            </button>
            {/* Link to Equipment */}
            <button onClick={onAdd} className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-5 px-3 text-foreground active:scale-[0.97] transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <Link2 className="h-7 w-7 mb-0.5 text-muted-foreground" />
              <span className="text-[14px] font-black leading-tight">Link to Equipment</span>
              <span className="text-[11px] text-muted-foreground font-normal">Connect to stations</span>
            </button>
          </div>
        )}

        {/* WHY THIS MATTERS */}
        <div className="w-full text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-4">Why this matters</p>
          <div className="space-y-3.5">
            {[
              { icon: Shield,       label: 'Centralize SDS and safety documents' },
              { icon: ClipboardList,label: 'Track usage and storage by location' },
              { icon: Users,        label: 'Ensure compliance and team safety' },
              { icon: Link2,        label: 'Connect to equipment and stations' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span className="text-[13px] text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DESKTOP empty state (original card layout) ──────────────── */}
      <div
        className="hidden lg:block overflow-hidden rounded-2xl border border-border/40"
        style={{ ...CARD_GLASS }}
      >
        <div className="flex flex-col items-center px-5 py-8 text-center">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full bg-white/[0.04] border border-border/30 flex items-center justify-center">
              <Beaker className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <div className="absolute -top-1 -right-0.5 h-2 w-2 rounded-full bg-primary/60" />
            <div className="absolute top-1 -left-2 h-1.5 w-1.5 rounded-full bg-primary/30" />
          </div>
          <h3 className="text-base font-black text-foreground mb-1">No chemicals added yet.</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed mb-5">
            Add chemicals to connect SDS sheets, usage instructions, PPE requirements, and safety notes to the stations and equipment where they are used.
          </p>
          {isAdmin && (
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              <button onClick={onAdd} className="btn-primary flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3">
                <div className="flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /><span className="text-xs font-bold">Add Chemical</span></div>
                <span className="text-[10px] opacity-70 font-normal">Manual entry</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3 rounded-2xl bg-white/[0.05] border border-border/40 text-foreground hover:bg-white/[0.07] transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-bold">Upload SDS</span></div>
                <span className="text-[10px] text-muted-foreground font-normal">Attach PDF document</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3 rounded-2xl bg-white/[0.05] border border-border/40 text-foreground hover:bg-white/[0.07] transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-bold">Import Chemical List</span></div>
                <span className="text-[10px] text-muted-foreground font-normal">CSV or spreadsheet</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-0.5 h-auto py-2.5 px-3 rounded-2xl bg-white/[0.05] border border-border/40 text-foreground hover:bg-white/[0.07] transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-bold">Link to Equipment</span></div>
                <span className="text-[10px] text-muted-foreground font-normal">Connect to stations</span>
              </button>
            </div>
          )}
        </div>
        <div className="border-t border-border/20 px-5 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 mb-3">Why This Matters</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            {[
              { icon: MapPin,        label: 'Areas & Stations',    desc: 'Assign chemicals to the exact stations where they are used' },
              { icon: Wrench,        label: 'Equipment',           desc: 'Link chemicals to dish machines, fryers, and other equipment' },
              { icon: ClipboardList, label: 'Cleaning Checklists', desc: 'Cleaning tasks can reference required chemicals and SDS links' },
              { icon: AlertTriangle, label: 'Safety Checks',       desc: 'PPE requirements and hazard warnings flow to safety tasks' },
              { icon: Package,       label: 'Inventory',           desc: 'Track chemicals as purchased items with costs and par levels' },
              { icon: FileText,      label: 'SDS / MSDS',          desc: 'Attach safety data sheets to every active chemical' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/70" />
                <div>
                  <p className="text-[11px] font-bold text-foreground leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Chemical form (preserved from original) ──────────────────────────────────
function ChemicalForm({ chemical, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', category: 'sanitizer', vendor: '', vendor_contact: '', vendor_phone: '',
    sds_url: '', description: '', dilution_ratio: '', dilution_instructions: '',
    hazard_warnings: '', emergency_procedures: '', first_aid: '', storage_requirements: '',
    storage_location: '', expiration_date: '', batch_number: '', container_size: '',
    active: true, notes: '',
    ...chemical,
    ppe_required:        Array.isArray(chemical?.ppe_required)        ? chemical.ppe_required        : [],
    assigned_areas:      Array.isArray(chemical?.assigned_areas)      ? chemical.assigned_areas      : [],
    assigned_stations:   Array.isArray(chemical?.assigned_stations)   ? chemical.assigned_stations   : [],
    assigned_equipment:  Array.isArray(chemical?.assigned_equipment)  ? chemical.assigned_equipment  : [],
  });
  const [areas,     setAreas]     = useState([]);
  const [stations,  setStations]  = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Area.list('name', 100).catch(() => []),
      base44.entities.Station.list('name', 100).catch(() => []),
      base44.entities.Equipment.list('name', 100).catch(() => []),
    ]).then(([a, s, e]) => { setAreas(a); setStations(s); setEquipment(e); });
  }, []);

  const set       = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (k, v) => setForm(p => ({ ...p, [k]: p[k]?.includes(v) ? p[k].filter(x => x !== v) : [...(p[k] || []), v] }));

  const save = async () => {
    if (!form.name.trim()) { toast.error('Chemical name is required'); return; }
    setSaving(true);
    try {
      if (chemical?.id) {
        await base44.entities.Chemical.update(chemical.id, form);
      } else {
        await base44.entities.Chemical.create(form);
      }
      haptics.success();
      onSave?.();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save chemical');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 bg-background border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary/50';
  const labelCls = 'block text-xs font-bold text-foreground mb-1';

  return (
    <>
      <div className="hidden lg:block fixed inset-0 bg-black/50 z-[99]" onClick={onClose} />
      <div className="fixed inset-0 bg-background z-[100] flex flex-col lg:inset-auto lg:right-0 lg:top-0 lg:bottom-0 lg:w-[520px] lg:bg-card lg:border-l lg:border-border"
        style={{ boxShadow: '-8px 0 48px rgba(0,0,0,0.5)' }}>
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="flex items-center gap-1 h-8 px-3 rounded-full bg-muted text-sm font-semibold text-foreground lg:hidden">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-sm font-extrabold text-foreground">{chemical ? 'Edit Chemical' : 'New Chemical'}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-2xl bg-muted flex items-center justify-center hidden lg:flex"><X className="h-4 w-4" /></button>
          <div className="w-16 lg:hidden" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-4">
          <div className="space-y-2"><label className={labelCls}>Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Chemical name" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Category *</label><select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label className={labelCls}>Vendor</label><input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Vendor name" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Vendor Contact</label><input value={form.vendor_contact} onChange={e => set('vendor_contact', e.target.value)} placeholder="Contact" className={inputCls} /></div>
            <div><label className={labelCls}>Vendor Phone</label><input value={form.vendor_phone} onChange={e => set('vendor_phone', e.target.value)} placeholder="Phone" className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>SDS/MSDS PDF URL</label><input value={form.sds_url} onChange={e => set('sds_url', e.target.value)} placeholder="https://…" className={inputCls} /></div>
          <div><label className={labelCls}>Description / Usage</label><textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="How to use…" rows={2} className={cn(inputCls, 'resize-none')} /></div>
          <div className="border-t border-border pt-3">
            <p className="text-xs font-bold text-foreground mb-2">Dilution</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input value={form.dilution_ratio} onChange={e => set('dilution_ratio', e.target.value)} placeholder="e.g., 1:10" className={inputCls} />
              <input value={form.container_size} onChange={e => set('container_size', e.target.value)} placeholder="e.g., 5L" className={inputCls} />
            </div>
            <textarea value={form.dilution_instructions} onChange={e => set('dilution_instructions', e.target.value)} placeholder="Detailed dilution steps…" rows={2} className={cn(inputCls, 'resize-none')} />
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs font-bold text-foreground mb-2">Required PPE</p>
            <div className="flex flex-wrap gap-1">
              {PPE_OPTIONS.map(ppe => (
                <button key={ppe} onClick={() => toggleArr('ppe_required', ppe)} className={cn('text-xs px-2.5 py-1 rounded-full font-semibold transition-all', form.ppe_required?.includes(ppe) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70')}>{ppe}</button>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs font-bold text-foreground mb-2">Hazard & Safety</p>
            <textarea value={form.hazard_warnings} onChange={e => set('hazard_warnings', e.target.value)} placeholder="Health hazards, warnings…" rows={2} className={cn(inputCls, 'resize-none mb-2')} />
            <textarea value={form.emergency_procedures} onChange={e => set('emergency_procedures', e.target.value)} placeholder="Spill/emergency procedures…" rows={2} className={cn(inputCls, 'resize-none mb-2')} />
            <textarea value={form.first_aid} onChange={e => set('first_aid', e.target.value)} placeholder="First aid instructions…" rows={2} className={cn(inputCls, 'resize-none')} />
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs font-bold text-foreground mb-2">Storage</p>
            <textarea value={form.storage_requirements} onChange={e => set('storage_requirements', e.target.value)} placeholder="Storage conditions…" rows={1} className={cn(inputCls, 'resize-none mb-2')} />
            <input value={form.storage_location} onChange={e => set('storage_location', e.target.value)} placeholder="Current location" className={cn(inputCls, 'mb-2')} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.expiration_date} onChange={e => set('expiration_date', e.target.value)} className={inputCls} />
              <input value={form.batch_number} onChange={e => set('batch_number', e.target.value)} placeholder="Batch #" className={inputCls} />
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs font-bold text-foreground mb-1">Assignments</p>
            <p className="mb-3 text-[11px] leading-4 text-muted-foreground">Link to the areas and stations where this chemical is used.</p>
            {areas.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Areas</p>
                <div className="flex flex-wrap gap-1.5">{areas.map(a => <button key={a.id} onClick={() => toggleArr('assigned_areas', a.id)} className={cn('min-h-7 rounded-full px-2.5 py-1 text-[10px] font-semibold', form.assigned_areas?.includes(a.id) ? 'bg-blue-500/20 text-blue-300' : 'bg-muted text-muted-foreground')}>{a.name}</button>)}</div>
              </div>
            )}
            {stations.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Stations</p>
                <div className="flex flex-wrap gap-1.5">{stations.map(s => <button key={s.id} onClick={() => toggleArr('assigned_stations', s.id)} className={cn('min-h-7 rounded-full px-2.5 py-1 text-[10px] font-semibold', form.assigned_stations?.includes(s.id) ? 'bg-green-500/20 text-green-300' : 'bg-muted text-muted-foreground')}>{s.name}</button>)}</div>
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 bg-card border-t border-border px-4 py-3 flex gap-2 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button onClick={save} disabled={saving} className="flex-1 btn-primary text-sm h-10">{saving ? '…' : 'Save'}</button>
          <button onClick={onClose} className="flex-1 h-10 rounded-2xl border border-border/50 text-sm font-bold text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function ChemicalLibrary() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const [chemicals,  setChemicals]  = useState([]);
  const [areas,      setAreas]      = useState([]);
  const [stations,   setStations]   = useState([]);
  const [equipment,  setEquipment]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterCat,  setFilterCat]  = useState('all');
  const [selected,   setSelected]   = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [page,       setPage]       = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const [chems, a, s, e] = await Promise.all([
      base44.entities.Chemical.list('name', 200).catch(() => []),
      base44.entities.Area.list('name', 100).catch(() => []),
      base44.entities.Station.list('name', 100).catch(() => []),
      base44.entities.Equipment.list('name', 100).catch(() => []),
    ]);
    setChemicals(chems);
    setAreas(a);
    setStations(s);
    setEquipment(e);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const active   = chemicals.filter(c => c.active !== false);
  const filtered = useMemo(() => active.filter(c => {
    if (filterCat !== 'all' && c.category !== filterCat) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [active, filterCat, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary stats
  const stats = useMemo(() => {
    const withSDS   = active.filter(c => c.sds_url).length;
    const missing   = active.filter(c => !c.sds_url).length;
    const now       = new Date();
    const in60      = new Date(); in60.setDate(now.getDate() + 60);
    const expiring  = active.filter(c => {
      if (!c.expiration_date) return false;
      const d = new Date(c.expiration_date);
      return d > now && d <= in60;
    }).length;
    const stSet = new Set(active.flatMap(c => [...(c.assigned_areas || []), ...(c.assigned_stations || [])]));
    return { total: active.length, withSDS, missing, expiring, assigned: stSet.size };
  }, [active]);

  // Top stations
  const topStations = useMemo(() => {
    const counts = {};
    active.forEach(c => {
      [...(c.assigned_areas || []), ...(c.assigned_stations || [])].forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    const maxCount = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({
        name:  stations.find(s => s.id === id)?.name || areas.find(a => a.id === id)?.name || 'Unknown',
        count,
        pct:   Math.round((count / maxCount) * 100),
      }));
  }, [active, stations, areas]);

  const recently = active.slice(-3).reverse();

  const handleSave  = async () => { await load(); setShowForm(false); setEditing(null); };
  const handleDelete = async id => {
    if (!confirm('Delete this chemical?')) return;
    await base44.entities.Chemical.delete(id).catch(() => {});
    haptics.success();
    await load();
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="app-screen">
      <DesktopPageHeader
        title="Chemical Safety"
        subtitle="SDS documents, usage instructions, PPE, and station assignments."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search chemicals…" className="w-48 pl-9 pr-3 py-2 card-glass border border-border rounded-2xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
            </div>
            {isAdmin && (
              <>
                <button
                  onClick={() => { setEditing(null); setShowForm(true); haptics.medium(); }}
                  className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Chemical
                </button>
                <button className="h-8 px-3 rounded-2xl border border-border/60 card-glass text-xs font-bold text-muted-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95">
                  <Upload className="h-3.5 w-3.5" /> Upload SDS
                </button>
              </>
            )}
          </div>
        }
      />

      {/* ── MOBILE STICKY HEADER (search + filters only — Layout handles back/title) */}
      <div className="lg:hidden sticky top-0 z-20 -mx-4 ">
        {/* Search */}
        <div className="px-4 pt-2 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search chemicals..."
              className="w-full pl-10 pr-3 py-2.5 rounded-2xl text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>
        {/* Filter chips */}
        <div className="w-full overflow-x-auto no-scrollbar px-4 pb-3">
          <div className="pill-slider-container">
            <button
              onClick={() => { setFilterCat('all'); setPage(1); }}
              className={cn('glass-pill', filterCat === 'all' && 'glow-active')}
            >
              All
            </button>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <button
                key={k}
                onClick={() => { setFilterCat(k); setPage(1); }}
                className={cn('glass-pill', filterCat === k && 'glow-active')}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── DESKTOP STICKY FILTER CHIPS ───────────────────────────────── */}
      <div
        className="hidden lg:block bg-card border-b border-border sticky top-[112px] z-20 px-4 py-2.5"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)' }}
      >
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className="pill-slider-container">
            <button onClick={() => { setFilterCat('all'); setPage(1); }} className={cn('glass-pill', filterCat === 'all' && 'glow-active')}>All</button>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <button key={k} onClick={() => { setFilterCat(k); setPage(1); }} className={cn('glass-pill', filterCat === k && 'glow-active')}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 lg:pt-14 pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : active.length === 0 ? (
          <EmptyChemicals onAdd={() => { setEditing(null); setShowForm(true); }} isAdmin={isAdmin} />
        ) : (
          <div className={cn('space-y-4', selected ? 'lg:grid lg:grid-cols-[1fr_380px] lg:gap-4 lg:space-y-0' : '')}>
            {/* ── Left column ──────────────────────────────────── */}
            <div className="space-y-4 min-w-0">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                  { label: 'Chemicals Added',  value: stats.total,   sub: 'Active chemicals',    color: 'text-foreground' },
                  { label: 'SDS Attached',      value: stats.withSDS, sub: `${stats.total > 0 ? Math.round(stats.withSDS / stats.total * 100) : 0}% with SDS`, color: 'text-green-400' },
                  { label: 'SDS Missing',       value: stats.missing, sub: 'Need documents',      color: stats.missing > 0 ? 'text-red-400' : 'text-foreground' },
                  { label: 'Expiring Soon',     value: stats.expiring,sub: 'In 60 days',          color: stats.expiring > 0 ? 'text-amber-400' : 'text-foreground' },
                  { label: 'Assigned Stations', value: stats.assigned,sub: 'Across all areas',    color: stats.assigned > 0 ? 'text-blue-400' : 'text-foreground' },
                  { label: 'Safety Checks Due', value: stats.expiring + stats.missing > 3 ? Math.floor((stats.expiring + stats.missing) / 3) : stats.expiring, sub: 'This week', color: 'text-muted-foreground' },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="card-glass border border-border/60 rounded-2xl px-3 py-3" style={{ ...CARD_GLASS }}>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-0.5">{label}</p>
                    <p className={cn('text-xl font-extrabold', color)}>{value}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-border/40" style={{ ...CARD_GLASS }}>
                {/* Desktop table header */}
                <div className="hidden lg:grid px-4 py-2.5 border-b border-border/20"
                  style={{ gridTemplateColumns: '3fr 110px 130px 160px 140px 80px 90px' }}>
                  {['Chemical', 'Type', 'SDS Status', 'Used At', 'Vendor', 'PPE', 'Actions'].map(h => (
                    <p key={h} className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{h}</p>
                  ))}
                </div>

                {paged.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-xs text-muted-foreground">No chemicals match your search.</p>
                  </div>
                ) : (
                  paged.map(c => (
                    <ChemicalRow
                      key={c.id}
                      chemical={c}
                      areas={areas}
                      stations={stations}
                      isSelected={selected?.id === c.id}
                      onSelect={chem => setSelected(prev => prev?.id === chem.id ? null : chem)}
                      onEdit={chem => { setEditing(chem); setShowForm(true); }}
                      onDelete={handleDelete}
                    />
                  ))
                )}

                {/* Pagination */}
                {pageCount > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
                    <p className="text-[10px] text-muted-foreground">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-7 w-7 rounded-2xl border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">‹</button>
                      {Array.from({ length: Math.min(pageCount, 4) }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} className={cn('h-7 w-7 rounded-2xl border text-xs font-bold', p === page ? 'bg-primary border-primary text-white' : 'border-border/40 text-muted-foreground hover:text-foreground')}>{p}</button>
                      ))}
                      <button disabled={page === pageCount} onClick={() => setPage(p => p + 1)} className="h-7 w-7 rounded-2xl border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">›</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom sections */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Recently Added */}
                <div className="overflow-hidden rounded-2xl border border-border/40" style={{ ...CARD_GLASS }}>
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Recently Added Chemicals</p>
                    <button onClick={() => setFilterCat('all')} className="text-[10px] font-bold text-primary hover:underline">View All</button>
                  </div>
                  <div className="divide-y divide-border/15">
                    {recently.map(c => {
                      const cat = CATEGORIES[c.category] || CATEGORIES.other;
                      const sds = sdsInfo(c);
                      const stNms = (c.assigned_stations || []).map(id => stations.find(s => s.id === id)?.name).filter(Boolean);
                      return (
                        <button key={c.id} onClick={() => setSelected(c)} className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-white/[0.02]">
                          <div className={cn('h-8 w-8 rounded-2xl flex items-center justify-center shrink-0', cat.color)}>
                            <Beaker className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                              <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0', cat.color)}>{cat.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className={cn('h-1.5 w-1.5 rounded-full', sds.dot)} />
                              <span className={cn('text-[9px] font-bold', sds.cls)}>{sds.label}</span>
                              {stNms.length > 0 && <span className="text-[9px] text-muted-foreground">· {stNms[0]}{stNms.length > 1 ? ` +${stNms.length - 1}` : ''}</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Top Stations */}
                <div className="overflow-hidden rounded-2xl border border-border/40" style={{ ...CARD_GLASS }}>
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Top Stations Using Chemicals</p>
                    <button className="text-[10px] font-bold text-primary hover:underline">View All</button>
                  </div>
                  {topStations.length === 0 ? (
                    <div className="px-4 pb-4 text-center">
                      <p className="text-xs text-muted-foreground">Assign chemicals to stations to see usage.</p>
                    </div>
                  ) : (
                    <div className="px-4 pb-4 space-y-3">
                      {topStations.map(({ name, count, pct }) => (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground/50" />
                              <p className="text-xs font-bold text-foreground">{name}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{count} chemical{count !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right: detail panel ───────────────────────────── */}
            {selected && (
              <div className="hidden lg:flex flex-col rounded-2xl border border-border/40 overflow-hidden sticky top-[160px] max-h-[calc(100vh-180px)]" style={{ ...CARD_GLASS }}>
                <ChemicalDetailPanel
                  chemical={selected}
                  areas={areas}
                  stations={stations}
                  equipment={equipment}
                  onClose={() => setSelected(null)}
                  onEdit={chem => { setEditing(chem); setShowForm(true); }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile detail sheet */}
      {selected && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full h-[85vh] bg-card border-t border-border rounded-t-2xl overflow-hidden flex flex-col">
            <ChemicalDetailPanel
              chemical={selected}
              areas={areas}
              stations={stations}
              equipment={equipment}
              onClose={() => setSelected(null)}
              onEdit={chem => { setEditing(chem); setShowForm(true); setSelected(null); }}
            />
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <ChemicalForm
          chemical={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
