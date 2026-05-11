import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Cog,
  FlaskConical,
  GitBranch,
  LayoutTemplate,
  MessageSquare,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundCog,
  Warehouse,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_ACTIONS = [
  { label: 'Templates', detail: 'Task, prep, cleaning', path: '/templates', icon: LayoutTemplate, status: 'status-info' },
  { label: 'Roles', detail: 'Access and permissions', path: '/admin/command-center', icon: ShieldCheck, status: 'status-neutral' },
  { label: 'Automation', detail: 'Rules and escalations', path: '/automation-rules', icon: Zap, status: 'status-warning' },
];

const SECTIONS = [
  {
    title: 'Operations',
    items: [
      { label: 'Prep Planning', detail: 'Plan production', path: '/prep-planning', icon: ClipboardList, status: 'status-info' },
      { label: 'Shift Handoff', detail: 'Manager transition', path: '/shift-handoff', icon: Sparkles, status: 'status-neutral' },
      { label: 'Comms', detail: 'Announcements and station notes', path: '/comms', icon: MessageSquare, status: 'status-warning' },
      { label: 'BEOs / Events', detail: 'Reservations and events', path: '/reservations', icon: CalendarDays, status: 'status-info' },
      { label: 'Reports', detail: 'Operational trends', path: '/reports', icon: BarChart3, status: 'status-neutral' },
    ],
  },
  {
    title: 'Food & Inventory',
    items: [
      { label: 'Recipes', detail: 'Recipes and build cards', path: '/recipes', icon: ChefHat, status: 'status-info' },
      { label: 'Inventory', detail: 'Stock and counts', path: '/inventory', icon: Warehouse, status: 'status-neutral' },
      { label: 'Purchased Items', detail: 'Goods and prices', path: '/purchased-items', icon: Package, status: 'status-neutral' },
      { label: 'Vendors', detail: 'Contacts and ordering', path: '/vendors', icon: Truck, status: 'status-neutral' },
    ],
  },
  {
    title: 'Knowledge',
    items: [
      { label: 'Training', detail: 'Team learning', path: '/training', icon: BookOpen, status: 'status-success' },
      { label: 'Chemicals / SDS', detail: 'Safety data sheets', path: '/chemical-library', icon: FlaskConical, status: 'status-info' },
    ],
  },
  {
    title: 'Restaurant Setup',
    items: [
      { label: 'Team Structure', detail: 'People hierarchy', path: '/people', icon: GitBranch, status: 'status-neutral' },
      { label: 'Restaurant', detail: 'Location settings', path: '/my-restaurant', icon: Building2, status: 'status-neutral' },
      { label: 'Profile & Settings', detail: 'Account preferences', path: '/profile', icon: Cog, status: 'status-neutral' },
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

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  if (!isAdmin) {
    return (
      <div className="app-screen">
        <main className="app-page mx-auto max-w-[620px] space-y-5">
          <header className="pt-1">
            <p className="metric-label">More</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Tools</h1>
          </header>
          <div className="app-card py-12 text-center">
            <div className="status-marker status-marker-lg status-neutral mx-auto mb-4">
              <UserRoundCog className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Admin tools are not available for your role.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <main className="app-page mx-auto max-w-[720px] space-y-6">
        <header className="pt-1">
          <p className="metric-label">More</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Control room</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Setup, resources, and admin tools for the restaurant.</p>
        </header>

        {SECTIONS.map((section) => (
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
            {PRIMARY_ACTIONS.map((item) => {
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
    </div>
  );
}

export const hideBase44Index = true;
