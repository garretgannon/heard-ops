import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { OperationalProvider } from '@/lib/OperationalContext';
import { UnifiedStateProvider } from '@/lib/UnifiedStateContext';
import { SimulatorProvider } from '@/lib/SimulatorContext';
import { ShiftModeProvider } from '@/lib/ShiftModeContext';
import { RoleSimulationProvider } from '@/lib/RoleSimulationContext';
import { useCurrentUser } from './hooks/useCurrentUser';
import { usePushAlerts } from './hooks/usePushAlerts';
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
const StaffShift = lazy(() => import('./pages/StaffShift'));
const LogsCenter = lazy(() => import('./pages/LogsCenter'));
const MyShifts = lazy(() => import('./pages/MyShifts'));
const More = lazy(() => import('./pages/More'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const TeamCenter = lazy(() => import('./pages/TeamCenter'));
const ScheduleCenter = lazy(() => import('./pages/ScheduleCenter'));
const ScheduleImport = lazy(() => import('./pages/ScheduleImport'));
const ApprovalInbox = lazy(() => import('./pages/ApprovalInbox'));
const Cleaning = lazy(() => import('./pages/Cleaning'));
const InventorySimplified = lazy(() => import('./pages/InventorySimplified'));
const Vendors = lazy(() => import('./pages/Vendors'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const MyRestaurant = lazy(() => import('./pages/MyRestaurant'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const BuildCards = lazy(() => import('./pages/BuildCards'));
const ReservationsAndBEOs = lazy(() => import('./pages/ReservationsAndBEOs'));
const PurchasedItems = lazy(() => import('./pages/PurchasedItems'));
const Recipes = lazy(() => import('./pages/Recipes'));
const RecipeBulkImport = lazy(() => import('./pages/RecipeBulkImport'));
const Training = lazy(() => import('./pages/Training'));
const ChemicalLibrary = lazy(() => import('./pages/ChemicalLibrary'));
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
const NotesAndComms = lazy(() => import('./pages/NotesAndComms'));
const CashDrawer = lazy(() => import('./pages/CashDrawer'));
const EightySixTemplates = lazy(() => import('./pages/86Templates'));
const StationReadiness = lazy(() => import('./pages/StationReadiness'));
const Stations = lazy(() => import('./pages/Stations'));
const RestaurantLayout = lazy(() => import('./pages/RestaurantLayout'));
const JobCodes = lazy(() => import('./pages/JobCodes'));
const OperationalMap = lazy(() => import('./pages/OperationalMap'));
const StationPage = lazy(() => import('./pages/StationPage'));
const LocationSetup = lazy(() => import('./pages/LocationSetup'));
const SetupJourney = lazy(() => import('./pages/SetupJourney'));
const RestaurantSetupWizard = lazy(() => import('./pages/RestaurantSetupWizard'));
const AutomationRules = lazy(() => import('./pages/AutomationRules'));
const ManagerShift = lazy(() => import('./pages/ManagerShift'));
const AdminRoleSimulator = lazy(() => import('./pages/AdminRoleSimulator'));
const AdminCommandCenter = lazy(() => import('./pages/AdminCommandCenter'));
const OnboardingSimulator = lazy(() => import('./pages/OnboardingSimulator'));
const Shift = lazy(() => import('./pages/Shift'));
const TemplateManager = lazy(() => import('./pages/TemplateManager'));
const AppOverview = lazy(() => import('./pages/AppOverview'));
const TeamStructureWizard = lazy(() => import('./pages/TeamStructureWizard'));
const Receiving = lazy(() => import('./pages/Receiving'));

function RouteFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="heard-spinner" />
    </div>
  );
}

// Redirects new users to onboarding if they haven't completed it yet.
function RootRedirect({ isAdmin }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      // Non-admins go directly to their shift view
      navigate('/station-shift', { replace: true });
      return;
    }
    base44.entities.Settings.filter({ key: 'onboarding_complete' })
      .then((rows) => {
        if (!rows || rows.length === 0 || rows[0]?.value !== 'true') {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/app/overview', { replace: true });
        }
      })
      .catch(() => navigate('/app/overview', { replace: true }))
      .finally(() => setChecking(false));
  }, [isAdmin, navigate]);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="heard-spinner" />
      </div>
    );
  }
  return null;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const { user, isAdmin, loading: userLoading } = useCurrentUser();
  usePushAlerts();

  if (isLoadingPublicSettings || isLoadingAuth || userLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background">
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

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<Layout />}>
          <Route path="/" element={<RootRedirect isAdmin={isAdmin} />} />
          <Route path="/app/overview" element={<AppOverview />} />
          <Route path="/station-shift" element={<StaffShift />} />
          <Route path="/tasks" element={<PermissionGate permission={PERMISSIONS.COMPLETE_TASKS}><StaffTasks /></PermissionGate>} />
          <Route path="/pulse" element={<PermissionGate permission={PERMISSIONS.VIEW_PULSE}><Pulse /></PermissionGate>} />
          <Route path="/logs" element={<PermissionGate permission={PERMISSIONS.VIEW_LOGS}><LogsCenter /></PermissionGate>} />
          <Route path="/notes-comms" element={<NotesAndComms />} />
          <Route path="/comms" element={<Navigate to="/notes-comms" replace />} />
          <Route path="/team" element={<PermissionGate permission={PERMISSIONS.VIEW_TEAM}><TeamCenter /></PermissionGate>} />
          <Route path="/more" element={<More />} />
          <Route path="/cleaning" element={<Cleaning />} />
          <Route path="/cleaning-templates" element={<CleaningTemplates />} />
          <Route path="/cleaning-templates/:id/edit" element={<CleaningTemplates />} />
          <Route path="/my-shifts" element={<MyShifts />} />
          <Route path="/shift" element={<ManagerShift />} />
          <Route path="/shift/:id" element={<Shift />} />
          <Route path="/approvals" element={<PermissionGate permission={PERMISSIONS.APPROVE_LOGS}><ApprovalInbox /></PermissionGate>} />
          <Route path="/temp-log-templates" element={<TemperatureLogTemplates />} />
          <Route path="/temp-log-templates/:id/edit" element={<TemperatureLogTemplates />} />
          <Route path="/recipes" element={<PermissionGate permission={PERMISSIONS.VIEW_RECIPES}><Recipes /></PermissionGate>} />
          <Route path="/recipe-bulk-import" element={<PermissionGate permission={PERMISSIONS.VIEW_RECIPES}><RecipeBulkImport /></PermissionGate>} />
          <Route path="/reservations" element={<PermissionGate permission={PERMISSIONS.VIEW_BEOS}><ReservationsAndBEOs /></PermissionGate>} />
          <Route path="/purchased-items" element={<PurchasedItems />} />
          <Route path="/chemical-library" element={<ChemicalLibrary />} />
          <Route path="/training" element={<PermissionGate permission={PERMISSIONS.VIEW_TRAINING}><Training /></PermissionGate>} />
          <Route path="/vendors" element={<PermissionGate permission={PERMISSIONS.VIEW_VENDORS}><Vendors /></PermissionGate>} />
          <Route path="/templates" element={<PermissionGate permission={PERMISSIONS.VIEW_TEMPLATES}><TemplateManager /></PermissionGate>} />
          <Route path="/templates/new" element={<PermissionGate permission={PERMISSIONS.VIEW_TEMPLATES}><TemplateManager /></PermissionGate>} />
          <Route path="/templates/:id" element={<PermissionGate permission={PERMISSIONS.VIEW_TEMPLATES}><TemplateManager /></PermissionGate>} />
          <Route path="/prep-templates" element={<PrepTemplatesManager />} />
          <Route path="/prep-templates/:id/edit" element={<PrepTemplatesManager />} />
          <Route path="/prep-plan-templates" element={<PrepPlanTemplatesManager />} />
          <Route path="/prep-plan-templates/new" element={<PrepTemplateBuilder />} />
          <Route path="/prep-plan-templates/:id" element={<PrepTemplateBuilder />} />
          <Route path="/side-work-templates" element={<SideWorkTemplates />} />
          <Route path="/side-work-templates/:id/edit" element={<SideWorkTemplates />} />
          <Route path="/waste-templates" element={<WasteTemplates />} />
          <Route path="/waste-templates/:id/edit" element={<WasteTemplates />} />
          <Route path="/waste-templates/new" element={<WasteTemplates />} />
          <Route path="/86-templates" element={<EightySixTemplates />} />
          <Route path="/86-templates/:id/edit" element={<EightySixTemplates />} />
          <Route path="/86-templates/new" element={<EightySixTemplates />} />
          <Route path="/prep-planning" element={<PrepPlanning />} />
          <Route path="/prep-count" element={<PrepInventoryCounter />} />
          <Route path="/prep-count/:id" element={<PrepInventoryCounter />} />
          <Route path="/prep-plan/:id" element={<PrepPlanReview />} />
          <Route path="/schedule" element={<PermissionGate permission={PERMISSIONS.VIEW_SCHEDULE}><ScheduleCenter /></PermissionGate>} />
          <Route path="/inventory" element={<PermissionGate permission={PERMISSIONS.VIEW_INVENTORY}><InventorySimplified /></PermissionGate>} />
          <Route path="/reports" element={<PermissionGate permission={PERMISSIONS.VIEW_REPORTS}><Reports /></PermissionGate>} />
          <Route path="/station-readiness" element={<PermissionGate permission={PERMISSIONS.VIEW_STATION_READINESS}><StationReadiness /></PermissionGate>} />
          <Route path="/shift-handoff" element={<ManagerShift />} />
          <Route path="/admin/role-simulator" element={<AdminRoleSimulator />} />
          <Route path="/admin/command-center" element={<AdminCommandCenter />} />
          <Route path="/admin/onboarding-simulator" element={<OnboardingSimulator />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/restaurant-layout" element={<RestaurantLayout />} />
          <Route path="/job-codes" element={<JobCodes />} />
          <Route path="/operational-map" element={<OperationalMap />} />
          <Route path="/station/:id" element={<StationPage />} />
          <Route path="/location-setup" element={<LocationSetup />} />
          <Route path="/setup-journey" element={<SetupJourney />} />
          <Route path="/restaurant-setup-wizard" element={<RestaurantSetupWizard />} />
          <Route path="/team-structure-wizard" element={<TeamStructureWizard />} />
          <Route path="/notepad" element={<Navigate to="/notes-comms" replace />} />
          <Route path="/cash-drawer" element={<CashDrawer />} />
          <Route path="/automation-rules" element={<AutomationRules />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-restaurant" element={<MyRestaurant />} />
          <Route path="/notifications" element={<NotificationSettings />} />
          <Route path="/build-cards" element={<BuildCards />} />
          <Route path="/receiving" element={<Receiving />} />
          <Route path="/schedule-import" element={<ScheduleImport />} />
          <Route path="/temperature-dashboard" element={<TemperatureDashboard />} />
          <Route path="/temperature-monitoring" element={<TemperatureMonitoring />} />
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
            <SonnerToaster position="bottom-center" richColors />
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
