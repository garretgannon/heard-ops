import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { 
  LayoutTemplate, Users, Calendar, Clock, 
  Layers, Zap, User, HelpCircle,
  ChevronRight, Settings, Cog
} from "lucide-react";
import StandardPageShell from "@/components/StandardPageShell";

function MenuItem({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 active:scale-95 transition-all duration-200 w-full text-left"
    >
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 stroke-[1.5] text-secondary-text" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-secondary-text mt-0.5">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 stroke-[1.5] text-secondary-text shrink-0" />
    </button>
  );
}

function SectionLabel({ label }) {
  return (
    <div className="mt-5 mb-3 first:mt-0">
      <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">{label}</p>
    </div>
  );
}

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const manageItems = [
    {
      title: "Templates",
      description: "Manage prep, cleaning & task templates",
      icon: LayoutTemplate,
      onClick: () => navigate("/templates"),
    },
    {
      title: "Team",
      description: "Manage staff & roles",
      icon: Users,
      onClick: () => navigate(isAdmin ? "/restaurant-team" : "/profile"),
    },
    {
      title: "Schedule",
      description: "View & manage shift schedule",
      icon: Calendar,
      onClick: () => navigate("/schedule-center"),
    },
    {
      title: "Time Clock",
      description: "Clock in/out & hours",
      icon: Clock,
      onClick: () => navigate("/cash"),
    },
  ];

  const settingsItems = [
    {
      title: "Restaurant Settings",
      description: "Business info & preferences",
      icon: Cog,
      onClick: () => navigate(isAdmin ? "/my-restaurant" : "/profile"),
    },
    {
      title: "Tasks & Categories",
      description: "Configure task types",
      icon: Layers,
      onClick: () => navigate("/standards"),
    },
    {
      title: "Integrations",
      description: "Connect external services",
      icon: Zap,
      onClick: () => navigate("/my-restaurant"),
    },
    {
      title: "My Account",
      description: "Profile & preferences",
      icon: User,
      onClick: () => navigate("/profile"),
    },
    {
      title: "Help & Support",
      description: "Documentation & guides",
      icon: HelpCircle,
      onClick: () => navigate("/knowledge"),
    },
  ];

  return (
    <StandardPageShell title="More">

      <div>
        <SectionLabel label="Manage" />
        <div className="space-y-2">
          {manageItems.map(item => (
            <MenuItem
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={item.onClick}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionLabel label="Settings" />
        <div className="space-y-2">
          {settingsItems.map(item => (
            <MenuItem
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={item.onClick}
            />
          ))}
        </div>
      </div>
    </StandardPageShell>
  );
}

export const hideBase44Index = true;