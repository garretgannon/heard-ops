import { useState } from "react";
import { Camera, Video, Wand2, Expand, Loader2, RefreshCw, PenLine } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * StepVisualCard — inline visual for a prep/cleaning/maintenance step.
 * Supports: AI illustration, uploaded photo, uploaded video, annotated image.
 * Handles fullscreen lightbox and auto-AI-gen when no visual exists.
 */
export default function StepVisualCard({ step, isAdmin, onUpdate, onFullscreen }) {
  const [generatingAI, setGeneratingAI] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingAnnotation, setUploadingAnnotation] = useState(false);

  const visual = step.photo_url || step.ai_illustration_url;
  const video = step.video_url;
  const annotation = step.annotation_url;

  const generateAI = async () => {
    setGeneratingAI(true);
    try {
      const prompt = `Dark cinematic commercial kitchen instructional illustration. 
Step: "${step.instruction}". 
Style: premium dark background (#0A0F14), clean stainless steel kitchen environment, 
minimal clutter, dramatic top-down or 45-degree angle lighting, blue (#FF6B00) accent 
highlight on the key action/object, photorealistic textures, modern restaurant kitchen 
aesthetic. Show the action clearly with no text overlays. High contrast. Cinematic depth.`;
      const { url } = await base44.integrations.Core.GenerateImage({ prompt });
      await base44.entities.PrepStep.update(step.id, { ai_illustration_url: url });
      onUpdate?.({ ...step, ai_illustration_url: url });
      toast.success("Illustration generated");
    } catch {
      toast.error("Failed to generate illustration");
    }
    setGeneratingAI(false);
  };

  const uploadFile = async (file, type) => {
    const setUploading = type === "photo" ? setUploadingPhoto : type === "video" ? setUploadingVideo : setUploadingAnnotation;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const field = type === "photo" ? "photo_url" : type === "video" ? "video_url" : "annotation_url";
      await base44.entities.PrepStep.update(step.id, { [field]: file_url });
      onUpdate?.({ ...step, [field]: file_url });
      toast.success(`${type === "photo" ? "Photo" : type === "video" ? "Video" : "Annotation"} uploaded`);
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Main visual */}
      <div className="relative rounded-xl overflow-hidden bg-[#0A0F14] border border-border group"
        style={{ minHeight: visual || video ? undefined : (isAdmin ? "80px" : "0") }}>

        {/* Video */}
        {video && (
          <div className="relative">
            <video
              src={video}
              className="w-full rounded-xl object-cover max-h-52"
              controls
              playsInline
            />
          </div>
        )}

        {/* Photo / AI illustration */}
        {!video && visual && (
          <button
            className="w-full block relative"
            onClick={() => onFullscreen?.({ url: visual, caption: step.instruction })}
          >
            <img
              src={visual}
              alt={step.instruction}
              className="w-full object-cover rounded-xl max-h-52 transition-transform duration-300 group-hover:scale-[1.01]"
            />
            {/* Orange accent overlay glow */}
            <div className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(255,122,26,0.08) 0%, transparent 50%)' }} />
            {/* Expand hint */}
            <div className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Expand className="h-3.5 w-3.5 text-white" />
            </div>
            {/* AI badge */}
            {step.ai_illustration_url && !step.photo_url && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-primary border border-primary/30">
                <Wand2 className="h-2.5 w-2.5" /> AI Illustration
              </div>
            )}
          </button>
        )}

        {/* No visual + admin: show generate button */}
        {!video && !visual && isAdmin && (
          <button
            onClick={generateAI}
            disabled={generatingAI}
            className="w-full flex flex-col items-center justify-center gap-1.5 py-5 text-muted-foreground hover:text-primary transition-colors rounded-xl border border-dashed border-border hover:border-primary"
          >
            {generatingAI
              ? <><Loader2 className="h-4 w-4 animate-spin" /><span className="text-[11px]">Generating...</span></>
              : <><Wand2 className="h-4 w-4" /><span className="text-[11px] font-semibold">Generate Illustration</span></>}
          </button>
        )}

        {/* No visual, not admin: auto-generate silently — done via parent useEffect */}
        {!video && !visual && !isAdmin && (
          <div className="h-0" />
        )}
      </div>

      {/* Annotation image */}
      {annotation && (
        <button
          className="relative w-full rounded-xl overflow-hidden border border-amber-500/30 group"
          onClick={() => onFullscreen?.({ url: annotation, caption: `Annotated: ${step.instruction}` })}
        >
          <img src={annotation} alt="Annotated" className="w-full object-cover max-h-36 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-amber-400 border border-amber-500/30">
            <PenLine className="h-2.5 w-2.5" /> Annotated
          </div>
        </button>
      )}

      {/* Admin media controls */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload photo */}
          <label className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg card-glass border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary transition-all">
            {uploadingPhoto ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            Photo
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && uploadFile(e.target.files[0], "photo")} />
          </label>

          {/* Upload video */}
          <label className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg card-glass border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary transition-all">
            {uploadingVideo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Video className="h-3 w-3" />}
            Video
            <input type="file" accept="video/*" className="hidden"
              onChange={e => e.target.files[0] && uploadFile(e.target.files[0], "video")} />
          </label>

          {/* Upload annotation */}
          <label className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg card-glass border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-amber-500/60 transition-all">
            {uploadingAnnotation ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenLine className="h-3 w-3" />}
            Annotate
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files[0] && uploadFile(e.target.files[0], "annotation")} />
          </label>

          {/* Regenerate AI */}
          <button
            onClick={generateAI}
            disabled={generatingAI}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg card-glass border border-border text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary transition-all disabled:opacity-50"
          >
            {generatingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {step.ai_illustration_url ? "Regen AI" : "Gen AI"}
          </button>
        </div>
      )}
    </div>
  );
}