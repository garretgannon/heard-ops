import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePermissions } from '@/hooks/usePermissions';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  ChefHat,
  Cog,
  FileText,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { moreNavSections, morePrimaryActions } from '@/lib/routeConfig';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const STAFF_SECTIONS = [
  {
    title: 'Reference',
    items: [
      { label: 'Training',        detail: 'Courses and certifications',   path: '/training',         icon: BookOpen,      status: 'status-review',   perm: 'view_training' },
      { label: 'Recipes',         detail: 'Recipes and build cards',       path: '/recipes',          icon: ChefHat,       status: 'status-review',   perm: 'view_recipes' },
      { label: 'Chemicals / SDS', detail: 'Safety data sheets',            path: '/chemical-library', icon: AlertTriangle, status: 'status-review' },
    ],
  },
  {
    title: 'Activity',
    items: [
      { label: 'My Shifts', detail: 'Upcoming and past shifts',        path: '/my-shifts', icon: Calendar,      status: 'status-info' },
      { label: 'Comms',     detail: 'Announcements and station notes', path: '/comms',     icon: MessageSquare, status: 'status-warning' },
      { label: 'Logs',      detail: 'Submit and view records',         path: '/logs',      icon: FileText,      status: 'status-warning', perm: 'view_logs' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile & Settings', detail: 'Account preferences', path: '/profile', icon: Settings, status: 'status-neutral' },
    ],
  },
];

function MoreRow({ item, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border/35 px-1 py-3.5 text-left transition-all last:border-b-0 active:scale-[0.99] glow-interactive"
    >
      <div className={cn('status-marker status-marker-md', item.status)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black tracking-tight text-foreground">{item.label}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.detail}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function HubCard({ item, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="min-h-[100px] rounded-xl border border-border/60 bg-black/20 p-4 text-left transition-all active:scale-[0.98] glow-interactive"
    >
      <div className={cn('status-marker status-marker-md mb-3', item.status)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-black text-foreground leading-tight">{item.label}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.detail}</p>
    </button>
  );
}

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const { can } = usePermissions();

  if (!isAdmin) {
    return (
      <div className="app-screen">
        <DesktopPageHeader title="Resources" subtitle="Tools and references for your shift" />

        {/* Mobile layout */}
        <main className="app-page mx-auto max-w-[620px] lg:hidden space-y-5 pb-28">
          <header className="pt-1">
            <p className="metric-label">More</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Resources</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tools and references for your shift.</p>
          </header>

          {STAFF_SECTIONS.map((section) => {
            const visible = section.items.filter(item => !item.perm || can(item.perm));
            if (visible.length === 0) return null;
            return (
              <section key={section.title} className="space-y-2">
                <h2 className="px-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{section.title}</h2>
                <div className="app-card py-1">
                  {visible.map((item) => (
                    <MoreRow key={item.path} item={item} onClick={() => navigate(item.path)} />
                  ))}
                </div>
              </section>
            );
          })}
        </main>

        {/* Desktop layout */}
        <main className="hidden lg:block app-page space-y-8">
          {STAFF_SECTIONS.map((section) => {
            const visible = section.items.filter(item => !item.perm || can(item.perm));
            if (visible.length === 0) return null;
            return (
              <section key={section.title} className="space-y-3">
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{section.title}</h2>
                <div className="grid grid-cols-3 gap-3">
                  {visible.map((item) => (
                    <HubCard key={item.path} item={item} onClick={() => navigate(item.path)} />
                  ))}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Admin Tools" subtitle="Setup, resources, and configuration" />

      {/* Mobile layout */}
      <main className="app-page mx-auto max-w-[720px] lg:hidden space-y-6">
        <header className="pt-1">
          <p className="metric-label">More</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Admin Tools</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Setup, resources, and admin tools for the restaurant.</p>
        </header>

        {moreNavSections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="px-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{section.title}</h2>
            <div className="app-card py-1">
              {section.items.map((item) => (
                <MoreRow key={item.path} item={item} onClick={() => navigate(item.path)} />
              ))}
            </div>
          </section>
        ))}

        <section className="app-card-lg space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">Admin</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Configure the system</h2>
            </div>
            <div className="status-marker status-marker-lg status-info">
              <Cog className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {morePrimaryActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="min-h-[112px] rounded-xl border border-border/60 bg-black/20 p-4 text-left transition-all active:scale-[0.98] glow-interactive"
                >
                  <div className={cn('status-marker status-marker-md mb-3', item.status)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-black text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{item.detail}</p>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Desktop admin hub */}
      <main className="hidden lg:block app-page space-y-8">

        {/* Primary admin actions */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Admin</h2>
          <div className="grid grid-cols-4 gap-4">
            {morePrimaryActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="min-h-[120px] rounded-xl border border-border/60 bg-black/20 p-5 text-left transition-all active:scale-[0.98] glow-interactive"
                >
                  <div className={cn('status-marker status-marker-md mb-3', item.status)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-black text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{item.detail}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* All nav sections as card grids */}
        {moreNavSections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{section.title}</h2>
            <div className="grid grid-cols-3 gap-3">
              {section.items.map((item) => (
                <HubCard key={item.path} item={item} onClick={() => navigate(item.path)} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

export const hideBase44Index = true;
