export default function DesktopPageHeader({ title, subtitle, actions }) {
  return (
    <div
      className="hidden lg:flex items-center justify-between -mx-8 px-8 h-12 shrink-0 sticky top-[72px] z-10 -mt-9"
      style={{
        background: 'linear-gradient(180deg, rgba(5,8,14,0.98), rgba(5,8,14,0.9))',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.26)',
      }}
    >
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="truncate text-[15px] font-black text-foreground tracking-tight">{title}</h1>
        {subtitle && (
          <>
            <span className="text-muted-foreground/25 text-sm">/</span>
            <p className="truncate text-[13px] font-medium text-muted-foreground/65">{subtitle}</p>
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
