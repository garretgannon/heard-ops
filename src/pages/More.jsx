import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Search, Clock, Star, TrendingUp, Users, Lightbulb, Zap, Settings, Wrench, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { allRoutes } from '@/lib/routeConfig';
import OperationsSectionCard from '@/components/OperationsSectionCard';

const PRIMARY_OPERATIONS = ['prepLists', 'sideWork', 'tempLogs', 'wasteLog'];

const OPERATIONS_CENTER_SECTIONS = {
  operations: {
    title: 'Operations',
    icon: Zap,
    color: 'text-primary',
    description: 'Daily tasks and workflows',
    primaryItems: ['prepLists', 'sideWork', 'tempLogs', 'wasteLog'],
    secondaryItems: ['cleaningChecklist', 'shiftHandoff', 'logs', 'issues'],
    defaultExpanded: true,
  },
  knowledge: {
    title: 'Knowledge Base',
    icon: Lightbulb,
    color: 'text-blue-400',
    description: 'Recipes, guides & standards',
    items: ['recipes', 'standards', 'msds', 'vendors'],
    defaultExpanded: false,
  },
  team: {
    title: 'Team',
    icon: Users,
    color: 'text-emerald-400',
    description: 'Staff management & insights',
    items: ['team', 'schedule'],
    defaultExpanded: false,
  },
  insights: {
    title: 'Business Insights',
    icon: BarChart3,
    color: 'text-amber-400',
    description: 'Analytics & performance',
    items: ['reports', 'inventory'],
    defaultExpanded: false,
  },
  admin: {
    title: 'Admin & Configuration',
    icon: Wrench,
    color: 'text-rose-400',
    description: 'System setup and control',
    items: ['jobCodes', 'stations', 'restaurant', 'purchasedItems'],
    templates: true,
    defaultExpanded: false,
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
  const [collapsedSections, setCollapsedSections] = useState({});

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

  const toggleSection = (sectionKey) => {
    haptics.light();
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const isSectionExpanded = (sectionKey, defaultExpanded) => {
    return collapsedSections[sectionKey] !== undefined ? !collapsedSections[sectionKey] : defaultExpanded;
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
    <div className="pb-32 max-w-[1280px] mx-auto">
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
        <div className="px-4 py-4 space-y-5">
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
          <div className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 space-y-3 lg:space-y-0">
            {Object.entries(OPERATIONS_CENTER_SECTIONS).map(([sectionKey, section]) => {
              const SectionIcon = section.icon;
              const isExpanded = isSectionExpanded(sectionKey, section.defaultExpanded);

              let allItems = [];
              if (section.primaryItems) {
                allItems = [...(section.primaryItems || []), ...(section.secondaryItems || [])];
              } else {
                allItems = section.items || [];
              }

              const accessibleItems = allItems
                .map(findRoute)
                .filter(route => {
                  if (!route) return false;
                  if (route.roles && !route.roles.includes(isAdmin ? 'admin' : 'user')) return false;
                  return true;
                });

              if (accessibleItems.length === 0) return null;

              const primaryItems = section.primaryItems
                ? accessibleItems.filter(t => section.primaryItems.includes(
                    Object.entries(allRoutes).find(([_, module]) =>
                      Object.values(module).some(route => route?.path === t.path)
                    )?.[1]
                  ))
                : [];

              const secondaryItems = section.secondaryItems
                ? accessibleItems.filter(t => section.secondaryItems.includes(
                    Object.entries(allRoutes).find(([_, module]) =>
                      Object.values(module).some(route => route?.path === t.path)
                    )?.[1]
                  ))
                : [];

              const itemsToShow = primaryItems.length > 0 ? [...primaryItems, ...secondaryItems] : accessibleItems;

              return (
                <div key={sectionKey} className="border border-border/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(sectionKey)}
                    className="w-full bg-card/50 hover:bg-card/80 transition-colors p-3.5 flex items-center justify-between active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <SectionIcon className={cn('h-4 w-4', section.color)} />
                      <div className="text-left">
                        <p className="text-xs font-bold text-foreground">{section.title}</p>
                        <p className="text-[9px] text-secondary-text">{section.description}</p>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-secondary-text">{isExpanded ? '−' : '+'}</div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/30 divide-y divide-border/30">
                      {itemsToShow.map(tool => {
                        const isSecondary = secondaryItems.includes(tool);
                        return (
                          <button
                            key={tool.path}
                            onClick={() => { haptics.light(); handleNavigate(tool.path); }}
                            className={cn(
                              'w-full text-left px-3.5 py-2 flex items-center gap-2.5 active:scale-95 transition-colors',
                              'hover:bg-muted/30',
                              isSecondary && 'opacity-80'
                            )}
                          >
                            {(() => {
                              const Icon = tool.icon;
                              return (
                                <div className={cn(
                                  'rounded-lg flex items-center justify-center shrink-0',
                                  isSecondary ? 'h-7 w-7 bg-muted' : 'h-8 w-8 bg-muted'
                                )}>
                                  <Icon className={cn(
                                    'stroke-[1.5] text-secondary-text',
                                    isSecondary ? 'h-3.5 w-3.5' : 'h-4 w-4'
                                  )} />
                                </div>
                              );
                            })()}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'font-bold text-foreground',
                                isSecondary ? 'text-xs' : 'text-sm'
                              )}>
                                {tool.label}
                              </p>
                              {!isSecondary && tool.description && (
                                <p className="text-[10px] text-secondary-text mt-0.5">{tool.description}</p>
                              )}
                            </div>
                            {!isSecondary && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  haptics.light();
                                  toggleFavorite(tool.path);
                                }}
                                className="text-[10px] font-bold text-secondary-text hover:text-primary"
                              >
                                {favorites.includes(tool.path) ? '★' : '☆'}
                              </button>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
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