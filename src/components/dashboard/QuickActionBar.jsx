import { Plus, AlertCircle, Camera, Users, Wrench, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function QuickActionBar({ isAdmin }) {
  const actions = [
    { icon: Plus, label: "Add Task", path: "/side-work", color: "bg-primary" },
    { icon: AlertCircle, label: "Log Issue", path: "/incidents", color: "bg-red-500" },
    { icon: Camera, label: "Photos", path: "/photo-review", color: "bg-purple-500" },
    { icon: Users, label: "Pre-Shift", path: "/pre-shift", color: "bg-blue-500" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 lg:gap-3 mt-6">
      {actions.map((action, idx) => (
        <Link key={idx} to={action.path} className="block">
          <Button
            size="sm"
            className={`w-full h-20 flex flex-col items-center justify-center gap-1 ${action.color} hover:opacity-90`}
            variant="default"
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs font-bold text-center">{action.label}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}