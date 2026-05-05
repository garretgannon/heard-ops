import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Search, ChefHat, BookOpen, Users, Wrench, ClipboardList, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import KnowledgeHeader from "@/components/KnowledgeHeader";

function SearchBar({ value, onChange, onFocus }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
      <input
        type="text"
        placeholder="Search recipes, guides, vendors…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}

function FeaturedCard({ icon: Icon, title, count, image, onClick }) {
  return (
    <button
      onClick={() => {
        haptics.light();
        onClick?.();
      }}
      className="group relative overflow-hidden rounded-xl bg-card border border-border h-40 flex flex-col justify-between p-4 active:scale-95 transition-all duration-100"
    >
      {/* Background Image Overlay */}
      {image && (
        <div
          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
          style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon className="h-4 w-4 stroke-[1.5] text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-2xl font-bold text-primary">{count}</span>
        <ChevronRight className="h-4 w-4 text-secondary-text group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}

function BrowseCard({ icon: Icon, title, count, onClick }) {
  return (
    <button
      onClick={() => {
        haptics.light();
        onClick?.();
      }}
      className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 active:scale-95 transition-all duration-100 w-full"
    >
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 stroke-[1.5] text-secondary-text" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-muted text-foreground">{count}</span>
        <ChevronRight className="h-4 w-4 text-secondary-text" />
      </div>
    </button>
  );
}

export default function Knowledge() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [recipes, vendors, knowledge, managerLogs] = await Promise.all([
          base44.entities.Recipe.list().catch(() => []),
          base44.entities.Vendor.list().catch(() => []),
          base44.entities.Knowledge.list().catch(() => []),
          base44.entities.ManagerLog.list().catch(() => []),
        ]);

        const equipmentGuides = knowledge.filter(k => k.type === "guide" && k.category?.includes("equipment")).length;
        const sopGuides = knowledge.filter(k => k.type === "procedure" || k.type === "standard").length;
        const forms = managerLogs.filter(m => m.category === "team_note").length;

        setCounts({
          recipes: recipes.length,
          vendors: vendors.length,
          equipment: equipmentGuides,
          sops: sopGuides,
          forms: forms,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <KnowledgeHeader onNotifications={() => navigate("/today")} />

      <div className="px-4 py-4 space-y-6">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onFocus={handleSearch}
        />

        {/* Featured Section */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Featured</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <FeaturedCard
              icon={ChefHat}
              title="Recipes"
              count={counts.recipes || 0}
              onClick={() => navigate("/recipes")}
            />
            <FeaturedCard
              icon={BookOpen}
              title="Build Cards"
              count={counts.recipes || 0}
              onClick={() => navigate("/recipes")}
            />
          </div>
        </div>

        {/* Browse Section */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Browse</h2>
          <div className="space-y-2">
            <BrowseCard
              icon={Users}
              title="Vendors"
              count={counts.vendors || 0}
              onClick={() => navigate("/vendors")}
            />
            <BrowseCard
              icon={Wrench}
              title="Equipment"
              count={counts.equipment || 0}
              onClick={() => navigate("/equipment")}
            />
            <BrowseCard
              icon={BookOpen}
              title="SOPs & Guides"
              count={counts.sops || 0}
              onClick={() => navigate("/guides")}
            />
            <BrowseCard
              icon={ClipboardList}
              title="Forms & Checklists"
              count={counts.forms || 0}
              onClick={() => navigate("/forms")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;