import { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Download, Search, Bell, Filter, Grid3x3, LayoutTemplate,
  RefreshCw, X, Check, Plus, Keyboard, Expand, Minimize
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

import ScheduleGrid from '@/components/schedule/ScheduleGrid';
import ShiftDetailDrawer from '@/components/schedule/ShiftDetailDrawer';
import BulkActionToolbar from '@/components/schedule/BulkActionToolbar';
import QuickAddShiftModal from '@/components/schedule/QuickAddShiftModal';
import MassAddModal from '@/components/schedule/MassAddModal';
import ShiftContextMenu from '@/components/schedule/ShiftContextMenu';
import RequestOffPanel from '@/components/schedule/RequestOffPanel';

const FAKE_EMPLOYEES = [
  { id: '1', name: 'Alex R.', role: 'Manager', email: 'alex@heard.com' },
  { id: '2', name: 'Jamie L.', role: 'Sous Chef', email: 'jamie@heard.com' },
  { id: '3', name: 'Taylor S.', role: 'Bartender', email: 'taylor@heard.com' },
  { id: '4', name: 'Morgan K.', role: 'Server', email: 'morgan@heard.com' },
  { id: '5', name: 'Casey M.', role: 'Line Cook', email: 'casey@heard.com' },
];

export default function ScheduleCenter() {
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState('weekly');
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const [selectedShiftDetail, setSelectedShiftDetail] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [quickAdd, setQuickAdd] = useState(null);
  const [showMassAdd, setShowMassAdd] = useState(false);
  const [showRequestOff, setShowRequestOff] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [groupBy, setGroupBy] = useState('employee');
  const [filterDepts, setFilterDepts] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i)), [currentWeek]);

  // ── Data Loading ──────────────────────────────────────────────────────────
  const loadScheduleData = useCallback(async () => {
    setLoading(true);
    const [shiftsData, rawEmployees, timeOff, avail] = await Promise.all([
      base44.entities.StaffShift.list('-created_date', 500).catch(() => []),
      base44.entities.Employee?.list?.('-created_date', 200).catch(() => []),
      base44.entities.TimeOffRequest?.list?.('-created_date', 200).catch(() => []),
      base44.entities.EmployeeAvailability?.list?.().catch(() => []),
    ]);
    setShifts(shiftsData);
    setTimeOffRequests(timeOff);
    setAvailability(avail);
    const normalized = (rawEmployees || []).map(e => ({
      id: e.id,
      name: e.data?.full_name || e.full_name || e.name || 'Unknown',
      email: e.data?.email || e.email || '',
      role: e.data?.primary_role || e.data?.job_code || e.role || '',
    }));
    const shiftNames = [...new Set(shiftsData.map(s => s.employee_name).filter(Boolean))];
    const extra = shiftNames
      .filter(name => !normalized.find(e => e.name === name))
      .map((name, i) => ({ id: `shift-emp-${i}`, name, email: shiftsData.find(s => s.employee_name === name)?.employee_email || '', role: shiftsData.find(s => s.employee_name === name)?.role || '' }));
    const merged = normalized.length > 0 ? [...normalized, ...extra] : [...extra, ...FAKE_EMPLOYEES];
    setEmployees(merged.slice(0, Math.max(merged.length, extra.length)));
    setLoading(false);
  }, []);

  useEffect(() => { loadScheduleData(); }, [currentWeek, loadScheduleData]);

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  const pushUndo = (action) => {
    setUndoStack(p => [...p, action]);
    setRedoStack([]);
  };

  const applyAction = async (action) => {
    if (action.type === 'create') await base44.entities.StaffShift.create(action.data);
    else if (action.type === 'delete') await base44.entities.StaffShift.delete(action.shiftId);
    else if (action.type === 'update') await base44.entities.StaffShift.update(action.shiftId, action.data);
    else if (action.type === 'bulk_create') await Promise.all(action.shifts.map(s => base44.entities.StaffShift.create(s)));
    else if (action.type === 'bulk_delete') await Promise.all(action.shiftIds.map(id => base44.entities.StaffShift.delete(id)));
  };

  const reverseAction = (action) => {
    if (action.type === 'create') return { type: 'delete', shiftId: action.shiftId };
    if (action.type === 'delete') return { type: 'create', data: action.data };
    if (action.type === 'update') return { type: 'update', shiftId: action.shiftId, data: action.prevData };
    if (action.type === 'bulk_create') return { type: 'bulk_delete', shiftIds: action.shiftIds };
    if (action.type === 'bulk_delete') return { type: 'bulk_create', shifts: action.shifts };
    return action;
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack(p => p.slice(0, -1));
    const rev = reverseAction(action);
    setRedoStack(p => [...p, reverseAction(rev)]);
    await applyAction(rev);
    await loadScheduleData();
    toast.info('Undone');
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setRedoStack(p => p.slice(0, -1));
    setUndoStack(p => [...p, reverseAction(action)]);
    await applyAction(action);
    await loadScheduleData();
    toast.info('Redone');
  };

  // ── Drag and Drop ─────────────────────────────────────────────────────────
  const handleDragEnd = async (result) => {
    if (!result.destination || result.source.droppableId === result.destination.droppableId) return;
    const shiftId = result.draggableId;
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;

    const [destEmpId, destDayIdxStr] = result.destination.droppableId.split('__');
    const destEmployee = employees.find(e => e.id === destEmpId);
    const destDay = weekDays[parseInt(destDayIdxStr)];
    if (!destEmployee || !destDay) return;

    const updates = {
      employee_name: destEmployee.name,
      employee_email: destEmployee.email,
      date: format(destDay, 'yyyy-MM-dd'),
    };

    const prevData = { employee_name: shift.employee_name, employee_email: shift.employee_email, date: shift.date };
    pushUndo({ type: 'update', shiftId, data: updates, prevData });

    // Check for time-off conflict
    const dateStr = format(destDay, 'yyyy-MM-dd');
    const hasApprovedOff = timeOffRequests.some(r => r.employee_email === destEmployee.email && r.status === 'approved' && dateStr >= r.start_date && dateStr <= r.end_date);
    if (hasApprovedOff) toast.warning(`${destEmployee.name} has approved time off on this day`);

    await base44.entities.StaffShift.update(shiftId, updates);
    await loadScheduleData();
  };

  // ── Add Shift ─────────────────────────────────────────────────────────────
  const handleAddShift = async (data) => {
    const created = await base44.entities.StaffShift.create({ ...data, status: 'draft' });
    pushUndo({ type: 'create', shiftId: created.id, data });
    setQuickAdd(null);
    await loadScheduleData();
    toast.success('Shift added');
  };

  const handleMassAdd = async (shiftsToAdd) => {
    const created = await Promise.all(shiftsToAdd.map(s => base44.entities.StaffShift.create({ ...s, status: 'draft' })));
    pushUndo({ type: 'bulk_create', shifts: shiftsToAdd, shiftIds: created.map(c => c.id) });
    setShowMassAdd(false);
    await loadScheduleData();
    toast.success(`Added ${created.length} shifts`);
  };

  // ── Copy / Paste / Duplicate ──────────────────────────────────────────────
  const handleCopyShift = useCallback((shift) => {
    setClipboard(shift);
    toast.success('Shift copied');
  }, []);

  const handlePasteShift = useCallback(async (employee, day) => {
    if (!clipboard) return;
    const data = {
      start_time: clipboard.start_time,
      end_time: clipboard.end_time,
      role: clipboard.role,
      station: clipboard.station,
      notes: clipboard.notes,
      employee_name: employee.name,
      employee_email: employee.email,
      date: format(day, 'yyyy-MM-dd'),
      status: 'draft',
    };
    const created = await base44.entities.StaffShift.create(data);
    pushUndo({ type: 'create', shiftId: created.id, data });
    await loadScheduleData();
    toast.success('Shift pasted');
  }, [clipboard, loadScheduleData]);

  const handleDuplicateShift = async (shift, opts = {}) => {
    const { acrossWeek, nextDay } = opts;
    const days = acrossWeek ? weekDays : nextDay ? [addDays(parseISO(shift.date), 1)] : [parseISO(shift.date)];
    const shiftsToCreate = days.map(d => ({
      start_time: shift.start_time,
      end_time: shift.end_time,
      role: shift.role,
      station: shift.station,
      notes: shift.notes,
      employee_name: shift.employee_name,
      employee_email: shift.employee_email,
      date: format(d, 'yyyy-MM-dd'),
      status: 'draft',
    }));
    const created = await Promise.all(shiftsToCreate.map(s => base44.entities.StaffShift.create(s)));
    pushUndo({ type: 'bulk_create', shifts: shiftsToCreate, shiftIds: created.map(c => c.id) });
    await loadScheduleData();
    toast.success(`Duplicated ${created.length} shift(s)`);
  };

  const handleDuplicateSelected = () => {
    const selected = shifts.filter(s => selectedShiftIds.includes(s.id));
    selected.forEach(s => handleDuplicateShift(s, { nextDay: true }));
  };

  // ── Delete Shifts ─────────────────────────────────────────────────────────
  const handleDeleteShifts = async (ids) => {
    const toDelete = shifts.filter(s => ids.includes(s.id));
    pushUndo({ type: 'bulk_delete', shiftIds: ids, shifts: toDelete });
    await Promise.all(ids.map(id => base44.entities.StaffShift.delete(id)));
    setSelectedShiftIds([]);
    await loadScheduleData();
    toast.success(`Deleted ${ids.length} shift(s)`);
  };

  const handleDeleteSelected = () => handleDeleteShifts(selectedShiftIds);

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    const drafts = shifts.filter(s => s.status === 'draft');
    if (drafts.length === 0) { toast.info('No draft shifts to publish'); setPublishing(false); return; }
    if (!confirm(`Publish ${drafts.length} draft shifts?`)) { setPublishing(false); return; }
    await Promise.all(drafts.map(s => base44.entities.StaffShift.update(s.id, { status: 'published' })));
    toast.success(`Published ${drafts.length} shifts`);
    await loadScheduleData();
    setPublishing(false);
  };

  const handlePublishSelected = async () => {
    const ids = selectedShiftIds;
    await Promise.all(ids.map(id => base44.entities.StaffShift.update(id, { status: 'published' })));
    setSelectedShiftIds([]);
    await loadScheduleData();
    toast.success(`Published ${ids.length} shifts`);
  };

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      else if (meta && e.key === 'z' && e.shiftKey) { e.preventDefault(); handleRedo(); }
      else if (meta && e.key === 'c' && selectedShiftDetail) { e.preventDefault(); handleCopyShift(selectedShiftDetail); }
      else if (meta && e.key === 'd' && selectedShiftDetail) { e.preventDefault(); handleDuplicateShift(selectedShiftDetail); }
      else if (e.key === 'Escape') { setSelectedShiftIds([]); setSelectedShiftDetail(null); setContextMenu(null); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShiftIds.length > 0 && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleDeleteShifts(selectedShiftIds);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedShiftIds, selectedShiftDetail, clipboard, undoStack, redoStack]);

  // ── Conflict Detection ────────────────────────────────────────────────────
  const shiftConflicts = useMemo(() => {
    const map = {};
    shifts.forEach(shift => {
      const issues = [];
      if (shift.employee_email) {
        const hasApprovedOff = timeOffRequests.some(r =>
          r.status === 'approved' && r.employee_email === shift.employee_email &&
          shift.date >= r.start_date && shift.date <= r.end_date
        );
        if (hasApprovedOff) issues.push({ type: 'error', msg: 'Employee has approved time off' });

        const overlaps = shifts.filter(s => s.id !== shift.id && s.employee_email === shift.employee_email && s.date === shift.date);
        if (overlaps.length > 0) issues.push({ type: 'warning', msg: 'Overlapping shifts same day' });

        const weekShifts = shifts.filter(s => s.employee_email === shift.employee_email);
        const weekHours = weekShifts.reduce((sum, s) => {
          if (!s.start_time || !s.end_time) return sum;
          const [sh, sm] = s.start_time.split(':').map(Number);
          const [eh, em] = s.end_time.split(':').map(Number);
          return sum + Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
        }, 0);
        if (weekHours > 40) issues.push({ type: 'warning', msg: `Overtime risk: ${weekHours.toFixed(1)}h this week` });
      }
      if (issues.length > 0) map[shift.id] = issues;
    });
    return map;
  }, [shifts, timeOffRequests]);

  // ── Labor Metrics ─────────────────────────────────────────────────────────
  const weekShifts = shifts.filter(s => {
    try {
      const d = parseISO(s.date);
      return weekDays.some(wd => isSameDay(d, wd));
    } catch { return false; }
  });
  const totalHours = weekShifts.reduce((sum, s) => {
    if (!s.start_time || !s.end_time) return sum;
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    return sum + Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
  }, 0);
  const draftCount = weekShifts.filter(s => s.status === 'draft').length;
  const conflictCount = Object.keys(shiftConflicts).length;
  const pendingTimeOff = timeOffRequests.filter(r => r.status === 'pending').length;

  // ── Filtered employees ────────────────────────────────────────────────────
  const filteredEmployees = employees.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || e.name?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q);
    const empDept = shifts.find(s => s.employee_name === e.name || s.employee_email === e.email)?.department || '';
    const matchDept = filterDepts.length === 0 || filterDepts.includes(empDept);
    return matchSearch && matchDept;
  });

  const DEPARTMENTS = ['FOH', 'BOH', 'Bar', 'Management'];

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0" onClick={() => { setContextMenu(null); setShowFilterPanel(false); setShowGroupPanel(false); }}>

      {/* ── Premium Header ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/20">
        <div className={cn('px-4 lg:px-6 space-y-3', isExpanded ? 'py-2' : 'py-4')}>

          {/* Header: Title + Week Navigation + Right Actions */}
          <div className="flex items-center justify-between">
            {/* LEFT: Title + Week Nav + Expand */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-extrabold text-foreground shrink-0">Schedule</h1>
                {!isMobile && (
                  isExpanded ? (
                    <button onClick={() => setIsExpanded(false)} className="h-8 w-8 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground transition-colors" title="Collapse">
                      <Minimize className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => setIsExpanded(true)} className="h-8 w-8 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground transition-colors" title="Expand">
                      <Expand className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </div>
              {!isMobile && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentWeek(addDays(currentWeek, -7))} className="h-8 w-8 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground transition-colors" title="Previous week">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="h-8 px-2.5 rounded-lg border border-border/50 hover:bg-card text-xs font-bold text-muted-foreground transition-colors">
                    Today
                  </button>
                  <button onClick={() => setCurrentWeek(addDays(currentWeek, 7))} className="h-8 w-8 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground transition-colors" title="Next week">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <div className="w-px h-5 bg-border/30" />
                  <p className="text-xs font-semibold text-muted-foreground">{format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d')}</p>
                </div>
              )}
            </div>

            {/* RIGHT: Actions */}
            {isMobile ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setShowMassAdd(true)} className="h-8 w-8 rounded-lg border border-border card-glass text-muted-foreground flex items-center justify-center">
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button onClick={handlePublish} disabled={publishing} className={cn('h-8 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-60', draftCount > 0 ? 'bg-primary text-white' : 'border border-border card-glass text-muted-foreground')}>
                  {publishing ? '…' : draftCount > 0 ? `${draftCount}` : '✓'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setShowSearch(s => !s)} className="h-8 w-8 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground transition-colors" title="Search">
                  <Search className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setShowRequestOff(true); }} className={cn('h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-colors', pendingTimeOff > 0 ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-border/50 text-muted-foreground hover:bg-card')}>
                  <Bell className="h-3.5 w-3.5" />
                  {pendingTimeOff > 0 && pendingTimeOff}
                </button>
                {isAdmin && (
                  <button onClick={() => setShowMassAdd(true)} className="h-8 px-3 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-bold flex items-center gap-1.5 hover:bg-primary/20 transition-all">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                )}
                <div className="w-px h-5 bg-border/30" />
                <button onClick={handlePublish} disabled={publishing} className={cn('h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-60', draftCount > 0 ? 'bg-primary text-white hover:brightness-110' : 'border border-border/50 text-muted-foreground hover:bg-card')}>
                  <Download className="h-3.5 w-3.5" />
                  {publishing ? '…' : draftCount > 0 ? `Pub ${draftCount}` : 'Done'}
                </button>
              </div>
            )}
          </div>

          {/* Operational Metrics Bar */}
          {!isExpanded && (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'Scheduled Hours', value: totalHours.toFixed(0), suffix: 'h', color: 'text-blue-400' },
              { label: 'Labor Cost', value: '$0', suffix: '', color: 'text-green-400' },
              { label: 'Staff Scheduled', value: weekShifts.length > 0 ? new Set(weekShifts.map(s => s.employee_email)).size : 0, suffix: '', color: 'text-foreground' },
              { label: 'Draft Shifts', value: draftCount, suffix: '', color: draftCount > 0 ? 'text-amber-400' : 'text-muted-foreground' },
              { label: 'Pending Approvals', value: pendingTimeOff, suffix: '', color: pendingTimeOff > 0 ? 'text-amber-400' : 'text-muted-foreground' },
              { label: 'Conflicts/Issues', value: conflictCount, suffix: '', color: conflictCount > 0 ? 'text-red-400' : 'text-muted-foreground' },
            ].map(({ label, value, suffix, color }) => (
              <div key={label} className="bg-card/50 border border-border/40 rounded-lg px-2.5 py-2">
                <p className={cn('text-sm font-extrabold leading-none', color)}>{value}{suffix}</p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{label}</p>
              </div>
            ))}
          </div>
          )}

          {/* Secondary Toolbar (Desktop) */}
          {!isMobile && !isExpanded && (
            <div className="flex items-center justify-between pt-2 border-t border-border/20">
              <div className="flex items-center gap-2.5">
                {/* Group By */}
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setShowGroupPanel(p => !p); setShowFilterPanel(false); }} className={cn('h-7 px-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors', groupBy !== 'employee' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:bg-card')}>
                    <Grid3x3 className="h-3 w-3" />
                    <span>Group by {groupBy === 'employee' ? 'Employee' : groupBy === 'department' ? 'Department' : 'Role'}</span>
                  </button>
                  {showGroupPanel && (
                    <div className="absolute top-9 left-0 z-50 w-44 rounded-lg border border-border card-glass shadow-lg p-1.5 space-y-0.5" onClick={e => e.stopPropagation()}>
                      {[['employee','Employee'],['department','Department'],['role','Role']].map(([val, label]) => (
                        <button key={val} onClick={() => { setGroupBy(val); setShowGroupPanel(false); }} className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors', groupBy === val ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-foreground')}>
                          {groupBy === val && <Check className="h-3 w-3" />}
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter */}
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setShowFilterPanel(p => !p); setShowGroupPanel(false); }} className={cn('h-7 px-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors', filterDepts.length > 0 ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:bg-card')}>
                    <Filter className="h-3 w-3" />
                    <span>Filter {filterDepts.length > 0 && `(${filterDepts.length})`}</span>
                  </button>
                  {showFilterPanel && (
                    <div className="absolute top-9 left-0 z-50 w-44 rounded-lg border border-border card-glass shadow-lg p-1.5 space-y-0.5" onClick={e => e.stopPropagation()}>
                      {DEPARTMENTS.map(d => (
                        <button key={d} onClick={() => setFilterDepts(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium text-foreground hover:bg-secondary transition-colors">
                          <div className={cn('h-3.5 w-3.5 rounded border flex items-center justify-center', filterDepts.includes(d) ? 'bg-primary border-primary' : 'border-border')}>
                            {filterDepts.includes(d) && <Check className="h-2 w-2 text-white" />}
                          </div>
                          {d}
                        </button>
                      ))}
                      {filterDepts.length > 0 && <button onClick={() => setFilterDepts([])} className="w-full mt-1 text-[10px] text-primary font-medium hover:underline">Clear Filters</button>}
                    </div>
                  )}
                </div>

                <div className="w-px h-4 bg-border/20" />

                {/* Templates */}
                <button onClick={() => navigate('/templates')} className="h-7 px-2.5 rounded-lg border border-border/50 text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 hover:bg-card transition-colors">
                  <LayoutTemplate className="h-3 w-3" /> Templates
                </button>

                {/* Shortcuts */}
                <button onClick={() => setShowShortcuts(p => !p)} className={cn('h-7 px-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors', showShortcuts ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:bg-card')}>
                  <Keyboard className="h-3 w-3" /> Shortcuts
                </button>
              </div>

              <button onClick={loadScheduleData} className="h-7 w-7 rounded-lg border border-border/50 hover:bg-card flex items-center justify-center text-muted-foreground transition-colors" title="Refresh">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Search (desktop) */}
        {showSearch && !isMobile && (
          <div className="px-6 py-2 border-t border-border/20 flex items-center gap-2 bg-background/90">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search employees or roles…" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
          </div>
        )}

        {/* Keyboard shortcuts */}
        {showShortcuts && !isMobile && (
          <div className="px-6 py-3 border-t border-border/20 bg-card/50" onClick={e => e.stopPropagation()}>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              {[['⌘C','Copy'],['⌘V','Paste'],['⌘D','Duplicate'],['⌘Z','Undo'],['⌘⇧Z','Redo'],['Del','Delete'],['Esc','Clear']].map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[10px] font-mono font-bold text-foreground">{key}</kbd>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className={cn('py-3', isExpanded ? 'px-0' : 'px-3 lg:px-6')}>
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && <ScheduleGrid
          shifts={shifts}
          employees={filteredEmployees}
          weekDays={weekDays}
          selectedShiftIds={selectedShiftIds}
          onSelectShift={(shift) => { setSelectedShiftDetail(shift); setSelectedShiftIds([shift.id]); }}
          onSelectShifts={setSelectedShiftIds}
          shiftConflicts={shiftConflicts}
          timeOffRequests={timeOffRequests}
          availability={availability}
          onDragEnd={handleDragEnd}
          onAddShift={(emp, day) => setQuickAdd({ employee: emp, day })}
          onShiftContextMenu={(shift, emp, day, x, y) => setContextMenu({ shift, employee: emp, day, x, y })}
          onEmptyCellContextMenu={(emp, day, x, y) => setContextMenu({ shift: null, employee: emp, day, x, y })}
          isMobile={isMobile}
          groupBy={groupBy}
          isExpanded={isExpanded}
        />}
      </div>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {selectedShiftDetail && (
          <ShiftDetailDrawer
            shift={selectedShiftDetail}
            employees={employees}
            conflicts={shiftConflicts[selectedShiftDetail.id]}
            onClose={() => { setSelectedShiftDetail(null); setSelectedShiftIds([]); }}
            onUpdate={loadScheduleData}
            onCopy={handleCopyShift}
            onDuplicate={handleDuplicateShift}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedShiftIds.length > 0 && !selectedShiftDetail && (
          <BulkActionToolbar
            selectedCount={selectedShiftIds.length}
            onClear={() => setSelectedShiftIds([])}
            onCopy={() => { const s = shifts.find(x => x.id === selectedShiftIds[0]); if (s) handleCopyShift(s); }}
            onDuplicate={handleDuplicateSelected}
            onDelete={handleDeleteSelected}
            onPublish={handlePublishSelected}
          />
        )}
      </AnimatePresence>

      {contextMenu && (
        <ShiftContextMenu
          x={contextMenu.x} y={contextMenu.y}
          shift={contextMenu.shift}
          hasClipboard={!!clipboard}
          onEdit={() => { if (contextMenu.shift) setSelectedShiftDetail(contextMenu.shift); else setQuickAdd({ employee: contextMenu.employee, day: contextMenu.day }); }}
          onCopy={() => contextMenu.shift && handleCopyShift(contextMenu.shift)}
          onPaste={() => contextMenu.employee && contextMenu.day && handlePasteShift(contextMenu.employee, contextMenu.day)}
          onDuplicate={() => contextMenu.shift && handleDuplicateShift(contextMenu.shift)}
          onDuplicateWeek={() => contextMenu.shift && handleDuplicateShift(contextMenu.shift, { acrossWeek: true })}
          onDelete={() => contextMenu.shift && handleDeleteShifts([contextMenu.shift.id])}
          onClose={() => setContextMenu(null)}
        />
      )}

      {quickAdd && (
        <QuickAddShiftModal
          employee={quickAdd.employee}
          day={quickAdd.day}
          onSave={handleAddShift}
          onClose={() => setQuickAdd(null)}
        />
      )}

      {showMassAdd && (
        <MassAddModal
          employees={employees}
          weekDays={weekDays}
          onSave={handleMassAdd}
          onClose={() => setShowMassAdd(false)}
        />
      )}

      {showRequestOff && (
        <RequestOffPanel employees={employees} onClose={() => setShowRequestOff(false)} />
      )}
    </div>
  );
}

export const hideBase44Index = true;