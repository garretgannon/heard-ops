import { useState, useRef } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    shifts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          employee_name: { type: "string" },
          date: { type: "string", description: "ISO date YYYY-MM-DD" },
          start_time: { type: "string", description: "e.g. 9:00 AM or 09:00" },
          end_time: { type: "string", description: "e.g. 5:00 PM or 17:00" },
          role: { type: "string" },
          department: { type: "string" },
          station: { type: "string" },
          notes: { type: "string" }
        }
      }
    }
  }
};

export default function R365UploadStep({ onComplete }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "pdf" && file.type !== "application/pdf") {
      setError("R365 only exports PDF files. Please upload a .pdf schedule export.");
      return;
    }
    setError("");
    setFileName(file.name);
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: EXTRACT_SCHEMA
    });
    setLoading(false);
    if (result.status !== "success" || !result.output?.shifts?.length) {
      setError("Could not detect shift data in this PDF. Make sure it is an R365 schedule export.");
      return;
    }
    onComplete(result.output.shifts);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        <input ref={inputRef} type="file" accept=".pdf" className="ops-input hidden" onChange={(e) => handleFile(e.target.files[0])} />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Parsing R365 schedule...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold text-foreground">Drop your R365 PDF export here</p>
              <p className="text-sm text-muted-foreground mt-1">PDF only (.pdf)</p>
            </div>
            {fileName && <p className="text-xs text-primary font-medium flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{fileName}</p>}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">How to export from R365:</p>
        <p>Scheduling → Weekly Schedule → Print/Export → Save as PDF</p>
      </div>
    </div>
  );
}