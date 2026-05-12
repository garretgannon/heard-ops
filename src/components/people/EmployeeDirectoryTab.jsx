import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, User, Phone, Mail, MapPin, Edit2, ChevronRight } from 'lucide-react';
import EmployeeEditDrawer from './EmployeeEditDrawer';

const ROLE_COLORS = {
  'Admin': 'bg-purple-500/20 text-purple-300',
  'General Manager': 'bg-blue-500/20 text-blue-300',
  'Manager': 'bg-blue-400/20 text-blue-200',
  'Kitchen Lead': 'bg-orange-500/20 text-orange-300',
  'Line Cook': 'bg-amber-500/20 text-amber-300',
  'Prep Cook': 'bg-yellow-500/20 text-yellow-300',
  'Dishwasher': 'bg-slate-500/20 text-slate-300',
  'Bartender': 'bg-cyan-500/20 text-cyan-300',
  'Server': 'bg-green-500/20 text-green-300',
  'Host': 'bg-pink-500/20 text-pink-300',
};

const DEPT_COLORS = {
  'BOH': 'text-orange-400',
  'FOH': 'text-green-400',
  'Bar': 'text-cyan-400',
  'Management': 'text-purple-400',
};

export default function EmployeeDirectoryTab() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, employee = edit
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Employee.list('-created_date', 200);
    setEmployees(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const depts = ['all', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = employees.filter(e => {
    const matchSearch = !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.primary_role?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || e.department === deptFilter;
    return matchSearch && matchDept && e.status !== 'archived';
  });

  const active = filtered.filter(e => e.status !== 'inactive');
  const inactive = filtered.filter(e => e.status === 'inactive');

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full pl-9 pr-3 py-2 card-glass border border-border rounded-lg text-sm text-foreground"
          />
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold shrink-0"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Dept filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {depts.map(d => (
          <button
            key={d}
            onClick={() => setDeptFilter(d)}
            className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
              deptFilter === d
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}
          >
            {d === 'all' ? 'All' : d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : (
        <>
          {/* Active employees */}
          <div className="space-y-2">
            {active.map(emp => (
              <EmployeeRow key={emp.id} emp={emp} onEdit={() => setEditing(emp)} />
            ))}
          </div>

          {inactive.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Inactive</p>
              <div className="space-y-2 opacity-60">
                {inactive.map(emp => (
                  <EmployeeRow key={emp.id} emp={emp} onEdit={() => setEditing(emp)} />
                ))}
              </div>
            </div>
          )}

          {active.length === 0 && inactive.length === 0 && (
            <div className="text-center py-12">
              <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No employees found</p>
              <button onClick={() => setEditing({})} className="mt-3 text-sm font-bold text-primary">+ Add first employee</button>
            </div>
          )}
        </>
      )}

      {editing !== null && (
        <EmployeeEditDrawer
          employee={editing.id ? editing : null}
          employees={employees}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function EmployeeRow({ emp, onEdit }) {
  const roleColor = ROLE_COLORS[emp.primary_role] || 'bg-muted text-muted-foreground';
  const deptColor = DEPT_COLORS[emp.department] || 'text-muted-foreground';

  return (
    <div
      className="flex items-center gap-3 card-glass border border-border rounded-xl px-3 py-2.5 cursor-pointer hover:border-primary/30 transition-all"
      onClick={onEdit}
    >
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {emp.profile_photo_url
          ? <img src={emp.profile_photo_url} className="h-full w-full object-cover" />
          : <span className="text-sm font-bold text-muted-foreground">{(emp.full_name || '?').charAt(0).toUpperCase()}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground truncate">{emp.full_name}</p>
          {emp.primary_role && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleColor}`}>{emp.primary_role}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {emp.department && <span className={`text-[10px] font-semibold ${deptColor}`}>{emp.department}</span>}
          {emp.manager_name && <span className="text-[10px] text-muted-foreground">→ {emp.manager_name}</span>}
          {emp.assigned_stations?.length > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />{emp.assigned_stations.slice(0, 2).join(', ')}{emp.assigned_stations.length > 2 ? ` +${emp.assigned_stations.length - 2}` : ''}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}