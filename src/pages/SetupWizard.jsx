import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEMO_STATIONS = [
  { name: "Sauté", color: "red", is_active: true, sort_order: 1 },
  { name: "Grill", color: "orange", is_active: true, sort_order: 2 },
  { name: "Fry", color: "yellow", is_active: true, sort_order: 3 },
  { name: "Pantry", color: "green", is_active: true, sort_order: 4 },
  { name: "Expo", color: "blue", is_active: true, sort_order: 5 },
  { name: "Bar", color: "purple", is_active: true, sort_order: 6 },
];

export default function SetupWizard({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const markComplete = async () => {
    await base44.entities.Settings.create({ key: "onboarding_complete", value: "true" });
    await base44.entities.Settings.create({ key: "restaurant_name", value: "My Restaurant" });
  };

  const handleDemo = async () => {
    setLoading(true);
    await markComplete();
    // Create demo stations
    for (const station of DEMO_STATIONS) {
      await base44.entities.Station.create(station);
    }
    // Create a sample prep list for today
    const today = new Date().toISOString().split("T")[0];
    const list = await base44.entities.PrepList.create({
      name: "Demo Prep List",
      date: today,
      station_id: "demo",
      station_name: "Sauté",
      status: "active",
    });
    onComplete();
  };

  const handleSkip = async () => {
    setLoading(true);
    await markComplete();
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
            <ChefHat className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Heard Ops</h1>
          <p className="mt-2 text-muted-foreground">
            The daily operating system for your restaurant. Let's get you set up.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full gap-2 h-14 text-base"
            onClick={handleDemo}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            Set Up Demo Restaurant
          </Button>
          <p className="text-xs text-muted-foreground">
            Loads sample stations and data so you can explore the app right away.
          </p>

          <Button
            variant="ghost"
            className="w-full gap-2"
            onClick={handleSkip}
            disabled={loading}
          >
            Start Fresh <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}