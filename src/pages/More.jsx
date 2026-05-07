import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Layout, BookOpen, Utensils, Building2, FileText, Settings, Users, BarChart3, Wrench, Clock, Thermometer, Shield, Truck, AlertCircle } from 'lucide-react';
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
        {/* Management Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">📋 MANAGEMENT</h2>
          <div className="space-y-2">
            <MoreRow
              icon={Layout}
              label="Template Builder"
              description="Create prep, side work, cleaning, and temperature templates"
              onClick={() => navigate('/templates')}
            />
            <MoreRow
              icon={Utensils}
              label="Recipes & Build Cards"
              description="Manage recipes, build cards, and menu items"
              onClick={() => navigate('/recipes')}
            />
            <MoreRow
              icon={Building2}
              label="Inventory"
              description="Track purchased items and stock levels"
              onClick={() => navigate('/inventory')}
            />
            <MoreRow
              icon={Truck}
              label="Vendors"
              description="Manage vendor information and pricing"
              onClick={() => navigate('/vendors')}
            />
            <MoreRow
              icon={Wrench}
              label="Equipment"
              description="Manage equipment and maintenance logs"
              onClick={() => navigate('/standards')}
            />
            <MoreRow
              icon={Clock}
              label="BEOs / Events"
              description="Manage reservations and banquet events"
              onClick={() => navigate('/reservations')}
            />
          </div>
        </div>

        {/* Admin Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">⚙️ ADMIN</h2>
          <div className="space-y-2">
            <MoreRow
              icon={BarChart3}
              label="Reports"
              description="View analytics, compliance scores, and performance"
              onClick={() => navigate('/reports')}
            />
            <MoreRow
              icon={FileText}
              label="Imports"
              description="Import schedules, inventory, and vendor data"
              onClick={() => navigate('/schedule-import')}
            />
            <MoreRow
              icon={Wrench}
              label="Integrations"
              description="Connect external services and APIs"
              badge="Coming"
              badgeColor="bg-slate-500/15 text-slate-400"
              disabled
            />
            <MoreRow
              icon={Shield}
              label="Role Preview"
              description="Preview the app as a specific role"
              onClick={() => navigate('/admin/role-simulator')}
            />
            <MoreRow
              icon={Users}
              label="Job Codes"
              description="Manage job codes and classifications"
              onClick={() => navigate('/job-codes')}
            />
            <MoreRow
              icon={Settings}
              label="Settings"
              description="Configure app behavior and preferences"
              onClick={() => navigate('/my-restaurant')}
            />
            <MoreRow
              icon={Thermometer}
              label="Temperature Monitoring"
              description="Configure recurring temperature checks"
              onClick={() => navigate('/temperature-monitoring')}
            />
            <MoreRow
              icon={Thermometer}
              label="Temperature Dashboard"
              description="Review compliance and failed checks"
              onClick={() => navigate('/temperature-dashboard')}
            />
            <MoreRow
              icon={AlertCircle}
              label="App Health"
              description="Diagnostic dashboard for routes, forms, and entities"
              onClick={() => navigate('/app-health')}
              badge="Diagnostic"
              badgeColor="bg-blue-500/15 text-blue-400"
            />
          </div>
        </div>

        {/* Knowledge Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">📚 KNOWLEDGE</h2>
          <div className="space-y-2">
            <MoreRow
              icon={Building2}
              label="Restaurant Settings"
              description="Edit restaurant details and brand settings"
              onClick={() => navigate('/my-restaurant')}
            />
            <MoreRow
              icon={FileText}
              label="SOPs / Standards"
              description="Standard operating procedures and guides"
              onClick={() => navigate('/standards')}
            />
            <MoreRow
              icon={BookOpen}
              label="Training"
              description="Training materials and onboarding content"
              onClick={() => navigate('/knowledge')}
              badge="Setup"
              badgeColor="bg-amber-500/15 text-amber-400"
            />
            <MoreRow
              icon={Wrench}
              label="MSDS / Safety"
              description="Material safety and compliance docs"
              onClick={() => navigate('/msds')}
            />
            <MoreRow
              icon={Utensils}
              label="Build Cards"
              description="Recipe components and build instructions"
              onClick={() => navigate('/build-cards')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const hideBase44Index = true;