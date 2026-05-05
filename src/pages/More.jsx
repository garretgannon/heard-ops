import { useNavigate } from "react-router-dom";
import {
  ShieldAlert, Wrench, Users, Package, ShoppingCart,
  BarChart2, LayoutTemplate, Truck, Settings, ChevronRight,
  AlertTriangle, ClipboardList, BookOpen, Wine, DollarSign,
  CalendarDays, Bell, Camera, FileText, UserCheck, Flame,
  Sparkles, Sun, Moon, Wind, Brush
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const SECTIONS = [
  {
    label: "Operations",
    adminOnly: false,
    items: [
      { label: "Standards",           icon: Sparkles,    path: "/standards",         color: "text-blue-400",   bg: "bg-blue-500/15" },
      { label: "Issues",              icon: AlertTriangle, path: "/issues-unified",     color: "text-red-400",    bg: "bg-red-500/15" },
      { label: "Inventory Control",   icon: Package,     path: "/inventory-control", color: "text-amber-400",  bg: "bg-amber-500/15" },
    ],
  },
  {
    label: "Core Systems",
    items: [
      { label: "Recipes", icon: BookOpen, path: "/recipes", color: "text-orange-400", bg: "bg-orange-500/15" },
    ],
  },
  {
    label: "People",
    adminOnly: true,
    items: [
      { label: "Team",                icon: Users,       path: "/restaurant-team", color: "text-purple-400", bg: "bg-purple-500/15" },
      { label: "Service Line-Up",     icon: Flame,       path: "/pre-shift",       color: "text-amber-400",  bg: "bg-amber-500/15" },
      { label: "Onboarding",          icon: BookOpen,    path: "/onboarding",      color: "text-green-400",  bg: "bg-green-500/15" },
    ],
  },
  {
    label: "Business",
    adminOnly: true,
    items: [
      { label: "Vendors",   icon: Truck,    path: "/vendors",   color: "text-yellow-400", bg: "bg-yellow-500/15" },
    ],
  },
  {
    label: "Setup",
    adminOnly: true,
    items: [
      { label: "Templates",    icon: LayoutTemplate, path: "/templates",       color: "text-indigo-400", bg: "bg-indigo-500/15" },
      { label: "Settings",     icon: Settings,      path: "/my-restaurant",  color: "text-gray-400",   bg: "bg-gray-500/15" },
    ],
  },
];

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const visibleSections = SECTIONS.filter(s => !s.adminOnly || isAdmin);

  return (
    <div className="pb-4">
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-white tracking-tight">More</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">All tools and settings</p>
      </div>

      <div className="space-y-4">
        {visibleSections.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">{section.label}</p>
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">



              {/* Regular items */}
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    className={cn("w-full flex items-center gap-3 px-3 py-2.5 active:bg-[#1C2432] transition-colors text-left",
                      idx < section.items.length - 1 && "border-b border-[#1F2937]")}>
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                      <Icon className={cn("h-4 w-4", item.color)} />
                    </div>
                    <span className="flex-1 text-sm font-semibold text-white">{item.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const hideBase44Index = true;