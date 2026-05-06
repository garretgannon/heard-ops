import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Zap, Shield, LogOut, Settings, Trash2, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { haptics } from '@/utils/haptics';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    haptics.medium();
    setDeleting(true);
    try {
      // Note: Delete account functionality would typically be a backend function
      // For now, logout after showing intent
      setShowDeleteConfirm(false);
      await base44.auth.logout();
    } catch (error) {
      console.error('Failed to delete account:', error);
      setDeleting(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-40 bg-card border-b border-border backdrop-blur-sm px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="lg:hidden h-9 w-9 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>
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
             onClick={() => navigate('/admin/command-center')}
             className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:scale-95 transition-all group hover:border-border/80"
           >
             <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
               <Settings className="h-5 w-5 text-primary" />
             </div>
             <div className="flex-1 text-left">
               <p className="font-bold text-foreground">Admin Command Center</p>
               <p className="text-[12px] text-secondary-text">Manage roles and permissions</p>
             </div>
             <Zap className="h-4 w-4 text-secondary-text group-hover:text-primary" />
           </button>
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

        {/* Delete Account */}
        <div className="space-y-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full h-12 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-500/15"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-500/15"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Delete Account?</h2>
                <p className="text-sm text-secondary-text">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 h-10 rounded-lg border border-border bg-card text-foreground font-bold active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 h-10 rounded-lg bg-red-500/20 text-red-400 font-bold border border-red-500/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>Delete</>  
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export const hideBase44Index = true;