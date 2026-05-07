import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { useUnifiedState } from "@/lib/UnifiedStateContext";

export default function Shift() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { setActiveTab } = useUnifiedState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab("/shift");
    // Redirect to StaffTasks which handles execution mode
    // This page acts as a bridge/container for shift execution UI
    navigate("/tasks", { replace: true });
  }, [navigate, setActiveTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return null;
}

export const hideBase44Index = true;