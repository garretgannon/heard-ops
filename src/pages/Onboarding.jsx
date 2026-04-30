import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight, BookOpen, Video,
  FileText, Award, ArrowRight, Users, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLES = ["server", "bartender", "busser", "host", "cook", "dishwasher", "manager"];

const DEFAULT_ITEMS = {
  server: [
    { id: "handbook", title: "Employee Handbook", type: "reading" },
    { id: "pos", title: "POS System Training", type: "video" },
    { id: "menu", title: "Menu Knowledge", type: "reading" },
    { id: "buildbook", title: "Build Book Review", type: "reading" },
    { id: "service", title: "Service Standards", type: "video" },
    { id: "safety", title: "Safety & Health", type: "quiz" },
    { id: "ack", title: "Training Acknowledgement", type: "acknowledgement" },
  ],
  bartender: [
    { id: "handbook", title: "Employee Handbook", type: "reading" },
    { id: "barbook", title: "Bar Book Mastery", type: "reading" },
    { id: "cocktails", title: "Cocktail Training", type: "video" },
    { id: "spirits", title: "Spirits & Liqueurs", type: "reading" },
    { id: "safety", title: "Safety & Health", type: "quiz" },
    { id: "ack", title: "Training Acknowledgement", type: "acknowledgement" },
  ],
  busser: [
    { id: "handbook", title: "Employee Handbook", type: "reading" },
    { id: "standards", title: "Service Standards", type: "video" },
    { id: "cleaning", title: "Cleaning & Sanitation", type: "reading" },
    { id: "safety", title: "Safety & Health", type: "quiz" },
    { id: "ack", title: "Training Acknowledgement", type: "acknowledgement" },
  ],
  host: [
    { id: "handbook", title: "Employee Handbook", type: "reading" },
    { id: "seating", title: "Seating Procedures", type: "video" },
    { id: "reservations", title: "Reservation System", type: "reading" },
    { id: "safety", title: "Safety & Health", type: "quiz" },
    { id: "ack", title: "Training Acknowledgement", type: "acknowledgement" },
  ],
  cook: [
    { id: "handbook", title: "Employee Handbook", type: "reading" },
    { id: "buildbook", title: "Build Book Review", type: "reading" },
    { id: "prep", title: "Prep Procedures", type: "video" },
    { id: "stations", title: "Station Setup", type: "reading" },
    { id: "safety", title: "Safety & Health", type: "quiz" },
    { id: "ack", title: "Training Acknowledgement", type: "acknowledgement" },
  ],
  dishwasher: [
    { id: "handbook", title: "Employee Handbook", type: "reading" },
    { id: "cleaning", title: "Cleaning & Sanitation", type: "reading" },
    { id: "safety", title: "Safety & Health", type: "quiz" },
    { id: "ack", title: "Training Acknowledgement", type: "acknowledgement" },
  ],
  manager: [
    { id: "handbook", title: "Employee Handbook", type: "reading" },
    { id: "policies", title: "Management Policies", type: "reading" },
    { id: "payroll", title: "Payroll & HR", type: "video" },
    { id: "leadership", title: "Leadership Training", type: "video" },
    { id: "safety", title: "Safety & Health", type: "quiz" },
    { id: "ack", title: "Training Acknowledgement", type: "acknowledgement" },
  ],
};

const TYPE_ICONS = {
  reading: FileText,
  video: Video,
  quiz: Award,
  acknowledgement: CheckCircle2,
  handbook: BookOpen,
};

