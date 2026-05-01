import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Upload, CheckCircle, Users, Layers, Users2, History } from "lucide-react";
import ScheduleThisWeek from "@/components/schedule/ScheduleThisWeek";
import ScheduleUpload from "@/components/schedule/ScheduleUpload";
import ScheduleReviewImport from "@/components/schedule/ScheduleReviewImport";
import ScheduleCoverage from "@/components/schedule/ScheduleCoverage";
import ScheduleRoleMapping from "@/components/schedule/ScheduleRoleMapping";
import ScheduleEmployeeMapping from "@/components/schedule/ScheduleEmployeeMapping";
import ScheduleImportHistory from "@/components/schedule/ScheduleImportHistory";

export default function ScheduleCenter() {
  const [activeTab, setActiveTab] = useState("this-week");
  const [shifts, setShifts] = useState([]);
  const [pendingShifts, setPendingShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get current week's Monday
  const getWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const weekStart = getWeekStart();

  useEffect(() => {
    const load = async () => {
      try {
        const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const [published, drafts] = await Promise.all([
          base44.entities.StaffShift.filter({ status: "published" }).catch(() => []),
          base44.entities.StaffShift.filter({ status: "needs_review" }).catch(() => []),
        ]);

        const filteredPublished = published.filter(s => s.date >= weekStart && s.date <= weekEnd);

        setShifts(filteredPublished || []);
        setPendingShifts(drafts || []);
      } catch (error) {
        console.error("Error loading schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [weekStart, refreshKey]);

  const handleUploadComplete = () => {
    setRefreshKey(k => k + 1);
    setActiveTab("review");
  };

  const handlePublish = () => {
    setRefreshKey(k => k + 1);
    setActiveTab("this-week");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight flex items-center gap-3">
          <Calendar className="h-10 w-10 text-primary" />
          Schedule Center
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage weekly staff schedules separately from the Operations Calendar.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto">
          <TabsTrigger value="this-week" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">This Week</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2 relative">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Review</span>
            {pendingShifts.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingShifts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="coverage" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Coverage</span>
          </TabsTrigger>
          <TabsTrigger value="role-mapping" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="employee-mapping" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            <span className="hidden sm:inline">Employees</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="this-week" className="space-y-4">
          <ScheduleThisWeek weekStart={weekStart} shifts={shifts} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <ScheduleUpload onComplete={handleUploadComplete} />
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <ScheduleReviewImport pendingShifts={pendingShifts} onPublish={handlePublish} />
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <ScheduleCoverage weekStart={weekStart} shifts={shifts} />
        </TabsContent>

        <TabsContent value="role-mapping" className="space-y-4">
          <ScheduleRoleMapping />
        </TabsContent>

        <TabsContent value="employee-mapping" className="space-y-4">
          <ScheduleEmployeeMapping />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ScheduleImportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const hideBase44Index = true;