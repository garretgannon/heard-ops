import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle, XCircle, Info, ArrowLeft } from 'lucide-react';

// ─── Static Health Data ───────────────────────────────────────────────────────

const ROUTE_HEALTH = [
  { path: '/', component: 'TodaysCommandCenter', navSource: 'Bottom Nav / Sidebar', status: 'ok' },
  { path: '/shift', component: 'Shift', navSource: 'Bottom Nav / Sidebar', status: 'ok' },
  { path: '/logs', component: 'LogsCenter', navSource: 'Bottom Nav / Sidebar', status: 'ok' },
  { path: '/team', component: 'TeamCenter', navSource: 'Bottom Nav / Sidebar', status: 'ok' },
  { path: '/more', component: 'More', navSource: 'Bottom Nav / Sidebar', status: 'ok' },
  { path: '/overview', component: 'TodaysCommandCenter', navSource: 'Sidebar only', status: 'duplicate', note: 'Same as /' },
  { path: '/templates', component: 'TemplateManager', navSource: 'More > Management', status: 'ok' },
  { path: '/recipes', component: 'Recipes', navSource: 'More > Management', status: 'ok' },
  { path: '/inventory', component: 'InventorySimplified', navSource: 'More > Management', status: 'ok' },
  { path: '/vendors', component: 'Vendors', navSource: 'More > Knowledge', status: 'ok' },
  { path: '/standards', component: 'Standards', navSource: 'More > Knowledge', status: 'ok' },
  { path: '/reservations', component: 'ReservationsAndBEOs', navSource: 'More > Management', status: 'ok' },
  { path: '/reports', component: 'Reports', navSource: 'More > Admin', status: 'ok' },
  { path: '/schedule-import', component: 'ScheduleImport', navSource: 'More > Admin', status: 'ok' },
  { path: '/schedule', component: 'ScheduleCenter', navSource: 'Link', status: 'ok' },
  { path: '/my-restaurant', component: 'MyRestaurant', navSource: 'More > Settings', status: 'ok' },
  { path: '/profile', component: 'Profile', navSource: 'Top Nav icon', status: 'ok' },
  { path: '/notifications', component: 'NotificationSettings', navSource: 'Link', status: 'ok' },
  { path: '/job-codes', component: 'JobCodes', navSource: 'More > Admin', status: 'ok' },
  { path: '/stations', component: 'Stations', navSource: 'Admin', status: 'ok' },
  { path: '/temperature-monitoring', component: 'TemperatureMonitoring', navSource: 'More > Admin', status: 'ok' },
  { path: '/temperature-dashboard', component: 'TemperatureDashboard', navSource: 'More > Admin', status: 'ok' },
  { path: '/admin/role-simulator', component: 'AdminRoleSimulator', navSource: 'More > Admin', status: 'ok' },
  { path: '/admin/command-center', component: 'AdminCommandCenter', navSource: 'Direct link', status: 'ok' },
  { path: '/admin/onboarding-simulator', component: 'OnboardingSimulator', navSource: 'Direct link', status: 'ok' },
  { path: '/cleaning', component: 'Cleaning', navSource: 'Link', status: 'ok' },
  { path: '/cleaning-templates', component: 'CleaningTemplates', navSource: 'More > Knowledge', status: 'ok' },
  { path: '/prep-templates', component: 'PrepTemplatesManager', navSource: 'Templates', status: 'ok' },
  { path: '/side-work-templates', component: 'SideWorkTemplates', navSource: 'Templates', status: 'ok' },
  { path: '/waste-templates', component: 'WasteTemplates', navSource: 'Templates', status: 'ok' },
  { path: '/86-templates', component: 'EightySixTemplates', navSource: 'Templates', status: 'ok' },
  { path: '/temp-log-templates', component: 'TemperatureLogTemplates', navSource: 'Admin', status: 'ok' },
  { path: '/shift-handoff', component: 'ShiftHandoff', navSource: 'Link', status: 'ok' },
  { path: '/msds', component: 'MSDS', navSource: 'More > Knowledge', status: 'ok' },
  { path: '/knowledge', component: 'Knowledge', navSource: 'More > Knowledge', status: 'ok' },
  { path: '/build-cards', component: 'BuildCards', navSource: 'More > Knowledge', status: 'ok' },
  { path: '/tasks', component: 'StaffTasks', navSource: 'Link', status: 'ok' },
  { path: '/purchased-items', component: 'PurchasedItems', navSource: 'Link', status: 'ok' },
  { path: '/app-health', component: 'AppHealth', navSource: 'More > Admin', status: 'ok' },
  // Redirects
  { path: '/temp-logs', component: '→ /logs?type=temperature', navSource: 'Legacy', status: 'redirect' },
  { path: '/waste-86', component: '→ /logs?type=waste', navSource: 'Legacy', status: 'redirect' },
  { path: '/issues', component: '→ /logs?type=incident', navSource: 'Legacy', status: 'redirect' },
  { path: '/prep', component: '→ /shift', navSource: 'Legacy', status: 'redirect' },
  { path: '/prep-lists', component: '→ /shift', navSource: 'Legacy', status: 'redirect' },
  { path: '/side-work', component: '→ /shift', navSource: 'Legacy', status: 'redirect' },
  { path: '/ManagerLog', component: '→ /logs', navSource: 'Legacy', status: 'redirect' },
  { path: '/Inventory', component: '→ /inventory', navSource: 'Legacy', status: 'redirect' },
  { path: '/Recipes', component: '→ /recipes', navSource: 'Legacy', status: 'redirect' },
  { path: '/Calendar', component: '→ /schedule', navSource: 'Legacy', status: 'redirect' },
];

