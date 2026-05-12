import { useNavigate } from 'react-router-dom';
import { BookOpen, Utensils } from 'lucide-react';

export default function RecipesAndBuildCards() {
  const navigate = useNavigate();
  return (
    <div className="pb-24 px-4 py-6 space-y-3">
      <h1 className="text-2xl font-black tracking-tight text-foreground mb-1">Recipes &amp; Build Cards</h1>
      <p className="text-xs text-muted-foreground mb-4">Kitchen production references and menu specs.</p>
      <button onClick={() => navigate('/recipes')} className="w-full flex items-center gap-3 card-glass border border-border rounded-xl p-4 active:scale-[0.99] transition-all">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-foreground">Recipes</p>
          <p className="text-xs text-muted-foreground">Kitchen production, prep methods, batch instructions</p>
        </div>
      </button>
      <button onClick={() => navigate('/build-cards')} className="w-full flex items-center gap-3 card-glass border border-border rounded-xl p-4 active:scale-[0.99] transition-all">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Utensils className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-foreground">Build Cards</p>
          <p className="text-xs text-muted-foreground">Menu specs, plating guides, modifiers, service execution</p>
        </div>
      </button>
    </div>
  );
}
export const hideBase44Index = true;