import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Zap, Download, Search, Bell, DollarSign, Clock, TrendingUp, Target, Users, ChevronDown, Filter, Grid3x3, LayoutTemplate, RefreshCw, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import LaborSummaryCards from '@/components/schedule/LaborSummaryCards';
import ScheduleGrid from '@/components/schedule/ScheduleGrid';
import EmployeeSidebar from '@/components/schedule/EmployeeSidebar';
import ShiftDetailDrawer from '@/components/schedule/ShiftDetailDrawer';
import BulkActionToolbar from '@/components/schedule/BulkActionToolbar';
import ViewModeSwitcher from '@/components/schedule/ViewModeSwitcher';
import WeekSelector from '@/components/schedule/WeekSelector';
import TodayShiftView from '@/components/schedule/TodayShiftView';

const FAKE_EMPLOYEES = [
  { id: '1', name: 'Alex R.', role: 'Manager', email: 'alex@heard.com', weeklyHours: 40 },
  { id: '2', name: 'Jamie L.', role: 'Sous Chef', email: 'jamie@heard.com', weeklyHours: 40 },
  { id: '3', name: 'Taylor S.', role: 'Bartender', email: 'taylor@heard.com', weeklyHours: 32 },
  { id: '4', name: 'Morgan K.', role: 'Server', email: 'morgan@heard.com', weeklyHours: 35 },
  { id: '5', name: 'Casey M.', role: 'Line Cook', email: 'casey@heard.com', weeklyHours: 38 },
  { id: '6', name: 'Riley D.', role: 'Prep Cook', email: 'riley@heard.com', weeklyHours: 39 },
  { id: '7', name: 'Jordan P.', role: 'Dishwasher', email: 'jordan@heard.com', weeklyHours: 24 },
  { id: '8', name: 'Avery S.', role: 'Host', email: 'avery@heard.com', weeklyHours: 24 },
  { id: '9', name: 'Dakota N.', role: 'Server', email: 'dakota@heard.com', weeklyHours: 36 },
  { id: '10', name: 'Quinn M.', role: 'Bartender', email: 'quinn@heard.com', weeklyHours: 33 },
];

