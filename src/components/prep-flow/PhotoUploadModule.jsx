import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, CheckCircle2, Loader2, ZoomIn } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PhotoUploadModule({ photos = [], onAdd, onRemove, label = "Add Photo", required = false }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onAdd?.(file_url);
      toast.success("Photo added");
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      {/* Existing photos */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <motion.div
              key={url}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <button onClick={() => setLightbox(url)}>
                <img src={url} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-xl object-cover border border-white/10" />
                <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
              {onRemove && (
                <button
                  onClick={() => onRemove(url)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload trigger */}
      <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-all ${
        required && photos.length === 0
          ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
          : "border-white/10 bg-white/3 hover:bg-white/5"
      }`}>
        <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
          {uploading
            ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
            : <Camera className="h-4 w-4 text-primary" />}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          {required && photos.length === 0 && (
            <p className="text-[11px] text-primary/80">Required for completion</p>
          )}
        </div>
        {photos.length > 0 && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />}
        <input type="file" accept="image/*,video/*" capture="environment" className="hidden"
          onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
      </label>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <X className="h-5 w-5 text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={lightbox}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}