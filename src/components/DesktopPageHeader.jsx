export default function DesktopPageHeader({ title, subtitle, actions }) {
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      className="hidden lg:flex items-center justify-between -mx-8 px-8 py-4 sticky top-[72px] z-10"
      style={{
        background: 'linear-gradient(180deg, rgba(6,10,17,0.98) 0%, rgba(5,8,14,0.96) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div>
        <h1 className="text-[20px] font-black tracking-tight text-foreground leading-none">{title}</h1>
        <p className="text-[11px] text-muted-foreground mt-1 font-medium">{subtitle || dateStr}</p>
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
