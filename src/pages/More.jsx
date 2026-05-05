import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { ChevronRight } from "lucide-react";
import { haptics } from "@/utils/haptics";
import { morePageStructure, allRoutes } from "@/lib/routeConfig";
import MoreHeader from "@/components/MoreHeader";

function MenuItem({ route, onClick }) {
  if (!route) return null;
  const Icon = route.icon;
  return (
    <button
      onClick={() => {
        haptics.light();
        onClick?.(route.path);
      }}
      className="w-full text-left bg-card border border-border rounded-lg p-3 flex items-center gap-3 active:scale-95 transition-all duration-100 hover:bg-muted"
    >
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 stroke-[1.5] text-secondary-text" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{route.label}</p>
        <p className="text-xs text-secondary-text mt-0.5">{route.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 stroke-[1.5] text-secondary-text shrink-0" />
    </button>
  );
}

function SectionLabel({ label }) {
  return (
    <div className="mt-5 mb-3 first:mt-0">
      <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">{label}</p>
    </div>
  );
}

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="pb-24">
      <MoreHeader onSettings={() => navigate("/my-restaurant")} />

      <div className="px-4 py-4 space-y-6">
        {/* Dynamically render sections from route config */}
        {Object.entries(morePageStructure).map(([sectionKey, section]) => (
          <div key={sectionKey}>
            <SectionLabel label={section.title} />
            <div className="space-y-2">
              {section.items.map((routeKey) => {
                // Find the route in allRoutes
                for (const moduleKey in allRoutes) {
                  for (const key in allRoutes[moduleKey]) {
                    if (key === routeKey) {
                      const route = allRoutes[moduleKey][key];
                      // Check if user has access
                      if (route.roles && !route.roles.includes(isAdmin ? "admin" : "user")) {
                        return null;
                      }
                      return (
                        <MenuItem
                          key={routeKey}
                          route={route}
                          onClick={handleNavigate}
                        />
                      );
                    }
                  }
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const hideBase44Index = true;