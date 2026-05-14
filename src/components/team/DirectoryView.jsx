import EmployeeCard from './EmployeeCard';

function matchesEmployee(record, employee) {
  const keys = [
    employee.id,
    employee.employee_id,
    employee.email,
    employee.full_name,
  ].filter(Boolean).map(value => String(value).toLowerCase());

  return [
    record.employeeId,
    record.employee_id,
    record.employee_email,
    record.employee_name,
    record.employeeName,
    record.tagged_employee,
  ].some(value => value && keys.includes(String(value).toLowerCase()));
}

function linkedForEmployee(employee, linkedRecords = {}) {
  return {
    certifications: (linkedRecords.certifications || []).filter(record => matchesEmployee(record, employee)),
    availability: (linkedRecords.availability || []).filter(record => matchesEmployee(record, employee)),
    timeOff: (linkedRecords.timeOff || []).filter(record => matchesEmployee(record, employee)),
    managerLogs: (linkedRecords.managerLogs || []).filter(record => matchesEmployee(record, employee)),
  };
}

export default function DirectoryView({ employees, linkedRecords, isAdmin, isFOH, onEmployeeSelect }) {
  const canContact = isFOH || isAdmin;
  const canManage = isAdmin;

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No employees found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          linkedRecords={linkedForEmployee(employee, linkedRecords)}
          onSelect={onEmployeeSelect}
          canContact={canContact}
          canManage={canManage}
          showManagerDetails={isAdmin}
        />
      ))}
    </div>
  );
}
