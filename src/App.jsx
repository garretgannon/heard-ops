import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { useCurrentUser } from './hooks/useCurrentUser';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Stations from './pages/Stations';
import PrepLists from './pages/PrepLists';
import StationPrepView from './pages/StationPrepView';
import MasterPrepList from './pages/MasterPrepList';
import StaffHome from './pages/StaffHome';
import Profile from './pages/Profile';
import SideWork from './pages/SideWork';
import BusserHome from './pages/BusserHome';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import PhotoReview from './pages/PhotoReview';
import JobCodes from './pages/JobCodes';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { user, isAdmin, isFOH, loading: userLoading } = useCurrentUser();
  const isBusser = user?.role === 'busser';

  if (isLoadingPublicSettings || isLoadingAuth || userLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={isAdmin ? <Dashboard /> : isBusser ? <BusserHome /> : <StaffHome />} />
        <Route path="/master" element={<MasterPrepList />} />
        {isAdmin && <Route path="/dashboard" element={<Dashboard />} />}
        {isAdmin && <Route path="/stations" element={<Stations />} />}
        {isAdmin && <Route path="/prep-lists" element={<PrepLists />} />}
        <Route path="/station/:stationId" element={<StationPrepView />} />
        <Route path="/profile" element={<Profile />} />
        {isFOH && <Route path="/side-work" element={<SideWork />} />}
        {isAdmin && <Route path="/calendar" element={<Calendar />} />}
        {isAdmin && <Route path="/reports" element={<Reports />} />}
        {isAdmin && <Route path="/photo-review" element={<PhotoReview />} />}
        {isAdmin && <Route path="/job-codes" element={<JobCodes />} />}
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