import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Users, Calendar, Tag, Truck, Package, Trash2, UtensilsCrossed, Sparkles, Wrench,
  Settings, BarChart2, ClipboardList, Bell, ChefHat, Users2
} from "lucide-react";

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const categories = [
    {
      id: "team",
      title: "Team & Scheduling",
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/15",
      borderColor: "border-blue-500/25",
      items: [
        { label: "Team Directory", desc: "Manage roles, certifications, availability", path: "/restaurant-team", icon: Users },
        { label: "Schedule Center", desc: "Import and manage weekly shifts", path: "/schedule-center", icon: Calendar },
        { label: "Job Codes", desc: "Configure roles and pay codes", path: "/job-codes", icon: Tag },
      ]
    },
    {
      id: "ops",
      title: "Operations",
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/15",
      borderColor: "border-amber-500/25",
      items: [
        { label: "Vendors", desc: "Supplier contacts and ordering", path: "/vendors", icon: Truck },
        { label: "Inventory & Orders", desc: "Track stock levels and reorder", path: "/inventory", icon: Package },
        { label: "Waste & 86 Log", desc: "Log waste and out-of-stock items", path: "/waste", icon: Trash2 },
        { label: "Cleaning & Deep Clean", desc: "Cleaning checklists and logs", path: "/cleaning", icon: Sparkles },
      ]
    },
    {
      id: "training",
      title: "Team Training",
      iconColor: "text-cyan-400",
      bgColor: "bg-cyan-500/15",
      borderColor: "border-cyan-500/25",
      items: [
        { label: "Recipes & Build Cards", desc: "Dish specs and plating notes", path: "/recipes", icon: UtensilsCrossed },
      ]
    },
    ...(isAdmin ? [{
      id: "admin",
      title: "Admin Settings",
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/15",
      borderColor: "border-purple-500/25",
      items: [
        { label: "Template Builder", desc: "Create recurring task lists", path: "/templates", icon: ClipboardList },
        { label: "Standards & Procedures", desc: "Attach notes to tasks", path: "/standards", icon: ClipboardList },
        { label: "Reports & Insights", desc: "Performance and compliance reports", path: "/reports", icon: BarChart2 },
        { label: "Restaurant Settings", desc: "Business info and branding", path: "/my-restaurant", icon: Settings },
        { label: "Notification Settings", desc: "Alert preferences and channels", path: "/notifications", icon: Bell },
      ]
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0D] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F24] px-4 py-3">
        <h1 className="text-lg font-bold text-white">More</h1>
        <p className="text-[10px] text-[#6B7280] mt-0.5">Tools, settings, and admin</p>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {categories.map((category, catIdx) => (
          <motion.section
            key={category.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.08, duration: 0.3 }}
          >
            {/* Section Header */}
            <div className="mb-3.5 px-1">
              <h2 className={`text-xs font-bold uppercase tracking-widest ${category.iconColor}`}>
                {category.title}
              </h2>
            </div>

            {/* Module Cards Grid */}
            <div className="space-y-2">
              {category.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={itemIdx}
                    onClick={() => navigate(item.path)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (catIdx * 0.08) + (itemIdx * 0.04), duration: 0.2 }}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-[#141418] border border-[#1F1F24] rounded-lg hover:bg-[#1A1A1F] hover:border-[#262630] transition-all active:scale-95"
                  >
                    {/* Icon Container */}
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 border ${category.bgColor} ${category.borderColor}`}>
                      <Icon className={`h-5.5 w-5.5 ${category.iconColor}`} />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5 line-clamp-1">{item.desc}</p>
                    </div>

                    {/* Chevron */}
                    <div className="text-[#6B7280] shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

export const hideBase44Index = true;