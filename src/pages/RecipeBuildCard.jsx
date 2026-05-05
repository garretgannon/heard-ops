import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Copy, Edit2, AlertCircle, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CAT_LABELS = {
  appetizer: "Appetizer", entree: "Entree", side: "Side",
  bar: "Bar", dessert: "Dessert", other: "Other",
};

const CAT_COLORS = {
  appetizer: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  entree:    "text-blue-400   bg-blue-500/10   border-blue-500/20",
  side:      "text-amber-400  bg-amber-500/10  border-amber-500/20",
  bar:       "text-purple-400 bg-purple-500/10 border-purple-500/20",
  dessert:   "text-pink-400   bg-pink-500/10   border-pink-500/20",
  other:     "text-gray-400   bg-gray-500/10   border-gray-500/20",
};

export default function RecipeBuildCard() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Recipe.get(recipeId).then(r => {
      base44.entities.Recipe.update(recipeId, { use_count: (r.use_count || 0) + 1 });
      setRecipe(r);
      setLoading(false);
    });
  }, [recipeId]);

  const handleDuplicate = async () => {
    if (!recipe) return;
    const copy = { ...recipe, name: recipe.name + " (Copy)", id: undefined };
    delete copy.id;
    const created = await base44.entities.Recipe.create(copy);
    toast.success("Recipe duplicated");
    navigate(`/recipes/${created.id}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!recipe) return <div className="p-4 text-red-400">Recipe not found</div>;

  const cat = CAT_COLORS[recipe.category] || CAT_COLORS.other;
  const steps = recipe.build_steps || [];
  const ingredientLines = (recipe.ingredients || "").split("\n").filter(l => l.trim()).slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-[480px] min-h-screen bg-[#080C14] flex flex-col pb-20">

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#080C14]/96 backdrop-blur-sm border-b border-[#1A2235] px-3 py-2 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="h-7 w-7 rounded-lg bg-[#0F1623] border border-[#1E2A3B] flex items-center justify-center active:scale-90 shrink-0">
          <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[14px] font-extrabold text-white truncate">{recipe.name}</h1>
        </div>
        <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", cat)}>{CAT_LABELS[recipe.category]}</span>
      </div>

      {/* Top Section: Photo + Meta */}
      <div className="px-3 pt-2 pb-2 space-y-1.5">
        {recipe.photo_url && (
          <img src={recipe.photo_url} alt={recipe.name} className="w-full h-28 object-cover rounded-lg border border-[#1E2A3B]" />
        )}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {recipe.yield && <div className="flex items-center gap-0.5"><Users className="h-3 w-3" /> {recipe.yield}</div>}
          {recipe.yield && recipe.prep_time && <span>·</span>}
          {recipe.prep_time && <div className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {recipe.prep_time}</div>}
        </div>
        {recipe.description && <p className="text-[11px] text-gray-400 line-clamp-1">{recipe.description}</p>}
      </div>

      {/* Section 1: Ingredients (Compact) */}
      {ingredientLines.length > 0 && (
        <div className="mx-3 mb-1.5 bg-[#0F1623] border border-[#1E2A3B] rounded-lg p-2 overflow-hidden">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1">Ingredients</p>
          <div className="space-y-0.5 text-[11px] text-white font-medium leading-tight">
            {ingredientLines.map((line, i) => (
              <div key={i} className="truncate">{line.trim()}</div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Build Steps (Tightly Stacked) */}
      {steps.length > 0 && (
        <div className="mx-3 mb-1.5 bg-[#0F1623] border border-[#1E2A3B] rounded-lg p-2 overflow-hidden">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1">Build</p>
          <div className="space-y-1">
            {steps.sort((a, b) => a.step_number - b.step_number).map((s) => (
              <div key={s.id || s.step_number} className="flex gap-1.5">
                <div className="h-6 w-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">{s.step_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2">{s.instruction}</p>
                  {s.image_url && (
                    <img src={s.image_url} alt={`Step ${s.step_number}`} className="w-full h-16 object-cover rounded-md mt-1 border border-[#1A2235]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Plating */}
      {(recipe.plating_image_url || recipe.plating_notes) && (
        <div className="mx-3 mb-1.5 bg-[#0F1623] border border-[#1E2A3B] rounded-lg p-2 overflow-hidden">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1">Plate</p>
          {recipe.plating_image_url && (
            <img src={recipe.plating_image_url} alt="Plated dish" className="w-full h-24 object-cover rounded-lg border border-[#1A2235] mb-1" />
          )}
          {recipe.plating_notes && (
            <p className="text-[11px] text-gray-300 line-clamp-2">{recipe.plating_notes}</p>
          )}
        </div>
      )}

      {/* Section 4: Quick Notes (Inline) */}
      <div className="mx-3 mb-2 space-y-1">
        {recipe.allergens && (
          <div className="flex gap-1.5 items-start bg-red-500/8 border border-red-500/20 rounded-lg p-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] text-red-400 font-bold uppercase leading-tight">Allergens</p>
              <p className="text-[10px] text-gray-300 line-clamp-1">{recipe.allergens}</p>
            </div>
          </div>
        )}
        {recipe.modifications && (
          <div className="flex gap-1.5 items-start bg-amber-500/8 border border-amber-500/20 rounded-lg p-1.5">
            <span className="text-[9px] text-amber-400 font-bold uppercase leading-tight shrink-0 mt-0.5">Mods</span>
            <p className="text-[10px] text-gray-300 line-clamp-1">{recipe.modifications}</p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#080C14]/96 backdrop-blur-md border-t border-[#1A2235] px-3 py-2 flex gap-1.5 lg:left-64">
        <button
          onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
          className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg bg-[#0F1623] border border-[#1E2A3B] text-[12px] font-bold text-gray-400 active:scale-95 transition-transform"
        >
          <Edit2 className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={handleDuplicate}
          className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 border border-primary/25 text-[12px] font-bold text-primary active:scale-95 transition-transform"
        >
          <Copy className="h-3.5 w-3.5" /> Dupe
        </button>
      </div>
    </div>
  );
}

export const hideBase44Index = true;