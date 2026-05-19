import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, ChevronDown, ChevronRight, MapPin } from 'lucide-react';

const ROLE_COLORS = {
  'Admin': 'border-purple-500/60 bg-purple-500/10',
  'General Manager': 'border-blue-500/60 bg-blue-500/10',
  'Manager': 'border-blue-400/40 bg-blue-400/8',
  'Kitchen Lead': 'border-orange-500/60 bg-orange-500/10',
  'Line Cook': 'border-amber-500/40 bg-amber-500/8',
  'Prep Cook': 'border-yellow-500/40 bg-yellow-500/8',
  'Dishwasher': 'border-slate-500/40 bg-slate-500/8',
  'Bartender': 'border-cyan-500/40 bg-cyan-500/8',
  'Server': 'border-green-500/40 bg-green-500/8',
  'Host': 'border-pink-500/40 bg-pink-500/8',
};

function buildTree(employees) {
  const byId = {};
  employees.forEach(e => { byId[e.id] = { ...e, children: [] }; });
  const roots = [];
  employees.forEach(e => {
    if (e.manager_id && byId[e.manager_id]) {
      byId[e.manager_id].children.push(byId[e.id]);
    } else {
      roots.push(byId[e.id]);
    }
  });
  return roots;
}

function EmployeeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children?.length > 0;
  const roleColor = ROLE_COLORS[node.primary_role] || 'border-border bg-card';

  return (
    <div className={depth > 0 ? 'ml-6 pl-4 border-l border-border/40' : ''}>
      <div
        className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${roleColor} mb-1.5 cursor-pointer hover:brightness-110 transition-all`}
        onClick={() => hasChildren && setExpanded(p => !p)}
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {node.profile_photo_url
            ? <img src={node.profile_photo_url} className="h-full w-full object-cover" />
            : <span className="text-xs font-bold text-muted-foreground">{(node.full_name || '?').charAt(0)}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{node.full_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {node.primary_role && <span className="text-[10px] text-muted-foreground">{node.primary_role}</span>}
            {node.department && <span className="text-[10px] text-muted-foreground/60">· {node.department}</span>}
          </div>
          {(node.managed_areas?.length > 0 || node.managed_stations?.length > 0) && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-2.5 w-2.5 text-orange-400" />
              <span className="text-[9px] text-orange-400 font-semibold">
                Owns {[...(node.managed_areas||[]), ...(node.managed_stations||[])].length} area/station(s)
              </span>
            </div>
          )}
        </div>
        {hasChildren && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground font-semibold">{node.children.length}</span>
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="mb-2">
          {node.children.map(child => (
            <EmployeeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChartTab() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    base44.entities.Employee.list('-created_date', 200).then(data => {
      setEmployees(data.filter(e => e.status !== 'archived'));
      setLoading(false);
    });
  }, []);

  const depts = ['all', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = deptFilter === 'all'
    ? employees
    : employees.filter(e => e.department === deptFilter || !e.manager_id);

  const tree = buildTree(filtered);

  return (
    <div className="space-y-4">
      {/* Dept filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {depts.map(d => (
          <button key={d} onClick={() => setDeptFilter(d)}
            className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
              deptFilter === d ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground'
            }`}>
            {d === 'all' ? 'All Departments' : d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : tree.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No employees yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add employees in the Directory tab and assign managers to build the hierarchy.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tree.map(node => <EmployeeNode key={node.id} node={node} />)}
        </div>
      )}

      <div className="card-glass border border-border/40 rounded-xl p-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">How This Works</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The org chart is built from "Reports To" assignments. Go to Directory → Edit Employee → Reports To to set up the chain of command.
          Employees with no manager are shown at the top level. Click any node to expand/collapse their reports.
        </p>
      </div>
    </div>
  );
}