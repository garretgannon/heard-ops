import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Plus, AlertCircle, CheckCircle2, Clock, Zap, Settings } from 'lucide-react';
import { toast } from 'sonner';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import BulkParEditorModal from '@/components/prep/BulkParEditorModal';

const ALLOWED_ROLES = ['admin', 'manager', 'chef', 'kitchen_lead'];

export default function PrepPlanning() {
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [countSessions, setCountSessions] = useState([]);
  const [prepPlans, setPrepPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedShift, setSelectedShift] = useState('opening');

  const isAllowed = isAdmin || ALLOWED_ROLES.includes(user?.role);

  useEffect(() => {
    if (!isAllowed) return;
    loadData();
  }, [isAllowed]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [counts, plans] = await Promise.all([
        base44.entities.PrepInventoryCount?.list?.('-created_date', 100).catch(() => []),
        base44.entities.PrepPlan?.list?.('-created_date', 100).catch(() => []),
      ]);
      setCountSessions(counts || []);
      setPrepPlans(plans || []);
    } catch (e) {
      console.error('Error loading prep data:', e);
      toast.error('Failed to load prep planning data');
    }
    setLoading(false);
  };

  const startCount = async (shift, station) => {
    try {
      const templates = await base44.entities.PrepPlanTemplate?.filter?.({ is_active: true, shift, station }).catch(() => []);
      if (templates?.length === 0) {
        toast.error(`No active prep templates for ${shift} shift at ${station}`);
        return;
      }
      navigate('/prep-count', { state: { shift, station } });
    } catch (e) {
      toast.error('Failed to start count');
    }
  };

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground">Only admins, managers, chefs, and kitchen leads can access prep planning.</p>
        </div>
      </div>
    );
  }

  const todayStr = today.toISOString().split('T')[0];
  const todayCount = countSessions.find(c => c.date === todayStr);
  const todayPlan = prepPlans.find(p => p.date === todayStr);

  return (
    <div className="pb-32 bg-background">
      <DesktopPageHeader
        title="Prep Planning"
        subtitle="Par-based prep inventory counting and task generation"
      />

      <div className="px-4 lg:px-8 py-6 space-y-8 max-w-6xl mx-auto">
        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {!todayCount ? (
            <div className="lg:col-span-1 bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground text-sm">Prep Inventory Count Required</p>
                  <p className="text-xs text-muted-foreground">No count submitted yet today</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/prep-count')}
                className="w-full btn-primary text-xs h-8 flex items-center justify-center gap-1 mt-3"
              >
                <Zap className="h-3 w-3" /> Start Count
              </button>
            </div>
          ) : (
            <div className="lg:col-span-1 bg-card border border-border rounded-xl p-4 border-l-4 border-l-green-500">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground text-sm">Count Submitted</p>
                  <p className="text-xs text-muted-foreground">{todayCount.shift} shift</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Status: {todayCount.status}</p>
              <button
                onClick={() => navigate(`/prep-count/${todayCount.id}`)}
                className="w-full btn-secondary text-xs h-8 flex items-center justify-center gap-1"
              >
                View Count
              </button>
            </div>
          )}

          {!todayPlan ? (
            <div className="lg:col-span-1 bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <Clock className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground text-sm">Prep Plan</p>
                  <p className="text-xs text-muted-foreground">Waiting for count submission</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Plan will appear after count</p>
            </div>
          ) : (
            <div className="lg:col-span-1 bg-card border border-border rounded-xl p-4 border-l-4 border-l-blue-500">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground text-sm">Prep Plan Ready</p>
                  <p className="text-xs text-muted-foreground">Status: {todayPlan.status}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/prep-plan/${todayPlan.id}`)}
                className="w-full btn-primary text-xs h-8 flex items-center justify-center gap-1"
              >
                Review Plan
              </button>
            </div>
          )}

          <div className="lg:col-span-1 bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <ChefHat className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-foreground text-sm">Prep Templates</p>
                <p className="text-xs text-muted-foreground">Configure par-based recipes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/prep-plan-templates')}
                className="flex-1 btn-secondary text-xs h-8 flex items-center justify-center gap-1"
              >
                <Plus className="h-3 w-3" /> Manage
              </button>
              <button
                onClick={() => { setSelectedStation('Prep'); setSelectedShift('opening'); setBulkEditOpen(true); }}
                className="flex-1 btn-secondary text-xs h-8 flex items-center justify-center gap-1"
              >
                <Settings className="h-3 w-3" /> Bulk Edit
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading...</div>
        ) : (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Recent Activity</h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {countSessions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No count sessions yet</p>
              ) : (
                countSessions.slice(0, 10).map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{session.shift} — {session.station}</p>
                      <p className="text-muted-foreground">{session.date} · Status: {session.status}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/prep-count/${session.id}`)}
                      className="text-primary font-bold hover:underline"
                    >
                      View →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Edit Modal */}
      {bulkEditOpen && (
        <BulkParEditorModal
          station={selectedStation}
          shift={selectedShift}
          onClose={() => setBulkEditOpen(false)}
          onSave={() => loadData()}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;