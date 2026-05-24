import { BRAND_ASSETS } from '@/lib/brandAssets';

export default function DesktopPageHeader({ title, subtitle, actions }) {
  return (
    <div
      className="hidden lg:flex items-center justify-between -mx-8 px-8 h-12 shrink-0 sticky top-[72px] z-10 -mt-9"
      style={{
        background: "rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={BRAND_ASSETS.logoMark}
          alt=""
          className="h-9 w-auto max-w-[156px] shrink-0 object-contain select-none"
          aria-hidden="true"
        />
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="truncate text-[15px] font-black text-foreground tracking-tight">{title}</h1>
          {subtitle && (
            <>
              <span className="text-muted-foreground/25 text-sm">/</span>
              <p className="truncate text-[13px] font-medium text-muted-foreground/65">{subtitle}</p>
            </>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