const NAV_HEALTH = {
  mobile: [
    { label: 'Today', path: '/', activeIds: ['today'], status: 'ok' },
    { label: 'Shift', path: '/shift', activeIds: ['shift'], status: 'ok' },
    { label: 'Logs', path: '/logs', activeIds: ['logs'], status: 'ok' },
    { label: 'Team', path: '/team', activeIds: ['team'], status: 'ok' },
    { label: 'More', path: '/more', activeIds: ['more'], status: 'ok' },
  ],
  desktop: [
    { label: 'Overview', path: '/overview', status: 'warning', note: 'Duplicate of Today (/)' },
    { label: 'Today', path: '/', status: 'ok' },
    { label: 'Shift', path: '/shift', status: 'ok' },
    { label: 'Logs', path: '/logs', status: 'ok' },
    { label: 'Team', path: '/team', status: 'ok' },
    { label: 'More', path: '/more', status: 'ok' },
  ],
};

const BUTTON_HEALTH = [
  { label: 'New Log', page: 'LogsCenter', action: 'Opens LogTypeSelector modal', destination: 'UnifiedLog.create', status: 'ok' },
  { label: 'Start Task', page: 'Shift (CurrentTaskCard)', action: 'Updates Task status → in_progress', destination: 'Task.update', status: 'ok' },
  { label: 'Complete Task', page: 'Shift (CurrentTaskCard)', action: 'Updates Task status → complete', destination: 'Task.update', status: 'ok' },
  { label: 'Log Temperature', page: 'Shift (CurrentTaskCard)', action: 'Opens TemperatureCheckForm', destination: 'TemperatureLog / UnifiedLog', status: 'ok' },
  { label: 'Unable to Complete', page: 'Shift (CurrentTaskCard)', action: 'Updates Task → unable_to_complete + reason', destination: 'Task.update', status: 'ok' },
  { label: 'Quick Action (+)', page: 'TodaysCommandCenter', action: 'Opens QuickActionModal', destination: 'Various entities', status: 'ok' },
  { label: 'New Template', page: 'TemplateManager', action: 'Opens template form modal', destination: 'Template.create', status: 'ok' },
  { label: 'Add Employee', page: 'TeamCenter', action: 'Opens AddEmployeeModal', destination: 'Employee.create', status: 'ok' },
  { label: 'Import Schedule', page: 'ScheduleCenter', action: 'Opens R365 import flow', destination: 'StaffShift.create', status: 'ok' },
  { label: 'Create BEO', page: 'ReservationsAndBEOs', action: 'Opens BEO form', destination: 'BEO.create', status: 'ok' },
  { label: 'Integrations', page: 'More > Admin', action: 'No action (disabled)', destination: 'None', status: 'warning', note: 'Button present but disabled/coming soon' },
  { label: 'Collapse Sidebar', page: 'Layout (Desktop)', action: 'Toggles sidebar width via localStorage', destination: 'localStorage only', status: 'ok' },
  { label: 'Bell / Notifications', page: 'Layout Header (Mobile)', action: 'Navigates to /logs', destination: '/logs', status: 'warning', note: 'Links to /logs instead of a notifications page' },
];

