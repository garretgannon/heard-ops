import { useRef, useState, useCallback } from 'react';
import EmployeeCard from './EmployeeCard';

function matchesEmployee(record, employee) {
  const keys = [employee.id, employee.employee_id, employee.email, employee.full_name]
    .filter(Boolean).map(v => String(v).toLowerCase());
  return [record.employeeId, record.employee_id, record.employee_email, record.employee_name, record.employeeName, record.tagged_employee]
    .some(v => v && keys.includes(String(v).toLowerCase()));
}

function linkedForEmployee(employee, linkedRecords = {}) {
  return {
    certifications: (linkedRecords.certifications || []).filter(r => matchesEmployee(r, employee)),
    availability:   (linkedRecords.availability   || []).filter(r => matchesEmployee(r, employee)),
    timeOff:        (linkedRecords.timeOff        || []).filter(r => matchesEmployee(r, employee)),
    managerLogs:    (linkedRecords.managerLogs    || []).filter(r => matchesEmployee(r, employee)),
  };
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

// Canonical department ordering
const DEPT_ORDER = [
  'Management', 'Executive', 'Admin',
  'Front of House', 'FOH', 'Service',
  'Back of House', 'BOH', 'Kitchen',
  'Bar', 'Beverage',
  'Host', 'Hosting',
];

function sortDepts(depts) {
  return [...depts].sort((a, b) => {
    const ai = DEPT_ORDER.findIndex(d => a.toLowerCase().includes(d.toLowerCase()));
    const bi = DEPT_ORDER.findIndex(d => b.toLowerCase().includes(d.toLowerCase()));
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function DirectoryView({ employees, linkedRecords, isAdmin, isFOH, onEmployeeSelect }) {
  const sectionRefs = useRef({});
  const letterRefs = useRef({});
  const [activeLetter, setActiveLetter] = useState(null);

  // Group by department
  const grouped = {};
  for (const emp of employees) {
    const dept = emp.department?.trim() || 'Team';
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(emp);
  }
  const sections = sortDepts(Object.keys(grouped));

  // Build a map: letter → first employee with that last-name initial
  const letterMap = {};
  for (const emp of employees) {
    const lastName = (emp.full_name || '').split(' ').slice(-1)[0] || '';
    const letter = lastName[0]?.toUpperCase() || '#';
    if (!letterMap[letter]) letterMap[letter] = emp.id;
  }

  const jumpToLetter = useCallback((letter) => {
    setActiveLetter(letter);
    // Find first employee across sections whose last name starts with letter
    const empId = letterMap[letter];
    if (empId && letterRefs.current[empId]) {
      letterRefs.current[empId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setActiveLetter(null), 1000);
  }, [letterMap]);

  if (employees.length === 0) {
    return (
      <div className="text-center py-16 text-white/30">
        <p className="text-[13px] font-medium">No employees found</p>
      </div>
    );
  }

  return (
    <div className="relative pr-8">
      {/* Section list */}
      <div className="flex flex-col gap-8">
        {sections.map(dept => (
          <section key={dept} ref={el => sectionRefs.current[dept] = el} className="flex flex-col gap-3">
            {/* Section header */}
            <h3 style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              paddingLeft: '8px',
            }}>
              {dept}
            </h3>

            {/* Employee cards */}
            <div className="flex flex-col gap-3">
              {grouped[dept].map(emp => (
                <div key={emp.id} ref={el => letterRefs.current[emp.id] = el}>
                  <EmployeeCard
                    employee={emp}
                    linkedRecords={linkedForEmployee(emp, linkedRecords)}
                    onSelect={onEmployeeSelect}
                    canContact={isFOH || isAdmin}
                    canManage={isAdmin}
                    showManagerDetails={isAdmin}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* A–Z scrubber — fixed to right edge */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-0">
        {ALPHA.map(letter => {
          const hasEmployees = !!letterMap[letter];
          return (
            <button
              key={letter}
              onClick={() => hasEmployees && jumpToLetter(letter)}
              style={{
                fontSize: '10px',
                fontWeight: 700,
                width: '20px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeLetter === letter
                  ? '#FF6B00'
                  : hasEmployees
                    ? 'rgba(255,255,255,0.55)'
                    : 'rgba(255,255,255,0.18)',
                cursor: hasEmployees ? 'pointer' : 'default',
                transition: 'color 150ms',
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
