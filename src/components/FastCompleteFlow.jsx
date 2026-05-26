import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Check } from "lucide-react";

export default function FastCompleteFlow({ item, onComplete, onCancel }) {
  const [state, setState] = useState("camera"); // camera, uploading, success
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied");
      onCancel();
    }
  };

  const captureAndUpload = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    // Stop camera
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }

    setState("uploading");

    try {
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, "image/jpeg", 0.8));
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      
      // Update item with photo and mark completed
      const now = new Date().toLocaleString();
      await base44.entities.PrepItem.update(item.id, {
        photo_url: file_url,
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: "Staff",
      });

      setState("success");
      setTimeout(() => onComplete(), 1000);
    } catch (err) {
      console.error("Upload failed:", err);
      onCancel();
    }
  };

  const useFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState("uploading");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const now = new Date().toLocaleString();
      await base44.entities.PrepItem.update(item.id, {
        photo_url: file_url,
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: "Staff",
      });
      setState("success");
      setTimeout(() => onComplete(), 1000);
    } catch (err) {
      console.error("Upload failed:", err);
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {state === "camera" && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={startCamera}
          />
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="ops-input hidden"
            onChange={handleFileSelect}
          />
          <div className="absolute bottom-8 left-0 right-0 flex gap-3 px-6 justify-center">
            <button
              onClick={captureAndUpload}
              className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              title="Capture photo"
            >
              <div className="h-14 w-14 border-4 border-primary-foreground rounded-full" />
            </button>
            <button
              onClick={useFileUpload}
              className="px-6 py-3 bg-white/20 text-white rounded-full font-medium text-sm backdrop-blur active:scale-95 transition-transform"
            >
              Choose
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-white/20 text-white rounded-full font-medium text-sm backdrop-blur active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {state === "uploading" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">Uploading...</p>
          </div>
        </div>
      )}

      {state === "success" && (
        <div className="flex-1 flex items-center justify-center bg-green-500">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center">
              <Check className="h-12 w-12 text-green-500" strokeWidth={3} />
            </div>
            <p className="text-white text-lg font-semibold">Complete!</p>
          </div>
        </div>
      )}
    </div>
  );
}