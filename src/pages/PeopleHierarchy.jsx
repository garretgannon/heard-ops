import { useState } from 'react';
import { Users, GitBranch, MapPin, Shield } from 'lucide-react';
import EmployeeDirectoryTab from '@/components/people/EmployeeDirectoryTab';
import OrgChartTab from '@/components/people/OrgChartTab';
import OwnershipTab from '@/components/people/OwnershipTab';
import RolesManagerTab from '@/components/people/RolesManagerTab';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'directory', label: 'Directory',  icon: Users },
  { id: 'org',       label: 'Org Chart',  icon: GitBranch },
  { id: 'ownership', label: 'Ownership',  icon: MapPin },
  { id: 'roles',     label: 'Roles',      icon: Shield },
  { id: 'access',    label: 'Access',     icon: Shield },
];

const DEFAULT_AUTHORITY = [
  { role: 'Admin', canAssign: 'All roles' },
  { role: 'General Manager', canAssign: 'All roles' },
  { role: 'Manager', canAssign: 'Kitchen Lead, Line Cook, Prep Cook, Dishwasher, Server, Host, Busser, Bartender' },
  { role: 'Kitchen Lead', canAssign: 'Line Cook, Prep Cook, Dishwasher' },
  { role: 'Bartender', canAssign: null },
  { role: 'Server', canAssign: null },
  { role: 'Host', canAssign: null },
  { role: 'Line Cook', canAssign: null },
  { role: 'Prep Cook', canAssign: null },
];

export default function PeopleHierarchy() {
  const [tab, setTab] = useState('directory');
  const navigate = useNavigate();

  return (
    <div className="pb-28 lg:pb-8 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/30 px-4 pt-4 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">People</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Team hierarchy, ownership &amp; access</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 overflow-x-auto pb-0 -mx-4 px-4">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4">
        {tab === 'directory' && <EmployeeDirectoryTab />}
        {tab === 'org'       && <OrgChartTab />}
        {tab === 'ownership' && <OwnershipTab />}
        {tab === 'roles'     && <RolesManagerTab />}
        {tab === 'access'    && (
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-bold text-foreground mb-1">Role Permissions</p>
              <p className="text-xs text-muted-foreground mb-3">Define what each role can see and do in the app.</p>
              <button onClick={() => navigate('/admin/command-center')} className="btn-primary text-sm w-full">
                Open Role &amp; Access Manager
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-bold text-foreground mb-1">Job Codes</p>
              <p className="text-xs text-muted-foreground mb-3">Manage job codes linked to roles and stations.</p>
              <button onClick={() => navigate('/job-codes')} className="btn-secondary text-sm w-full">
                Manage Job Codes
              </button>
            </div>

            {/* Assignment Authority */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40">
                <p className="text-sm font-bold text-foreground">Assignment Authority</p>
                <p className="text-xs text-muted-foreground mt-0.5">Who can assign tasks to whom (default rules)</p>
              </div>
              <div className="divide-y divide-border/30">
                {DEFAULT_AUTHORITY.map(row => (
                  <div key={row.role} className="flex items-center gap-3 px-4 py-2.5">
                    <p className="text-xs font-semibold text-foreground w-32 shrink-0">{row.role}</p>
                    <p className="text-xs text-muted-foreground flex-1">
                      {row.canAssign
                        ? row.canAssign
                        : <span className="italic text-muted-foreground/50">Cannot assign tasks</span>
                      }
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground">Per-employee overrides can be set in Directory, Edit Employee, Can Assign Tasks To.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;