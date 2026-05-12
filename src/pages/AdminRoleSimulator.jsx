import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleSimulation } from '@/lib/RoleSimulationContext';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { ROLE_DEFINITIONS, getRoleDefinition } from '@/lib/roleDefinitions';
import { generateRoleSimulationData } from '@/utils/generateRoleSimulationData';
import { ArrowRight, LogOut, ChefHat, Users, Flame, Wine, Utensils, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';

const ROLE_ICONS = {
  manager: Shield,
  kitchen_lead: ChefHat,
  server: Users,
  prep_cook: Utensils,
  cook: Flame,
  bartender: Wine,
};

export default function AdminRoleSimulator() {
  const navigate = useNavigate();
  const { simulatedRole, enterSimulation, exitSimulation, isSimulating } = useRoleSimulation();
  const [hoveredRole, setHoveredRole] = useState(null);

  const handleEnterRole = (roleKey) => {
    haptics.medium?.();
    const dummyData = generateRoleSimulationData(roleKey);
    enterSimulation(roleKey, dummyData);
    const roleDef = getRoleDefinition(roleKey);
    navigate(roleDef?.defaultView || '/app/overview');
  };

  const handleExit = () => {
    haptics.light?.();
    exitSimulation();
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <DesktopPageHeader title="Role Simulator" subtitle="Preview the app exactly as each role experiences it" />
      {/* Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-card border-b border-border backdrop-blur-sm">
        <div className="px-4 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Role Simulation</h1>
              <p className="text-sm text-secondary-text mt-1">Preview the app exactly as each role experiences it</p>
            </div>
            {isSimulating && (
              <button
                onClick={handleExit}
                className="h-10 px-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-semibold text-sm flex items-center gap-2 active:scale-95 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Exit Simulation
              </button>
            )}
          </div>
          {isSimulating && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2.5 text-sm text-purple-300">
              Currently simulating as: <span className="font-bold">{getRoleDefinition(simulatedRole)?.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Grid */}
      <div className="px-4 py-6 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(ROLE_DEFINITIONS).map(([roleKey, roleDef]) => {
            const IconComponent = ROLE_ICONS[roleKey];
            const isActive = simulatedRole === roleKey;

            return (
              <button
                key={roleKey}
                onClick={() => handleEnterRole(roleKey)}
                onMouseEnter={() => setHoveredRole(roleKey)}
                onMouseLeave={() => setHoveredRole(null)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 transition-all active:scale-95 text-left group",
                  isActive
                    ? 'bg-primary/15 border-primary'
                    : 'bg-card border-border hover:border-border/80'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      isActive ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      {IconComponent && <IconComponent className={cn("h-5 w-5", isActive ? 'text-primary' : 'text-secondary-text')} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">{roleDef.label}</h3>
                      <p className="text-[13px] text-secondary-text mt-0.5">
                        {Object.values(roleDef.permissions).filter(Boolean).length} permissions • {roleDef.visibleModules.length} modules
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted group-hover:bg-border',
                    (hoveredRole === roleKey || isActive) && 'scale-110'
                  )}>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Module badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {roleDef.visibleModules.slice(0, 4).map(module => (
                    <span key={module} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-muted text-secondary-text">
                      {module}
                    </span>
                  ))}
                  {roleDef.visibleModules.length > 4 && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-muted text-secondary-text">
                      +{roleDef.visibleModules.length - 4}
                    </span>
                  )}
                </div>

                {isActive && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-primary font-bold">✓ Now simulating</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 space-y-4 p-4 rounded-xl card-glass border border-border/50">
          <h3 className="font-bold text-foreground">How Role Simulation Works</h3>
          <ul className="space-y-2 text-sm text-secondary-text">
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Select a role to enter full immersion mode — you'll see exactly what staff sees</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>All permissions are restricted — try actions to verify they work correctly</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Dummy operational data is generated for testing and workflow review</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Return to your admin dashboard anytime — simulation bar is always visible</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;
