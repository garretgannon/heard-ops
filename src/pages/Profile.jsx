import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Zap, Shield, LogOut, Settings, Trash2, ChevronLeft, ChevronRight, Bell, Users, Lock, Link, Palette, Sliders, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const SETTINGS_GROUPS = [
  {
    title: 'Users & Roles',
    icon: Users,
    description: 'Manage team members, roles, and access levels.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    items: ['Manage Users', 'Roles & Permissions', 'Invite Team Members'],
    link: '/team',
  },
  {
    title: 'Permissions',
    icon: Lock,
    description: 'Configure permissions and access controls for your team.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    items: ['Permission Policies', 'Location Access', 'Feature Access'],
    link: '/admin/command-center',
  },
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
    title: 'Integrations',
    icon: Link,
    description: 'Connect with third-party tools and services.',
    color: 'text-green-400',
    bg: 'bg-green-500/15',
    items: ['Connected Apps', 'POS Integration', 'Temperature Devices'],
    link: '/my-restaurant',
  },
  {
    title: 'Branding',
    icon: Palette,
    description: 'Customize your brand and how it appears in HeardOS.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/15',
    items: ['Restaurant Profile', 'Logo & Branding', 'Print & Export Settings'],
    link: '/my-restaurant',
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

  const handleLogout = async () => { await base44.auth.logout(); };

  const handleDeleteAccount = async () => {
    haptics.medium();
    setDeleting(true);
    setShowDeleteConfirm(false);
    await base44.auth.logout();
  };

  return (
    <div className="pb-24 lg:pb-0">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/30">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your account, team, and system preferences.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-lg border border-border bg-card text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95">Today's Plan</button>
          <button className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted active:scale-95"><Bell className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      </div>

      {/* Desktop Settings Grid */}
      <div className="hidden lg:block px-8 py-6">
        {/* 2-col card grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {SETTINGS_GROUPS.map(group => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="bg-card border border-border/60 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', group.bg)}>
                    <Icon className={cn('h-5 w-5', group.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{group.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{group.description}</p>
                  </div>
                </div>
                <div className="divide-y divide-border/40">
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

        {/* System Information — full width bottom card */}
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">System Information</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">View system details, activity, and data management options.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-border/40">
            {['Audit Logs', 'Data Export', 'System Status', 'Clear Cache'].map(item => (
              <button key={item} onClick={() => {}} className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-foreground hover:text-primary transition-colors active:scale-[0.98]">
                <span>{item}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Account actions */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-card border border-border/60 rounded-xl p-3 flex items-center gap-3">
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
        <div className="sticky top-0 z-40 bg-card border-b border-border backdrop-blur-sm px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-all">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          </div>
        </div>

        <div className="px-4 py-4 space-y-6">
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs text-secondary-text font-bold uppercase">Account</p>
            <p className="text-lg font-bold text-foreground">{user?.full_name}</p>
            <p className="text-sm text-secondary-text">{user?.email}</p>
            <p className="text-xs text-secondary-text mt-2">Role: <span className="font-bold text-primary">{user?.role?.toUpperCase()}</span></p>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <p className="text-xs text-secondary-text font-bold uppercase px-1">Admin Tools</p>
              <button onClick={() => navigate('/admin/command-center')} className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:scale-95 transition-all group hover:border-border/80">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center"><Settings className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 text-left"><p className="font-bold text-foreground">Admin Command Center</p><p className="text-[12px] text-secondary-text">Manage roles and permissions</p></div>
                <Zap className="h-4 w-4 text-secondary-text group-hover:text-primary" />
              </button>
              <button onClick={() => navigate('/admin/role-simulator')} className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:scale-95 transition-all group hover:border-border/80">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center"><Shield className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 text-left"><p className="font-bold text-foreground">Role Simulator</p><p className="text-[12px] text-secondary-text">Preview app as any role</p></div>
                <Zap className="h-4 w-4 text-secondary-text group-hover:text-primary" />
              </button>
            </div>
          )}

          <div className="space-y-2">
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full h-12 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400 font-bold flex items-center justify-center gap-2 active:scale-95">
              <Trash2 className="h-4 w-4" /> Delete Account
            </button>
            <button onClick={handleLogout} className="w-full h-12 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold flex items-center justify-center gap-2 active:scale-95">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm space-y-4">
            <h2 className="text-xl font-bold text-foreground">Delete Account?</h2>
            <p className="text-sm text-secondary-text">This action cannot be undone. All your data will be permanently deleted.</p>
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

export const hideBase44Index = true;