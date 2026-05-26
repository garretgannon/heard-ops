import { useState, useEffect } from 'react';
import { posSync } from '@/lib/posSync';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { ArrowRight, CheckCircle2, Link2, MonitorSmartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Integrations() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setIsConnected(posSync.isConnected());
  }, []);

  const handleToggleConnection = async () => {
    if (isConnected) {
      await posSync.disconnect();
      setIsConnected(false);
      toast.success('Disconnected from Toast POS');
    } else {
      setIsConnecting(true);
      await posSync.connect('toast');
      setIsConnected(true);
      setIsConnecting(false);
      toast.success('Successfully connected to Toast POS', {
        description: 'Live 86 syncing and Sales Velocity are now active.',
      });
    }
  };

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Integrations" subtitle="Connect external platforms" />

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Integrations</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage external system connections</p>
      </div>

      <main className="ops-page max-w-[800px] mx-auto space-y-6">
        <section className="space-y-3">
          <h2 className="ops-kicker">Point of Sale</h2>
          
          <div className="ops-panel p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                  <MonitorSmartphone className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Toast POS</h3>
                  <p className="text-sm text-muted-foreground">Sync 86 items, live sales velocity, and labor data.</p>
                </div>
              </div>
              
              {isConnected && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">Connected</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border/40">
              <button
                onClick={handleToggleConnection}
                disabled={isConnecting}
                className={cn(
                  "w-full flex items-center justify-center gap-2 h-11 rounded-2xl font-bold transition-all",
                  isConnected 
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
                  isConnecting && "opacity-50 cursor-wait"
                )}
              >
                {isConnecting ? (
                  <span className="animate-pulse">Connecting...</span>
                ) : isConnected ? (
                  "Disconnect"
                ) : (
                  <>
                    <Link2 className="h-4 w-4" /> Connect Toast
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="space-y-3 opacity-60">
          <h2 className="ops-kicker">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="ops-panel p-4 flex items-center justify-between pointer-events-none">
              <div>
                <h3 className="font-bold text-foreground">7shifts</h3>
                <p className="text-xs text-muted-foreground">Live schedule sync</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="ops-panel p-4 flex items-center justify-between pointer-events-none">
              <div>
                <h3 className="font-bold text-foreground">SevenRooms</h3>
                <p className="text-xs text-muted-foreground">Live cover forecasting</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
