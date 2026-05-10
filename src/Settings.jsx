import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { User, Building2, Bell, LogOut, Trash2, ChevronRight, Shield, Settings as SettingsIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'restaurant', label: 'Restaurant', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

function AccountTab({ user, isAdmin, navigate }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleLogout = () => base44.auth.logout();
  const handleDeleteAccount = async () => {
    haptics.medium();
    setDeleting(true);
    setShowDeleteConfirm(false);
    await base44.auth.logout();
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/60 rounded-xl p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
          <span className="text-xl font-extrabold text-primary">{user?.full_name?.charAt(0) || 'U'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">{user?.full_name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{user?.role}</span>
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Admin Tools</p>
          <button onClick={() => navigate('/admin/role-simulator')} className="w-full bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3 hover:border-border active:scale-[0.99] transition-all group">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">Role Simulator</p>
              <p className="text-xs text-muted-foreground">Preview the app as any role</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </button>
          <button onClick={() => navigate('/team')} className="w-full bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3 hover:border-border active:scale-[0.99] transition-all group">
            <div className="h-9 w-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">Team and Users</p>
              <p className="text-xs text-muted-foreground">Manage team members and access levels</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </button>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <button onClick={handleLogout} className="w-full h-11 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 hover:bg-red-500/15 transition-all">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
        <button onClick={() => setShowDeleteConfirm(true)} className="w-full h-11 rounded-xl border border-red-500/20 bg-transparent text-red-400/70 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 hover:bg-red-500/10 transition-all">
          <Trash2 className="h-4 w-4" /> Delete Account
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-xl font-bold text-foreground">Delete Account?</h2>
            <p className="text-sm text-muted-foreground">This action cannot be undone. All your data will be permanently deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 h-10 rounded-lg border border-border bg-card text-foreground font-bold active:scale-95 disabled:opacity-50">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 h-10 rounded-lg bg-red-500/20 text-red-400 font-bold border border-red-500/30 active:scale-95 disabled:opacity-50">
                {deleting ? <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RestaurantTab({ navigate }) {
  const items = [
    { label: 'Restaurant Profile', desc: 'Name, logo, branding, and contact info', path: '/my-restaurant' },
    { label: 'Stations and Areas', desc: 'Manage kitchen and service stations', path: '/stations' },
    { label: 'Job Codes', desc: 'Configure role and job code mappings', path: '/job-codes' },
    { label: 'Temperature Monitoring', desc: 'Configure recurring temperature checks', path: '/temperature-monitoring' },
    { label: 'Schedule Import', desc: 'Import staff schedules from R365 or CSV', path: '/schedule-import' },
  ];
  return (
    <div className="space-y-2">
      {items.map(item => (
        <button key={item.path} onClick={() => navigate(item.path)} className="w-full bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3 hover:border-border active:scale-[0.99] transition-all group">
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </button>
      ))}
    </div>
  );
}

function NotificationsTab({ navigate }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border/60 rounded-xl p-5">
        <p className="text-sm font-bold text-foreground mb-1">Alert Preferences</p>
        <p className="text-xs text-muted-foreground mb-4">Configure how and when you receive notifications.</p>
        <button onClick={() => navigate('/notifications')} className="w-full h-10 rounded-lg bg-primary/15 text-primary font-bold text-sm active:scale-95 hover:bg-primary/20 transition-all">
          Open Notification Settings
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="pb-32 lg:pb-8 min-h-screen bg-background">
      <div className="border-b border-border/20 px-4 py-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <SettingsIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">Account, restaurant, and notifications</p>
          </div>
        </div>
      </div>

      <div className="border-b border-border/20 px-4 lg:px-8">
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-6 lg:px-8 max-w-2xl">
        {activeTab === 'account' && <AccountTab user={user} isAdmin={isAdmin} navigate={navigate} />}
        {activeTab === 'restaurant' && <RestaurantTab navigate={navigate} />}
        {activeTab === 'notifications' && <NotificationsTab navigate={navigate} />}
      </div>
    </div>
  );
}

export const hideBase44Index = true;