import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = () => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Only resolve isAdmin once we have a user; return undefined while loading to prevent premature effects
  const isAdmin = loading ? undefined : (!user?.role || user?.role === "admin" || !!user?.collaborator_role);
  const FOH_ROLES = ["server", "bartender", "host", "busser", "food_runner", "expo"];
  const isFOH = isAdmin || FOH_ROLES.includes(user?.role);
  return { user, loading, isAdmin, isFOH };
}