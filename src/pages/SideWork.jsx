import { useCurrentUser } from "../hooks/useCurrentUser";
import SideWorkManager from "./SideWorkManager";
import SideWorkStaff from "./SideWorkStaff";

export default function SideWork() {
  const { isAdmin, loading } = useCurrentUser();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return isAdmin ? <SideWorkManager /> : <SideWorkStaff />;
}

export const hideBase44Index = true;