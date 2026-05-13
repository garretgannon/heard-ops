import { Settings } from "lucide-react";
import { haptics } from "@/utils/haptics";
import { BRAND_ASSETS } from '@/lib/brandAssets';

export default function MoreHeader({ onSettings }) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-4 py-3">
        {/* Title */}
        <h1 className="text-lg font-bold text-foreground mb-2">More</h1>

        {/* Top Row: Logo + Settings */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src={BRAND_ASSETS.headerLogo} alt="HeardOS" className="h-12 w-auto max-w-[210px] object-contain" />
          </div>

          {/* Settings Icon */}
          <button
            onClick={() => {
              haptics.light();
              onSettings?.();
            }}
            className="p-1.5 rounded-lg hover:bg-muted transition-all active:scale-95"
          >
            <Settings className="h-5 w-5 stroke-[1.5] text-secondary-text" />
          </button>
        </div>
      </div>
    </div>
  );
}