const FORM_HEALTH = [
  { name: 'UnifiedLogForm', opensFrom: 'LogsCenter, QuickActionModal', savesTo: 'UnifiedLog', requiredFields: 'type, title, status', creates: 'Log', status: 'ok' },
  { name: 'LogTypeSelector', opensFrom: 'LogsCenter', savesTo: 'N/A (selector only)', requiredFields: 'logType', creates: 'N/A', status: 'ok' },
  { name: 'TemperatureCheckForm', opensFrom: 'Shift (CurrentTaskCard)', savesTo: 'TemperatureLog / UnifiedLog', requiredFields: 'temperature, equipment', creates: 'Log', status: 'ok' },
  { name: 'TemperatureMonitoringForm', opensFrom: 'TemperatureMonitoring', savesTo: 'MonitoredTemperatureItem', requiredFields: 'name, type, location, min_temperature, max_temperature', creates: 'Setting', status: 'ok' },
  { name: 'TemplateManager Form', opensFrom: 'TemplateManager', savesTo: 'Template', requiredFields: 'name, template_type, assigned_role', creates: 'Template', status: 'ok' },
  { name: 'PrepTemplatesManager Form', opensFrom: 'PrepTemplatesManager', savesTo: 'PrepTemplate + PrepTemplateItem', requiredFields: 'name', creates: 'Template', status: 'ok' },
  { name: 'SideWorkTemplateForm', opensFrom: 'SideWorkTemplates', savesTo: 'SideWorkTemplate + SideWorkTemplateItem', requiredFields: 'name, assigned_role', creates: 'Template', status: 'ok' },
  { name: 'CleaningTemplateForm', opensFrom: 'CleaningTemplates', savesTo: 'CleaningTemplate', requiredFields: 'name', creates: 'Template', status: 'ok' },
  { name: 'TemperatureLogTemplateForm', opensFrom: 'TemperatureLogTemplates', savesTo: 'TemperatureLogTemplate', requiredFields: 'name', creates: 'Template', status: 'ok' },
  { name: 'AddEmployeeModal / SingleEntryForm', opensFrom: 'TeamCenter', savesTo: 'Employee', requiredFields: 'full_name, email, employee_id, clock_in_code, job_code, rate_of_pay', creates: 'Employee', status: 'ok' },
  { name: 'ReservationForm', opensFrom: 'ReservationsAndBEOs', savesTo: 'Reservation', requiredFields: 'name, date', creates: 'Setting', status: 'ok' },
  { name: 'BEOForm', opensFrom: 'ReservationsAndBEOs', savesTo: 'BEO + BEO sub-entities', requiredFields: 'name, event_date', creates: 'Setting', status: 'ok' },
  { name: 'PurchasedItemForm', opensFrom: 'PurchasedItems', savesTo: 'PurchasedItem', requiredFields: 'name, vendor_id, unit', creates: 'Inventory', status: 'ok' },
  { name: 'QuickActionModal', opensFrom: 'TodaysCommandCenter', savesTo: 'Various (Task, Log, etc.)', requiredFields: 'Varies by action', creates: 'Task/Log', status: 'ok' },
  { name: 'UnifiedTaskForm', opensFrom: 'Admin dashboards', savesTo: 'Task', requiredFields: 'type, title, status', creates: 'Task', status: 'ok' },
  { name: 'MaintenanceForm', opensFrom: 'QuickActions / Logs', savesTo: 'UnifiedLog (type: maintenance)', requiredFields: 'title, location', creates: 'Log', status: 'ok' },
  { name: 'CashLogForm', opensFrom: 'Cash page', savesTo: 'CashTransaction / DrawerCount', requiredFields: 'amount', creates: 'Log', status: 'ok' },
  { name: 'MyRestaurant Settings', opensFrom: 'MyRestaurant page', savesTo: 'Settings (key/value)', requiredFields: 'key, value', creates: 'Setting', status: 'ok' },
];