export default function ScheduleCenter() {
  const { user, isAdmin } = useCurrentUser();
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState('weekly');
  const [showEmployeeSidebar, setShowEmployeeSidebar] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [groupBy, setGroupBy] = useState('employee'); // 'employee' | 'department' | 'role'
  const [filterDepts, setFilterDepts] = useState([]); // empty = show all
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    loadScheduleData();
  }, [currentWeek]);

  const loadScheduleData = async () => {
    setLoading(true);
    try {
      const [shiftsData, rawEmployees] = await Promise.all([
        base44.entities.StaffShift.list('-created_date', 200).catch(() => []),
        base44.entities.Employee?.list?.('-created_date', 100).catch(() => []),
      ]);
      setShifts(shiftsData);
      // Normalize DB employees (data is nested under .data)
      const normalized = (rawEmployees || []).map(e => ({
        id: e.id,
        name: e.data?.full_name || e.full_name || e.name || 'Unknown',
        email: e.data?.email || e.email || '',
        role: e.data?.job_code || e.data?.primary_role || e.role || '',
        weeklyHours: e.data?.weekly_hours || 40,
      }));
      // Merge with any shift employees not in DB
      const shiftEmployeeNames = [...new Set(shiftsData.map(s => s.employee_name).filter(Boolean))];
      const extra = shiftEmployeeNames
        .filter(name => !normalized.find(e => e.name === name))
        .map((name, i) => ({ id: `shift-emp-${i}`, name, email: shiftsData.find(s => s.employee_name === name)?.employee_email || '', role: shiftsData.find(s => s.employee_name === name)?.role || '' }));
      setEmployees(normalized.length > 0 ? [...normalized, ...extra] : [...extra, ...FAKE_EMPLOYEES].slice(0, Math.max(extra.length, FAKE_EMPLOYEES.length)));
    } catch (e) {
      console.error('Error loading schedule:', e);
    }
    setLoading(false);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const weekStart = format(currentWeek, 'MMM d');
  const weekEnd = format(weekDays[6], 'MMM d, yyyy');

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const draftShifts = shifts.filter(s => s.status === 'draft');
      if (draftShifts.length === 0) { toast.info('No draft shifts to publish'); setPublishing(false); return; }
      await Promise.all(draftShifts.map(s => base44.entities.StaffShift.update(s.id, { status: 'published' })));
      toast.success(`Published ${draftShifts.length} shifts`);
      await loadScheduleData();
    } catch (e) {
      toast.error('Failed to publish');
    }
    setPublishing(false);
  };

  const handleAutoSchedule = async () => {
    toast.info('Auto-schedule: generating shifts from templates…');
    try {
      await base44.functions.invoke('generateShiftTasks', { week_start: format(currentWeek, 'yyyy-MM-dd') });
      toast.success('Shifts generated!');
      await loadScheduleData();
    } catch (e) {
      toast.error('Auto-schedule failed: ' + e.message);
    }
  };

  const DEPARTMENTS = ['FOH', 'BOH', 'Bar', 'Management'];

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = !searchQuery || e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || e.role?.toLowerCase().includes(searchQuery.toLowerCase());
    // Get the department for this employee from their shifts
    const empDept = shifts.find(s => s.employee_name === e.name || s.employee_email === e.email)?.department || '';
    const matchesDept = filterDepts.length === 0 || filterDepts.includes(empDept);
    return matchesSearch && matchesDept;
  });

  const toggleFilterDept = (dept) => setFilterDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/20">
        <div className="px-4 lg:px-8 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span>Schedule</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <WeekSelector currentWeek={currentWeek} onWeekChange={setCurrentWeek} />
              <button
                onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="h-9 px-3 rounded-lg border border-border hover:bg-card text-sm font-medium text-foreground transition-colors">
                Today
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSearch(s => !s)} className="h-9 w-9 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground transition-colors">
                  <Search className="h-4 w-4" />
                </button>
                <button className="h-9 w-9 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground transition-colors relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                </button>
              </div>
              {isAdmin && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAutoSchedule}
                  className="h-9 px-4 rounded-lg bg-primary/20 text-primary border border-primary/30 text-sm font-bold flex items-center gap-2 hover:bg-primary/30 transition-all"
                >
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Auto Schedule</span>
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePublish}
                disabled={publishing}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{publishing ? 'Publishing…' : 'Publish Schedule'}</span>
              </motion.button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <div className="p-3 rounded-lg border border-border/30 bg-card/40">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">Total Labor Cost</p>
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">$12,746</p>
              <p className="text-xs text-muted-foreground mt-1">18.7% of sales ↑</p>
            </div>
            <div className="p-3 rounded-lg border border-border/30 bg-card/40">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">Scheduled Hours</p>
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">328.5</p>
              <p className="text-xs text-green-400 mt-1">+ 22.5 vs last week</p>
            </div>
            <div className="p-3 rounded-lg border border-border/30 bg-card/40">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">Forecasted Sales</p>
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">$68,200</p>
              <p className="text-xs text-green-400 mt-1">+ 8.2% vs last week</p>
            </div>
            <div className="p-3 rounded-lg border border-border/30 bg-card/40">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">Labor Target</p>
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">18.0%</p>
              <p className="text-xs text-green-400 mt-1">On Target ✓</p>
            </div>
            <div className="p-3 rounded-lg border border-border/30 bg-card/40">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium">Projected Labor</p>
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">17.6%</p>
              <p className="text-xs text-green-400 mt-1">On Target ✓</p>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 relative">
              <button
                onClick={() => { setShowGroupPanel(false); setShowFilterPanel(false); }}
                className={`h-8 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${ groupBy !== 'employee' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border hover:bg-card text-foreground'}`}>
                <ChevronDown className="h-3.5 w-3.5" />
                View by {groupBy === 'employee' ? 'Employee' : groupBy === 'department' ? 'Department' : 'Role'}
              </button>
            </div>
            <div className="flex items-center gap-2 relative">
              {/* Filter */}
              <div className="relative">
                <button
                  onClick={() => { setShowFilterPanel(p => !p); setShowGroupPanel(false); }}
                  className={`h-8 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${filterDepts.length > 0 ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border hover:bg-card text-foreground'}`}>
                  <Filter className="h-3.5 w-3.5" />
                  Filter {filterDepts.length > 0 && `(${filterDepts.length})`}
                </button>
                {showFilterPanel && (
                  <div className="absolute top-10 right-0 z-50 w-48 rounded-xl border border-border bg-card shadow-xl p-3 space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Department</p>
                    {DEPARTMENTS.map(dept => (
                      <button key={dept} onClick={() => toggleFilterDept(dept)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary text-sm text-foreground transition-colors">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${filterDepts.includes(dept) ? 'bg-primary border-primary' : 'border-border'}`}>
                          {filterDepts.includes(dept) && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        {dept}
                      </button>
                    ))}
                    {filterDepts.length > 0 && (
                      <button onClick={() => setFilterDepts([])} className="w-full mt-2 text-xs text-primary hover:underline">Clear filters</button>
                    )}
                  </div>
                )}
              </div>
              {/* Group */}
              <div className="relative">
                <button
                  onClick={() => { setShowGroupPanel(p => !p); setShowFilterPanel(false); }}
                  className={`h-8 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${groupBy !== 'employee' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border hover:bg-card text-foreground'}`}>
                  <Grid3x3 className="h-3.5 w-3.5" />
                  Group
                </button>
                {showGroupPanel && (
                  <div className="absolute top-10 right-0 z-50 w-44 rounded-xl border border-border bg-card shadow-xl p-3 space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Group by</p>
                    {[['employee', 'Employee'], ['department', 'Department'], ['role', 'Role']].map(([val, label]) => (
                      <button key={val} onClick={() => { setGroupBy(val); setShowGroupPanel(false); }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${groupBy === val ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'}`}>
                        {groupBy === val && <Check className="h-3.5 w-3.5" />}
                        {groupBy !== val && <span className="w-3.5" />}
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Templates */}
              <button
                onClick={() => navigate('/templates')}
                className="h-8 px-3 rounded-lg border border-border hover:bg-card text-xs font-medium text-foreground transition-colors flex items-center gap-1">
                <LayoutTemplate className="h-3.5 w-3.5" />
                Templates
              </button>
              <button onClick={loadScheduleData} className="h-8 w-8 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode(v => v === 'today' ? 'weekly' : 'today')} className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${viewMode === 'today' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border hover:bg-card text-muted-foreground'}`}>
                <Calendar className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 lg:px-8 py-2 border-b border-border/20 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or role…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {searchQuery && <button onClick={() => setSearchQuery('')}><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="px-4 lg:px-8 py-6"
        >
          {/* Labor Summary */}
          {viewMode === 'weekly' && (
            <div className="mb-8">
              <LaborSummaryCards shifts={shifts} weekDays={weekDays} />
            </div>
          )}

          {/* Today View */}
          {viewMode === 'today' && (
            <div className="mb-8">
              <TodayShiftView shifts={shifts} />
            </div>
          )}

          {/* Schedule Grid */}
          {viewMode === 'weekly' && !isMobile && (
            <ScheduleGrid
              shifts={shifts}
              employees={filteredEmployees}
              weekDays={weekDays}
              selectedShifts={selectedShifts}
              onSelectShift={setSelectedShift}
              onSelectShifts={setSelectedShifts}
              onShiftUpdate={loadScheduleData}
              groupBy={groupBy}
            />
          )}

          {/* Mobile Schedule */}
          {viewMode === 'weekly' && isMobile && (
            <ScheduleGrid
              shifts={shifts}
              employees={filteredEmployees}
              weekDays={weekDays}
              selectedShifts={selectedShifts}
              onSelectShift={setSelectedShift}
              onSelectShifts={setSelectedShifts}
              onShiftUpdate={loadScheduleData}
              groupBy={groupBy}
              isMobile
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Shift Detail Drawer */}
      {selectedShift && (
        <ShiftDetailDrawer
          shift={selectedShift}
          employees={employees}
          onClose={() => setSelectedShift(null)}
          onUpdate={loadScheduleData}
        />
      )}

      {/* Bulk Action Toolbar */}
      {selectedShifts.length > 0 && (
        <BulkActionToolbar
          selectedCount={selectedShifts.length}
          onClear={() => setSelectedShifts([])}
          onAction={loadScheduleData}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;