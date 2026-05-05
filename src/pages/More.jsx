import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion } from "framer-motion";
import {
  Users, Calendar, Tag, Truck, Package, Trash2, ChefHat, Wine, ClipboardList,
  AlertTriangle, Wrench, Settings, BarChart2, FileText, Bell, BookOpen,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const categories = [
    {
      title: "Team & Scheduling",
      icon: Users,
      items: [
        { label: "Team Directory", path: "/restaurant-team", icon: Users },
        { label: "Schedule Center", path: "/schedule-center", icon: Calendar },
        { label: "Employee Calendar", path: "/employee-calendar", icon: Calendar },
        { label: "Job Codes", path: "/job-codes", icon: Tag },
      ]
    },
    {
      title: "Operations",
      icon: Package,
      items: [
        { label: "Vendors", path: "/vendors", icon: Truck },
        { label: "Inventory & Orders", path: "/inventory", icon: Package },
        { label: "Waste & 86 Log", path: "/waste", icon: Trash2 },
        { label: "Recipes", path: "/recipes", icon: ChefHat },
        { label: "Build Books", path: "/build-book", icon: BookOpen },
        { label: "Bar Book", path: "/bar-book", icon: Wine },
        { label: "Cleaning & Deep Clean", path: "/cleaning", icon: ClipboardList },
        { label: "Issues & Repairs", path: "/issues", icon: AlertTriangle },
      ]
    },
    {
      title: "Admin",
      icon: Settings,
      items: [
        { label: "Template Builder", path: "/templates", icon: Settings },
        { label: "Standards", path: "/standards", icon: FileText },
        { label: "Reports & Insights", path: "/reports", icon: BarChart2 },
        { label: "Settings", path: "/my-restaurant", icon: Settings },
        { label: "Notification Settings", path: "/notifications", icon: Bell },
      ]
    },
  ];

  return (
    <motion.div
      className="min-h-screen bg-background pb-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">More Tools</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your restaurant operations</p>
      </div>

      {/* Categories */}
      <div className="px-4 py-4 space-y-6">
        {categories.map((category, catIdx) => {
          // Hide admin section for non-admins
          if (category.title === "Admin" && !isAdmin) return null;

          const Icon = category.icon;
          return (
            <div key={catIdx}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  {category.title}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {category.items.map((item, itemIdx) => {
                  const ItemIcon = item.icon;
                  return (
                    <motion.button
                      key={itemIdx}
                      onClick={() => navigate(item.path)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: itemIdx * 0.02 }}
                      className="group bg-card border border-border rounded-xl p-3 text-left hover:bg-muted transition-colors active:scale-95"
                    >
                      <ItemIcon className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-foreground leading-tight">{item.label}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export const hideBase44Index = true;