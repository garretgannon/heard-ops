import { useState } from "react";
import { Upload, FileText, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import R365UploadStep from "@/components/schedule/R365UploadStep";
import MatchStep from "@/components/schedule/MatchStep";
import PreviewStep from "@/components/schedule/PreviewStep";
import PublishStep from "@/components/schedule/PublishStep";

const STEPS = [
  { label: "Upload", icon: Upload },
  { label: "Match", icon: FileText },
  { label: "Preview", icon: CheckCircle },
  { label: "Publish", icon: ArrowRight },
];

export default function R365ScheduleImport() {
  const [step, setStep] = useState(0);
  const [scheduleData, setScheduleData] = useState([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">R365 Schedule Import</h1>
        <p className="text-muted-foreground text-sm mt-1">Import your Restaurant365 schedule file to publish shifts across the app.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
              <s.icon className="h-4 w-4" />
              {s.label}
            </div>
            {i < STEPS.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-xl p-6">
        {step === 0 && (
          <R365UploadStep
            onComplete={(data) => { setScheduleData(data); setStep(1); }}
          />
        )}
        {step === 1 && (
          <MatchStep
            rows={scheduleData}
            onBack={() => setStep(0)}
            onNext={(matched) => { setScheduleData(matched); setStep(2); }}
          />
        )}
        {step === 2 && (
          <PreviewStep
            scheduleData={scheduleData}
            onBack={() => setStep(1)}
            onComplete={(final) => { setScheduleData(final); setStep(3); }}
          />
        )}
        {step === 3 && (
          <PublishStep
            scheduleData={scheduleData}
            onBack={() => setStep(2)}
            onComplete={() => { setScheduleData([]); setStep(0); }}
          />
        )}
      </div>
    </div>
  );
}