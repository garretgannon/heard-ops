import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion } from "framer-motion";
import {
  Users, Calendar, Tag, Truck, Package, Trash2, ChefHat, Wine, Wrench,
  Settings, BarChart2, FileText, Bell, BookOpen, ChevronRight, ChevronDown,
  Zap, PlusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const [expandedCategory, setExpandedCategory] = useState("team");

  const categories = [
    {
      id: "team",
      title: "Team & Scheduling",
      subtitle: "Staff, shifts, and onboarding",
      icon: Users,
      color: "from-blue-500/20 to-blue-600/10",
      borderColor: "border-blue-500/20",
      items: [
        { label: "Team Directory", desc: "View all staff and roles", path: "/restaurant-team", icon: Users },
        { label: "Schedule Center", desc: "Import and manage weekly shifts", path: "/schedule-center", icon: Calendar },
        { label: "Job Codes", desc: "Configure roles and pay codes", path: "/job-codes", icon: Tag },
      ]
    },
    {
      id: "ops",
      title: "Operations",
      subtitle: "Daily tasks, inventory, and issues",
      icon: Package,
      color: "from-amber-500/20 to-amber-600/10",
      borderColor: "border-amber-500/20",
      items: [
        { label: "Vendors", desc: "Supplier contacts and orders", path: "/vendors", icon: Truck },
        { label: "Inventory & Orders", desc: "Stock levels and reordering", path: "/inventory", icon: Package },
        { label: "Waste & 86 Log", desc: "Track waste and out-of-stock items", path: "/waste", icon: Trash2 },
        { label: "Recipes & Build Cards", desc: "Dish specs and plating notes", path: "/recipes", icon: ChefHat },
        { label: "Cleaning & Deep Clean", desc: "Cleaning checklists and logs", path: "/cleaning", icon: Zap },
        { label: "Issues & Repairs", desc: "Equipment issues and maintenance", path: "/issues", icon: Wrench },
      ]
    },
    {
      id: "admin",
      title: "Admin Settings",
      subtitle: "Templates, reports, and configuration",
      icon: Settings,
      color: "from-orange-500/20 to-orange-600/10",
      borderColor: "border-orange-500/20",
      items: [
        { label: "Template Builder", desc: "Create recurring task lists", path: "/templates", icon: FileText },
        { label: "Standards & Procedures", desc: "Attach notes to tasks", path: "/standards", icon: BookOpen },
        { label: "Reports & Insights", desc: "Performance and compliance reports", path: "/reports", icon: BarChart2 },
        { label: "Restaurant Settings", desc: "Business info and branding", path: "/my-restaurant", icon: Settings },
        { label: "Notification Settings", desc: "Alert preferences", path: "/notifications", icon: Bell },
      ]
    },
  ];

  const visibleCategories = isAdmin ? categories : categories.slice(0, 2);

  return (
    <motion.div
      className="min-h-screen bg-background pb-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-2.5">
        <h1 className="text-lg font-bold text-foreground">More</h1>
        <p className="text-[10px] text-muted-foreground mt-0">Tools, settings, and admin</p>
      </div>

      {/* Categories */}
      <div className="px-4 py-4 space-y-2">
        {visibleCategories.map((category, catIdx) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategory === category.id;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.05 }}
              className={cn(
                "rounded-xl border transition-all overflow-hidden",
                category.borderColor,
                isExpanded ? "bg-card" : "bg-card/50"
              )}
            >
              {/* Category Header - Collapsible */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", category.color)}>
                  <CategoryIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{category.title}</p>
                  <p className="text-xs text-muted-foreground mt-0">{category.subtitle}</p>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground shrink-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>

              {/* Category Items */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border"
                >
                  {category.items.map((item, itemIdx) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={itemIdx}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors text-left active:scale-95"
                      >
                        <ItemIcon className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export const hideBase44Index = true;