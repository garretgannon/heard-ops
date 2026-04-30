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
import Dashboard from './pages/Dashboard';
import Stations from './pages/Stations';
import PrepLists from './pages/PrepLists';
import StationPrepView from './pages/StationPrepView';

import StaffHome from './pages/StaffHome';
import Profile from './pages/Profile';
import SideWork from './pages/SideWork';
import BusserHome from './pages/BusserHome';
import Calendar from './pages/Calendar';
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
import EmployeeCalendar from './pages/EmployeeCalendar';
import Vendors from './pages/Vendors';
import IncidentReports from './pages/IncidentReports';
import PreShift from './pages/PreShift';
import LineUp from './pages/LineUp';
import BuildBook from './pages/BuildBook';
import BarBook from './pages/BarBook';
import StaffTasks from './pages/StaffTasks';
import MSDS from './pages/MSDS';

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



  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route path="/" element={<StaffTasks />} />

        {isAdmin && <Route path="/dashboard" element={<Dashboard />} />}
        <Route path="/today" element={<StaffTasks />} />
        {isAdmin && <Route path="/stations" element={<Stations />} />}
        {isAdmin && <Route path="/prep-lists" element={<PrepLists />} />}
        <Route path="/station/:stationId" element={<StationPrepView />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/home" element={isBusser ? <BusserHome /> : <StaffHome />} />
        {isFOH && <Route path="/side-work" element={<SideWork />} />}
        {isAdmin && <Route path="/calendar" element={<Calendar />} />}
        {isAdmin && <Route path="/reports" element={<Reports />} />}
        {isAdmin && <Route path="/photo-review" element={<PhotoReview />} />}
        {isAdmin && <Route path="/job-codes" element={<JobCodes />} />}
        {isAdmin && <Route path="/prep-library" element={<PrepLibrary />} />}
        {isAdmin && <Route path="/temp-logs" element={<TempLogs />} />}
        <Route path="/dish-machines" element={<DishMachines />} />
        {isAdmin && <Route path="/my-restaurant" element={<MyRestaurant />} />}
        {isAdmin && <Route path="/restaurant-team" element={<RestaurantTeam />} />}
        {isAdmin && <Route path="/employee-calendar" element={<EmployeeCalendar />} />}
        {isAdmin && <Route path="/vendors" element={<Vendors />} />}
        {isAdmin && <Route path="/incidents" element={<IncidentReports />} />}
        {isFOH && <Route path="/pre-shift" element={<PreShift />} />}
        {isAdmin && <Route path="/line-up" element={<LineUp />} />}
        {isAdmin && <Route path="/build-book" element={<BuildBook />} />}
        {isFOH && <Route path="/bar-book" element={<BarBook />} />}
        {isAdmin && <Route path="/manager-log" element={<ManagerLog />} />}
        {isAdmin && <Route path="/msds" element={<MSDS />} />}
        <Route path="/bathroom-checks" element={<BathroomChecks />} />
        <Route path="/cash" element={<Cash />} />
        <Route path="/maintenance" element={<MaintenanceRequests />} />
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