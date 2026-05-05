import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Plus, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "prep", label: "Prep", color: "text-blue-400" },
  { value: "cleaning", label: "Cleaning", color: "text-emerald-400" },
  { value: "side_work", label: "Side Work", color: "text-purple-400" },
  { value: "opening", label: "Opening", color: "text-amber-400" },
  { value: "closing", label: "Closing", color: "text-red-400" },
];

const catColor = (val) => {
  const cat = CATEGORIES.find(c => c.value === val);
  return cat?.color || "text-gray-400";
};

export default function TemplateList() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => {
    base44.entities.Template.list("-updated_date", 100).then(data => {
      setTemplates(data.filter(t => t.is_active !== false));
      setLoading(false);
    });
  }, []);

  const filtered = templates.filter(t => {
    if (filterCat !== "all" && t.category !== filterCat) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[480px] flex flex-col bg-[#080C14] text-white pb-24 min-h-screen">

      {/* HEADER */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1A2235] sticky top-0 z-10 bg-[#080C14]">
        <h1 className="text-[16px] font-extrabold tracking-tight mb-3">Templates</h1>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full h-9 pl-9 pr-3 text-[13px] bg-[#0F1623] border border-[#1E2A3B] rounded-lg text-white outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-600"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilterCat(cat.value)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
                filterCat === cat.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-[#0F1623] text-gray-500 border-[#1E2A3B]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN LIST */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-4 space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <Layers className="h-8 w-8 opacity-40 mb-2" />
              <p className="text-[13px]">
                {search ? "No templates match your search" : "No templates yet"}
              </p>
            </div>
          ) : (
            filtered.map(template => (
              <button
                key={template.id}
                onClick={() => navigate(`/templates/${template.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#1A2235] bg-[#0B1018] hover:border-[#2A3A50] active:scale-95 transition-all"
              >
                {/* Left: Content */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-bold text-white truncate">{template.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-[10px] font-semibold", catColor(template.category))}>
                      {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {template.tasks?.length || 0} tasks
                    </span>
                    {template.updated_date && (
                      <span className="text-[10px] text-gray-700">
                        · {formatDistanceToNow(new Date(template.updated_date), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Chevron */}
                <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => navigate("/templates")}
        className="fixed bottom-6 right-4 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-[13px] font-bold shadow-lg active:scale-95 transition-transform z-20"
      >
        <Plus className="h-4 w-4" /> Create
      </button>
    </div>
  );
}

export const hideBase44Index = true;