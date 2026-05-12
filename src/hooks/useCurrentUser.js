import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchUser();
    // Re-fetch when window regains focus (catches post-login redirects)
    window.addEventListener('focus', fetchUser);
    return () => window.removeEventListener('focus', fetchUser);
  }, [fetchUser]);

  const isAdmin = !user?.role || user?.role === "admin" || !!user?.collaborator_role;
  const FOH_ROLES = ["server", "bartender", "host", "busser", "food_runner", "expo"];
  const isFOH = isAdmin || FOH_ROLES.includes(user?.role);
  return { user, loading, isAdmin, isFOH };
}