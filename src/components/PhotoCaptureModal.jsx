import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { haptics } from "@/utils/haptics";
import { cn } from "@/lib/utils";

export default function PhotoCaptureModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [showPreview, setShowPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Camera access denied", err);
        onClose();
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    };
  }, [open, onClose]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    const video = videoRef.current;

    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvasRef.current.toBlob(async (blob) => {
      setShowPreview(canvasRef.current.toDataURL("image/jpeg"));

      setTimeout(async () => {
        setUploading(true);
        haptics.medium();
        
        await onCapture(blob);
        
        setShowPreview(null);
        setUploading(false);
        
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
        onClose();
      }, 500);
    }, "image/jpeg");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-lg bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <X className="h-5 w-5 text-white stroke-[2]" />
      </button>

      {!showPreview && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
            <motion.button
              onClick={handleCapture}
              whileTap={{ scale: 0.9 }}
              className="h-16 w-16 rounded-full bg-white border-4 border-white/30 shadow-lg active:scale-90 transition-transform"
            />
          </div>
        </>
      )}

      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-0 bg-black flex items-center justify-center",
            uploading && "animate-flash"
          )}
        >
          <img
            src={showPreview}
            alt="capture"
            className="w-full h-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center">
                <p className="text-white text-sm font-bold">Uploading...</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}