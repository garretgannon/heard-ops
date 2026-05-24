import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LogOut, Trash2, ChevronLeft, ChevronRight, Bell, Sliders, Info, Utensils } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { toast } from 'sonner';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { isIndustryModeOn, setIndustryMode, isEasterEggFound } from '@/lib/microcopy';

const SETTINGS_GROUPS = [
  {
    title: 'Notifications',
    icon: Bell,
    description: 'Set notification preferences and alert delivery methods.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    items: ['In-App Notifications', 'Email Alerts', 'SMS Alerts'],
    link: '/notifications',
  },
  {
    title: 'Account Preferences',
    icon: Sliders,
    description: 'Manage your account settings and system preferences.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    items: ['General Preferences', 'Security Settings', 'Billing & Subscription'],
    link: '/profile',
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [industryMode, setIndustryModeState] = useState(() => isIndustryModeOn());
  const easterEggFound = isEasterEggFound();
  const showIndustryMode = easterEggFound || industryMode;

  const handleIndustryModeToggle = () => {
    const next = !industryMode;
    haptics.light();
    setIndustryModeState(next);
    setIndustryMode(next);
    toast.success(next ? 'Industry Mode on. Welcome to the industry.' : 'Back to professional mode.');
  };

  const handleLogout = async () => { await base44.auth.logout(); };

  const handleDeleteAccount = async () => {
    haptics.medium();
    setDeleting(true);
    setShowDeleteConfirm(false);
    await base44.auth.logout();
  };

  const handleSystemInfoAction = (item) => {
    haptics.light();
    if (item === 'Audit Logs') {
      navigate('/logs');
    } else if (item === 'Data Export' || item === 'System Status') {
      navigate('/reports');
    } else if (item === 'Clear Cache') {
      sessionStorage.clear();
      toast.success('Session cache cleared');
    }
  };

  const cardStyle = { background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.28)' };

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Settings" subtitle="Account preferences and notifications" />

      {/* Desktop Settings Grid */}
      <div className="hidden lg:block px-8 pt-14 pb-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {SETTINGS_GROUPS.map(group => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="overflow-hidden rounded-2xl border border-border/40 p-4" style={cardStyle}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', group.bg)}>
                    <Icon className={cn('h-5 w-5', group.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">{group.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{group.description}</p>
                  </div>
                </div>
                <div className="divide-y divide-border/30">
                  {group.items.map(item => (
                    <button key={item} onClick={() => { haptics.light(); navigate(group.link); }} className="w-full flex items-center justify-between py-2 text-xs font-semibold text-foreground hover:text-primary transition-colors active:scale-[0.98]">
                      <span>{item}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* System Information */}
        <div className="overflow-hidden rounded-2xl border border-border/40 p-4 mb-4" style={cardStyle}>
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-border/40 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">System Information</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">View system details, activity, and data management options.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-border/30">
            {['Audit Logs', 'Data Export', 'System Status', 'Clear Cache'].map(item => (
              <button key={item} onClick={() => handleSystemInfoAction(item)} className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-foreground hover:text-primary transition-colors active:scale-[0.98]">
                <span>{item}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Industry Mode — hidden until easter egg is found */}
        {showIndustryMode && (
          <div className="overflow-hidden rounded-2xl border border-border/40 p-4 mb-4" style={cardStyle}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Utensils className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">Industry Mode</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    Adds restaurant-industry flavor to empty states and status messages. Won't appear in safety or compliance workflows.
                  </p>
                </div>
              </div>
              <button
                onClick={handleIndustryModeToggle}
                className={cn(
                  'shrink-0 relative h-6 w-11 rounded-full transition-colors duration-200',
                  industryMode ? 'bg-primary' : 'bg-muted/60'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
                  industryMode ? 'left-5' : 'left-0.5'
                )} />
              </button>
            </div>
          </div>
        )}

        {/* Account actions */}
        <div className="flex gap-3">
          <div className="flex-1 overflow-hidden rounded-2xl border border-border/40 p-3 flex items-center gap-3" style={cardStyle}>
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-base font-extrabold text-primary">{user?.full_name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <span className="text-[10px] font-bold text-primary uppercase">{user?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="h-auto px-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-sm flex items-center gap-2 active:scale-95 hover:bg-red-500/15">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div
          className="sticky top-0 z-40 px-4 py-3.5"
          style={{
            background: 'linear-gradient(180deg, rgba(6,10,16,0.97) 0%, rgba(8,13,20,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 transition-all active:scale-95" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Profile</h1>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/40 p-4" style={cardStyle}>
            <p className="metric-label">Account</p>
            <p className="mt-2 text-lg font-black text-foreground">{user?.full_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-2 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary">
              {user?.role?.toUpperCase()}
            </div>
          </div>

          {/* Industry Mode — mobile */}
          {showIndustryMode && (
            <div className="overflow-hidden rounded-2xl border border-border/40 p-4" style={cardStyle}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Utensils className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">Industry Mode</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Restaurant flavor in safe UI areas</p>
                  </div>
                </div>
                <button
                  onClick={handleIndustryModeToggle}
                  className={cn(
                    'shrink-0 relative h-6 w-11 rounded-full transition-colors duration-200',
                    industryMode ? 'bg-primary' : 'bg-muted/60'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
                    industryMode ? 'left-5' : 'left-0.5'
                  )} />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button onClick={() => setShowDeleteConfirm(true)} className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 text-sm font-black text-red-400 active:scale-[0.97] transition-all">
              <Trash2 className="h-4 w-4" /> Delete Account
            </button>
            <button onClick={handleLogout} className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/8 text-sm font-black text-red-400 active:scale-[0.97] transition-all">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border/50 p-6 space-y-4" style={cardStyle}>
            <h2 className="text-xl font-black text-foreground">Delete Account?</h2>
            <p className="text-sm text-muted-foreground">This action cannot be undone. All your data will be permanently deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 h-10 rounded-xl border border-border/50 text-sm font-black text-foreground active:scale-95 disabled:opacity-50 transition-all" style={cardStyle}>Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 h-10 rounded-xl border border-red-500/35 bg-red-500/15 text-sm font-black text-red-400 active:scale-95 disabled:opacity-50 transition-all">
                {deleting ? <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;