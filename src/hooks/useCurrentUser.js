import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === "admin";
  const FOH_ROLES = ["server", "bartender", "host", "busser", "food_runner", "expo"];
  const isFOH = isAdmin || FOH_ROLES.includes(user?.role);
  return { user, loading, isAdmin, isFOH };
}