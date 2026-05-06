import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Zap, Shield, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-40 bg-card border-b border-border backdrop-blur-sm px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* User Info */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-secondary-text font-bold uppercase">Account</p>
          <p className="text-lg font-bold text-foreground">{user?.full_name}</p>
          <p className="text-sm text-secondary-text">{user?.email}</p>
          <p className="text-xs text-secondary-text mt-2">
            Role: <span className="font-bold text-primary">{user?.role?.toUpperCase()}</span>
          </p>
        </div>

        {/* Admin Tools */}
        {isAdmin && (
          <div className="space-y-2">
            <p className="text-xs text-secondary-text font-bold uppercase px-1">Admin Tools</p>
            <button
              onClick={() => navigate('/admin/role-simulator')}
              className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:scale-95 transition-all group hover:border-border/80"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-foreground">Role Simulator</p>
                <p className="text-[12px] text-secondary-text">Preview app as any role</p>
              </div>
              <Zap className="h-4 w-4 text-secondary-text group-hover:text-primary" />
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-500/15"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
export const hideBase44Index = true;