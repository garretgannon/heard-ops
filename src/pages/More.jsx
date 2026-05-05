import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  LayoutTemplate,
  Users,
  Calendar,
  Clock,
  Cog,
  Tag,
  Zap,
  User,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { haptics } from "@/utils/haptics";
import MoreHeader from "@/components/MoreHeader";

function MenuItem({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={() => {
        haptics.light();
        onClick?.();
      }}
      className="w-full text-left bg-card border border-border rounded-lg p-3 flex items-center gap-3 active:scale-95 transition-all duration-100 hover:bg-muted"
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
      onClick: () => navigate("/restaurant-team"),
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
      onClick: () => navigate("/time-clock"),
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
      title: "Tags & Categories",
      description: "Configure task types & labels",
      icon: Tag,
      onClick: () => navigate("/standards"),
    },
    {
      title: "Integrations",
      description: "Connect external services",
      icon: Zap,
      onClick: () => navigate("/integrations"),
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
    <div className="pb-24">
      <MoreHeader onSettings={() => navigate("/settings")} />

      <div className="px-4 py-4 space-y-6">
        {/* Manage Section */}
        <div>
          <SectionLabel label="Manage" />
          <div className="space-y-2">
            {manageItems.map((item) => (
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

        {/* Settings Section */}
        <div>
          <SectionLabel label="Settings" />
          <div className="space-y-2">
            {settingsItems.map((item) => (
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
      </div>
    </div>
  );
}

export const hideBase44Index = true;