const DATA_HEALTH = [
  { name: 'Task', purpose: 'Unified task tracking for all shift work', reads: 'Shift, TodaysCommandCenter, AdminShiftDashboard, StaffTasks', writes: 'UnifiedTaskForm, QuickActionModal, Template generators', duplicates: 'PrepItem, SideWorkAssignment, DailyPrepTask, DailySideWorkTask', orphanRisk: 'medium' },
  { name: 'UnifiedLog', purpose: 'Unified log for all log types', reads: 'LogsCenter, TodaysCommandCenter', writes: 'UnifiedLogForm, TemperatureCheckForm, MaintenanceForm', duplicates: 'Log, IncidentReport, EmployeeLog, WasteEntry, CleaningLog, BathroomCheckLog', orphanRisk: 'medium' },
  { name: 'Template', purpose: 'New unified template definition', reads: 'TemplateManager', writes: 'TemplateManager form', duplicates: 'PrepTemplate, SideWorkTemplate, CleaningTemplate, TemperatureLogTemplate', orphanRisk: 'low' },
  { name: 'Employee', purpose: 'Staff directory', reads: 'TeamCenter, ScheduleCenter, AdminShiftDashboard', writes: 'AddEmployeeModal, SingleEntryForm, BulkImportTab', duplicates: 'None known', orphanRisk: 'low' },
  { name: 'MonitoredTemperatureItem', purpose: 'Configure temp check schedules', reads: 'TemperatureMonitoring', writes: 'TemperatureMonitoringForm', duplicates: 'TemperatureLogTemplate, TemperatureLogTemplateItem', orphanRisk: 'low' },
  { name: 'PrepItem', purpose: 'Legacy prep tracking', reads: 'KitchenPrep (legacy)', writes: 'Legacy forms', duplicates: 'Task (type: prep), DailyPrepTask', orphanRisk: 'high' },
  { name: 'DailyPrepTask', purpose: 'Generated daily prep tasks (legacy)', reads: 'KitchenPrep', writes: 'generatePrepTasksFromTemplate', duplicates: 'Task (type: prep)', orphanRisk: 'high' },
  { name: 'SideWorkAssignment', purpose: 'Legacy side work tracking', reads: 'SideWork (legacy)', writes: 'Legacy forms', duplicates: 'Task (type: sidework), DailySideWorkTask', orphanRisk: 'high' },
  { name: 'DailySideWorkTask', purpose: 'Generated side work (legacy)', reads: 'SideWork pages', writes: 'generateSideWorkTasksFromTemplate', duplicates: 'Task (type: sidework)', orphanRisk: 'high' },
  { name: 'IncidentReport', purpose: 'Legacy incident tracking', reads: 'IncidentReports (redirected)', writes: 'Legacy forms', duplicates: 'UnifiedLog (type: incident)', orphanRisk: 'high' },
  { name: 'WasteEntry', purpose: 'Legacy waste logging', reads: 'WasteLog (redirected)', writes: 'Legacy forms', duplicates: 'UnifiedLog (type: waste)', orphanRisk: 'high' },
  { name: 'EmployeeLog', purpose: 'Legacy employee notes', reads: 'Legacy', writes: 'Legacy forms', duplicates: 'UnifiedLog (type: employee_note)', orphanRisk: 'high' },
  { name: 'MaintenanceRequest', purpose: 'Legacy maintenance tracking', reads: 'MaintenanceRequests (redirected)', writes: 'Legacy forms', duplicates: 'UnifiedLog (type: maintenance)', orphanRisk: 'high' },
  { name: 'Log', purpose: 'Legacy log base entity', reads: 'Legacy', writes: 'Legacy', duplicates: 'UnifiedLog', orphanRisk: 'high' },
  { name: 'StaffShift', purpose: 'Imported schedule shifts', reads: 'ScheduleCenter', writes: 'ScheduleImport', duplicates: 'Shift entity (possibly)', orphanRisk: 'medium' },
  { name: 'BEO', purpose: 'Banquet event orders', reads: 'ReservationsAndBEOs', writes: 'BEOForm', duplicates: 'CalendarEvent (possibly)', orphanRisk: 'low' },
  { name: 'Recipe', purpose: 'Recipe / build card definitions', reads: 'Recipes, BuildCards', writes: 'Recipe forms', duplicates: 'BuildCard (overlap)', orphanRisk: 'low' },
  { name: 'Settings', purpose: 'App config key-value store', reads: 'Layout, MyRestaurant', writes: 'MyRestaurant', duplicates: 'None', orphanRisk: 'low' },
  { name: 'EightySixItem', purpose: '86 item tracking', reads: 'LogsCenter (via waste)', writes: 'UnifiedLogForm', duplicates: 'UnifiedLog (type: eighty_six)', orphanRisk: 'medium' },
];

