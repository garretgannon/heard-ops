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
  { task_name: "Roll silverware (50 sets)", role: "server", shift_type: "opening", priority: "high", due_time: "10:30", requires_photo: false, requires_approval: false },
  { task_name: "Fill all salt & pepper shakers", role: "server", shift_type: "opening", priority: "medium", due_time: "10:45", requires_photo: false, requires_approval: false },
  { task_name: "Stock server station with napkins", role: "server", shift_type: "opening", priority: "medium", due_time: "10:45", requires_photo: false, requires_approval: false },
  { task_name: "Wipe down all menus", role: "server", shift_type: "opening", priority: "low", due_time: "11:00", requires_photo: false, requires_approval: false },
  { task_name: "Roll silverware (50 sets)", role: "server", shift_type: "closing", priority: "high", due_time: "22:00", requires_photo: false, requires_approval: false },
  { task_name: "Wipe down all booths and chairs", role: "server", shift_type: "closing", priority: "high", due_time: "22:15", requires_photo: true, requires_approval: true },
  { task_name: "Restock condiments and sugars", role: "server", shift_type: "closing", priority: "medium", due_time: "22:00", requires_photo: false, requires_approval: false },
  { task_name: "Cut garnishes (lemons, limes, oranges)", role: "bartender", shift_type: "opening", priority: "high", due_time: "11:00", requires_photo: true, requires_approval: false },
  { task_name: "Stock beer cooler", role: "bartender", shift_type: "opening", priority: "high", due_time: "10:45", requires_photo: false, requires_approval: false },
  { task_name: "Wipe down bar top and stools", role: "bartender", shift_type: "opening", priority: "medium", due_time: "11:00", requires_photo: true, requires_approval: false },
  { task_name: "Drain and clean blenders", role: "bartender", shift_type: "closing", priority: "high", due_time: "23:00", requires_photo: true, requires_approval: true },
  { task_name: "Restock liquor bottles from back bar", role: "bartender", shift_type: "closing", priority: "medium", due_time: "23:00", requires_photo: false, requires_approval: false },
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

const DEMO_MAINTENANCE = [
  { title: "Ice machine leaking", description: "Water pooling under ice machine near bar", priority: "high", status: "open", location: "Bar", reported_by: "Manager" },
  { title: "Walk-in cooler door seal worn", description: "Door gasket is torn — cooler losing temp", priority: "high", status: "open", location: "BOH", reported_by: "Chef" },
  { title: "Table 12 wobbly leg", description: "Guest reported table rocking", priority: "low", status: "open", location: "Dining Room", reported_by: "Server" },
];

const DEMO_HANDOFFS = [
  { shift: "evening", urgency: "high", department: "BOH", logged_by: "Chef Marco", items_86d: "Salmon, Ribeye", maintenance_problems: "Ice machine leak getting worse", prep_concerns: "Need more caesar dressing tomorrow AM", notes_for_next_manager: "Vendor delivery pushed to 8am — someone needs to be here" },
  { shift: "morning", urgency: "medium", department: "FOH", logged_by: "AM Manager", guest_issues: "Table 7 comp — wrong order", staff_issues: "One server called out late", notes_for_next_manager: "Large party of 20 booked at 7pm — prep accordingly" },
];

const DEMO_MANAGER_LOGS = [
  { note: "Dinner rush went smoothly. 86'd salmon at 7pm. Vendor confirmed restock tomorrow.", shift: "evening" },
  { note: "Alex arrived 20 min late — had a conversation, documented.", shift: "morning" },
  { note: "Called plumber re: ice machine. Coming Thursday between 10-12.", shift: "afternoon" },
];

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

    setStatus("Adding maintenance requests...");
    for (const req of DEMO_MAINTENANCE) {
      await base44.entities.MaintenanceRequest.create({ ...req, date: today });
    }

    setStatus("Adding shift handoffs...");
    for (const handoff of DEMO_HANDOFFS) {
      await base44.entities.ShiftHandoff.create({ ...handoff, date: today });
    }

    setStatus("Adding manager logs...");
    for (const log of DEMO_MANAGER_LOGS) {
      await base44.entities.ManagerLog.create({ ...log, date: today });
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
          <h1 className="text-3xl font-bold tracking-tight">Welcome to <span className="text-primary">heardOS</span></h1>
          <p className="mt-2 text-muted-foreground">
            Run restaurants better.
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
            Loads sample data: prep, side work, temp logs, maintenance, vendors, cash, incidents, schedules, training, and handoffs.
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