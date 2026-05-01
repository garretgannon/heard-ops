import { useState } from "react";
import { Upload, Eye, Users, CheckSquare } from "lucide-react";
import UploadStep from "../components/schedule/UploadStep";
import PreviewStep from "../components/schedule/PreviewStep";
import MatchStep from "../components/schedule/MatchStep";
import PublishStep from "../components/schedule/PublishStep";
import { Link } from "react-router-dom";

const STEPS = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "match", label: "Match", icon: Users },
  { id: "publish", label: "Publish", icon: CheckSquare },
];

export default function ScheduleImport() {
  const [step, setStep] = useState(0);
  const [rawRows, setRawRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [enrichedRows, setEnrichedRows] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleParsed = (rows, name) => {
    setRawRows(rows);
    setFileName(name);
    setStep(1);
  };

  const handlePreview = (rows) => {
    setPreviewRows(rows);
    setStep(2);
  };

  const handleMatch = (rows) => {
    setEnrichedRows(rows);
    setStep(3);
  };

  const handleDone = () => {
    // stay on step 3 (done state shown inside PublishStep)
  };

  const reset = () => { setStep(0); setRawRows([]); setPreviewRows([]); setEnrichedRows([]); setFileName(""); };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Schedule Import</h1>
        <p className="text-muted-foreground mt-1">Upload your weekly staff schedule to auto-populate shifts, calendar events, and task assignments.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === i;
          const isDone = step > i;
          return (
            <div key={s.id} className="flex items-center min-w-0">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive ? "bg-primary text-primary-foreground" : isDone ? "text-green-500" : "text-muted-foreground"}`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-6 ${isDone ? "bg-green-500" : "bg-border"} shrink-0`} />}
            </div>
          );
        })}
        {step === 3 && (
          <button onClick={reset} className="ml-auto text-xs text-muted-foreground hover:text-primary underline shrink-0">Import another</button>
        )}
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-xl p-6">
        {step === 0 && <UploadStep onParsed={handleParsed} />}
        {step === 1 && <PreviewStep rows={rawRows} onNext={handlePreview} onBack={() => setStep(0)} />}
        {step === 2 && <MatchStep rows={previewRows} onNext={handleMatch} onBack={() => setStep(1)} />}
        {step === 3 && <PublishStep rows={enrichedRows} fileName={fileName} onBack={() => setStep(2)} onDone={handleDone} />}
      </div>

      {/* Help */}
      {step === 0 && (
        <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { title: "Staff Home", desc: "Each employee sees their upcoming shifts." },
            { title: "Command Center", desc: "Today's scheduled staff shown on the dashboard." },
            { title: "Operations Calendar", desc: "All shifts added as calendar events." },
          ].map(tip => (
            <div key={tip.title} className="p-4 bg-muted/20 rounded-xl border border-border">
              <p className="font-semibold">{tip.title}</p>
              <p className="text-muted-foreground mt-1">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}