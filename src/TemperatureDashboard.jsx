import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Download, AlertTriangle, TrendingDown, Zap } from 'lucide-react';
import TemperatureComplianceCard from '@/components/temperature/TemperatureComplianceCard';
import TemperatureDashboardSection from '@/components/temperature/TemperatureDashboardSection';

export default function TemperatureDashboard() {
  const { isAdmin } = useCurrentUser();
  
  if (!isAdmin) {
    return (
      <div className="pb-32 bg-background min-h-screen">
        <div className="px-4 py-12 lg:px-8 text-center">
          <p className="text-muted-foreground">Temperature dashboard available for managers only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-background min-h-screen lg:flex lg:flex-col">
      <div className="border-b border-border/20 px-4 py-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Temperature Monitoring</h1>
            <p className="text-sm text-muted-foreground mt-1">Compliance tracking and temperature logs</p>
          </div>
          <button className="h-11 px-4 rounded-lg border border-border/40 card-glass text-muted-foreground flex items-center gap-2 hover:border-border/60 active:scale-95 transition-all">
            <Download className="h-5 w-5" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
        <TemperatureComplianceCard />

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Alert Sections</h2>
          
          <div className="space-y-3">
            <TemperatureDashboardSection
              title="Failed Temperature Checks"
              filter="failed"
              icon={AlertTriangle}
              initialOpen={true}
            />
            
            <TemperatureDashboardSection
              title="Missed Temperature Checks"
              filter="missed"
              icon={TrendingDown}
              initialOpen={true}
            />
            
            <TemperatureDashboardSection
              title="Needs Manager Review"
              filter="review"
              icon={Zap}
              initialOpen={false}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Equipment Health</h2>
          <div className="card-glass border border-border/40 rounded-xl p-6">
            <p className="text-muted-foreground text-sm">Equipment failure tracking and history coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;