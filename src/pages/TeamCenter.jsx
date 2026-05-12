import { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';
import { Search, Plus } from 'lucide-react';
import TeamCommandHeader from '@/components/team/TeamCommandHeader';
import TeamTabNav from '@/components/team/TeamTabNav';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import DirectoryView from '@/components/team/DirectoryView';
import TeamProgressView from '@/components/team/TeamProgressView';
import AddEmployeeModal from '@/components/team/AddEmployeeModal';
import EmployeeEditModal from '@/components/team/EmployeeEditModal';
import { buildEmployeeProgress } from '@/lib/employeeProgress';

export default function TeamCenter() {
  const { user, isAdmin, isFOH } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [linkedRecords, setLinkedRecords] = useState({
    certifications: [],
    availability: [],
    timeOff: [],
    managerLogs: [],
    generatedTasks: [],
    sideworkTasks: [],
    prepTasks: [],
    cleaningTasks: [],
    tempTasks: [],
  });
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
const isMounted = useRef(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const safeList = (entityName, sortBy = '-updated_date', limit = 300) => Promise.race([
        base44.entities[entityName]?.list?.(sortBy, limit).catch(() => []) || Promise.resolve([]),
        new Promise(resolve => setTimeout(() => resolve([]), 10000)),
      ]);

      const [
        empData,
        certData,
        availabilityData,
        timeOffData,
        logData,
        generatedTaskData,
        sideworkTaskData,
        prepTaskData,
        cleaningTaskData,
        tempTaskData,
      ] = await Promise.all([
        Promise.race([
          base44.entities.Employee.list('full_name', 100).catch(() => []),
          new Promise(resolve => setTimeout(() => resolve([]), 10000)),
        ]),
        safeList('CertificationRecord'),
        safeList('EmployeeAvailability', 'day_of_week'),
        safeList('TimeOffRequest'),
        safeList('UnifiedLog'),
        safeList('GeneratedTask'),
        safeList('DailySideWorkTask'),
        safeList('DailyPrepTask'),
        safeList('DailyCleaningTask'),
        safeList('DailyTemperatureLogTask'),
      ]);
      if (isMounted.current) {
        setEmployees(Array.isArray(empData) ? empData : []);
        setLinkedRecords({
          certifications: Array.isArray(certData) ? certData : [],
          availability: Array.isArray(availabilityData) ? availabilityData : [],
          timeOff: Array.isArray(timeOffData) ? timeOffData : [],
          managerLogs: Array.isArray(logData)
            ? logData.filter(log => ['employee', 'employee_note', 'manager_note'].includes(log.type))
            : [],
          generatedTasks: Array.isArray(generatedTaskData) ? generatedTaskData : [],
          sideworkTasks: Array.isArray(sideworkTaskData) ? sideworkTaskData : [],
          prepTasks: Array.isArray(prepTaskData) ? prepTaskData : [],
          cleaningTasks: Array.isArray(cleaningTaskData) ? cleaningTaskData : [],
          tempTasks: Array.isArray(tempTaskData) ? tempTaskData : [],
        });
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
      if (isMounted.current) setLoading(false);
    }
  };

  // Load team data
  useEffect(() => {
    isMounted.current = true;
    loadData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Filter employees based on search
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      emp.full_name?.toLowerCase().includes(query) ||
      emp.primary_role?.toLowerCase().includes(query) ||
      emp.department?.toLowerCase().includes(query) ||
      emp.employee_id?.toLowerCase().includes(query)
    );
  });

  const progress = useMemo(
    () => buildEmployeeProgress(employees, linkedRecords),
    [employees, linkedRecords]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="app-screen lg:flex lg:flex-col">
      <DesktopPageHeader
        title="Team"
        subtitle="Staff directory and certifications"
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search team..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-border/30 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary w-56"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddEmployee(true)}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all"
              >
                <Plus className="h-4 w-4" /> Add Employee
              </button>
            )}
          </>
        }
      />
      {/* Mobile header */}
      <div className="lg:hidden">
        <TeamCommandHeader
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onAddEmployee={() => setShowAddEmployee(true)}
          canAdd={isAdmin}
        />
      </div>

      {/* Tab Navigation */}
      <TeamTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <div className="app-page-narrow flex-1">
        {activeTab === 'directory' && (
          <DirectoryView
            employees={filteredEmployees}
            linkedRecords={linkedRecords}
            isAdmin={isAdmin}
            isFOH={isFOH}
            onEmployeeSelect={(empId) => setSelectedEmployee(employees.find(e => e.id === empId) || null)}
          />
        )}

        {activeTab === 'progress' && (
          <TeamProgressView
            progress={progress}
            isAdmin={isAdmin}
            currentUser={user}
          />
        )}

      </div>

      {showAddEmployee && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => { setShowAddEmployee(false); loadData(); }}
        />
      )}

      {selectedEmployee && (
        <EmployeeEditModal
          employee={selectedEmployee}
          linkedRecords={linkedRecords}
          isAdmin={isAdmin}
          onClose={() => setSelectedEmployee(null)}
          onSave={() => { setSelectedEmployee(null); loadData(); }}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
