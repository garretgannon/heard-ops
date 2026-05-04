import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, ClipboardList, Thermometer, TrendingUp, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Today",   path: "/",              icon: CalendarCheck },
  { label: "Prep",    path: "/prep-lists",    icon: ClipboardList },
  { label: "Temps",   path: "/temp-logs",     icon: Thermometer },
  { label: "Handoff", path: "/shift-handoff", icon: TrendingUp },
  { label: "More",    path: "/manager",       icon: Grid3x3 },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        height: 72,
        background: "#0B0F14",
        borderTop: "1px solid #1F2933",
        borderRadius: "18px 18px 0 0",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
        const active = pathname === path || (path !== "/" && pathname.startsWith(path));
        return (
          <Link
            key={path}
            to={path}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 active:opacity-70 transition-opacity"
            style={{ minHeight: 56 }}
          >
            <Icon
              className="h-5 w-5 transition-colors"
              style={{ color: active ? "#F5A623" : "#6B7280", strokeWidth: active ? 2.5 : 1.8 }}
            />
            <span
              className="text-[10px] font-semibold tracking-wide transition-colors"
              style={{ color: active ? "#F5A623" : "#6B7280" }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute bottom-0 rounded-full"
                style={{ width: 4, height: 4, background: "#F5A623", marginBottom: 2 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}