export default function Onboarding() {
  const { user, isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [onboardings, setOnboardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      if (isAdmin) {
        // Show all onboardings
        const all = await base44.entities.OnboardingItem.list("-created_date");
        setOnboardings(all);
      } else {
        // Show only current user's onboarding
        const myOnboarding = await base44.entities.OnboardingItem.filter({
          employee_email: user.email,
        });
        setOnboardings(myOnboarding);
      }
      setLoading(false);
    };
    load();
  }, [user, isAdmin]);

  const filteredOnboardings = filterRole === "all" 
    ? onboardings 
    : onboardings.filter(o => o.role === filterRole);

  const handleToggleItem = async (onboardingId, itemId) => {
    setSaving(onboardingId);
    const onboarding = onboardings.find(o => o.id === onboardingId);
    const updatedItems = onboarding.items.map(i =>
      i.id === itemId
        ? { ...i, completed: !i.completed, completed_at: !i.completed ? new Date().toISOString() : null }
        : i
    );
    const completed = updatedItems.filter(i => i.completed).length;
    const progress = Math.round((completed / updatedItems.length) * 100);

    await base44.entities.OnboardingItem.update(onboardingId, {
      items: updatedItems,
      progress_percentage: progress,
      status: progress === 100 ? "completed" : "in_progress",
    });

    const updated = await base44.entities.OnboardingItem.list("-created_date");
    setOnboardings(updated);
    setSaving(null);
    toast.success("Item updated");
  };

  const handleManagerSignOff = async (onboardingId) => {
    setSaving(onboardingId);
    await base44.entities.OnboardingItem.update(onboardingId, {
      manager_email: user?.email,
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    const updated = await base44.entities.OnboardingItem.list("-created_date");
    setOnboardings(updated);
    setSaving(null);
    toast.success("Signed off");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Award className="h-7 w-7 text-primary" /> 
            {isAdmin ? "Team Onboarding" : "Your Onboarding"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isAdmin ? "Track new hire training progress" : "Complete your training checklist"}
          </p>
        </div>
      </div>

      {/* Filter (admin only) */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map(r => (
                <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Onboarding Cards */}
      <div className="grid gap-4">
        {filteredOnboardings.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              {isAdmin ? "No onboardings yet" : "No onboarding assigned"}
            </p>
          </div>
        ) : (
          filteredOnboardings.map(onboarding => {
            const completed = onboarding.items?.filter(i => i.completed).length || 0;
            const total = onboarding.items?.length || 0;
            const isExpanded = expandedId === onboarding.id;

            return (
              <div
                key={onboarding.id}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : onboarding.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div>
                      <h3 className="font-semibold capitalize">
                        {onboarding.employee_name || onboarding.employee_email}
                      </h3>
                      <p className="text-xs text-muted-foreground capitalize">{onboarding.role}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{onboarding.progress_percentage || 0}%</p>
                      <p className="text-xs text-muted-foreground">{completed}/{total} done</p>
                    </div>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${onboarding.progress_percentage || 0}%` }}
                      />
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </button>

                {/* Items (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {onboarding.items?.map(item => {
                      const IconComponent = TYPE_ICONS[item.type] || FileText;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "p-4 flex items-center gap-3",
                            item.completed && "bg-accent/5"
                          )}
                        >
                          <button
                            onClick={() => handleToggleItem(onboarding.id, item.id)}
                            className="flex-shrink-0"
                            disabled={saving === onboarding.id}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-accent" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground/50 hover:text-primary transition" />
                            )}
                          </button>

                          <div className="flex-1">
                            <p className={cn("text-sm font-medium", item.completed && "line-through text-muted-foreground")}>
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize mt-0.5">{item.type}</p>
                          </div>

                          <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      );
                    })}

                    {/* Manager Sign-off (Admin) */}
                    {isAdmin && onboarding.progress_percentage === 100 && !onboarding.manager_email && (
                      <div className="p-4 bg-primary/10 border-t border-primary/30">
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => handleManagerSignOff(onboarding.id)}
                          disabled={saving === onboarding.id}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {saving === onboarding.id ? "Signing off..." : "Manager Sign-Off"}
                        </Button>
                      </div>
                    )}

                    {/* Completed Badge */}
                    {onboarding.manager_email && (
                      <div className="p-4 bg-accent/10 text-accent text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed by {onboarding.manager_email}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Links */}
      {!isAdmin && (
        <div className="grid grid-cols-2 gap-3 mt-8">
          <Button variant="outline" onClick={() => navigate("/build-book")} className="gap-2">
            <BookOpen className="h-4 w-4" /> Build Book
          </Button>
          <Button variant="outline" onClick={() => navigate("/bar-book")} className="gap-2">
            <BookOpen className="h-4 w-4" /> Bar Book
          </Button>
        </div>
      )}
    </motion.div>
  );
}