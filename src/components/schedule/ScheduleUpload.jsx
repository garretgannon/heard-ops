import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";

export default function ScheduleUpload({ onComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const valid = ["application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(selected.type);
      if (!valid) {
        setError("Please upload a PDF, CSV, or Excel file");
        return;
      }
      setFile(selected);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Extract schedule data from file
      const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            shifts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  employee_name: { type: "string" },
                  date: { type: "string" },
                  start_time: { type: "string" },
                  end_time: { type: "string" },
                  role: { type: "string" },
                  department: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extraction.status === "success" && extraction.output?.shifts) {
        // Save as drafts for review
        for (const shift of extraction.output.shifts) {
          await base44.entities.StaffShift.create({
            ...shift,
            status: "needs_review",
            source_file: file.name,
            import_date: new Date().toISOString(),
          });
        }
        onComplete();
      } else {
        setError("Could not parse schedule file. Please check format.");
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card-glass border border-border rounded-xl p-8">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Upload Weekly Schedule</h3>
            <p className="text-sm text-muted-foreground">PDF, CSV, or Excel format</p>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.csv,.xls,.xlsx"
              className="hidden"
              id="schedule-upload"
              disabled={loading}
            />
            <label htmlFor="schedule-upload" className="block cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">Drag and drop your schedule file</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload and Parse Schedule
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="card-glass border border-border rounded-xl p-6 space-y-4">
        <h4 className="font-semibold">What we will detect:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✓ Employee names</li>
          <li>✓ Shift dates and times</li>
          <li>✓ Job roles and departments</li>
          <li>✓ Station assignments</li>
          <li>✓ Shift types (Opening, Mid, Closing, etc.)</li>
          <li>✓ Any notes or special instructions</li>
        </ul>
      </div>
    </div>
  );
}