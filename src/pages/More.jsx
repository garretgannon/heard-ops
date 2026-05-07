import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Search, Clock, Star, Zap, Bell, CalendarDays, ChevronRight, BarChart3, TrendingUp, AlertTriangle, Users, Activity, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/haptics';
import { allRoutes } from '@/lib/routeConfig';
import OperationsSectionCard from '@/components/OperationsSectionCard';

function findRoute(routeKey) {
  for (const moduleKey in allRoutes) {
    for (const key in allRoutes[moduleKey]) {
      if (key === routeKey) return allRoutes[moduleKey][key];
    }
  }
  return null;
}

const SECTION_CONFIG = {
  operations: { title: 'Operations', color: 'text-primary', items: ['prepLists','sideWork','tempLogs','wasteLog','cleaningChecklist','logs','issues'], defaultExpanded: true },
  knowledge: { title: 'Knowledge Base', color: 'text-blue-400', items: ['recipes','standards','msds','vendors'], defaultExpanded: false },
  team: { title: 'Team', color: 'text-emerald-400', items: ['team','schedule'], defaultExpanded: false },
  insights: { title: 'Business Insights', color: 'text-amber-400', items: ['reports','inventory'], defaultExpanded: false },
  admin: { title: 'Admin & Config', color: 'text-rose-400', items: ['jobCodes','stations','restaurant','purchasedItems'], defaultExpanded: false },
};

