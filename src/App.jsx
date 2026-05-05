import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ShiftModeProvider } from '@/lib/ShiftModeContext';
import { useCurrentUser } from './hooks/useCurrentUser';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
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
        {/* 5-Tab Mobile-First Navigation */}
        <Route path="/" element={needsOnboarding && isAdmin ? <Onboarding /> : <TodaysCommandCenter />} />
        <Route path="/today" element={<StaffTasks />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/more" element={<More />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ShiftModeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
            <GlobalBottomNav />
            <ToastContainer />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ShiftModeProvider>
    </AuthProvider>
  )
}

export default App

export const hideBase44Index = true;