import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Search, Clock, Star, TrendingUp, Users, Lightbulb, Zap, Settings, Wrench, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { allRoutes } from '@/lib/routeConfig';
import OperationsSectionCard from '@/components/OperationsSectionCard';

const OPERATIONS_CENTER_SECTIONS = {
  operations: {
    title: 'Operations',
    icon: Zap,
    color: 'text-primary',
    description: 'Daily tasks and workflows',
    items: ['prepLists', 'sideWork', 'tempLogs', 'wasteLog', 'cleaningChecklist', 'shiftHandoff', 'logs', 'issues'],
  },
  knowledge: {
    title: 'Knowledge Base',
    icon: Lightbulb,
    color: 'text-blue-400',
    description: 'Recipes, guides & standards',
    items: ['recipes', 'standards', 'msds', 'vendors'],
  },
  team: {
    title: 'Team',
    icon: Users,
    color: 'text-emerald-400',
    description: 'Staff management & insights',
    items: ['team', 'schedule'],
  },
  insights: {
    title: 'Business Insights',
    icon: BarChart3,
    color: 'text-amber-400',
    description: 'Analytics & performance',
    items: ['reports', 'inventory'],
  },
  admin: {
    title: 'Admin & Configuration',
    icon: Wrench,
    color: 'text-rose-400',
    description: 'System setup and control',
    items: ['prepTemplates', 'sideWorkTemplates', 'cleaningTemplates', 'tempLogTemplates', 'wasteTemplates', 'eightsixTemplates', 'jobCodes', 'stations', 'restaurant', 'scheduleImport'],
  },
};

function findRoute(routeKey) {
  for (const moduleKey in allRoutes) {
    for (const key in allRoutes[moduleKey]) {
      if (key === routeKey) return allRoutes[moduleKey][key];
    }
  }
  return null;
}

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('operationsCenter_favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [recentTools, setRecentTools] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('operationsCenter_recent') || '[]').slice(0, 5);
    } catch {
      return [];
    }
  });

  const toggleFavorite = (path) => {
    setFavorites(prev => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
      localStorage.setItem('operationsCenter_favorites', JSON.stringify(next));
      return next;
    });
  };

  const handleNavigate = (path) => {
    setRecentTools(prev => {
      const next = [path, ...prev.filter(p => p !== path)].slice(0, 5);
      localStorage.setItem('operationsCenter_recent', JSON.stringify(next));
      return next;
    });
    navigate(path);
  };

  // Get all accessible tools and filter by search
  const allTools = [];
  Object.values(allRoutes).forEach(module => {
    Object.entries(module).forEach(([key, route]) => {
      if (route.roles?.includes(isAdmin ? 'admin' : 'user')) {
        allTools.push(route);
      }
    });
  });

  const filteredTools = searchQuery.trim()
    ? allTools.filter(tool =>
        tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const favoriteTools = favorites.map(findRoute).filter(Boolean);
  const recentToolsData = recentTools.map(findRoute).filter(Boolean);

  return (
    <div className="pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-card via-card to-card/80 border-b border-border backdrop-blur-sm px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Operations Center</h1>
          <p className="text-xs text-secondary-text mt-1">Organize your restaurant workflow</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted border border-border/50 rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="px-4 py-4">
          {filteredTools.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Search Results ({filteredTools.length})</p>
              <div className="space-y-2">
                {filteredTools.map(tool => (
                  <OperationsSectionCard
                    key={tool.path}
                    route={tool}
                    onClick={handleNavigate}
                    isFavorite={favorites.includes(tool.path)}
                    onToggleFavorite={toggleFavorite}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-secondary-text">No tools found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}

      {/* Normal View (no search) */}
      {!searchQuery.trim() && (
        <div className="px-4 py-4 space-y-8">
          {/* Pinned Favorites */}
          {favoriteTools.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Pinned Favorites</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {favoriteTools.map(tool => (
                  <OperationsSectionCard
                    key={tool.path}
                    route={tool}
                    onClick={handleNavigate}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recently Used */}
          {recentToolsData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Recently Used</h2>
              </div>
              <div className="space-y-2">
                {recentToolsData.map(tool => (
                  <OperationsSectionCard
                    key={tool.path}
                    route={tool}
                    onClick={handleNavigate}
                    isFavorite={favorites.includes(tool.path)}
                    onToggleFavorite={toggleFavorite}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main Sections */}
          <div className="space-y-8">
            {Object.entries(OPERATIONS_CENTER_SECTIONS).map(([sectionKey, section]) => {
              const SectionIcon = section.icon;
              const accessibleItems = section.items
                .map(findRoute)
                .filter(route => {
                  if (!route) return false;
                  if (route.roles && !route.roles.includes(isAdmin ? 'admin' : 'user')) return false;
                  return true;
                });

              if (accessibleItems.length === 0) return null;

              return (
                <div key={sectionKey} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <SectionIcon className={cn('h-5 w-5', section.color)} />
                    <div>
                      <h2 className="text-sm font-bold text-foreground">{section.title}</h2>
                      <p className="text-[10px] text-secondary-text">{section.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {accessibleItems.map(tool => (
                      <OperationsSectionCard
                        key={tool.path}
                        route={tool}
                        onClick={handleNavigate}
                        isFavorite={favorites.includes(tool.path)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;