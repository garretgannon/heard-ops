import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Search, ChefHat, BookOpen, Users, Wrench, ClipboardList, CalendarDays, AlertTriangle, FileText, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/haptics";
import KnowledgeHeader from "@/components/KnowledgeHeader";
import QuickAccessCard from "@/components/QuickAccessCard";
import OperationsLibraryRow from "@/components/OperationsLibraryRow";

const knowledgeCache = { data: null, ts: 0 };
const CACHE_TTL = 60_000;

export default function Knowledge() {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState(knowledgeCache.data || {});
  const [loading, setLoading] = useState(!knowledgeCache.data);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [recipes, buildCards, vendors, equipment, beos, reservations] = await Promise.all([
          base44.entities.Recipe.list("-updated_date", 100).catch(() => []),
          base44.entities.BuildCard.list("-updated_date", 100).catch(() => []),
          base44.entities.Vendor.list("-updated_date", 100).catch(() => []),
          base44.entities.Equipment.list("-updated_date", 100).catch(() => []),
          base44.entities.BEO.list("-updated_date", 50).catch(() => []),
          base44.entities.Reservation.list("-updated_date", 50).catch(() => []),
        ]);

        const data = {
          recipes: recipes.length,
          buildCards: buildCards.length,
          vendors: vendors.length,
          equipment: equipment.length,
          beos: beos.length,
          reservations: reservations.length,
          activeBeos: beos.filter(b => b.status !== "completed").length,
        };

        knowledgeCache.data = data;
        knowledgeCache.ts = Date.now();
        setCounts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (!knowledgeCache.data || Date.now() - knowledgeCache.ts > CACHE_TTL) {
      load();
    }
  }, []);

  // Sticky search on scroll
  const handleScroll = (e) => {
    setScrolled(e.target.scrollLeft > 0 || e.target.scrollTop > 40);
  };

  return (
    <div className="pb-24 max-w-[1100px] mx-auto" onScroll={handleScroll}>
      <KnowledgeHeader onNotifications={() => navigate("/app/overview")} />

      <div className="px-4 py-3 space-y-4">
        {/* Premium Search Bar - Sticky */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
          <Search className="h-4 w-4 text-secondary-text shrink-0" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search recipes, equipment, vendors…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-secondary-text focus:outline-none"
          />
        </div>

        {/* Quick Access Section */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Quick Access</p>
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
            <QuickAccessCard
              icon={ChefHat}
              title="Recipes"
              count={counts.recipes || 0}
              color="blue"
              onClick={() => navigate("/recipes")}
            />
            <QuickAccessCard
              icon={BookOpen}
              title="Build Cards"
              count={counts.buildCards || 0}
              color="purple"
              onClick={() => navigate("/build-cards")}
            />
            <QuickAccessCard
              icon={CalendarDays}
              title="Active BEOs"
              count={counts.activeBeos || 0}
              color="teal"
              indicator={counts.activeBeos > 0}
              onClick={() => navigate("/reservations")}
            />
            <QuickAccessCard
              icon={FileText}
              title="SOPs"
              count={0}
              color="purple"
              onClick={() => navigate("/standards")}
            />
            <QuickAccessCard
              icon={AlertTriangle}
              title="Alerts"
              count={0}
              color="amber"
              indicator
              onClick={() => navigate("/operational-map")}
            />
          </div>
        </div>

        {/* Operations Library */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Operations Library</p>
          <div className="space-y-1.5 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
            <OperationsLibraryRow
              icon={ChefHat}
              title="Recipes"
              subtitle={`${counts.recipes || 0} recipes`}
              count={counts.recipes}
              color="blue"
              onClick={() => navigate("/recipes")}
            />
            <OperationsLibraryRow
              icon={BookOpen}
              title="Build Cards"
              subtitle={`${counts.buildCards || 0} cards`}
              count={counts.buildCards}
              color="purple"
              onClick={() => navigate("/build-cards")}
            />
            <OperationsLibraryRow
              icon={Users}
              title="Vendors"
              subtitle={`${counts.vendors || 0} active contacts`}
              count={counts.vendors}
              color="blue"
              onClick={() => navigate("/vendors")}
            />
            <OperationsLibraryRow
              icon={Wrench}
              title="Equipment"
              subtitle={`${counts.equipment || 0} assets`}
              count={counts.equipment}
              color="amber"
              onClick={() => navigate("/purchased-items")}
            />
            <OperationsLibraryRow
              icon={FileText}
              title="SOPs & Guides"
              subtitle="12 procedures"
              count="12"
              color="purple"
              onClick={() => navigate("/standards")}
            />
            <OperationsLibraryRow
              icon={ClipboardList}
              title="Forms & Checklists"
              subtitle="18 active templates"
              count="18"
              color="green"
              onClick={() => navigate("/templates")}
            />
            <OperationsLibraryRow
              icon={CalendarDays}
              title="Reservations & BEOs"
              subtitle={`${(counts.reservations || 0) + (counts.beos || 0)} events`}
              count={(counts.reservations || 0) + (counts.beos || 0)}
              color="teal"
              onClick={() => navigate("/reservations")}
            />
            <OperationsLibraryRow
              icon={Utensils}
              title="Purchased Items"
              subtitle="Inventory & costing"
              color="blue"
              onClick={() => navigate("/purchased-items")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;
