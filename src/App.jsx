import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { useCurrentUser } from './hooks/useCurrentUser';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Stations from './pages/Stations';
import PrepLists from './pages/PrepLists';
import StationPrepView from './pages/StationPrepView';
import StaffHome from './pages/StaffHome';
import Profile from './pages/Profile';
import SideWork from './pages/SideWork';
import BusserHome from './pages/BusserHome';
import Reports from './pages/Reports';
import PhotoReview from './pages/PhotoReview';
import JobCodes from './pages/JobCodes';
import PrepLibrary from './pages/PrepLibrary';
import TempLogs from './pages/TempLogs';
import DishMachines from './pages/DishMachines';
import MyRestaurant from './pages/MyRestaurant';
import ManagerLog from './pages/ManagerLog';
import BathroomChecks from './pages/BathroomChecks';
import Cash from './pages/Cash';
import MaintenanceRequests from './pages/MaintenanceRequests';
import Onboarding from './pages/Onboarding';
import RestaurantTeam from './pages/RestaurantTeam';
import Vendors from './pages/Vendors';
import IncidentReports from './pages/IncidentReports';

import LineUp from './pages/LineUp';
import StaffTasks from './pages/StaffTasks';
import ManagerDashboard from './pages/ManagerDashboard';
import MSDS from './pages/MSDS';
import NotificationSettings from './pages/NotificationSettings';
import WeeklyReport from './pages/WeeklyReport';
import ShiftHandoff from './pages/ShiftHandoff';
import TodaysCommandCenter from './pages/TodaysCommandCenter';
import SetupWizard from './pages/SetupWizard';
import ScheduleCenter from './pages/ScheduleCenter';
import IssuesRepairs from './pages/IssuesRepairs';
import More from './pages/More';
import Standards from './pages/Standards';
import InventoryControl from './pages/InventoryControl';
import Cleaning from './pages/Cleaning';
import OpeningChecklist from './pages/OpeningChecklist';
import ClosingChecklist from './pages/ClosingChecklist';
import Inventory from './pages/Inventory';
import WasteLog from './pages/WasteLog';
import TemplateBuilder from './pages/TemplateBuilder';
import TemplateList from './pages/TemplateList';
import RecipesAndBuildCards from './pages/RecipesAndBuildCards';
import KitchenPrep from './pages/KitchenPrep';
import SideWorkProduction from './pages/SideWorkProduction';

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
        {/* Main 5-tab navigation */}
        <Route path="/" element={needsOnboarding && isAdmin ? <SetupWizard onComplete={() => { setNeedsOnboarding(false); }} /> : <TodaysCommandCenter />} />
        <Route path="/prep-lists" element={<PrepLists />} />
        <Route path="/temp-logs" element={<TempLogs />} />
        <Route path="/shift-handoff" element={<ShiftHandoff />} />
        <Route path="/more" element={<More />} />
        <Route path="/opening" element={<OpeningChecklist />} />
        <Route path="/closing" element={<ClosingChecklist />} />
        <Route path="/cleaning" element={<Cleaning />} />
        {isFOH && <Route path="/side-work" element={<SideWork />} />}

        {/* Team & Scheduling */}
        {isAdmin && <Route path="/restaurant-team" element={<RestaurantTeam />} />}
        {isAdmin && <Route path="/schedule-center" element={<ScheduleCenter />} />}
        {isAdmin && <Route path="/job-codes" element={<JobCodes />} />}

        {/* Operations */}
        {isAdmin && <Route path="/vendors" element={<Vendors />} />}
        <Route path="/inventory" element={<Inventory />} />
        {isAdmin && <Route path="/inventory-control" element={<InventoryControl />} />}
        <Route path="/waste" element={<WasteLog />} />
        <Route path="/recipes" element={<RecipesAndBuildCards />} />
        <Route path="/kitchen-prep" element={<KitchenPrep />} />
        <Route path="/side-work-production" element={<SideWorkProduction />} />
        <Route path="/cleaning" element={<Cleaning />} />
        {isAdmin && <Route path="/incidents" element={<IncidentReports />} />}
        <Route path="/issues" element={<IssuesRepairs />} />
        <Route path="/maintenance" element={<MaintenanceRequests />} />

        {/* Admin */}
        {isAdmin && <Route path="/templates" element={<TemplateList />} />}
        {isAdmin && <Route path="/templates/:id" element={<TemplateBuilder />} />}
        {isAdmin && <Route path="/templates/new" element={<TemplateBuilder />} />}
        {isAdmin && <Route path="/standards" element={<Standards />} />}
        {isAdmin && <Route path="/reports" element={<Reports />} />}
        {isAdmin && <Route path="/weekly-report" element={<WeeklyReport />} />}
        {isAdmin && <Route path="/my-restaurant" element={<MyRestaurant />} />}
        {isAdmin && <Route path="/notifications" element={<NotificationSettings />} />}

        {/* Secondary routes */}
        {isAdmin && <Route path="/dashboard" element={<Dashboard />} />}
        {isAdmin && <Route path="/manager" element={<ManagerDashboard />} />}
        {isAdmin && <Route path="/stations" element={<Stations />} />}
        <Route path="/station/:stationId" element={<StationPrepView />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/home" element={isBusser ? <BusserHome /> : <StaffHome />} />
        <Route path="/today" element={<StaffTasks />} />
        {isFOH && <Route path="/side-work" element={<SideWork />} />}
        {isAdmin && <Route path="/photo-review" element={<PhotoReview />} />}
        {isAdmin && <Route path="/prep-library" element={<PrepLibrary />} />}
        <Route path="/dish-machines" element={<DishMachines />} />
        {isAdmin && <Route path="/manager-log" element={<ManagerLog />} />}
        <Route path="/bathroom-checks" element={<BathroomChecks />} />
        {isAdmin && <Route path="/msds" element={<MSDS />} />}
        {isFOH && <Route path="/pre-shift" element={<LineUp />} />}

        <Route path="/cash" element={<Cash />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App

export const hideBase44Index = true;