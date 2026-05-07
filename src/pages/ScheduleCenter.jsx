import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Zap, Download } from 'lucide-react';
import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ScheduleGrid from '@/components/schedule/ScheduleGrid';
import MobileSchedulePreview from '@/components/schedule/MobileSchedulePreview';
import ScheduleFeatures from '@/components/schedule/ScheduleFeatures';

const FEATURES = [
  { id: 'drag', label: 'Drag & Drop Scheduling', icon: '↔️' },
  { id: 'bulk', label: 'Bulk Actions', icon: '☑️' },
  { id: 'auto', label: 'Auto Scheduling (AI)', icon: '✨' },
  { id: 'colors', label: 'Color Coded by Role', icon: '🎨' },
  { id: 'conflict', label: 'Conflict Detection', icon: '⚠️' },
  { id: 'labor', label: 'Labor Targets', icon: '📊' },
  { id: 'export', label: 'Export to Excel, PDF', icon: '📁' },
];

export default function ScheduleCenter() {
  const { user, isAdmin } = useCurrentUser();
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
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
        base44.entities.StaffShift?.list?.('-created_date', 100).catch(() => []),
        base44.entities.Employee?.list?.('-created_date', 100).catch(() => []),
      ]);
      setShifts(shiftsData || []);
      setEmployees(employeesData || []);
    } catch (e) {
      console.error('Error loading schedule:', e);
    }
    setLoading(false);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const weekStart = format(currentWeek, 'MMM d');
  const weekEnd = format(weekDays[6], 'MMM d, yyyy');

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/20 px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">Schedule</h1>
          <p className="text-sm text-muted-foreground">{weekStart} — {weekEnd}</p>
        </div>
        <div className="px-4 py-6">
          <ScheduleGrid shifts={shifts} employees={employees} weekDays={weekDays} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Schedule</h2>
            <p className="text-xs text-muted-foreground">Manage weekly shifts and labor</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentWeek(prev => addDays(prev, -7))}
                className="h-8 w-8 rounded-lg border border-border hover:bg-card flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                {weekStart} – {format(weekDays[6], 'MMM d, yyyy')}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentWeek(prev => addDays(prev, 7))}
                className="h-8 w-8 rounded-lg border border-border hover:bg-card flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Action Buttons */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="h-9 px-4 rounded-lg border border-border hover:bg-card text-sm font-medium text-foreground"
            >
              Today
            </motion.button>

            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:brightness-110"
              >
                <Zap className="h-4 w-4" />
                Publish Schedule
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-9 w-9 rounded-lg border border-border hover:bg-card flex items-center justify-center"
            >
              <Download className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-[200px_1fr_280px] gap-6 px-6 py-6 h-[calc(100vh-120px)]">
        {/* Left Sidebar — Features */}
        <div className="border-r border-border/20 pr-6 overflow-y-auto">
          <ScheduleFeatures features={FEATURES} />
        </div>

        {/* Center — Schedule Grid */}
        <div className="min-w-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ScheduleGrid shifts={shifts} employees={employees} weekDays={weekDays} />
          )}
        </div>

        {/* Right Sidebar — Mobile Preview */}
        <div className="border-l border-border/20 pl-6 overflow-y-auto">
          <MobileSchedulePreview shifts={shifts} employees={employees} currentWeek={currentWeek} />
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;