const DUPLICATE_WARNINGS = [
  {
    issue: 'PrepItem vs Task (type: prep)',
    legacy: 'PrepItem, DailyPrepTask, PrepList, PrepTemplate, PrepTemplateItem',
    modern: 'Task (type: prep) + Template system',
    severity: 'high',
    recommendation: 'Migrate active PrepItems to Task records. Archive PrepItem entity.',
  },
  {
    issue: 'SideWorkAssignment vs Task (type: sidework)',
    legacy: 'SideWorkAssignment, DailySideWorkTask, SideWorkTemplate, SideWorkTemplateItem',
    modern: 'Task (type: sidework) + Template system',
    severity: 'high',
    recommendation: 'Migrate active SideWork to Task records. Archive SideWorkAssignment.',
  },
  {
    issue: 'IncidentReport vs UnifiedLog (type: incident)',
    legacy: 'IncidentReport entity',
    modern: 'UnifiedLog (type: incident)',
    severity: 'high',
    recommendation: 'Route is already redirected. Migrate data to UnifiedLog.',
  },
  {
    issue: 'WasteEntry vs UnifiedLog (type: waste)',
    legacy: 'WasteEntry entity',
    modern: 'UnifiedLog (type: waste)',
    severity: 'high',
    recommendation: 'Route is already redirected. Migrate data to UnifiedLog.',
  },
  {
    issue: 'EmployeeLog vs UnifiedLog (type: employee_note)',
    legacy: 'EmployeeLog entity',
    modern: 'UnifiedLog (type: employee_note)',
    severity: 'high',
    recommendation: 'Migrate EmployeeLog records into UnifiedLog.',
  },
  {
    issue: 'MaintenanceRequest vs UnifiedLog (type: maintenance)',
    legacy: 'MaintenanceRequest entity',
    modern: 'UnifiedLog (type: maintenance)',
    severity: 'high',
    recommendation: 'Route is already redirected. Migrate data to UnifiedLog.',
  },
  {
    issue: 'Log vs UnifiedLog',
    legacy: 'Log entity + LogTemperatureDetail, LogWasteDetail, LogMaintenanceDetail, LogBathroomDetail, etc.',
    modern: 'UnifiedLog (with custom_metadata)',
    severity: 'high',
    recommendation: 'Fully consolidate into UnifiedLog. Legacy Log and detail entities can be archived.',
  },
  {
    issue: 'TemperatureLog vs UnifiedLog (type: temperature)',
    legacy: 'TemperatureLog, RefrigeratorFreezerLog, HotHoldingLog, CoolingLog, TempLogEntry',
    modern: 'UnifiedLog (type: temperature)',
    severity: 'medium',
    recommendation: 'Consolidate all temperature log entities into UnifiedLog.',
  },
  {
    issue: 'Template vs PrepTemplate / SideWorkTemplate / CleaningTemplate',
    legacy: 'PrepTemplate, SideWorkTemplate, CleaningTemplate, TemperatureLogTemplate',
    modern: 'Template entity (unified)',
    severity: 'medium',
    recommendation: 'Migrate all template types to the unified Template entity.',
  },
  {
    issue: 'Overview (/overview) vs Today (/)',
    legacy: '/overview route',
    modern: '/ (TodaysCommandCenter)',
    severity: 'low',
    recommendation: 'Remove /overview or redirect to /.',
  },
];

