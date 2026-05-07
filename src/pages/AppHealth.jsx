import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Navigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    ok: 'bg-green-500/15 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/15 text-red-400 border-red-500/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  return <span className={`px-2 py-1 rounded border text-xs font-bold ${styles[status] || styles.info}`}>{status.toUpperCase()}</span>;
};

const HealthSection = ({ title, icon: Icon, children, count, status }) => (
  <div className="border border-border/30 rounded-xl bg-card p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>
      <div className="flex items-center gap-3">
        {count !== undefined && <span className="text-sm text-muted-foreground">{count} items</span>}
        {status && <StatusBadge status={status} />}
      </div>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

export default function AppHealth() {
  const { isAdmin } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isAdmin) return <Navigate to="/" replace />;

  // Define app structure for analysis
  const ROUTES = [
    { path: '/', page: 'TodaysCommandCenter', source: 'Main Nav', status: 'ok' },
    { path: '/overview', page: 'TodaysCommandCenter', source: 'Desktop Nav', status: 'duplicate', note: 'Same as /' },
    { path: '/shift', page: 'Shift', source: 'Main Nav', status: 'ok' },
    { path: '/logs', page: 'LogsCenter', source: 'Main Nav', status: 'ok' },
    { path: '/team', page: 'TeamCenter', source: 'Main Nav', status: 'ok' },
    { path: '/more', page: 'More', source: 'Main Nav', status: 'ok' },
    { path: '/admin/role-simulator', page: 'AdminRoleSimulator', source: 'More > Admin', status: 'ok' },
    { path: '/admin/command-center', page: 'AdminCommandCenter', source: 'More > Admin', status: 'ok' },
    { path: '/templates', page: 'TemplateManager', source: 'More > Management', status: 'ok' },
    { path: '/recipes', page: 'Recipes', source: 'More > Management', status: 'ok' },
    { path: '/inventory', page: 'InventorySimplified', source: 'More > Management', status: 'ok' },
    { path: '/vendors', page: 'Vendors', source: 'More > Management', status: 'ok' },
    { path: '/reservations', page: 'ReservationsAndBEOs', source: 'More > Management', status: 'ok' },
    { path: '/reports', page: 'Reports', source: 'More > Admin', status: 'ok' },
    { path: '/schedule-import', page: 'ScheduleImport', source: 'More > Admin', status: 'ok' },
    { path: '/my-restaurant', page: 'MyRestaurant', source: 'More > Knowledge', status: 'ok' },
    { path: '/standards', page: 'Standards', source: 'More > Knowledge', status: 'ok' },
    { path: '/knowledge', page: 'Knowledge', source: 'More > Knowledge', status: 'ok' },
    { path: '/msds', page: 'MSDS', source: 'More > Knowledge', status: 'ok' },
    { path: '/build-cards', page: 'BuildCards', source: 'More > Knowledge', status: 'ok' },
    { path: '/job-codes', page: 'JobCodes', source: 'More > Admin', status: 'ok' },
    { path: '/temperature-monitoring', page: 'TemperatureMonitoring', source: 'More > Admin', status: 'ok' },
    { path: '/temperature-dashboard', page: 'TemperatureDashboard', source: 'More > Admin', status: 'ok' },
    { path: '/prep', page: 'Redirect to /shift', source: 'Legacy', status: 'redirect' },
    { path: '/side-work', page: 'Redirect to /shift', source: 'Legacy', status: 'redirect' },
  ];

  const NAVIGATION_ITEMS = [
    { source: 'Mobile Bottom Nav', items: [{ label: 'Today', path: '/' }, { label: 'Shift', path: '/shift' }, { label: 'Logs', path: '/logs' }, { label: 'Team', path: '/team' }, { label: 'More', path: '/more' }] },
    { source: 'Desktop Sidebar', items: [{ label: 'Overview', path: '/overview' }, { label: 'Today', path: '/' }, { label: 'Shift', path: '/shift' }, { label: 'Logs', path: '/logs' }, { label: 'Team', path: '/team' }, { label: 'More', path: '/more' }] },
  ];

  const ENTITIES = [
    { name: 'Task', purpose: 'Unified task management (prep, sidework, temperature, cleaning, etc)', pages: ['Shift', 'StaffTasks', 'TodaysCommandCenter'], forms: ['UnifiedTaskForm'], status: 'ok' },
    { name: 'UnifiedLog', purpose: 'Unified logging for all incident types', pages: ['LogsCenter', 'More'], forms: ['UnifiedLogForm'], status: 'ok' },
    { name: 'Template', purpose: 'Reusable templates for tasks', pages: ['TemplateManager', 'More'], forms: ['TemplateForm'], status: 'ok' },
    { name: 'Employee', purpose: 'Staff directory', pages: ['TeamCenter', 'More'], forms: ['EmployeeForm'], status: 'ok' },
    { name: 'MonitoredTemperatureItem', purpose: 'Temperature monitoring configuration', pages: ['TemperatureMonitoring'], forms: ['TemperatureMonitoringForm'], status: 'ok' },
    { name: 'User', purpose: 'Authentication and user profiles', pages: ['Profile', 'TeamCenter'], forms: ['ProfileForm'], status: 'ok' },
    { name: 'Settings', purpose: 'App configuration (name, logo, etc)', pages: ['MyRestaurant'], forms: ['SettingsForm'], status: 'ok' },
  ];

  const DUPLICATE_FEATURES = [
    { legacy: 'PrepItem', modern: 'Task (type: prep)', status: 'warning', note: 'Legacy entity - data should migrate to Task' },
    { legacy: 'SideWorkAssignment', modern: 'Task (type: sidework)', status: 'warning', note: 'Legacy entity - data should migrate to Task' },
    { legacy: 'TemperatureLog', modern: 'UnifiedLog (type: temperature)', status: 'warning', note: 'Legacy entity - data should migrate to UnifiedLog' },
    { legacy: 'IncidentReport', modern: 'UnifiedLog (type: incident)', status: 'warning', note: 'Legacy entity - data should migrate to UnifiedLog' },
    { legacy: 'WasteEntry', modern: 'UnifiedLog (type: waste)', status: 'warning', note: 'Legacy entity - data should migrate to UnifiedLog' },
    { legacy: 'EmployeeLog', modern: 'UnifiedLog (type: employee_note)', status: 'warning', note: 'Legacy entity - data should migrate to UnifiedLog' },
    { legacy: 'MaintenanceRequest', modern: 'UnifiedLog (type: maintenance)', status: 'warning', note: 'Legacy entity - data should migrate to UnifiedLog' },
    { legacy: '/overview', modern: '/ (Today)', status: 'warning', note: 'Duplicate route - both go to TodaysCommandCenter' },
  ];

  const ROLES = [
    { role: 'admin', access: 'All pages, all admin tools, all data' },
    { role: 'user', access: 'Today, Shift, Logs, Team, More (Knowledge only)' },
    { role: 'Other (busser, server, cook, etc)', access: 'Today, Shift, Logs, Team (team only)' },
  ];

  const routeHealthStatus = ROUTES.filter(r => r.status !== 'ok').length === 0 ? 'ok' : 'warning';
  const duplicateCount = DUPLICATE_FEATURES.filter(d => d.status === 'warning').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'routes', label: 'Routes', icon: '🛣️' },
    { id: 'navigation', label: 'Navigation', icon: '🧭' },
    { id: 'entities', label: 'Entities', icon: '📦' },
    { id: 'duplicates', label: 'Duplicates', icon: '⚠️' },
    { id: 'roles', label: 'Roles', icon: '👥' },
  ];

  return (
    <div className="pb-32 bg-background min-h-screen">
      {/* Header */}
      <div className="border-b border-border/20 px-4 py-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">App Health</h1>
          <p className="text-sm text-muted-foreground">Diagnostic dashboard for app structure, routes, forms, and duplicates. Read-only.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/20 px-4 lg:px-8 sticky top-0 z-20 bg-background/95">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8 lg:px-8 max-w-6xl mx-auto space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-border/30 rounded-xl bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Routes</p>
                <p className="text-2xl font-bold text-foreground">{ROUTES.length}</p>
              </div>
              <div className="border border-border/30 rounded-xl bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Route Issues</p>
                <p className="text-2xl font-bold text-amber-400">{ROUTES.filter(r => r.status !== 'ok').length}</p>
              </div>
              <div className="border border-border/30 rounded-xl bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Entities</p>
                <p className="text-2xl font-bold text-foreground">{ENTITIES.length}</p>
              </div>
              <div className="border border-border/30 rounded-xl bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Duplicate Features</p>
                <p className="text-2xl font-bold text-amber-400">{duplicateCount}</p>
              </div>
              <div className="border border-border/30 rounded-xl bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Roles Defined</p>
                <p className="text-2xl font-bold text-foreground">{ROLES.length}</p>
              </div>
              <div className="border border-border/30 rounded-xl bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Overall Status</p>
                <StatusBadge status={duplicateCount > 0 ? 'warning' : 'ok'} />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <HealthSection title="Key Findings" icon={AlertTriangle} status="warning">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-400">Duplicate Routes</p>
                      <p className="text-xs text-amber-300/80">/overview and / both render TodaysCommandCenter</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-400">Legacy Entities</p>
                      <p className="text-xs text-amber-300/80">PrepItem, SideWorkAssignment, TemperatureLog, etc. should migrate to unified entities (Task, UnifiedLog)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-400">Main Navigation</p>
                      <p className="text-xs text-green-300/80">5-item mobile nav + desktop sidebar properly configured</p>
                    </div>
                  </div>
                </div>
              </HealthSection>

              <HealthSection title="Migration Opportunities" icon={Info} status="info">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">These legacy entities can be deprecated in favor of unified systems:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>PrepItem → Task (type: prep)</li>
                    <li>SideWorkAssignment → Task (type: sidework)</li>
                    <li>TemperatureLog → UnifiedLog (type: temperature)</li>
                    <li>IncidentReport → UnifiedLog (type: incident)</li>
                    <li>WasteEntry → UnifiedLog (type: waste)</li>
                    <li>EmployeeLog → UnifiedLog (type: employee_note)</li>
                    <li>MaintenanceRequest → UnifiedLog (type: maintenance)</li>
                  </ul>
                </div>
              </HealthSection>
            </div>
          </>
        )}

        {activeTab === 'routes' && (
          <HealthSection title={`Route Health (${ROUTES.length} routes)`} count={ROUTES.length}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/30">
                  <tr className="text-xs text-muted-foreground font-semibold">
                    <th className="text-left py-2 px-3">Path</th>
                    <th className="text-left py-2 px-3">Page</th>
                    <th className="text-left py-2 px-3">Source</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ROUTES.map((route, idx) => (
                    <tr key={idx} className="border-b border-border/10">
                      <td className="py-2 px-3 text-foreground">{route.path}</td>
                      <td className="py-2 px-3 text-muted-foreground">{route.page}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{route.source}</td>
                      <td className="py-2 px-3"><StatusBadge status={route.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HealthSection>
        )}

        {activeTab === 'navigation' && (
          <>
            {NAVIGATION_ITEMS.map((nav, idx) => (
              <HealthSection key={idx} title={nav.source} count={nav.items.length}>
                <div className="space-y-2">
                  {nav.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.path}</p>
                      </div>
                      <StatusBadge status="ok" />
                    </div>
                  ))}
                </div>
              </HealthSection>
            ))}
          </>
        )}

        {activeTab === 'entities' && (
          <HealthSection title={`Entities (${ENTITIES.length} active)`} count={ENTITIES.length}>
            <div className="space-y-3">
              {ENTITIES.map((entity, idx) => (
                <div key={idx} className="border border-border/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-foreground">{entity.name}</h4>
                    <StatusBadge status={entity.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{entity.purpose}</p>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/20">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pages Reading</p>
                      <p className="text-xs text-foreground">{entity.pages.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Forms Writing</p>
                      <p className="text-xs text-foreground">{entity.forms.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </HealthSection>
        )}

        {activeTab === 'duplicates' && (
          <HealthSection title={`Duplicate Features (${duplicateCount} flagged)`} count={duplicateCount} status="warning">
            <div className="space-y-3">
              {DUPLICATE_FEATURES.map((dup, idx) => (
                <div key={idx} className="border border-border/20 rounded-lg p-4 space-y-2 bg-amber-500/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{dup.legacy}</p>
                      <p className="text-xs text-muted-foreground">→ Use {dup.modern}</p>
                    </div>
                    <StatusBadge status={dup.status} />
                  </div>
                  <p className="text-sm text-amber-300/90">{dup.note}</p>
                </div>
              ))}
            </div>
          </HealthSection>
        )}

        {activeTab === 'roles' && (
          <HealthSection title={`Roles (${ROLES.length} defined)`} count={ROLES.length}>
            <div className="space-y-3">
              {ROLES.map((roleItem, idx) => (
                <div key={idx} className="border border-border/20 rounded-lg p-4">
                  <h4 className="font-bold text-foreground mb-2 capitalize">{roleItem.role}</h4>
                  <p className="text-sm text-muted-foreground">{roleItem.access}</p>
                </div>
              ))}
            </div>
          </HealthSection>
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;