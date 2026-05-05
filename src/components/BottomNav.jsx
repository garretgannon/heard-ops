import { Link, useLocation } from "react-router-dom";
import { Home, Package, Thermometer, ArrowRightLeft, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Today",   path: "/",              icon: Home },
  { label: "Prep",    path: "/prep-lists",    icon: Package },
  { label: "Temps",   path: "/temp-logs",     icon: Thermometer },
  { label: "Handoff", path: "/shift-handoff", icon: ArrowRightLeft },
  { label: "More",    path: "/more",          icon: MoreHorizontal },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        background: "rgba(11, 15, 20, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "0.5px solid rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        height: "calc(56px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
        const active = pathname === path || (path !== "/" && pathname.startsWith(path));
        return (
          <Link
            key={path}
            to={path}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] relative"
            style={{ minHeight: 44 }}
          >
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{ width: 24, height: 2.5, background: "#F5A623", borderRadius: "0 0 3px 3px" }}
              />
            )}
            <Icon
              className="transition-all duration-200"
              style={{
                width: 22, height: 22,
                color: active ? "#F5A623" : "#6B7280",
                strokeWidth: active ? 2.2 : 1.7,
                transform: active ? "scale(1.08)" : "scale(1)",
              }}
            />
            <span
              className="text-[10px] font-semibold tracking-tight transition-colors duration-200"
              style={{ color: active ? "#F5A623" : "#6B7280" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}