import { useState } from 'react';
import { Plus, ChevronDown, List, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOG_CREATE_TYPES = [
  { id: 'temperature', label: 'Temperature Log', icon: '🌡️' },
  { id: 'maintenance', label: 'Maintenance Request', icon: '🔧' },
  { id: 'incident', label: 'Incident Report', icon: '🚨' },
  { id: 'employee', label: 'Employee Log', icon: '👤' },
  { id: 'manager', label: 'Manager Note', icon: '📝' },
  { id: 'waste', label: 'Waste Entry', icon: '🗑️' },
  { id: 'eighty_six', label: '86 Item', icon: '❌' },
  { id: 'cleaning', label: 'Cleaning Log', icon: '🧹' },
  { id: 'bathroom', label: 'Bathroom Checklist', icon: '🚿' },
];

export default function LogsPageHeader({ onCreateClick, onViewChange, activeView }) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const views = [
    { id: 'feed', label: 'Feed', icon: List },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'review', label: 'Review Queue', icon: Clock },
  ];

  return (
    <div className="bg-card border-b border-border/40 px-4 py-4 sm:px-6 sticky top-0 z-20">
      {/* Title + Primary Action */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Logs</h1>
          <p className="text-xs text-muted-foreground mt-1">Track every operational record, issue, checklist, and shift note</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all">
            <Plus className="h-4 w-4" /> New Log
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          {showCreateMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
              {LOG_CREATE_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => { onCreateClick(type.id); setShowCreateMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted transition-all">
                  <span className="text-base">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1">
        {views.map(v => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold border transition-all',
                activeView === v.id
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              )}>
              <Icon className="h-3.5 w-3.5" /> {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}