import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Settings, Search } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import PrepTaskCard from '@/components/PrepTaskCard';

function PrepListGroup({ group, tasks, onTaskStatusChange }) {
  const stationTasks = tasks.filter(t => t.station === group.station && t.date === group.date);
  const completedCount = stationTasks.filter(t => ['completed', 'approved'].includes(t.status)).length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-foreground">{group.date}</h3>
        <div className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-500/20 text-amber-300">
          {completedCount}/{stationTasks.length}
        </div>
      </div>
      <div className="space-y-2">
        {stationTasks.map(task => (
          <PrepTaskCard
            key={task.id}
            task={task}
            onStatusChange={onTaskStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

export default function PrepLists() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTasks();
    const unsub = base44.entities.DailyPrepTask.subscribe(() => loadTasks());
    return () => unsub?.();
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
    if (['completed', 'approved'].includes(task.status)) acc[key].completedCount++;
    return acc;
  }, {});

  const filtered = Object.values(grouped).filter(g => {
    const matchStation = !filterStation || g.station === filterStation;
    const matchShift = !filterShift || g.items.some(i => i.shift === filterShift);
    const matchSearch = !search || g.station.toLowerCase().includes(search.toLowerCase());
    return matchStation && matchShift && matchSearch;
  });

  const stations = [...new Set(tasks.map(t => t.station))].sort();
  const shifts = [...new Set(tasks.map(t => t.shift))].sort();

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

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
          >
            <option value="">All Stations</option>
            {stations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
          >
            <option value="">All Shifts</option>
            {shifts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
              <PrepListGroup group={group} tasks={tasks} onTaskStatusChange={loadTasks} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;