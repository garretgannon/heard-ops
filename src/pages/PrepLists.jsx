import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Settings, Search } from 'lucide-react';
import { haptics } from '@/utils/haptics';

function PrepListCard({ list, onTap }) {
  return (
    <button
      onClick={() => {
        haptics.light();
        onTap(list.id);
      }}
      className="w-full text-left bg-card border border-border rounded-lg p-3.5 space-y-2.5 active:scale-95 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground">{list.date}</p>
          <p className="text-xs text-secondary-text mt-0.5">
            {list.station} • {list.itemCount || 0} items
          </p>
        </div>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${list.completedCount === list.itemCount ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
          {list.completedCount || 0}/{list.itemCount || 0}
        </div>
      </div>
    </button>
  );
}

export default function PrepLists() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.DailyPrepTask.filter({ date: todayStr });
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
    setLoading(false);
  };

  const grouped = tasks.reduce((acc, task) => {
    const key = `${task.date} - ${task.station}`;
    if (!acc[key]) {
      acc[key] = { date: task.date, station: task.station, items: [], completedCount: 0, itemCount: 0 };
    }
    acc[key].items.push(task);
    acc[key].itemCount++;
    if (task.status === 'approved') acc[key].completedCount++;
    return acc;
  }, {});

  const filtered = Object.values(grouped).filter(g =>
    g.station.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-foreground">Prep Lists</h1>
          <button
            onClick={() => navigate('/prep-templates')}
            className="btn-secondary text-xs h-8 px-2 flex items-center gap-1"
          >
            <Settings className="h-3 w-3" />
            Templates
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-secondary-text text-sm">
            No prep lists for today
          </div>
        ) : (
          filtered.map((group) => (
            <div key={`${group.date}-${group.station}`}>
              <p className="text-xs font-bold text-secondary-text mb-2 uppercase tracking-wider">
                {group.station}
              </p>
              <PrepListCard list={group} onTap={() => {}} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;