import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Search, ChefHat, BookOpen, Users, Zap, FileText, ChevronRight, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

function FeaturedCard({ title, icon: Icon, image, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card-with-border border-l-slate-600 overflow-hidden flex flex-col shrink-0 w-40 active:scale-95 transition-all duration-200"
    >
      {image ? (
        <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <img src={image} alt={title} className="h-20 w-20 object-cover rounded-lg" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Icon className="h-10 w-10 stroke-[1.5] text-primary" />
        </div>
      )}
      <div className="p-2.5 flex-1 flex flex-col justify-end">
        <p className="text-xs font-bold text-foreground">{title}</p>
        <p className="text-[9px] text-secondary-text mt-0.5">{count} items</p>
      </div>
    </button>
  );
}

function BrowseItem({ icon: Icon, title, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card-with-border border-l-slate-600 p-3 flex items-center gap-3 active:scale-95 transition-all duration-200 w-full"
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
    buildCards: 0,
    vendors: 0,
    equipment: 0,
    guides: 0,
    checklists: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [recipes, buildBooks, vendors, stations, templates, checklists] = await Promise.all([
          base44.entities.Recipe.list().catch(() => []),
          base44.entities.BuildBook.list().catch(() => []),
          base44.entities.Vendor.list().catch(() => []),
          base44.entities.Station.list().catch(() => []),
          base44.entities.Template.list().catch(() => []),
          base44.entities.ClosingChecklist.list().catch(() => []),
        ]);

        setData({
          recipes: recipes.length,
          buildCards: buildBooks.length,
          vendors: vendors.length,
          equipment: stations.length,
          guides: templates.filter(t => t.category === "prep").length,
          checklists: checklists.length,
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
    // Simple routing based on search context - can be enhanced
    navigate(`/recipes?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="w-full pb-20">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-3">Knowledge</h1>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-5 w-5 stroke-[1.5] text-secondary-text pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSearch()}
            placeholder="Search recipes, guides, vendors…"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-card text-foreground placeholder-secondary-text focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Featured Section */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-3">Featured</h2>
            <div className="flex gap-2 -mx-4 px-4 overflow-x-auto pb-2 scrollbar-hide">
              <FeaturedCard
                title="Recipes"
                icon={ChefHat}
                count={data.recipes}
                onClick={() => navigate("/recipes")}
              />
              <FeaturedCard
                title="Build Cards"
                icon={Utensils}
                count={data.buildCards}
                onClick={() => navigate("/recipes")}
              />
            </div>
          </div>

          {/* Browse Section */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-3">Browse</h2>
            <div className="space-y-2">
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
                icon={BookOpen}
                title="SOPs & Guides"
                count={data.guides}
                onClick={() => navigate("/standards")}
              />
              <BrowseItem
                icon={FileText}
                title="Forms & Checklists"
                count={data.checklists}
                onClick={() => navigate("/opening")}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const hideBase44Index = true;