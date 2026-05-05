import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Search, ChefHat, Users, Zap, FileText, ChevronRight } from "lucide-react";
import StandardPageShell from "@/components/StandardPageShell";

function BrowseItem({ icon: Icon, title, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 active:scale-95 transition-all duration-200 w-full"
    >
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 stroke-[1.5] text-secondary-text" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-secondary-text mt-0.5">{count} items</p>
      </div>
      <ChevronRight className="h-4 w-4 stroke-[1.5] text-secondary-text shrink-0" />
    </button>
  );
}

export default function Knowledge() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [data, setData] = useState({
    recipes: 0,
    vendors: 0,
    equipment: 0,
    guides: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [recipes, vendors, stations, templates] = await Promise.all([
          base44.entities.Recipe.list().catch(() => []),
          base44.entities.Vendor.list().catch(() => []),
          base44.entities.Station.list().catch(() => []),
          base44.entities.Template.list().catch(() => []),
        ]);

        setData({
          recipes: recipes.length,
          vendors: vendors.length,
          equipment: stations.length,
          guides: templates.filter(t => t.category === "prep").length,
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
    if (!search.trim()) return;
    navigate(`/recipes?q=${encodeURIComponent(search)}`);
  };

  return (
    <StandardPageShell title="Knowledge">
      {/* Search Bar */}
      <div className="relative flex items-center mb-4">
        <Search className="absolute left-3 h-5 w-5 stroke-[1.5] text-secondary-text pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyPress={e => e.key === "Enter" && handleSearch()}
          placeholder="Search…"
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-card text-foreground placeholder-secondary-text text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          <BrowseItem
            icon={ChefHat}
            title="Recipes"
            count={data.recipes}
            onClick={() => navigate("/recipes")}
          />
          <BrowseItem
            icon={Users}
            title="Vendors"
            count={data.vendors}
            onClick={() => navigate("/vendors")}
          />
          <BrowseItem
            icon={Zap}
            title="Equipment"
            count={data.equipment}
            onClick={() => navigate("/standards")}
          />
          <BrowseItem
            icon={FileText}
            title="Guides & SOPs"
            count={data.guides}
            onClick={() => navigate("/standards")}
          />
        </div>
      )}
    </StandardPageShell>
  );
}

export const hideBase44Index = true;