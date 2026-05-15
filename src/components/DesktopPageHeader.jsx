export default function DesktopPageHeader({ title, subtitle, actions }) {
  return (
    <div
      className="hidden lg:flex items-center justify-between -mx-8 px-8 h-10 shrink-0 sticky top-[72px] z-10 -mt-7"
      style={{
        background: 'rgba(5,8,14,0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-bold text-foreground/90 tracking-wide">{title}</h1>
        {subtitle && (
          <>
            <span className="text-muted-foreground/30 text-sm">·</span>
            <p className="text-[13px] text-muted-foreground/60">{subtitle}</p>
          </>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
