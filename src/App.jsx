import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { UnifiedStateProvider } from '@/lib/UnifiedStateContext';
import { ShiftModeProvider } from '@/lib/ShiftModeContext';
import { useCurrentUser } from './hooks/useCurrentUser';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { legacyRedirects } from '@/lib/routeConfig';
import Layout from './components/Layout';
import GlobalBottomNav from './components/GlobalBottomNav';
import ToastContainer from './components/ToastContainer';
import Landing from './pages/Landing';
import TodaysCommandCenter from './pages/TodaysCommandCenter';
import StaffTasks from './pages/StaffTasks';
import Logs from './pages/Logs';
import Knowledge from './pages/Knowledge';
import More from './pages/More';
import Onboarding from './pages/Onboarding';
import RestaurantTeam from './pages/RestaurantTeam';
import TemplateList from './pages/TemplateList';
import ScheduleCenter from './pages/ScheduleCenter';
import SideWork from './pages/SideWork';
import PrepLists from './pages/PrepLists';
import Cleaning from './pages/Cleaning';
import WasteLog from './pages/WasteLog';
import IssueTracker from './pages/IssueTracker';
import InventorySimplified from './pages/InventorySimplified';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import MyRestaurant from './pages/MyRestaurant';
import NotificationSettings from './pages/NotificationSettings';
import RecipesAndBuildCards from './pages/RecipesAndBuildCards';
import Standards from './pages/Standards';
import MSDS from './pages/MSDS';
import TempLogs from './pages/TempLogs';

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
    return (
      <Routes>
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        {/* BOTTOM NAV ROUTES (5 main) */}
        <Route path="/" element={needsOnboarding && isAdmin ? <Onboarding /> : <TodaysCommandCenter />} />
        <Route path="/tasks" element={<StaffTasks />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/more" element={<More />} />

        {/* TASK ROUTES */}
        <Route path="/side-work" element={<SideWork />} />
        <Route path="/prep-lists" element={<PrepLists />} />
        <Route path="/cleaning" element={<Cleaning />} />

        {/* COMPLIANCE ROUTES */}
        <Route path="/temp-logs" element={<TempLogs />} />
        <Route path="/waste-log" element={<WasteLog />} />

        {/* KNOWLEDGE ROUTES */}
        <Route path="/recipes" element={<RecipesAndBuildCards />} />
        <Route path="/standards" element={<Standards />} />
        <Route path="/msds" element={<MSDS />} />
        <Route path="/templates" element={<TemplateList />} />
        <Route path="/vendors" element={<Vendors />} />

        {/* OPERATIONS ROUTES */}
        <Route path="/issues" element={<IssueTracker />} />
        <Route path="/schedule" element={<ScheduleCenter />} />
        <Route path="/inventory" element={<InventorySimplified />} />
        <Route path="/team" element={<RestaurantTeam />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/shift-handoff" element={<RestaurantTeam />} /> {/* Placeholder */}

        {/* SETTINGS ROUTES */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-restaurant" element={<MyRestaurant />} />
        <Route path="/notifications" element={<NotificationSettings />} />

        {/* LEGACY REDIRECTS */}
        <Route path="/Inventory" element={<Navigate to="/inventory" replace />} />
        <Route path="/InventoryControl" element={<Navigate to="/inventory" replace />} />
        <Route path="/InventorySimplified" element={<Navigate to="/inventory" replace />} />
        <Route path="/Recipes" element={<Navigate to="/recipes" replace />} />
        <Route path="/RecipeBuildCard" element={<Navigate to="/recipes" replace />} />
        <Route path="/BuildBook" element={<Navigate to="/recipes" replace />} />
        <Route path="/BarBook" element={<Navigate to="/recipes" replace />} />
        <Route path="/RecipesAndBuildCards" element={<Navigate to="/recipes" replace />} />
        <Route path="/ManagerLog" element={<Navigate to="/logs" replace />} />
        <Route path="/NewLog" element={<Navigate to="/logs" replace />} />
        <Route path="/MaintenanceRequests" element={<Navigate to="/issues" replace />} />
        <Route path="/IncidentReports" element={<Navigate to="/issues" replace />} />
        <Route path="/Incidents" element={<Navigate to="/issues" replace />} />
        <Route path="/IssueTracker" element={<Navigate to="/issues" replace />} />
        <Route path="/Calendar" element={<Navigate to="/schedule" replace />} />
        <Route path="/EmployeeCalendar" element={<Navigate to="/schedule" replace />} />
        <Route path="/ScheduleImport" element={<Navigate to="/schedule" replace />} />
        <Route path="/R365ScheduleImport" element={<Navigate to="/schedule" replace />} />
        <Route path="/SideWork" element={<Navigate to="/side-work" replace />} />
        <Route path="/SideWorkManager" element={<Navigate to="/side-work" replace />} />
        <Route path="/SideWorkStaff" element={<Navigate to="/side-work" replace />} />
        <Route path="/SideWorkProduction" element={<Navigate to="/side-work" replace />} />
        <Route path="/restaurant-team" element={<Navigate to="/team" replace />} />
        <Route path="/schedule-center" element={<Navigate to="/schedule" replace />} />
        <Route path="/today" element={<Navigate to="/tasks" replace />} />

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
      <UnifiedStateProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
            <GlobalBottomNav />
            <ToastContainer />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </UnifiedStateProvider>
      </ShiftModeProvider>
    </AuthProvider>
  )
}

export default App

export const hideBase44Index = true;