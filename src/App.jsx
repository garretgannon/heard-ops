import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { OperationalProvider } from '@/lib/OperationalContext';
import { UnifiedStateProvider } from '@/lib/UnifiedStateContext';
import { SimulatorProvider } from '@/lib/SimulatorContext';
import { ShiftModeProvider } from '@/lib/ShiftModeContext';
import { RoleSimulationProvider } from '@/lib/RoleSimulationContext';
import { useCurrentUser } from './hooks/useCurrentUser';
import { usePushAlerts } from './hooks/usePushAlerts';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PermissionGate from '@/components/PermissionGate';
import { PERMISSIONS } from '@/lib/permissions';
import Layout from './components/Layout';
import GlobalBottomNav from './components/GlobalBottomNav';
import ToastContainer from './components/ToastContainer';
import { TabHistoryProvider } from '@/lib/TabHistoryContext';
const PageNotFound = lazy(() => import('./lib/PageNotFound'));
const Landing = lazy(() => import('./pages/Landing'));
const Pulse = lazy(() => import('./pages/Pulse'));
const StaffTasks = lazy(() => import('./pages/StaffTasks'));
const StationShift = lazy(() => import('./pages/StationShift'));
const LogsCenter = lazy(() => import('./pages/LogsCenter'));
const CommsCenter = lazy(() => import('./pages/CommsCenter'));
const MyShifts = lazy(() => import('./pages/MyShifts'));
const More = lazy(() => import('./pages/More'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const TeamCenter = lazy(() => import('./pages/TeamCenter'));
const ScheduleCenter = lazy(() => import('./pages/ScheduleCenter'));
const ScheduleImport = lazy(() => import('./pages/ScheduleImport'));
const ApprovalInbox = lazy(() => import('./pages/ApprovalInbox'));
const ReviewInbox = lazy(() => import('./pages/ReviewInbox'));
const Cleaning = lazy(() => import('./pages/Cleaning'));
const InventorySimplified = lazy(() => import('./pages/InventorySimplified'));
const Vendors = lazy(() => import('./pages/Vendors'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const MyRestaurant = lazy(() => import('./pages/MyRestaurant'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const RecipesAndBuildCards = lazy(() => import('./pages/RecipesAndBuildCards'));
const BuildCards = lazy(() => import('./pages/BuildCards'));
const ReservationsAndBEOs = lazy(() => import('./pages/ReservationsAndBEOs'));
const PurchasedItems = lazy(() => import('./pages/PurchasedItems'));
const Recipes = lazy(() => import('./pages/Recipes'));
const Training = lazy(() => import('./pages/Training'));
const ChemicalLibrary = lazy(() => import('./pages/ChemicalLibrary'));
const Knowledge = lazy(() => import('./pages/Knowledge'));
const PrepTemplatesManager = lazy(() => import('./pages/PrepTemplatesManager'));
const PrepPlanning = lazy(() => import('./pages/PrepPlanning'));
const PrepInventoryCounter = lazy(() => import('./pages/PrepInventoryCounter'));
const PrepPlanReview = lazy(() => import('./pages/PrepPlanReview'));
const PrepPlanTemplatesManager = lazy(() => import('./pages/PrepPlanTemplatesManager'));
const PrepTemplateBuilder = lazy(() => import('./pages/PrepTemplateBuilder'));
const SideWorkTemplates = lazy(() => import('./pages/SideWorkTemplates'));
const CleaningTemplates = lazy(() => import('./pages/CleaningTemplates'));
const TemperatureLogTemplates = lazy(() => import('./pages/TemperatureLogTemplates'));
const TemperatureDashboard = lazy(() => import('./pages/TemperatureDashboard'));
const TemperatureMonitoring = lazy(() => import('./pages/TemperatureMonitoring'));
const WasteTemplates = lazy(() => import('./pages/WasteTemplates'));
const EightySixTemplates = lazy(() => import('./pages/86Templates'));
const StationReadiness = lazy(() => import('./pages/StationReadiness'));
const Stations = lazy(() => import('./pages/Stations'));
const RestaurantLayout = lazy(() => import('./pages/RestaurantLayout'));
const JobCodes = lazy(() => import('./pages/JobCodes'));
const OperationalMap = lazy(() => import('./pages/OperationalMap'));
const LocationSetup = lazy(() => import('./pages/LocationSetup'));
const PeopleHierarchy = lazy(() => import('./pages/PeopleHierarchy'));
const SetupJourney = lazy(() => import('./pages/SetupJourney'));
const AutomationRules = lazy(() => import('./pages/AutomationRules'));
const ManagerShift = lazy(() => import('./pages/ManagerShift'));
const AdminRoleSimulator = lazy(() => import('./pages/AdminRoleSimulator'));
const AdminCommandCenter = lazy(() => import('./pages/AdminCommandCenter'));
const OnboardingSimulator = lazy(() => import('./pages/OnboardingSimulator'));
const Shift = lazy(() => import('./pages/Shift'));
const TemplateManager = lazy(() => import('./pages/TemplateManager'));
const SDSLibrary = lazy(() => import('./pages/SDSLibrary'));
const Standards = lazy(() => import('./pages/Standards'));
const AppOverview = lazy(() => import('./pages/AppOverview'));

function RouteFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="heard-spinner" />
    </div>
  );
}

const AuthenticatedApp = () => {
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const { user, isAdmin, loading: userLoading } = useCurrentUser();
  usePushAlerts();

  useEffect(() => {
    if (!user || !isAdmin) { setOnboardingChecked(true); return; }
    const settingsEntity = base44.entities?.Settings;
    if (!settingsEntity?.filter) {
      setOnboardingChecked(true);
      return;
    }
    settingsEntity.filter({ key: 'onboarding_complete' }).then(results => {
      setOnboardingChecked(true);
    }).catch(() => {
      setOnboardingChecked(true);
    });
  }, [user, isAdmin]);

  if (isLoadingPublicSettings || isLoadingAuth || userLoading || !onboardingChecked) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4">
        <div className="heard-spinner" />
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (!user) {
    // If not logged in, show Landing page
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Logged-in users: managers land on overview, staff land on station shift.
  if (window.location.pathname === '/') {
    return <Navigate to={isAdmin ? "/app/overview" : "/station-shift"} replace />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<Layout />}>
        {/* OVERVIEW - Logged-in dashboard */}
        <Route path="/app/overview" element={<AppOverview />} />
        
        {/* BOTTOM NAV ROUTES (5 main) */}
        <Route path="/dashboard" element={<AppOverview />} />
        <Route path="/station-shift" element={<StationShift />} />
        <Route path="/tasks" element={<StaffTasks />} />
        <Route path="/pulse" element={<PermissionGate permission={PERMISSIONS.VIEW_PULSE}><Pulse /></PermissionGate>} />
        <Route path="/logs" element={<PermissionGate permission={PERMISSIONS.VIEW_LOGS}><LogsCenter /></PermissionGate>} />
        <Route path="/comms" element={<CommsCenter />} />
        <Route path="/team" element={<PermissionGate permission={PERMISSIONS.VIEW_TEAM}><TeamCenter /></PermissionGate>} />

        <Route path="/more" element={<More />} />

        {/* TASK ROUTES - Redirected to Today with filters */}
        <Route path="/prep-lists" element={<Navigate to="/tasks?tab=prep" replace />} />
        <Route path="/side-work" element={<Navigate to="/tasks?tab=sidework" replace />} />
        <Route path="/cleaning" element={<Cleaning />} />
        <Route path="/cleaning-templates" element={<CleaningTemplates />} />
        <Route path="/cleaning-templates/:id/edit" element={<CleaningTemplates />} />
        <Route path="/my-shifts" element={<MyShifts />} />
        <Route path="/shift" element={<ManagerShift />} />
        <Route path="/shift/:id" element={<Shift />} />

        {/* COMPLIANCE ROUTES */}
        <Route path="/temp-logs" element={<Navigate to="/logs?type=temperature" replace />} />
        <Route path="/waste-86" element={<Navigate to="/logs?type=waste" replace />} />
        <Route path="/waste-log" element={<Navigate to="/logs?type=waste" replace />} />
        <Route path="/bathroom-checks" element={<Navigate to="/logs?type=bathroom" replace />} />

        {/* ADMIN/MANAGER - Approvals */}
        <Route path="/approvals" element={<ApprovalInbox />} />
        <Route path="/review-queue" element={<ReviewInbox />} />

        {/* ADMIN ONLY - Template Management */}
        <Route path="/temp-log-templates" element={<TemperatureLogTemplates />} />
        <Route path="/temp-log-templates/:id/edit" element={<TemperatureLogTemplates />} />

        {/* KNOWLEDGE ROUTES */}
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/search" element={<Knowledge />} />
        <Route path="/recipes" element={<PermissionGate permission={PERMISSIONS.VIEW_RECIPES}><Recipes /></PermissionGate>} />

        <Route path="/recipes-and-build-cards" element={<RecipesAndBuildCards />} />
        <Route path="/reservations" element={<ReservationsAndBEOs />} />
        <Route path="/purchased-items" element={<PurchasedItems />} />

        <Route path="/chemical-library" element={<ChemicalLibrary />} />
        <Route path="/training" element={<Training />} />
        <Route path="/vendors" element={<PermissionGate permission={PERMISSIONS.VIEW_VENDORS}><Vendors /></PermissionGate>} />

        {/* TEMPLATE ROUTES (Admin) */}
        <Route path="/prep-templates" element={<PrepTemplatesManager />} />
        <Route path="/prep-templates/:id/edit" element={<PrepTemplatesManager />} />
        <Route path="/prep-plan-templates" element={<PrepPlanTemplatesManager />} />
        <Route path="/prep-plan-templates/new" element={<PrepTemplateBuilder />} />
        <Route path="/prep-plan-templates/:id" element={<PrepTemplateBuilder />} />
        <Route path="/side-work-templates" element={<SideWorkTemplates />} />
        <Route path="/side-work-templates/:id/edit" element={<SideWorkTemplates />} />
        <Route path="/waste-templates" element={<WasteTemplates />} />
        <Route path="/waste-templates/:id/edit" element={<WasteTemplates />} />
        <Route path="/86-templates" element={<EightySixTemplates />} />
        <Route path="/86-templates/:id/edit" element={<EightySixTemplates />} />

        {/* OPERATIONS (Secondary) */}
        <Route path="/prep-planning" element={<PrepPlanning />} />
        <Route path="/prep-count" element={<PrepInventoryCounter />} />
        <Route path="/prep-count/:id" element={<PrepInventoryCounter />} />
        <Route path="/prep-plan/:id" element={<PrepPlanReview />} />
        <Route path="/issues" element={<Navigate to="/logs?type=incident" replace />} />
        <Route path="/schedule" element={<PermissionGate permission={PERMISSIONS.VIEW_SCHEDULE}><ScheduleCenter /></PermissionGate>} />
        <Route path="/inventory" element={<PermissionGate permission={PERMISSIONS.VIEW_INVENTORY}><InventorySimplified /></PermissionGate>} />
        <Route path="/reports" element={<PermissionGate permission={PERMISSIONS.VIEW_REPORTS}><Reports /></PermissionGate>} />
        <Route path="/station-readiness" element={<StationReadiness />} />
        <Route path="/shift-handoff" element={<ManagerShift />} />

        {/* ADMIN ROUTES (Under /more) */}
        <Route path="/admin/role-simulator" element={<AdminRoleSimulator />} />
        <Route path="/admin/command-center" element={<AdminCommandCenter />} />
        <Route path="/admin/onboarding-simulator" element={<OnboardingSimulator />} />
        <Route path="/templates" element={<TemplateManager />} />
        <Route path="/templates/new" element={<TemplateManager />} />
        <Route path="/templates/:id" element={<TemplateManager />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/restaurant-layout" element={<RestaurantLayout />} />
        <Route path="/job-codes" element={<JobCodes />} />
        <Route path="/operational-map" element={<OperationalMap />} />
        <Route path="/location-setup" element={<LocationSetup />} />
        <Route path="/people" element={<PeopleHierarchy />} />
        <Route path="/setup-journey" element={<SetupJourney />} />
        <Route path="/automation-rules" element={<AutomationRules />} />
        <Route path="/sds-library" element={<SDSLibrary />} />

        {/* SETTINGS ROUTES */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-restaurant" element={<MyRestaurant />} />
        <Route path="/notifications" element={<NotificationSettings />} />

        {/* LEGACY REDIRECTS - All logs → unified system */}
        <Route path="/ManagerLog" element={<Navigate to="/logs" replace />} />
        <Route path="/NewLog" element={<Navigate to="/logs" replace />} />
        <Route path="/MaintenanceRequests" element={<Navigate to="/logs?type=maintenance" replace />} />
        <Route path="/IncidentReports" element={<Navigate to="/logs?type=incident" replace />} />
        <Route path="/Incidents" element={<Navigate to="/logs?type=incident" replace />} />
        <Route path="/IssueTracker" element={<Navigate to="/logs?type=incident" replace />} />
        <Route path="/BathroomChecks" element={<Navigate to="/logs?type=bathroom" replace />} />
        <Route path="/TempLogs" element={<Navigate to="/station-readiness" replace />} />
        <Route path="/TemperatureMonitoring" element={<Navigate to="/station-readiness" replace />} />
        <Route path="/TemperatureDashboard" element={<Navigate to="/station-readiness" replace />} />
        <Route path="/WasteLog" element={<Navigate to="/logs?type=waste" replace />} />
        <Route path="/WasteEntry" element={<Navigate to="/logs?type=waste" replace />} />
        <Route path="/CleaningLog" element={<Navigate to="/logs?type=cleaning" replace />} />
        <Route path="/Cleaning" element={<Navigate to="/logs?type=cleaning" replace />} />
        <Route path="/EightySix" element={<Navigate to="/logs?type=waste" replace />} />
        <Route path="/Inventory" element={<Navigate to="/inventory" replace />} />
        <Route path="/InventoryControl" element={<Navigate to="/inventory" replace />} />
        <Route path="/InventorySimplified" element={<Navigate to="/inventory" replace />} />
        <Route path="/Recipes" element={<Navigate to="/recipes" replace />} />
        <Route path="/RecipeBuildCard" element={<Navigate to="/recipes" replace />} />
        <Route path="/BuildBook" element={<Navigate to="/recipes" replace />} />
        <Route path="/BarBook" element={<Navigate to="/recipes" replace />} />
        <Route path="/RecipesAndBuildCards" element={<Navigate to="/recipes" replace />} />
        <Route path="/Calendar" element={<Navigate to="/schedule" replace />} />
        <Route path="/EmployeeCalendar" element={<Navigate to="/schedule" replace />} />
        <Route path="/ScheduleImport" element={<Navigate to="/schedule" replace />} />
        <Route path="/R365ScheduleImport" element={<Navigate to="/schedule" replace />} />
        <Route path="/SideWork" element={<Navigate to="/tasks?tab=sidework" replace />} />
        <Route path="/SideWorkManager" element={<Navigate to="/tasks?tab=sidework" replace />} />
        <Route path="/SideWorkStaff" element={<Navigate to="/tasks?tab=sidework" replace />} />
        <Route path="/SideWorkProduction" element={<Navigate to="/tasks?tab=sidework" replace />} />
        <Route path="/restaurant-team" element={<Navigate to="/team" replace />} />
        <Route path="/schedule-center" element={<Navigate to="/schedule" replace />} />

        {/* SDS/MSDS REDIRECTS */}
        <Route path="/MSDS" element={<Navigate to="/sds-library" replace />} />
        <Route path="/SDS" element={<Navigate to="/sds-library" replace />} />
        <Route path="/safety-data-sheets" element={<Navigate to="/sds-library" replace />} />
        <Route path="/chemical-sheets" element={<Navigate to="/sds-library" replace />} />

        {/* ROUTE ALIASES - keep older buttons and quick actions from dead-ending */}
        <Route path="/today" element={<Navigate to="/app/overview" replace />} />
        <Route path="/build-cards" element={<BuildCards />} />
        <Route path="/standards" element={<Standards />} />
        <Route path="/schedule-import" element={<ScheduleImport />} />
        <Route path="/temperature-dashboard" element={<TemperatureDashboard />} />
        <Route path="/temperature-monitoring" element={<TemperatureMonitoring />} />
        <Route path="/86-templates/new" element={<EightySixTemplates />} />
        <Route path="/waste-templates/new" element={<WasteTemplates />} />
        <Route path="/kitchen-prep" element={<Navigate to="/tasks?tab=prep" replace />} />
        <Route path="/side-work-production" element={<Navigate to="/tasks?tab=sidework" replace />} />
        <Route path="/manager-log" element={<Navigate to="/logs?type=manager" replace />} />
        <Route path="/maintenance" element={<Navigate to="/logs?type=maintenance" replace />} />
        <Route path="/incidents" element={<Navigate to="/logs?type=incident" replace />} />
        <Route path="/photo-review" element={<Navigate to="/logs?action=photo" replace />} />
        <Route path="/pre-shift" element={<Navigate to="/shift" replace />} />

        {/* 404 */}
        <Route path="/" element={<Navigate to="/app/overview" replace />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <ShiftModeProvider>
      <OperationalProvider>
      <UnifiedStateProvider>
        <SimulatorProvider>
        <RoleSimulationProvider>
          <QueryClientProvider client={queryClientInstance}>
            <TabHistoryProvider>
              <Router>
                <AuthenticatedApp />
                <GlobalBottomNav />
                <ToastContainer />
              </Router>
            </TabHistoryProvider>
            <Toaster />
          </QueryClientProvider>
        </RoleSimulationProvider>
        </SimulatorProvider>
      </UnifiedStateProvider>
      </OperationalProvider>
      </ShiftModeProvider>
    </AuthProvider>
  )
}

export default App

export const hideBase44Index = true;
