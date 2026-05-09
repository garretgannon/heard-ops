import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Clock, FileText, AlertTriangle, Thermometer, Users, CalendarDays, BookOpen, ChefHat, Package, Trash2, Truck, BarChart3, Cog, Warehouse } from 'lucide-react';
import MoreSectionHeader from '@/components/more/MoreSectionHeader';

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  if (!isAdmin) {
    return (
      <div className="pb-32 bg-background min-h-screen">
        <MoreSectionHeader />
        <div className="px-4 py-12 lg:px-8 text-center">
          <p className="text-muted-foreground">Admin tools not available for your role</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-background min-h-screen lg:flex lg:flex-col">
      {/* Header */}
      <MoreSectionHeader />

      {/* Main Content */}
       <div className="flex-1 px-4 py-6 lg:px-8 max-w-6xl mx-auto w-full space-y-10">
        {/* OPERATIONS Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Operations</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={() => navigate('/shift-handoff')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <Clock className="h-6 w-6 text-green-500" />
              <p className="text-xs font-bold text-foreground text-center">Shift</p>
              <p className="text-[10px] text-muted-foreground text-center">Manage shifts</p>
            </button>
            <button onClick={() => navigate('/logs?type=incident')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <p className="text-xs font-bold text-foreground text-center">Issues</p>
              <p className="text-[10px] text-muted-foreground text-center">Track issues</p>
            </button>
            <button onClick={() => navigate('/temperature-monitoring')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <Thermometer className="h-6 w-6 text-purple-500" />
              <p className="text-xs font-bold text-foreground text-center">Temps</p>
              <p className="text-[10px] text-muted-foreground text-center">Temperature</p>
            </button>
            <div />
          </div>
        </div>

        {/* DEVELOPMENT Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Development</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={() => navigate('/training')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <BookOpen className="h-6 w-6 text-green-500" />
              <p className="text-xs font-bold text-foreground text-center">Training</p>
              <p className="text-[10px] text-muted-foreground text-center">Training center</p>
            </button>
            <div />
            <div />
            <div />
          </div>
        </div>

        {/* FOOD Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Food</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={() => navigate('/recipes')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <ChefHat className="h-6 w-6 text-primary" />
              <p className="text-xs font-bold text-foreground text-center">Recipes</p>
              <p className="text-[10px] text-muted-foreground text-center">Manage recipes</p>
            </button>
            <button onClick={() => navigate('/?tab=prep')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <Package className="h-6 w-6 text-primary" />
              <p className="text-xs font-bold text-foreground text-center">Prep</p>
              <p className="text-[10px] text-muted-foreground text-center">Prep plans</p>
            </button>
            <button onClick={() => navigate('/inventory')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <Warehouse className="h-6 w-6 text-blue-500" />
              <p className="text-xs font-bold text-foreground text-center">Inventory</p>
              <p className="text-[10px] text-muted-foreground text-center">Stock levels</p>
            </button>
            <button onClick={() => navigate('/logs?type=waste')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <Trash2 className="h-6 w-6 text-red-500" />
              <p className="text-xs font-bold text-foreground text-center">Waste</p>
              <p className="text-[10px] text-muted-foreground text-center">Waste log</p>
            </button>
          </div>
        </div>

        {/* BUSINESS Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Business</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={() => navigate('/vendors')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <Truck className="h-6 w-6 text-green-500" />
              <p className="text-xs font-bold text-foreground text-center">Vendors</p>
              <p className="text-[10px] text-muted-foreground text-center">Vendors orders</p>
            </button>
            <button onClick={() => navigate('/reservations')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <CalendarDays className="h-6 w-6 text-primary" />
              <p className="text-xs font-bold text-foreground text-center">BEOs</p>
              <p className="text-[10px] text-muted-foreground text-center">Banquet events</p>
            </button>
            <button onClick={() => navigate('/reports')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <BarChart3 className="h-6 w-6 text-blue-500" />
              <p className="text-xs font-bold text-foreground text-center">Reports</p>
              <p className="text-[10px] text-muted-foreground text-center">View reports</p>
            </button>
            <button onClick={() => navigate('/profile')} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/30 active:scale-95 transition-all">
              <Cog className="h-6 w-6 text-slate-500" />
              <p className="text-xs font-bold text-foreground text-center">Settings</p>
              <p className="text-[10px] text-muted-foreground text-center">App settings</p>
            </button>
          </div>
        </div>
       </div>
    </div>
  );
}

export const hideBase44Index = true;