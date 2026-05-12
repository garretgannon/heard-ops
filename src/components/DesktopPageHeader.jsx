import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays } from 'lucide-react';

export default function DesktopPageHeader({ title, subtitle, actions }) {
  const navigate = useNavigate();
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      className="hidden lg:flex items-center justify-between px-8 py-[18px] sticky top-0 z-20"
      style={{
        background: 'linear-gradient(180deg, rgba(6,10,17,0.97) 0%, rgba(5,8,14,0.95) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        borderTop: '1px solid rgba(230,106,31,0.25)',
        boxShadow: '0 1px 0 rgba(230,106,31,0.07), 0 8px 40px rgba(0,0,0,0.55)',
      }}
    >
      <div>
        <h1 className="text-[22px] font-black tracking-tight text-foreground leading-none">{title}</h1>
        <p className="text-[11px] text-muted-foreground mt-1 font-medium">{subtitle || dateStr}</p>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={() => navigate('/shift')}
          className="h-8 px-3 rounded-lg text-[12px] font-bold text-foreground flex items-center gap-1.5 transition-all active:scale-95"
          style={{
            background: 'rgba(230,106,31,0.1)',
            border: '1px solid rgba(230,106,31,0.28)',
            boxShadow: '0 0 12px rgba(230,106,31,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          Shift
        </button>
        <button
          onClick={() => navigate('/logs')}
          className="h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <Bell className="h-[15px] w-[15px] text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
