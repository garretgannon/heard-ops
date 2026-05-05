import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brush, UserCheck, Sun, Moon, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Cleaning from "./Cleaning";
import SideWork from "./SideWork";
import OpeningChecklist from "./OpeningChecklist";
import ClosingChecklist from "./ClosingChecklist";

const TABS = [
  { id: "cleaning", label: "Cleaning", icon: Brush, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "sidework", label: "Side Work", icon: UserCheck, color: "text-teal-400", bg: "bg-teal-500/10" },
  { id: "opening", label: "Opening", icon: Sun, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: "closing", label: "Closing", icon: Moon, color: "text-indigo-400", bg: "bg-indigo-500/10" },
];

const COMPONENTS = {
  cleaning: Cleaning,
  sidework: SideWork,
  opening: OpeningChecklist,
  closing: ClosingChecklist,
};

export default function Standards() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cleaning");

  const handleTabClick = (id) => {
    setActiveTab(id);
  };

  return (
    <div className="mx-auto w-full max-w-[420px] flex flex-col gap-3 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => navigate("/more")} className="h-8 w-8 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center">
          <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-extrabold text-white tracking-tight">Standards</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">Operational checklists</p>
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

      {/* Content */}
      {(() => {
        const Component = COMPONENTS[activeTab];
        return Component ? <Component /> : null;
      })()}
    </div>
  );
}

export const hideBase44Index = true;