export default function More() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [overviewData, setOverviewData] = useState({ shiftCompletion: 0, openIssues: 0, completedLogs: 0, pendingReviews: 0, complianceScore: 92 });
  const [activityFeed, setActivityFeed] = useState([]);
  const [staffing, setStaffing] = useState({ scheduled: 0, clockedIn: 0, absent: 0, late: 0 });
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem('operationsCenter_favorites') || '[]'); } catch { return []; } });
  const [recentTools, setRecentTools] = useState(() => { try { return JSON.parse(localStorage.getItem('operationsCenter_recent') || '[]').slice(0, 5); } catch { return []; } });
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    Promise.all([
      base44.entities.Issue.filter({ status: 'open' }).catch(() => []),
      base44.entities.DailyPrepTask.filter({ date: todayStr }).catch(() => []),
      base44.entities.CoolingLog.filter({ date: todayStr }).catch(() => []),
      base44.entities.RefrigeratorFreezerLog.filter({ date: todayStr }).catch(() => []),
      base44.entities.HotHoldingLog.filter({ date: todayStr }).catch(() => []),
    ]).then(([issues, prepTasks, coolingLogs, refrigLogs, hotLogs]) => {
      const totalPrep = prepTasks.length;
      const donePrep = prepTasks.filter(t => ['completed','approved'].includes(t.status)).length;
      const completedLogs = coolingLogs.length + refrigLogs.length + hotLogs.length;
      const reviewItems = prepTasks.filter(t => t.status === 'pending_review').length;
      setOverviewData({
        shiftCompletion: totalPrep > 0 ? Math.round((donePrep / totalPrep) * 100) : 0,
        openIssues: issues.length,
        completedLogs,
        pendingReviews: reviewItems,
        complianceScore: 92,
      });
      setLoadingOverview(false);
    });
  }, []);

  const toggleFavorite = (path) => { setFavorites(prev => { const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]; localStorage.setItem('operationsCenter_favorites', JSON.stringify(next)); return next; }); };
  const handleNavigate = (path) => { setRecentTools(prev => { const next = [path, ...prev.filter(p => p !== path)].slice(0, 5); localStorage.setItem('operationsCenter_recent', JSON.stringify(next)); return next; }); navigate(path); };
  const toggleSection = (k) => { haptics.light(); setCollapsedSections(prev => ({ ...prev, [k]: !prev[k] })); };
  const isSectionExpanded = (k, def) => collapsedSections[k] !== undefined ? !collapsedSections[k] : def;

  const allTools = [];
  Object.values(allRoutes).forEach(module => Object.entries(module).forEach(([key, route]) => { if (route.roles?.includes(isAdmin ? 'admin' : 'user')) allTools.push(route); }));
  const filteredTools = searchQuery.trim() ? allTools.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  const favoriteTools = favorites.map(findRoute).filter(Boolean);
  const recentToolsData = recentTools.map(findRoute).filter(Boolean);

  return (
    <div className="pb-32 lg:pb-0">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-8 pt-6 pb-4 border-b border-border/30">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Command center for restaurant operations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/today')} className="h-8 px-3 rounded-lg border border-border bg-card text-xs font-bold text-foreground flex items-center gap-1.5 hover:bg-muted active:scale-95">
            <CalendarDays className="h-3.5 w-3.5 text-primary" /> Today's Plan
          </button>
          <button className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted active:scale-95">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Desktop KPI Row */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-3 lg:px-8 lg:py-4 border-b border-border/30">
        {[
          { label: 'Shift Completion', value: `${overviewData.shiftCompletion}%`, sub: 'On track', sub2: '1h 0m elapsed', color: 'text-primary', link: '/today' },
          { label: 'Open Issues', value: overviewData.openIssues, sub: `High priority`, sub2: `Total ${overviewData.openIssues}`, color: overviewData.openIssues > 0 ? 'text-red-400' : 'text-foreground', link: '/issues' },
          { label: 'Completed Logs', value: overviewData.completedLogs, sub: 'Today', sub2: 'vs yesterday', color: 'text-blue-400', link: '/temp-logs' },
          { label: 'Pending Reviews', value: overviewData.pendingReviews, sub: 'Next review 9:00 AM', color: overviewData.pendingReviews > 0 ? 'text-amber-400' : 'text-foreground', link: '/logs' },
          { label: 'Compliance Score', value: `${overviewData.complianceScore}%`, sub: 'On track', sub2: 'Goal: 90%', color: 'text-green-400', link: '/temp-logs' },
        ].map(({ label, value, sub, sub2, color, link }) => (
          <button key={label} onClick={() => { haptics.light(); navigate(link); }} className="bg-card border border-border/60 rounded-xl px-4 py-3 text-left hover:border-border transition-all active:scale-[0.98]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            {label === 'Shift Completion' ? (
              <div className="flex items-center gap-2 mb-1">
                <div className="relative h-10 w-10 shrink-0">
                  <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${overviewData.shiftCompletion * 0.88} 88`} strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className={cn('text-xl font-extrabold', color)}>{value}</p>
                  <p className="text-[10px] text-green-400">● On track</p>
                </div>
              </div>
            ) : (
              <p className={cn('text-2xl font-extrabold mb-1', color)}>{value}</p>
            )}
            {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
            {sub2 && <p className="text-[10px] text-muted-foreground">{sub2}</p>}
            <p className="text-[10px] font-bold text-primary mt-1">View →</p>
          </button>
        ))}
      </div>

      {/* Desktop Main 2-col Layout */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_280px] lg:gap-0 lg:px-0">
        {/* Left: Activity + Feed */}
        <div className="px-8 py-6 space-y-6 border-r border-border/30">
          {/* Daily Activity placeholder */}
          <div className="bg-card border border-border/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Daily Activity</p>
                <span className="text-[10px] text-muted-foreground">● This Week</span>
                <span className="text-[10px] text-muted-foreground">● Last Week</span>
              </div>
              <select className="h-7 px-2 bg-card border border-border rounded-lg text-xs text-foreground">
                <option>7 Days</option>
                <option>14 Days</option>
                <option>30 Days</option>
              </select>
            </div>
            <div className="h-28 flex items-end justify-between gap-1 px-2">
              {[40,65,55,80,70,90,85].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t" style={{ height: `${h}%`, background: i === 6 ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/30">
              {[
                { label: 'Logs Completed', value: overviewData.completedLogs, sub: '↑ 2 vs last week' },
                { label: 'Tasks Completed', value: 0, sub: '↑ 3 vs last week' },
                { label: 'Issues Resolved', value: 0, sub: '↑ 2 vs last week' },
                { label: 'Reviews Completed', value: 0, sub: '— No change' },
              ].map(({ label, value, sub }) => (
                <div key={label}>
                  <p className="text-lg font-extrabold text-foreground">{value}</p>
                  <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
                  <p className="text-[10px] text-green-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Role Completion */}
          <div className="bg-card border border-border/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Role Completion by Department</p>
              </div>
              <select className="h-7 px-2 bg-card border border-border rounded-lg text-xs text-foreground">
                <option>All Departments</option>
              </select>
            </div>
            <div className="space-y-3">
              {[
                { dept: 'Kitchen', pct: 65, done: 13, total: 20, color: 'bg-primary' },
                { dept: 'Service', pct: 48, done: 12, total: 25, color: 'bg-blue-500' },
                { dept: 'Bar', pct: 38, done: 6, total: 18, color: 'bg-purple-500' },
                { dept: 'Management', pct: 72, done: 8, total: 11, color: 'bg-green-500' },
                { dept: 'Dish', pct: 55, done: 6, total: 11, color: 'bg-amber-500' },
              ].map(({ dept, pct, done, total, color }) => (
                <div key={dept} className="flex items-center gap-3">
                  <p className="text-xs font-semibold text-foreground w-24 shrink-0">{dept}</p>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-8 text-right">{pct}%</span>
                  <span className="text-[10px] text-muted-foreground w-12 text-right">{done}/{total}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/team')} className="mt-3 text-[10px] font-bold text-primary hover:underline flex items-center gap-1">View Role Completion <ChevronRight className="h-3 w-3" /></button>
          </div>

          {/* Activity Feed */}
          <div className="bg-card border border-border/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Activity Feed</p>
              </div>
              <select className="h-7 px-2 bg-card border border-border rounded-lg text-xs text-foreground">
                <option>All Activity</option>
              </select>
            </div>
            <div className="space-y-0 divide-y divide-border/30">
              {[
                { time: '9:00 AM', icon: '📋', color: 'text-blue-400', title: 'Opening Shift log completed by Alex B.', sub: 'Kitchen · Opening Checklist', tag: 'Log', tagCls: 'bg-blue-500/20 text-blue-400' },
                { time: '8:45 AM', icon: '⚠️', color: 'text-red-400', title: 'Walk-in cooler temperature out of range', sub: 'Cooler #1 · 41°F detected', tag: 'Issue', tagCls: 'bg-red-500/20 text-red-400' },
                { time: '8:30 AM', icon: '🍳', color: 'text-primary', title: 'Prep task "Chop Vegetables" completed', sub: 'Kitchen · Prep List', tag: 'Task', tagCls: 'bg-primary/20 text-primary' },
                { time: '8:15 AM', icon: '📋', color: 'text-blue-400', title: 'Side Work log completed by Jamie L.', sub: 'Dining Room · Side Work', tag: 'Log', tagCls: 'bg-blue-500/20 text-blue-400' },
                { time: '8:00 AM', icon: '👁', color: 'text-purple-400', title: 'Manager review completed by Taylor M.', sub: 'Opening Shift · 8:00 AM', tag: 'Review', tagCls: 'bg-purple-500/20 text-purple-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <span className="text-sm w-16 text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', item.tagCls)}>{item.tag}</span>
                </div>
              ))}
            </div>
            <button className="mt-2 text-[10px] font-bold text-primary hover:underline flex items-center gap-1">View All Activity <ChevronRight className="h-3 w-3" /></button>
          </div>
        </div>

        {/* Right: Alerts + Staffing + Notes */}
        <div className="px-5 py-6 space-y-4">
          {/* Alerts */}
          <div className="bg-card border border-border/60 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alerts</p>
              {overviewData.openIssues > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{overviewData.openIssues} High</span>}
            </div>
            {overviewData.openIssues === 0 ? (
              <p className="text-xs text-muted-foreground">No active alerts.</p>
            ) : (
              <div className="space-y-2">
                {[
                  { icon: '⚠️', title: 'Walk-in cooler out of range', sub: 'Cooler #1 · 41°F detected', time: '8:45 AM', cls: 'border-l-red-500' },
                  { icon: '🕐', title: '1 task past due', sub: 'Break down station', time: '8:10 AM', cls: 'border-l-amber-500' },
                  { icon: 'ℹ️', title: 'Review due soon', sub: 'Opening Shift · 9:00 AM', time: '8:00 AM', cls: 'border-l-blue-500' },
                ].map((a, i) => (
                  <div key={i} className={cn('bg-background border border-border border-l-4 rounded-lg px-3 py-2', a.cls)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-foreground">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground">{a.sub}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/issues')} className="w-full mt-2 text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1">View All Alerts <ChevronRight className="h-3 w-3" /></button>
          </div>

          {/* Today's Staffing */}
          <div className="bg-card border border-border/60 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today's Staffing</p>
              <span className="text-[10px] text-muted-foreground">As of 8:30 AM</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'Scheduled', value: 18, color: 'text-foreground' },
                { label: 'Clocked In', value: 16, color: 'text-green-400' },
                { label: 'Absent', value: 2, color: 'text-red-400' },
                { label: 'Late', value: 0, color: 'text-muted-foreground' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={cn('text-lg font-extrabold', color)}>{value}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/schedule')} className="w-full text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1">View Full Schedule <ChevronRight className="h-3 w-3" /></button>
          </div>

          {/* Recent Notes */}
          <div className="bg-card border border-border/60 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Notes</p>
              <button className="text-[10px] font-bold text-primary hover:underline">+ New Note</button>
            </div>
            <div className="space-y-3 divide-y divide-border/30">
              {[
                { note: 'Team huddle went great this morning. Focus on communication and clean as you go.', author: 'Taylor M.', time: '7:45 AM' },
                { note: 'New dessert special received well last night. Sold 14 orders.', author: 'Alex B.', time: 'Yesterday' },
              ].map((n, i) => (
                <div key={i} className={cn('', i > 0 && 'pt-3')}>
                  <p className="text-xs text-foreground leading-relaxed">{n.note}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.author} · {n.time}</p>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/logs')} className="w-full mt-3 text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1">View All Notes <ChevronRight className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-gradient-to-b from-card via-card to-card/80 border-b border-border backdrop-blur-sm px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Operations Center</h1>
          <p className="text-xs text-secondary-text mt-1">Organize your restaurant workflow</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input type="text" placeholder="Search tools..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-muted border border-border/50 rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Mobile Search Results */}
      {searchQuery.trim() && (
        <div className="lg:hidden px-4 py-4">
          {filteredTools.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Search Results ({filteredTools.length})</p>
              <div className="space-y-2">{filteredTools.map(tool => <OperationsSectionCard key={tool.path} route={tool} onClick={handleNavigate} isFavorite={favorites.includes(tool.path)} onToggleFavorite={toggleFavorite} variant="compact" />)}</div>
            </div>
          ) : (
            <div className="text-center py-8"><p className="text-sm text-secondary-text">No tools found matching "{searchQuery}"</p></div>
          )}
        </div>
      )}

      {/* Mobile Normal View */}
      {!searchQuery.trim() && (
        <div className="lg:hidden px-4 py-4 space-y-5">
          {favoriteTools.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /><h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Pinned Favorites</h2></div>
              <div className="grid grid-cols-2 gap-2">{favoriteTools.map(tool => <OperationsSectionCard key={tool.path} route={tool} onClick={handleNavigate} isFavorite={true} onToggleFavorite={toggleFavorite} variant="compact" />)}</div>
            </div>
          )}
          {recentToolsData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /><h2 className="text-xs font-bold uppercase tracking-widest text-secondary-text">Recently Used</h2></div>
              <div className="space-y-2">{recentToolsData.map(tool => <OperationsSectionCard key={tool.path} route={tool} onClick={handleNavigate} isFavorite={favorites.includes(tool.path)} onToggleFavorite={toggleFavorite} variant="compact" />)}</div>
            </div>
          )}
          <div className="space-y-3">
            {Object.entries(SECTION_CONFIG).map(([sectionKey, section]) => {
              const isExpanded = isSectionExpanded(sectionKey, section.defaultExpanded);
              const accessibleItems = section.items.map(findRoute).filter(r => r && (!r.roles || r.roles.includes(isAdmin ? 'admin' : 'user')));
              if (accessibleItems.length === 0) return null;
              return (
                <div key={sectionKey} className="border border-border/50 rounded-xl overflow-hidden">
                  <button onClick={() => toggleSection(sectionKey)} className="w-full bg-card/50 hover:bg-card/80 transition-colors p-3.5 flex items-center justify-between active:scale-95">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('text-sm font-bold', section.color)}>●</div>
                      <p className="text-xs font-bold text-foreground">{section.title}</p>
                    </div>
                    <div className="text-[10px] font-bold text-secondary-text">{isExpanded ? '−' : '+'}</div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border/30 divide-y divide-border/30">
                      {accessibleItems.map(tool => {
                        const Icon = tool.icon;
                        return (
                          <button key={tool.path} onClick={() => { haptics.light(); handleNavigate(tool.path); }} className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 active:scale-95 hover:bg-muted/30">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Icon className="h-4 w-4 stroke-[1.5] text-secondary-text" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground">{tool.label}</p>
                              {tool.description && <p className="text-[10px] text-secondary-text mt-0.5">{tool.description}</p>}
                            </div>
                            <button onClick={e => { e.stopPropagation(); haptics.light(); toggleFavorite(tool.path); }} className="text-[10px] font-bold text-secondary-text hover:text-primary">{favorites.includes(tool.path) ? '★' : '☆'}</button>
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