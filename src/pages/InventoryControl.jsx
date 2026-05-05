import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Trash2, UtensilsCrossed, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "inventory", label: "Stock", icon: Package, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: "recipes", label: "Recipes", icon: UtensilsCrossed, color: "text-orange-400", bg: "bg-orange-500/10" },
  { id: "waste", label: "Waste", icon: Trash2, color: "text-red-400", bg: "bg-red-500/10" },
  { id: "orders", label: "Orders", icon: ShoppingCart, color: "text-green-400", bg: "bg-green-500/10" },
];

const PAGES = {
  inventory: { path: "/inventory", label: "Inventory Management" },
  recipes: { path: "/recipes", label: "Recipe Library" },
  waste: { path: "/waste", label: "Waste Log" },
  orders: { path: "/vendors", label: "Vendor Orders" },
};

export default function InventoryControl() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventory");

  const handleTabClick = (id) => {
    setActiveTab(id);
    navigate(PAGES[id].path);
  };

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-3 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => navigate("/more")} className="h-8 w-8 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center">
          <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-extrabold text-white tracking-tight">Inventory Control</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">Stock, recipes, waste</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold border transition-all active:scale-95",
                activeTab === tab.id
                  ? `${tab.bg} ${tab.color} border-opacity-50`
                  : "bg-[#111827] text-gray-500 border-[#1F2937]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content hint */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#111827] border border-[#1F2937] rounded-xl">
        <p className="text-[12px] text-gray-400 flex-1">
          Viewing <span className="font-bold text-white">{PAGES[activeTab].label}</span>
        </p>
        <ChevronRight className="h-4 w-4 text-gray-600" />
      </div>

      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
        <p className="text-[13px]">Use tabs above to navigate</p>
      </div>
    </div>
  );
}

export const hideBase44Index = true;