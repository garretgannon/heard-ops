import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Zap, Download, Search } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

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
      const [shiftsData, employeesData] = await Promise.all([
        base44.entities.StaffShift.list('-created_date', 100).catch(() => []),
        base44.entities.Employee?.list?.('-created_date', 100).catch(() => []),
      ]);
      setShifts(shiftsData);
      setEmployees(employeesData || []);
    } catch (e) {
      console.error('Error loading schedule:', e);
    }
    setLoading(false);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const weekStart = format(currentWeek, 'MMM d');
  const weekEnd = format(weekDays[6], 'MMM d, yyyy');

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/20">
        <div className="px-4 lg:px-8 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
              <p className="text-sm text-muted-foreground">{weekStart} — {weekEnd}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEmployeeSidebar(!showEmployeeSidebar)}
                className="h-9 px-3 rounded-lg border border-border hover:bg-card text-sm font-medium text-foreground transition-colors"
              >
                {showEmployeeSidebar ? 'Hide' : 'Show'} Team
              </button>
              {isAdmin && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all"
                >
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Auto Build</span>
                </motion.button>
              )}
              <button className="h-9 w-9 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            <WeekSelector currentWeek={currentWeek} onWeekChange={setCurrentWeek} />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg border border-border bg-card/50">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-40"
                />
              </div>
              <ViewModeSwitcher viewMode={viewMode} onViewChange={setViewMode} />
              <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-card border border-border/50">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Published</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            <div className="grid grid-cols-[240px_1fr] gap-6">
              <EmployeeSidebar
                employees={employees}
                shifts={shifts}
                searchQuery={searchQuery}
              />
              <ScheduleGrid
                shifts={shifts}
                employees={employees}
                weekDays={weekDays}
                selectedShifts={selectedShifts}
                onSelectShift={setSelectedShift}
                onSelectShifts={setSelectedShifts}
                onShiftUpdate={loadScheduleData}
              />
            </div>
          )}

          {/* Mobile Schedule */}
          {viewMode === 'weekly' && isMobile && (
            <ScheduleGrid
              shifts={shifts}
              employees={employees}
              weekDays={weekDays}
              selectedShifts={selectedShifts}
              onSelectShift={setSelectedShift}
              onSelectShifts={setSelectedShifts}
              onShiftUpdate={loadScheduleData}
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