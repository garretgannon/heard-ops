import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, Eye, EyeOff, Mail, Phone, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEPARTMENTS = ['All', 'FOH', 'BOH', 'Bar', 'Management', 'Support'];
const JOB_CODES = ['Manager', 'Server', 'Bartender', 'Host', 'Line Cook', 'Prep Cook', 'Dishwasher', 'Sous Chef', 'Chef', 'Support'];

export default function EmployeeDirectory({ employees = [], onAddClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedJobCode, setSelectedJobCode] = useState('All');
  const [showInactive, setShowInactive] = useState(false);
  const [revealedPayIds, setRevealedPayIds] = useState(new Set());
  const [revealedCodeIds, setRevealedCodeIds] = useState(new Set());

  const filteredEmployees = useMemo(() => {
    return (employees || []).filter(emp => {
      const matchesSearch = !searchQuery || 
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.phone?.includes(searchQuery) ||
        emp.employeeId?.toString().includes(searchQuery);

      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      const matchesJobCode = selectedJobCode === 'All' || emp.jobCode === selectedJobCode;

      return matchesSearch && matchesDept && matchesJobCode;
    });
  }, [employees, searchQuery, selectedDept, selectedJobCode]);

  const togglePayReveal = (id) => {
    const newSet = new Set(revealedPayIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setRevealedPayIds(newSet);
  };

  const toggleCodeReveal = (id) => {
    const newSet = new Set(revealedCodeIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setRevealedCodeIds(newSet);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  if (!employees || employees.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">No employees yet</h3>
        <p className="text-sm text-muted-foreground mb-6">Add your first employee to get started</p>
        <button
          onClick={onAddClick}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all"
        >
          Add Employee
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Employee Directory</h2>
        <button
          onClick={onAddClick}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Employee</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 p-4 rounded-lg border border-border/30 bg-card/40">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 h-9 rounded-lg border border-border bg-background">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 flex-wrap">
            {DEPARTMENTS.slice(0, 4).map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                  selectedDept === dept
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <p className="text-xs text-muted-foreground">
          {filteredEmployees.length} of {employees.length} employees
        </p>
      </div>

      {/* Employee Cards */}
      <div className="space-y-3">
        {filteredEmployees.map((emp, idx) => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="p-4 rounded-lg border border-border/30 bg-card/40 hover:bg-card/60 transition-colors cursor-pointer space-y-3"
          >
            {/* Top Row: Avatar & Basic Info */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{getInitials(emp.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{emp.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                    {emp.jobCode}
                  </span>
                  {emp.department && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-secondary/50 text-muted-foreground font-medium">
                      {emp.department}
                    </span>
                  )}
                </div>
              </div>
              {emp.employeeId && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="text-sm font-semibold text-foreground">{emp.employeeId}</p>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {emp.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href={`mailto:${emp.email}`} className="hover:text-primary truncate">
                    {emp.email}
                  </a>
                </div>
              )}
              {emp.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${emp.phone}`} className="hover:text-primary">
                    {emp.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Clock-In Code & Pay Rate */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/10">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Clock-In Code</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-mono font-bold ${
                    revealedCodeIds.has(emp.id) ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {revealedCodeIds.has(emp.id) ? emp.clockInCode || '—' : '••••'}
                  </span>
                  <button
                    onClick={() => toggleCodeReveal(emp.id)}
                    className="h-5 w-5 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {revealedCodeIds.has(emp.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Rate of Pay</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-mono font-bold ${
                    revealedPayIds.has(emp.id) ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {revealedPayIds.has(emp.id) ? `$${emp.rateOfPay}` : 'Restricted'}
                  </span>
                  <button
                    onClick={() => togglePayReveal(emp.id)}
                    className="h-5 w-5 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {revealedPayIds.has(emp.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}