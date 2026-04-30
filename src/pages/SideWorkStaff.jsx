import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, ChevronDown, Upload, Flag, Check } from "lucide-react";
import { toast } from "sonner";

export default function SideWorkStaff() {
  const { user } = useCurrentUser();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState({});
  const [completingTask, setCompletingTask] = useState({});
  const [reportingProblem, setReportingProblem] = useState({});

  const todayStr = new Date().toISOString().split("T")[0];

  const load = async () => {
    const data = await base44.entities.SideWorkAssignment.filter({ date: todayStr });
    setAssignments(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Only show tasks assigned to this user
  const myAssignments = assignments.filter(a => {
    if (a.assigned_to_individual && a.assigned_to_email === user?.email) return true;
    if (a.role_assignment === user?.role && !a.assigned_to_individual) return true;
    if (!a.role_assignment && !a.assigned_to_individual) return true;
    return false;
  });

  const pending = myAssignments.filter(a => a.status === "pending" || a.status === "rejected");
  const inReview = myAssignments.filter(a => a.status === "completed");
  const approved = myAssignments.filter(a => a.status === "approved");

  const handleCompleteTask = async (id) => {
    setCompletingTask(prev => ({ ...prev, [id]: true }));
    await base44.entities.SideWorkAssignment.update(id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: user?.email,
    });
    toast.success("Task marked complete");
    setCompletingTask(prev => ({ ...prev, [id]: false }));
    load();
  };

  const handleUploadPhoto = async (id, file) => {
    if (!file) return;
    setUploadingPhoto(prev => ({ ...prev, [id]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.SideWorkAssignment.update(id, { photo_url: file_url });
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Photo upload failed");
    }
    setUploadingPhoto(prev => ({ ...prev, [id]: false }));
  };

  const handleReportProblem = async (id) => {
    setReportingProblem(prev => ({ ...prev, [id]: true }));
    await base44.entities.SideWorkAssignment.update(id, {
      status: "rejected",
      rejection_notes: "Staff reported issue - needs reassignment",
    });
    toast.success("Problem reported to manager");
    setReportingProblem(prev => ({ ...prev, [id]: false }));
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (myAssignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 mb-3" />
        <p className="text-lg font-semibold">All set!</p>
        <p className="text-muted-foreground">No side work tasks assigned for today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">{todayStr}</p>
      </div>

      {/* Quick Stats */}
      {pending.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm font-semibold text-red-700">⏳ {pending.length} task{pending.length > 1 ? "s" : ""} to complete</p>
        </div>
      )}

      {/* Pending Tasks (Large Cards) */}
      <div className="space-y-3">
        {pending.map(a => (
          <div key={a.id} className="bg-card border-2 border-primary/30 rounded-xl p-4">
            {/* Task Name & Status */}
            <h3 className="font-bold text-lg mb-1">{a.task_name}</h3>
            {a.status === "rejected" && (
              <p className="text-xs text-red-600 mb-2 font-semibold">↻ Needs redo</p>
            )}

            {/* Details */}
            <div className="space-y-1 mb-3 text-sm">
              {a.description && <p className="text-muted-foreground">{a.description}</p>}
              {a.due_time && <p className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Due: {a.due_time}</p>}
              {a.requires_photo && <p className="text-primary text-xs font-semibold">📷 Photo required</p>}
            </div>

            {/* Completion Notes (if rejected) */}
            {a.rejection_notes && (
              <div className="bg-red-500/5 border border-red-500/20 rounded p-2 mb-3">
                <p className="text-xs text-red-700"><strong>Why it was rejected:</strong> {a.rejection_notes}</p>
              </div>
            )}

            {/* Action Buttons - Large Mobile Friendly */}
            <div className="space-y-2">
              {/* Photo Upload */}
              {a.requires_photo && !a.photo_url && (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleUploadPhoto(a.id, e.target.files[0])}
                    className="hidden"
                  />
                  <Button
                    className="w-full h-12 text-base"
                    variant="outline"
                    disabled={uploadingPhoto[a.id]}
                    onClick={e => e.currentTarget.previousElementSibling.click()}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    {uploadingPhoto[a.id] ? "Uploading..." : "Upload Photo"}
                  </Button>
                </label>
              )}
              {a.photo_url && (
                <div className="text-xs text-green-600 font-semibold">✓ Photo uploaded</div>
              )}

              {/* Complete Task */}
              <Button
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                disabled={completingTask[a.id]}
                onClick={() => handleCompleteTask(a.id)}
              >
                <Check className="h-5 w-5 mr-2" />
                {completingTask[a.id] ? "Submitting..." : "Complete Task"}
              </Button>

              {/* Report Problem */}
              <Button
                className="w-full h-12 text-base"
                variant="outline"
                disabled={reportingProblem[a.id]}
                onClick={() => handleReportProblem(a.id)}
              >
                <Flag className="h-5 w-5 mr-2" />
                {reportingProblem[a.id] ? "Reporting..." : "Report Problem"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* In Review Tasks */}
      {inReview.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-yellow-700 mb-2">⏱️ {inReview.length} waiting for approval</p>
          <div className="space-y-2">
            {inReview.map(a => (
              <div key={a.id} className="bg-card rounded-lg p-3">
                <p className="font-semibold text-sm">{a.task_name}</p>
                <p className="text-xs text-muted-foreground">Submitted for review</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed (Collapsible) */}
      {approved.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full p-4 flex items-center justify-between bg-green-500/10 hover:bg-green-500/15 transition-colors"
          >
            <span className="font-semibold text-green-700">✓ {approved.length} Completed</span>
            <ChevronDown className={cn("h-5 w-5 transition-transform", showCompleted && "rotate-180")} />
          </button>
          {showCompleted && (
            <div className="divide-y divide-border p-4 space-y-2">
              {approved.map(a => (
                <div key={a.id} className="text-sm text-muted-foreground line-through py-1">
                  {a.task_name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}