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

const STANDARDS_ITEMS = [
  { label: "Cleaning",   icon: Brush,        path: "/cleaning",  color: "text-blue-400",   bg: "bg-blue-500/15" },
  { label: "Side Work",  icon: UserCheck,    path: "/side-work", color: "text-teal-400",   bg: "bg-teal-500/15" },
  { label: "Opening",   icon: Sun,          path: "/opening",   color: "text-amber-400",  bg: "bg-amber-500/15" },
  { label: "Closing",   icon: Moon,         path: "/closing",   color: "text-indigo-400", bg: "bg-indigo-500/15" },
];

const SECTIONS = [
  {
    label: "Operations",
    hasStandards: true,
    items: [
      { label: "Issue Tracker", icon: ShieldAlert, path: "/issues",      color: "text-red-400",    bg: "bg-red-500/15" },
      { label: "Repairs",       icon: Wrench,      path: "/maintenance", color: "text-orange-400", bg: "bg-orange-500/15" },
    ],
  },
  {
    label: "Team",
    adminOnly: true,
    items: [
      { label: "Employees",       icon: Users,       path: "/restaurant-team", color: "text-purple-400", bg: "bg-purple-500/15" },
      { label: "Service Line-Up", icon: Flame,       path: "/pre-shift",       color: "text-amber-400",  bg: "bg-amber-500/15" },
      { label: "Onboarding",      icon: BookOpen,    path: "/onboarding",      color: "text-green-400",  bg: "bg-green-500/15" },
      { label: "Calendar",        icon: CalendarDays,path: "/calendar",        color: "text-blue-400",   bg: "bg-blue-500/15" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Inventory",    icon: Package,       path: "/inventory",    color: "text-amber-400",  bg: "bg-amber-500/15" },
      { label: "Build Book",   icon: ClipboardList, path: "/build-book",   color: "text-orange-400", bg: "bg-orange-500/15" },
      { label: "Bar Book",     icon: Wine,          path: "/bar-book",     color: "text-purple-400", bg: "bg-purple-500/15" },
      { label: "Prep Library", icon: Package,       path: "/prep-library", color: "text-teal-400",   bg: "bg-teal-500/15" },
    ],
  },
  {
    label: "Insights",
    adminOnly: true,
    items: [
      { label: "Reports",       icon: BarChart2, path: "/reports",       color: "text-blue-400",   bg: "bg-blue-500/15" },
      { label: "Weekly Report", icon: FileText,  path: "/weekly-report", color: "text-indigo-400", bg: "bg-indigo-500/15" },
      { label: "Photo Review",  icon: Camera,    path: "/photo-review",  color: "text-pink-400",   bg: "bg-pink-500/15" },
    ],
  },
  {
    label: "Setup",
    adminOnly: true,
    items: [
      { label: "Vendors",       icon: Truck,    path: "/vendors",       color: "text-yellow-400", bg: "bg-yellow-500/15" },
      { label: "My Restaurant", icon: Settings, path: "/my-restaurant", color: "text-gray-400",   bg: "bg-gray-500/15" },
      { label: "Notifications", icon: Bell,     path: "/notifications", color: "text-amber-400",  bg: "bg-amber-500/15" },
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

              {/* Standards sub-group */}
              {section.hasStandards && (
                <>
                  <div className="px-3 py-1.5 border-b border-[#1F2937] bg-[#0F1724]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Standards</span>
                  </div>
                  {STANDARDS_ITEMS.map(item => {
                    const Icon = item.icon;
                    return (
                      <button key={item.path} onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-[#1C2432] transition-colors text-left border-b border-[#1F2937]">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                          <Icon className={cn("h-4 w-4", item.color)} />
                        </div>
                        <span className="flex-1 text-sm font-semibold text-white pl-2">{item.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                      </button>
                    );
                  })}
                  {section.items.length > 0 && (
                    <div className="border-t border-[#1F2937]" />
                  )}
                </>
              )}

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