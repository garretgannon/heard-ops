import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function PhotoUpload({ onUpload, existingUrl, className }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(existingUrl || null);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPreview(file_url);
    setUploading(false);
    onUpload(file_url);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setPreview(null);
    onUpload(null);
  };

  if (preview) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden border border-border group", className)}>
        <img src={preview} alt="Prep photo" className="w-full h-40 object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Button
            size="icon"
            variant="destructive"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
            onClick={clear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-2 right-2 bg-emerald-500 text-white rounded-full p-1">
          <Check className="h-3 w-3" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-24", className)}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      {uploading ? (
        <div className="flex items-center justify-center h-full rounded-xl border-2 border-dashed border-border bg-muted/50">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 h-full rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">Take or upload photo</span>
        </div>
      )}
    </div>
  );
}