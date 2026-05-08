import { useState, useEffect, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { OperationalProvider } from '@/lib/OperationalContext';
import { UnifiedStateProvider } from '@/lib/UnifiedStateContext';
import { SimulatorProvider } from '@/lib/SimulatorContext';
import { ShiftModeProvider } from '@/lib/ShiftModeContext';
import { RoleSimulationProvider } from '@/lib/RoleSimulationContext';
import { useCurrentUser } from './hooks/useCurrentUser';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { legacyRedirects } from '@/lib/routeConfig';
import Layout from './components/Layout';
import GlobalBottomNav from './components/GlobalBottomNav';
import ToastContainer from './components/ToastContainer';
import AdminSimulationBar from './components/AdminSimulationBar';
import { TabHistoryProvider } from '@/lib/TabHistoryContext';
import Landing from './pages/Landing';
import TodaysCommandCenter from './pages/TodaysCommandCenter';
import StaffTasks from './pages/StaffTasks';
import LogsCenter from './pages/LogsCenter';
import Knowledge from './pages/Knowledge';
import More from './pages/More';
import Onboarding from './pages/Onboarding';
import TeamCenter from './pages/TeamCenter';

import ScheduleCenter from './pages/ScheduleCenter';


import Cleaning from './pages/Cleaning';


import InventorySimplified from './pages/InventorySimplified';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import MyRestaurant from './pages/MyRestaurant';
import NotificationSettings from './pages/NotificationSettings';
import RecipesAndBuildCards from './pages/RecipesAndBuildCards';
import ReservationsAndBEOs from './pages/ReservationsAndBEOs';
import PurchasedItems from './pages/PurchasedItems';
import Recipes from './pages/Recipes';
import BuildCards from './pages/BuildCards';
import Standards from './pages/Standards';
import MSDS from './pages/MSDS';

import PrepTemplatesManager from './pages/PrepTemplatesManager';
import SideWorkTemplates from './pages/SideWorkTemplates';
import CleaningTemplates from './pages/CleaningTemplates';
import TemperatureLogTemplates from './pages/TemperatureLogTemplates';
import WasteTemplates from './pages/WasteTemplates';
import EightySixTemplates from './pages/86Templates';
import TemperatureMonitoring from './pages/TemperatureMonitoring';
import TemperatureDashboard from './pages/TemperatureDashboard';
import Stations from './pages/Stations';
import JobCodes from './pages/JobCodes';
import ScheduleImport from './pages/ScheduleImport';
import ShiftHandoff from './pages/ShiftHandoff';
import AdminRoleSimulator from './pages/AdminRoleSimulator';
import AdminCommandCenter from './pages/AdminCommandCenter';
import OnboardingSimulator from './pages/OnboardingSimulator';
import Shift from './pages/Shift';
import TemplateManager from './pages/TemplateManager';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { user, isAdmin, isFOH, loading: userLoading } = useCurrentUser();
  const isBusser = user?.role === 'busser';
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) { setOnboardingChecked(true); return; }
    base44.entities.Settings.filter({ key: 'onboarding_complete' }).then(results => {
      setNeedsOnboarding(results.length === 0);
      setOnboardingChecked(true);
    }).catch(() => {
      setOnboardingChecked(true);
    });
  }, [user, isAdmin]);

  if (isLoadingPublicSettings || isLoadingAuth || userLoading || !onboardingChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (!user) {
    // If not logged in, redirect to Landing only on root
    // All other routes redirect to login
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        {/* BOTTOM NAV ROUTES (5 main) */}
        <Route path="/" element={needsOnboarding && isAdmin ? <Onboarding /> : <TodaysCommandCenter />} />
        <Route path="/today" element={needsOnboarding && isAdmin ? <Onboarding /> : <TodaysCommandCenter />} />

        <Route path="/tasks" element={<StaffTasks />} />
        <Route path="/logs" element={<LogsCenter />} />
        <Route path="/team" element={<TeamCenter />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/more" element={<More />} />

        {/* TASK ROUTES - Redirected to Today with filters */}
        <Route path="/prep-lists" element={<Navigate to="/?tab=prep" replace />} />
        <Route path="/side-work" element={<Navigate to="/?tab=sidework" replace />} />
        <Route path="/cleaning" element={<Cleaning />} />
        <Route path="/cleaning-templates" element={<CleaningTemplates />} />
        <Route path="/cleaning-templates/:id/edit" element={<CleaningTemplates />} />

        {/* COMPLIANCE ROUTES */}
        <Route path="/temp-logs" element={<Navigate to="/logs?type=temperature" replace />} />
        <Route path="/waste-86" element={<Navigate to="/logs?type=waste" replace />} />
        <Route path="/waste-log" element={<Navigate to="/logs?type=waste" replace />} />

        {/* ADMIN ONLY - Template Management */}
        <Route path="/temp-log-templates" element={<TemperatureLogTemplates />} />
        <Route path="/temp-log-templates/:id/edit" element={<TemperatureLogTemplates />} />

        {/* KNOWLEDGE ROUTES */}
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/build-cards" element={<BuildCards />} />
        <Route path="/recipes-and-build-cards" element={<RecipesAndBuildCards />} />
        <Route path="/reservations" element={<ReservationsAndBEOs />} />
        <Route path="/purchased-items" element={<PurchasedItems />} />
        <Route path="/standards" element={<Standards />} />
        <Route path="/msds" element={<MSDS />} />
        <Route path="/vendors" element={<Vendors />} />

        {/* TEMPLATE ROUTES (Admin) */}
        <Route path="/prep-templates" element={<PrepTemplatesManager />} />
        <Route path="/prep-templates/:id/edit" element={<PrepTemplatesManager />} />
        <Route path="/side-work-templates" element={<SideWorkTemplates />} />
        <Route path="/side-work-templates/:id/edit" element={<SideWorkTemplates />} />
        <Route path="/waste-templates" element={<WasteTemplates />} />
        <Route path="/86-templates" element={<EightySixTemplates />} />

        {/* OPERATIONS (Secondary) */}
        <Route path="/issues" element={<Navigate to="/logs?type=incident" replace />} />
        <Route path="/schedule" element={<ScheduleCenter />} />
        <Route path="/inventory" element={<InventorySimplified />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/shift-handoff" element={<ShiftHandoff />} />

        {/* ADMIN ROUTES (Under /more) */}
        <Route path="/admin/role-simulator" element={<AdminRoleSimulator />} />
        <Route path="/admin/command-center" element={<AdminCommandCenter />} />
        <Route path="/admin/onboarding-simulator" element={<OnboardingSimulator />} />
        <Route path="/templates" element={<TemplateManager />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/job-codes" element={<JobCodes />} />
        <Route path="/schedule-import" element={<ScheduleImport />} />
        <Route path="/temperature-monitoring" element={<TemperatureMonitoring />} />
        <Route path="/temperature-dashboard" element={<TemperatureDashboard />} />

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
        <Route path="/TempLogs" element={<Navigate to="/logs?type=temperature" replace />} />
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
        <Route path="/SideWork" element={<Navigate to="/?tab=sidework" replace />} />
        <Route path="/SideWorkManager" element={<Navigate to="/?tab=sidework" replace />} />
        <Route path="/SideWorkStaff" element={<Navigate to="/?tab=sidework" replace />} />
        <Route path="/SideWorkProduction" element={<Navigate to="/?tab=sidework" replace />} />
        <Route path="/restaurant-team" element={<Navigate to="/team" replace />} />
        <Route path="/schedule-center" element={<Navigate to="/schedule" replace />} />

        {/* 404 */}
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
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
                <AdminSimulationBar />
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