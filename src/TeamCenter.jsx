import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import TeamCommandHeader from '@/components/team/TeamCommandHeader';
import TeamTabNav from '@/components/team/TeamTabNav';
import DirectoryView from '@/components/team/DirectoryView';
import ScheduleView from '@/components/team/ScheduleView';
import MessagesView from '@/components/team/MessagesView';
import RolesView from '@/components/team/RolesView';
import AddEmployeeModal from '@/components/team/AddEmployeeModal';
import EmployeeEditModal from '@/components/team/EmployeeEditModal';

export default function TeamCenter() {
  const { user, isAdmin, isFOH } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const loadData = async () => {
    try {
      const [empData, rolesData] = await Promise.all([
        base44.entities.Employee.list('full_name', 100).catch(() => []),
        base44.entities.Role?.list?.() || [],
      ]);
      if (isMounted.current) {
        setEmployees(empData);
        setRoles(rolesData || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="app-screen lg:flex lg:flex-col">
      {/* Header */}
      <TeamCommandHeader
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onAddEmployee={() => setShowAddEmployee(true)}
        canAdd={isAdmin}
      />

      {/* Tab Navigation */}
      <TeamTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        canManageRoles={isAdmin}
      />

      {/* Content */}
      <div className="app-page-narrow flex-1">
        {activeTab === 'directory' && (
          <DirectoryView
            employees={filteredEmployees}
            isAdmin={isAdmin}
            isFOH={isFOH}
            onEmployeeSelect={(empId) => setSelectedEmployee(employees.find(e => e.id === empId) || null)}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            schedules={schedules}
            openShifts={[]}
            callOuts={[]}
          />
        )}

        {activeTab === 'messages' && (
          <MessagesView
            announcements={announcements}
            shiftNotes={[]}
            managerMessages={[]}
          />
        )}

        {activeTab === 'roles' && isAdmin && (
          <RolesView
            roles={roles}
            employees={employees}
            onPreviewRole={() => navigate('/admin/role-simulator')}
            onManageRole={() => navigate('/admin/role-simulator')}
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
          onClose={() => setSelectedEmployee(null)}
          onSave={() => { setSelectedEmployee(null); loadData(); }}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;