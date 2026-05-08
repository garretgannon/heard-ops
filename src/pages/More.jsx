import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ChefHat, Award, Warehouse, Truck, CalendarDays, LayoutTemplate, Layout, BarChart3, Thermometer, Building2, Settings } from 'lucide-react';
import MoreSectionHeader from '@/components/more/MoreSectionHeader';
import MoreRow from '@/components/more/MoreRow';

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  if (!isAdmin) {
    return (
      <div className="pb-32 bg-background min-h-screen">
        <MoreSectionHeader />
        <div className="px-4 py-12 lg:px-8 text-center">
          <p className="text-muted-foreground">Admin tools not available for your role</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-background min-h-screen lg:flex lg:flex-col">
      {/* Header */}
      <MoreSectionHeader />

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Resources Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">📚 Resources</h2>
          <div className="space-y-2">
            <MoreRow
              icon={ChefHat}
              label="Recipes"
              description="Manage recipes, build cards, and menu items"
              onClick={() => navigate('/recipes')}
            />
            <MoreRow
              icon={Award}
              label="Training"
              description="Training materials and onboarding content"
              onClick={() => navigate('/training')}
            />
            <MoreRow
              icon={Warehouse}
              label="Inventory"
              description="Track purchased items and stock levels"
              onClick={() => navigate('/inventory')}
            />
            <MoreRow
              icon={Truck}
              label="Vendors"
              description="Manage vendor contacts and orders"
              onClick={() => navigate('/vendors')}
            />
          </div>
        </div>

        {/* Planning Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">📅 Planning</h2>
          <div className="space-y-2">
            <MoreRow
              icon={CalendarDays}
              label="Schedule"
              description="Manage employee shifts and schedules"
              onClick={() => navigate('/schedule')}
            />
            <MoreRow
              icon={LayoutTemplate}
              label="BEOs / Events"
              description="Manage reservations and banquet events"
              onClick={() => navigate('/reservations')}
            />
          </div>
        </div>

        {/* Setup Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">⚙️ Setup</h2>
          <div className="space-y-2">
            <MoreRow
              icon={Layout}
              label="Templates"
              description="Create prep, side work, cleaning, and temperature templates"
              onClick={() => navigate('/templates')}
            />
            <MoreRow
              icon={Thermometer}
              label="Temperature Monitoring"
              description="Configure recurring temperature checks"
              onClick={() => navigate('/temperature-monitoring')}
            />
            <MoreRow
              icon={BarChart3}
              label="Reports"
              description="View analytics, compliance scores, and performance"
              onClick={() => navigate('/reports')}
            />
            <MoreRow
              icon={Building2}
              label="My Restaurant"
              description="Manage restaurant info, equipment, and integrations"
              onClick={() => navigate('/my-restaurant')}
            />
            <MoreRow
              icon={Settings}
              label="Settings"
              description="Configure app behavior and preferences"
              onClick={() => navigate('/profile')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;