import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, ChevronDown } from 'lucide-react';

const TAG_TYPE_CONFIG = {
  employee: { label: 'Employee', icon: '👤', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  equipment: { label: 'Equipment', icon: '⚙️', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  area: { label: 'Area', icon: '📍', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  station: { label: 'Station', icon: '🛠️', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  role: { label: 'Role', icon: '👨‍💼', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  shift: { label: 'Shift', icon: '⏰', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  vendor: { label: 'Vendor', icon: '🏪', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  recipe: { label: 'Recipe', icon: '📖', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  inventory_item: { label: 'Inventory', icon: '📦', color: 'bg-lime-500/20 text-lime-300 border-lime-500/30' },
  beo_event: { label: 'BEO/Event', icon: '🎉', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  reservation: { label: 'Reservation', icon: '📅', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  location: { label: 'Location', icon: '🗺️', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  department: { label: 'Department', icon: '🏢', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

export default function LogTagManager({ selectedTags = [], onChange, maxTags = 10 }) {
  const [allTags, setAllTags] = useState([]);
  const [expandedType, setExpandedType] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    base44.entities.LogTag.filter({ is_active: true }, '-updated_date', 200)
      .then(tags => setAllTags(tags))
      .catch(() => setAllTags([]))
      .finally(() => setLoading(false));
  }, []);

  const handleTagToggle = (tag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      onChange(selectedTags.filter(t => t.id !== tag.id));
    } else if (selectedTags.length < maxTags) {
      onChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagId) => {
    onChange(selectedTags.filter(t => t.id !== tagId));
  };

  const groupedTags = {};
  allTags.forEach(tag => {
    if (!groupedTags[tag.tag_type]) groupedTags[tag.tag_type] = [];
    groupedTags[tag.tag_type].push(tag);
  });

  return (
    <div className="space-y-2">
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map(tag => {
            const config = TAG_TYPE_CONFIG[tag.tag_type];
            return (
              <div key={tag.id} className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold ${config.color}`}>
                <span>{config.icon}</span>
                <span>{tag.label}</span>
                <button onClick={() => handleRemoveTag(tag.id)} className="ml-0.5 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tag Type Dropdowns */}
      <div className="space-y-1.5">
        {Object.entries(TAG_TYPE_CONFIG).map(([typeKey, typeConfig]) => {
          const typeTags = groupedTags[typeKey] || [];
          if (typeTags.length === 0) return null;

          const isExpanded = expandedType === typeKey;

          return (
            <div key={typeKey}>
              <button
                onClick={() => setExpandedType(isExpanded ? null : typeKey)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all text-left"
              >
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>{typeConfig.icon}</span>
                  {typeConfig.label}
                  <span className="text-muted-foreground text-[10px]">({typeTags.length})</span>
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div className="mt-1 ml-2 space-y-1 border-l-2 border-border pl-2">
                  {typeTags.map(tag => {
                    const isSelected = selectedTags.some(t => t.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                          isSelected
                            ? `${typeConfig.color}`
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedTags.length >= maxTags && (
        <p className="text-xs text-amber-400">Max {maxTags} tags selected</p>
      )}
    </div>
  );
}