import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Loader2 } from 'lucide-react';
import KitchenLeadLaunch from './KitchenLeadLaunch';
import CookLaunch from './CookLaunch';
import ServerLaunch from './ServerLaunch';
import BartenderLaunch from './BartenderLaunch';
import ManagerLaunch from './ManagerLaunch';
import DishwasherLaunch from './DishwasherLaunch';
import FOHLeadLaunch from './FOHLeadLaunch';

const ROLE_COMPONENTS = {
  'kitchen-lead': KitchenLeadLaunch,
  'cook': CookLaunch,
  'server': ServerLaunch,
  'bartender': BartenderLaunch,
  'manager': ManagerLaunch,
  'dishwasher': DishwasherLaunch,
  'foh-lead': FOHLeadLaunch,
};

const ROLE_LABELS = {
  'kitchen-lead': 'Kitchen Lead',
  'cook': 'Cook',
  'server': 'Server',
  'bartender': 'Bartender',
  'manager': 'Manager',
  'dishwasher': 'Dishwasher',
  'foh-lead': 'FOH Lead',
};

export default function RoleBasedLauncher({ isOpen, onClose, onComplete }) {
  const { user } = useCurrentUser();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const role = (user.role || '').toLowerCase();
    const normalizedRole = 
      role === 'kitchen-lead' ? 'kitchen-lead' :
      role === 'cook' ? 'cook' :
      role === 'server' ? 'server' :
      role === 'bartender' ? 'bartender' :
      role === 'manager' ? 'manager' :
      role === 'dishwasher' ? 'dishwasher' :
      role === 'foh-lead' ? 'foh-lead' :
      'manager'; // default

    setUserRole(normalizedRole);
    setLoading(false);
  }, [user]);

  if (!isOpen || loading) {
    return null;
  }

  if (!userRole || !ROLE_COMPONENTS[userRole]) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-secondary-text">Loading shift experience...</p>
        </div>
      </div>
    );
  }

  const LaunchComponent = ROLE_COMPONENTS[userRole];

  return (
    <LaunchComponent 
      isOpen={isOpen} 
      onClose={onClose} 
      onComplete={onComplete}
      userRole={userRole}
      roleLabel={ROLE_LABELS[userRole]}
    />
  );
}