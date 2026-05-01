import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, ArrowRight, Loader2 } from "lucide-react";

const DEMO_STATIONS = [
  { name: "Sauté", color: "red", is_active: true, sort_order: 1 },
  { name: "Grill", color: "orange", is_active: true, sort_order: 2 },
  { name: "Fry", color: "yellow", is_active: true, sort_order: 3 },
  { name: "Pantry", color: "green", is_active: true, sort_order: 4 },
  { name: "Expo", color: "blue", is_active: true, sort_order: 5 },
  { name: "Bar", color: "purple", is_active: true, sort_order: 6 },
];

const SIDE_WORK_TASKS = [
  // Server opening
  { task_name: "Roll silverware (50 sets)", role: "server", shift_type: "opening", priority: "high", due_time: "10:30", requires_photo: false, requires_approval: false },
  { task_name: "Fill all salt & pepper shakers", role: "server", shift_type: "opening", priority: "medium", due_time: "10:45", requires_photo: false, requires_approval: false },
  { task_name: "Stock server station with napkins", role: "server", shift_type: "opening", priority: "medium", due_time: "10:45", requires_photo: false, requires_approval: false },
  { task_name: "Wipe down all menus", role: "server", shift_type: "opening", priority: "low", due_time: "11:00", requires_photo: false, requires_approval: false },
  // Server closing
  { task_name: "Roll silverware (50 sets)", role: "server", shift_type: "closing", priority: "high", due_time: "22:00", requires_photo: false, requires_approval: false },
  { task_name: "Wipe down all booths and chairs", role: "server", shift_type: "closing", priority: "high", due_time: "22:15", requires_photo: true, requires_approval: true },
  { task_name: "Restock condiments and sugars", role: "server", shift_type: "closing", priority: "medium", due_time: "22:00", requires_photo: false, requires_approval: false },
  // Bartender opening
  { task_name: "Cut garnishes (lemons, limes, oranges)", role: "bartender", shift_type: "opening", priority: "high", due_time: "11:00", requires_photo: true, requires_approval: false },
  { task_name: "Stock beer cooler", role: "bartender", shift_type: "opening", priority: "high", due_time: "10:45", requires_photo: false, requires_approval: false },
  { task_name: "Wipe down bar top and stools", role: "bartender", shift_type: "opening", priority: "medium", due_time: "11:00", requires_photo: true, requires_approval: false },
  // Bartender closing
  { task_name: "Drain and clean blenders", role: "bartender", shift_type: "closing", priority: "high", due_time: "23:00", requires_photo: true, requires_approval: true },
  { task_name: "Restock liquor bottles from back bar", role: "bartender", shift_type: "closing", priority: "medium", due_time: "23:00", requires_photo: false, requires_approval: false },
  // Busser
  { task_name: "Sweep dining room floor", role: "busser", shift_type: "closing", priority: "high", due_time: "22:30", requires_photo: true, requires_approval: true },
  { task_name: "Clean and sanitize high chairs", role: "busser", shift_type: "closing", priority: "medium", due_time: "22:00", requires_photo: false, requires_approval: false },
  { task_name: "Restock to-go containers at expo", role: "busser", shift_type: "opening", priority: "medium", due_time: "11:00", requires_photo: false, requires_approval: false },
];

const PREP_ITEMS_BY_STATION = {
  "Sauté": [
    { name: "Roasted garlic (2 qt)", priority: "high", quantity: "2", unit: "qt" },
    { name: "Compound butter — herb", priority: "high", quantity: "3", unit: "lbs" },
    { name: "Demi-glace reduction", priority: "medium", quantity: "1", unit: "qt" },
    { name: "Sautéed mushrooms", priority: "medium", quantity: "2", unit: "lbs" },
    { name: "Caramelized onions", priority: "low", quantity: "1", unit: "qt" },
  ],
  "Grill": [
    { name: "Marinate chicken thighs", priority: "high", quantity: "10", unit: "lbs" },
    { name: "Portion ribeye steaks (12 oz)", priority: "high", quantity: "20", unit: "pcs" },
    { name: "Season and portion salmon", priority: "medium", quantity: "8", unit: "pcs" },
    { name: "Grill vegetables — zucchini, peppers", priority: "medium", quantity: "3", unit: "lbs" },
  ],
  "Fry": [
    { name: "Bread chicken tenders", priority: "high", quantity: "8", unit: "lbs" },
    { name: "Portion fries into baskets", priority: "high", quantity: "30", unit: "svgs" },
    { name: "Fry oil quality check & filter", priority: "medium", quantity: "1", unit: "each" },
    { name: "Bread calamari", priority: "low", quantity: "3", unit: "lbs" },
  ],
  "Pantry": [
    { name: "Caesar dressing (fresh batch)", priority: "high", quantity: "2", unit: "qt" },
    { name: "Chop romaine for Caesar", priority: "high", quantity: "5", unit: "lbs" },
    { name: "Portion side salads (10)", priority: "medium", quantity: "10", unit: "pcs" },
    { name: "Slice tomatoes and onions", priority: "medium", quantity: "2", unit: "lbs" },
    { name: "Avocado — slice and portion", priority: "high", quantity: "12", unit: "pcs" },
  ],
  "Bar": [
    { name: "Simple syrup (2 batches)", priority: "high", quantity: "2", unit: "qt" },
    { name: "Fresh squeeze lemon juice", priority: "high", quantity: "1", unit: "qt" },
    { name: "Fresh squeeze lime juice", priority: "high", quantity: "1", unit: "qt" },
    { name: "Batch margarita mix", priority: "medium", quantity: "1", unit: "gal" },
    { name: "Garnish tray — citrus, olives, cherries", priority: "medium", quantity: "1", unit: "tray" },
  ],
};

export default function SetupWizard({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const markComplete = async () => {
    await base44.entities.Settings.create({ key: "onboarding_complete", value: "true" });
    await base44.entities.Settings.create({ key: "restaurant_name", value: "Demo Restaurant" });
  };

  const handleDemo = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    setStatus("Creating stations...");
    const stationMap = {};
    for (const station of DEMO_STATIONS) {
      const created = await base44.entities.Station.create(station);
      stationMap[station.name] = created.id;
    }

    setStatus("Building prep lists...");
    for (const [stationName, items] of Object.entries(PREP_ITEMS_BY_STATION)) {
      const stationId = stationMap[stationName];
      if (!stationId) continue;
      const list = await base44.entities.PrepList.create({
        name: `${stationName} Prep — ${today}`,
        date: today,
        station_id: stationId,
        station_name: stationName,
        status: "active",
        due_time: "15:00",
      });
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await base44.entities.PrepItem.create({
          ...item,
          prep_list_id: list.id,
          station_id: stationId,
          status: i < 2 ? "completed" : "pending",
          sort_order: i,
        });
      }
    }

    setStatus("Adding side work tasks...");
    for (let i = 0; i < SIDE_WORK_TASKS.length; i++) {
      const task = SIDE_WORK_TASKS[i];
      await base44.entities.SideWorkAssignment.create({
        ...task,
        date: today,
        status: i % 4 === 0 ? "completed" : "pending",
      });
    }

    setStatus("Finishing up...");
    await markComplete();
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
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Heard <span className="text-primary">Ops</span></h1>
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
            {loading ? status || "Setting up..." : "Set Up Demo Restaurant"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Loads sample prep lists, side work tasks, and stations so you can explore the app right away.
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