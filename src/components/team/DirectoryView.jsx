import EmployeeCard from './EmployeeCard';

export default function DirectoryView({ employees, isAdmin, isFOH, onEmployeeSelect }) {
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
    <div className="space-y-2">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onSelect={onEmployeeSelect}
          canContact={canContact}
          canManage={canManage}
        />
      ))}
    </div>
  );
}