const ROLE_HEALTH = [
  { role: 'admin', canAccess: 'All routes and pages', restrictions: 'None', status: 'ok' },
  { role: 'manager', canAccess: 'Main nav (Today, Shift, Logs, Team, More), Logs review queue, Admin shift dashboard', restrictions: 'Some admin settings may be limited', status: 'ok' },
  { role: 'user (staff)', canAccess: 'Today, Shift (staff view), Logs (team_only), Team', restrictions: 'More page hidden. Manager-only logs hidden.', status: 'ok' },
  { role: 'busser', canAccess: 'Busser home, limited tasks', restrictions: 'Redirected to BusserHome', status: 'ok' },
  { role: 'FOH / Server', canAccess: 'Today, Shift, Logs, Team', restrictions: 'Role visibility filters applied', status: 'ok' },
  { role: 'kitchen / cook', canAccess: 'Today, Shift, Kitchen prep workflows', restrictions: 'Role visibility filters applied', status: 'ok' },
];

// ─── Score Calculation ─────────────────────────────────────────────────────────

function calcScores() {
  const routeOk = ROUTE_HEALTH.filter(r => r.status === 'ok').length;
  const routeScore = Math.round((routeOk / ROUTE_HEALTH.filter(r => r.status !== 'redirect').length) * 100);

  const navOk = [...NAV_HEALTH.mobile, ...NAV_HEALTH.desktop].filter(n => n.status === 'ok').length;
  const navScore = Math.round((navOk / (NAV_HEALTH.mobile.length + NAV_HEALTH.desktop.length)) * 100);

  const btnOk = BUTTON_HEALTH.filter(b => b.status === 'ok').length;
  const btnScore = Math.round((btnOk / BUTTON_HEALTH.length) * 100);

  const formOk = FORM_HEALTH.filter(f => f.status === 'ok').length;
  const formScore = Math.round((formOk / FORM_HEALTH.length) * 100);

  const dataLowRisk = DATA_HEALTH.filter(d => d.orphanRisk === 'low').length;
  const dataScore = Math.round((dataLowRisk / DATA_HEALTH.length) * 100);

  const permOk = ROLE_HEALTH.filter(r => r.status === 'ok').length;
  const permScore = Math.round((permOk / ROLE_HEALTH.length) * 100);

  return { routeScore, navScore, btnScore, formScore, dataScore, permScore };
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ok: { label: 'OK', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle2 },
  warning: { label: 'Warning', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: AlertTriangle },
  broken: { label: 'Broken', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
  duplicate: { label: 'Duplicate', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: AlertCircle },
  redirect: { label: 'Redirect', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Info },
  unused: { label: 'Unused', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', icon: AlertCircle },
};

const SEVERITY_CONFIG = {
  high: { label: 'High', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  medium: { label: 'Medium', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  low: { label: 'Low', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
};

const ORPHAN_CONFIG = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-green-400',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ok;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function ScoreRing({ score, label }) {
  const color = score >= 90 ? 'text-green-400' : score >= 70 ? 'text-amber-400' : 'text-red-400';
  const bgColor = score >= 90 ? 'bg-green-500/10 border-green-500/30' : score >= 70 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30';
  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-xl border ${bgColor} gap-1 min-w-[100px]`}>
      <span className={`text-3xl font-black ${color}`}>{score}%</span>
      <span className="text-xs font-semibold text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function Section({ title, count, badgeColor = 'bg-primary/15 text-primary', children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-foreground">{title}</span>
          {count != null && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>{count}</span>
          )}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border/20 px-5 py-4">{children}</div>}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-border/20">
            {headers.map(h => (
              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground pb-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/10 last:border-0 hover:bg-white/2">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-4 align-top text-xs text-foreground/80">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AppHealth() {
  const { isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const scores = calcScores();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-foreground font-bold">Admin Only</p>
          <p className="text-muted-foreground text-sm mt-1">You do not have access to this page.</p>
        </div>
      </div>
    );
  }

  const highDupes = DUPLICATE_WARNINGS.filter(d => d.severity === 'high').length;
  const highOrphan = DATA_HEALTH.filter(d => d.orphanRisk === 'high').length;
  const warnings = BUTTON_HEALTH.filter(b => b.status === 'warning').length + NAV_HEALTH.desktop.filter(n => n.status === 'warning').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-32 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/more')} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-2xl font-black text-foreground">App Health</h1>
            <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold">READ-ONLY DIAGNOSTIC</span>
          </div>
          <p className="text-sm text-muted-foreground">Identify broken, unused, duplicate, and disconnected parts of HeardOS. Nothing here deletes or modifies data.</p>
        </div>
      </div>

      {/* Alert Banner */}
      {(highDupes > 0 || highOrphan > 0) && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-300">Action Recommended</p>
            <p className="text-xs text-red-300/80 mt-0.5">
              {highDupes} high-severity duplicate feature conflicts and {highOrphan} entities with high orphan risk detected. Review sections below.
            </p>
          </div>
        </div>
      )}

      {/* ── Section 8: Health Score ── */}
      <Section title="8. Health Score" badgeColor="bg-green-500/15 text-green-400">
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          <ScoreRing score={scores.routeScore} label="Route Health" />
          <ScoreRing score={scores.navScore} label="Navigation Health" />
          <ScoreRing score={scores.btnScore} label="Button Health" />
          <ScoreRing score={scores.formScore} label="Form Health" />
          <ScoreRing score={scores.dataScore} label="Data Health" />
          <ScoreRing score={scores.permScore} label="Permission Health" />
        </div>
        <p className="text-xs text-muted-foreground mt-4">Scores based on static analysis of defined routes, nav items, buttons, forms, entities, and roles. Data Health score reflects entities with low orphan risk.</p>
      </Section>

      {/* ── Section 1: Route Health ── */}
      <Section title="1. Route Health" count={ROUTE_HEALTH.length}>
        <Table
          headers={['Path', 'Component', 'Nav Source', 'Status', 'Note']}
          rows={ROUTE_HEALTH.map(r => [
            <code className="text-primary text-[11px] font-mono">{r.path}</code>,
            <span className="text-foreground/70">{r.component}</span>,
            <span className="text-muted-foreground">{r.navSource}</span>,
            <StatusBadge status={r.status} />,
            <span className="text-muted-foreground italic">{r.note || '—'}</span>,
          ])}
        />
      </Section>

      {/* ── Section 2: Navigation Health ── */}
      <Section title="2. Navigation Health" count={NAV_HEALTH.mobile.length + NAV_HEALTH.desktop.length} badgeColor={warnings > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-primary/15 text-primary'}>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Mobile Bottom Nav</p>
            <Table
              headers={['Label', 'Route', 'Status', 'Note']}
              rows={NAV_HEALTH.mobile.map(n => [
                <span className="font-semibold">{n.label}</span>,
                <code className="text-primary text-[11px] font-mono">{n.path}</code>,
                <StatusBadge status={n.status} />,
                <span className="text-muted-foreground italic">{n.note || '—'}</span>,
              ])}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Desktop Sidebar Nav</p>
            <Table
              headers={['Label', 'Route', 'Status', 'Note']}
              rows={NAV_HEALTH.desktop.map(n => [
                <span className="font-semibold">{n.label}</span>,
                <code className="text-primary text-[11px] font-mono">{n.path}</code>,
                <StatusBadge status={n.status} />,
                <span className="text-muted-foreground italic">{n.note || '—'}</span>,
              ])}
            />
          </div>
        </div>
      </Section>

      {/* ── Section 3: Button Health ── */}
      <Section title="3. Button Health" count={BUTTON_HEALTH.length} badgeColor={BUTTON_HEALTH.some(b => b.status === 'warning') ? 'bg-amber-500/15 text-amber-400' : 'bg-primary/15 text-primary'}>
        <Table
          headers={['Label', 'Page', 'Action', 'Destination', 'Status', 'Note']}
          rows={BUTTON_HEALTH.map(b => [
            <span className="font-semibold">{b.label}</span>,
            <span className="text-muted-foreground">{b.page}</span>,
            <span className="text-foreground/70">{b.action}</span>,
            <code className="text-blue-400 text-[11px] font-mono">{b.destination}</code>,
            <StatusBadge status={b.status} />,
            <span className="text-muted-foreground italic">{b.note || '—'}</span>,
          ])}
        />
      </Section>

      {/* ── Section 4: Form Health ── */}
      <Section title="4. Form Health" count={FORM_HEALTH.length}>
        <Table
          headers={['Form', 'Opens From', 'Saves To', 'Required Fields', 'Creates', 'Status']}
          rows={FORM_HEALTH.map(f => [
            <span className="font-semibold text-foreground">{f.name}</span>,
            <span className="text-muted-foreground">{f.opensFrom}</span>,
            <code className="text-blue-400 text-[11px] font-mono">{f.savesTo}</code>,
            <span className="text-foreground/60 text-[11px]">{f.requiredFields}</span>,
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">{f.creates}</span>,
            <StatusBadge status={f.status} />,
          ])}
        />
      </Section>

      {/* ── Section 5: Data Health ── */}
      <Section title="5. Data Health" count={DATA_HEALTH.length} badgeColor={highOrphan > 0 ? 'bg-red-500/15 text-red-400' : 'bg-primary/15 text-primary'}>
        <Table
          headers={['Entity', 'Purpose', 'Read By', 'Written By', 'Possible Duplicates', 'Orphan Risk']}
          rows={DATA_HEALTH.map(d => [
            <span className="font-semibold text-foreground font-mono text-[11px]">{d.name}</span>,
            <span className="text-muted-foreground">{d.purpose}</span>,
            <span className="text-foreground/60 text-[11px]">{d.reads}</span>,
            <span className="text-foreground/60 text-[11px]">{d.writes}</span>,
            <span className="text-amber-400/80 text-[11px] italic">{d.duplicates}</span>,
            <span className={`text-xs font-bold ${ORPHAN_CONFIG[d.orphanRisk]}`}>{d.orphanRisk.toUpperCase()}</span>,
          ])}
        />
      </Section>

      {/* ── Section 6: Duplicate Feature Warnings ── */}
      <Section title="6. Duplicate Feature Warnings" count={DUPLICATE_WARNINGS.length} badgeColor="bg-red-500/15 text-red-400">
        <div className="space-y-3">
          {DUPLICATE_WARNINGS.map((w, i) => (
            <div key={i} className="p-4 rounded-xl bg-background border border-border/30 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <AlertTriangle className={`h-4 w-4 shrink-0 ${w.severity === 'high' ? 'text-red-400' : w.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
                <span className="font-bold text-sm text-foreground">{w.issue}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEVERITY_CONFIG[w.severity].color}`}>
                  {SEVERITY_CONFIG[w.severity].label} Priority
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Legacy System</p>
                  <p className="text-red-300/80">{w.legacy}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Modern System</p>
                  <p className="text-green-300/80">{w.modern}</p>
                </div>
              </div>
              <div className="pt-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Recommendation</p>
                <p className="text-xs text-foreground/70">{w.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 7: Role/Permission Health ── */}
      <Section title="7. Role / Permission Health" count={ROLE_HEALTH.length}>
        <Table
          headers={['Role', 'Can Access', 'Restrictions', 'Status']}
          rows={ROLE_HEALTH.map(r => [
            <code className="text-primary text-[11px] font-mono font-bold">{r.role}</code>,
            <span className="text-foreground/70">{r.canAccess}</span>,
            <span className="text-muted-foreground">{r.restrictions}</span>,
            <StatusBadge status={r.status} />,
          ])}
        />
      </Section>

      <p className="text-center text-xs text-muted-foreground pb-4">This is a read-only diagnostic page. No data was modified. Last generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
    </div>
  );
}

export const hideBase44Index = true;