import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ListChecks,
  MapPin,
  MessageSquare,
  Play,
  Thermometer,
} from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];
const isActive = (item) => item?.isActive !== false && item?.status !== 'inactive' && item?.status !== 'archived';
const normalize = (value) => String(value || '').trim().toLowerCase();

function matchesStation(item, station) {
  const stationKeys = [station?.id, station?.name].map(normalize).filter(Boolean);
  return stationKeys.some((key) => [item?.station_id, item?.station_name, item?.station, item?.role].map(normalize).includes(key));
}

function assignmentCoversStation(assignment, station, area) {
  if (!assignment || assignment.status === 'removed') return false;
  if (assignment.station_id && assignment.station_id === station?.id) return true;
  if (assignment.area_id && assignment.area_id === (area?.id || station?.area_id)) return true;
  return false;
}

function assignmentRank(assignment, station, area) {
  const typeRank = { primary: 0, support: 1, coverage: 2, manager: 3 };
  const scopeRank = assignment.station_id === station?.id ? 0 : assignment.area_id === (area?.id || station?.area_id) ? 1 : 2;
  return (scopeRank * 10) + (typeRank[assignment.assignment_type] ?? 9);
}

function generatedTaskIcon(taskType) {
  if (taskType === 'temperature_check') return Thermometer;
  if (taskType === 'cleaning_task') return ListChecks;
  return ClipboardCheck;
}

function equipmentAutomationSeeds(equipment, station, area, assigneeEmail) {
  const date = today();
  const seeds = [];

  equipment.forEach((item) => {
    const base = {
      source_template_id: item.id,
      assigned_user_email: assigneeEmail,
      area_id: area?.id || station?.area_id || '',
      station_id: station?.id,
      equipment_id: item.id,
      due_date: date,
      shift_type: item.required_on_opening ? 'opening' : 'mid',
      priority: item.requiresMaintenanceChecklist ? 'high' : 'medium',
      status: 'pending',
    };

    if (item.temp_enabled || item.requiresTemperatureLog) {
      seeds.push({
        ...base,
        task_title: `Temp check: ${item.name}`,
        task_type: 'temperature_check',
        description: item.temp_check_frequency_minutes ? `Scheduled every ${item.temp_check_frequency_minutes} minutes` : 'Manual station temperature check',
        duplicate_prevention_key: `${date}:${station?.id}:${item.id}:temperature_check`,
      });
    }

    if (item.requiresCleaningChecklist) {
      seeds.push({
        ...base,
        source_template_id: item.cleaning_template_id || item.id,
        task_title: item.cleaning_template_name ? `${item.cleaning_template_name}: ${item.name}` : `Clean ${item.name}`,
        task_type: 'cleaning_task',
        description: item.cleaning_template_name ? `Cleaning template linked to ${item.name}` : 'Station equipment cleaning task',
        required_proof: item.cleaning_template_id ? ['checkbox'] : ['checkbox'],
        duplicate_prevention_key: `${date}:${station?.id}:${item.id}:cleaning_task`,
      });
    }

    if (item.requiresMaintenanceChecklist) {
      seeds.push({
        ...base,
        source_template_id: item.maintenance_template_id || item.id,
        task_title: item.maintenance_template_name ? `${item.maintenance_template_name}: ${item.name}` : `Inspect ${item.name}`,
        task_type: 'maintenance_check',
        description: item.maintenance_template_name ? `Maintenance automation linked to ${item.name}` : 'Station equipment maintenance check',
        required_proof: ['checkbox', 'text_note'],
        requires_approval: true,
        duplicate_prevention_key: `${date}:${station?.id}:${item.id}:maintenance_check`,
      });
    }

    if (item.inInventory) {
      seeds.push({
        ...base,
        source_template_id: item.inventory_item_id || item.id,
        task_title: item.inventory_item_name ? `Stock ${item.inventory_item_name}` : `Stock ${item.name}`,
        task_type: 'station_readiness',
        description: item.inventory_item_name ? `Inventory item linked to ${item.name}` : 'Verify station equipment and supplies are stocked',
        required_proof: ['checkbox'],
        duplicate_prevention_key: `${date}:${station?.id}:${item.id}:station_readiness`,
      });
    }
  });

  return seeds;
}

async function uploadShiftPhoto(file) {
  const uploader = base44.integrations?.Core?.UploadFile || base44.integrations?.UploadFile;
  if (!uploader) return { file_url: URL.createObjectURL(file), file_name: file.name };

  const result = await uploader({ file });
  return {
    file_url: result?.file_url || result?.url || URL.createObjectURL(file),
    file_name: file.name,
  };
}

const TASK_TYPE_STYLES = {
  temperature_check: { border: 'border-l-blue-500/70', bg: 'bg-blue-500/5', marker: 'border-blue-500/50 text-blue-400' },
  cleaning_task:     { border: 'border-l-green-500/70', bg: 'bg-green-500/5', marker: 'border-green-500/50 text-green-400' },
  maintenance_check: { border: 'border-l-amber-500/70', bg: 'bg-amber-500/5', marker: 'border-amber-500/50 text-amber-400' },
  station_readiness: { border: 'border-l-primary/70', bg: 'bg-primary/5', marker: 'border-primary/50 text-primary' },
  prep:              { border: 'border-l-purple-500/70', bg: 'bg-purple-500/5', marker: 'border-purple-500/50 text-purple-400' },
  sidework:          { border: 'border-l-slate-400/50', bg: 'bg-black/20', marker: 'border-border text-muted-foreground' },
  closing:           { border: 'border-l-slate-400/50', bg: 'bg-black/20', marker: 'border-border text-muted-foreground' },
};

const STAGES = [
  { id: 'brief',   label: 'Brief' },
  { id: 'work',    label: 'Open' },
  { id: 'closing', label: 'Close' },
  { id: 'done',    label: 'Done' },
];

function StageBar({ stage }) {
  const currentIndex = STAGES.findIndex((s) => s.id === stage);
  return (
    <div className="flex items-center gap-1.5">
      {STAGES.map((s, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={s.id} className="flex items-center gap-1.5">
            <div className={cn(
              'flex h-5 items-center rounded-full px-2 text-[9px] font-black uppercase tracking-[0.1em] transition-all',
              isDone    ? 'bg-green-500/20 text-green-400' :
              isCurrent ? 'bg-primary/20 text-primary' :
                          'bg-black/25 text-muted-foreground/50'
            )}>
              {s.label}
            </div>
            {i < STAGES.length - 1 && (
              <div className={cn('h-px w-3 rounded-full', isDone ? 'bg-green-500/40' : 'bg-border/40')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({ eyebrow, title, children, action }) {
  return (
    <section
      className="rounded-2xl border border-border/50 p-4"
      style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="metric-label">{eyebrow}</p>
          {title && <h2 className="mt-1 text-lg font-black text-foreground">{title}</h2>}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function TaskRow({ task, checked, onToggle }) {
  const Icon = task.icon || ClipboardCheck;
  const styles = TASK_TYPE_STYLES[task.type] || TASK_TYPE_STYLES.closing;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-l-4 px-3 py-3 text-left transition-all duration-150 active:scale-[0.99]',
        checked
          ? 'border-green-500/40 border-l-green-500/60 bg-green-500/5 opacity-70'
          : cn('border-border/40', styles.border, styles.bg)
      )}
    >
      <span className={cn(
        'status-marker status-marker-sm shrink-0 transition-all',
        checked ? 'status-success' : cn('border', styles.marker, 'bg-transparent')
      )}
      style={!checked ? { boxShadow: 'none', background: 'transparent' } : undefined}
      >
        {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm font-bold transition-colors', checked ? 'text-muted-foreground line-through' : 'text-foreground')}>{task.title}</span>
        <span className="block text-[10px] text-muted-foreground">{task.meta}</span>
      </span>
      {checked && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />}
    </button>
  );
}

function PhotoCapture({ label, hint, preview, onChange, kind }) {
  return (
    <div className="space-y-2">
      <label
        className={cn(
          'group relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all',
          preview
            ? 'border-green-500/40 bg-green-500/5'
            : 'border-primary/35 bg-primary/5 hover:border-primary/55 hover:bg-primary/8'
        )}
      >
        <div className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full border transition-all',
          preview
            ? 'border-green-500/40 bg-green-500/15 text-green-400'
            : 'border-primary/40 bg-primary/15 text-primary group-hover:bg-primary/20'
        )}>
          <Camera className="h-5 w-5" />
        </div>
        <span className="mt-2.5 text-sm font-black text-foreground">{preview ? label + ' ✓' : label}</span>
        <span className="mt-1 text-xs text-muted-foreground">{preview ? 'Tap to retake' : hint}</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => onChange(event.target.files?.[0], kind)}
        />
      </label>
      {preview && (
        <div className="relative overflow-hidden rounded-2xl">
          <img src={preview} alt={label} className="max-h-52 w-full object-cover" />
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 backdrop-blur-sm">
            <CheckCircle2 className="h-3 w-3 text-green-400" />
            <span className="text-[10px] font-black text-green-400">Verified</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StationShift() {
  const { user, loading: userLoading } = useCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [station, setStation] = useState(null);
  const [area, setArea] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [lineup, setLineup] = useState(null);
  const [eightySixItems, setEightySixItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [sideworkItems, setSideworkItems] = useState([]);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [session, setSession] = useState(null);
  const [stage, setStage] = useState('brief');
  const [acknowledged, setAcknowledged] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [closingPhotoPreview, setClosingPhotoPreview] = useState('');
  const [completedTasks, setCompletedTasks] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadShift();
  }, [user?.email]);

  const loadShift = async () => {
    setLoading(true);
    const date = today();
    const [
      employees,
      stations,
      areas,
      allEquipment,
      lineups,
      active86s,
      dayEvents,
      prep,
      sidework,
      sessions,
      generated,
      assignments,
      sideworkTemplates,
      sideworkTemplateItems,
    ] = await Promise.all([
      base44.entities.Employee.filter({ email: user.email }).catch(() => []),
      base44.entities.Station.list().catch(() => []),
      base44.entities.Area.list().catch(() => []),
      base44.entities.Equipment.list().catch(() => []),
      base44.entities.LineUp.filter({ date }).catch(() => []),
      base44.entities.EightySixItem.filter({ status: 'active' }).catch(() => []),
      base44.entities.CalendarEvent.filter({ date }).catch(() => []),
      base44.entities.PrepItem.list('-created_date', 100).catch(() => []),
      base44.entities.DailySideWorkTask
        ? base44.entities.DailySideWorkTask.filter({ date }).catch(() => [])
        : Promise.resolve([]),
      base44.entities.StationShiftSession
        ? base44.entities.StationShiftSession.filter({ date, employee_email: user.email }).catch(() => [])
        : Promise.resolve([]),
      base44.entities.GeneratedTask.filter({ due_date: date }).catch(() => []),
      base44.entities.ShiftAssignment
        ? base44.entities.ShiftAssignment.filter({ shift_date: date }).catch(() => [])
        : Promise.resolve([]),
      base44.entities.SideWorkTemplate.list('-updated_date', 200).catch(() => []),
      base44.entities.SideWorkTemplateItem.list('-sortOrder', 500).catch(() => []),
    ]);

    const employeeRecord = employees[0] || null;
    const activeStations = stations.filter(isActive);
    const employeeAssignments = assignments
      .filter((assignment) => assignment.employee_id === employeeRecord?.id || assignment.employee_email === user.email)
      .filter((assignment) => assignment.status !== 'removed')
      .sort((a, b) => ({ primary: 0, support: 1, coverage: 2, manager: 3 }[a.assignment_type] ?? 9) - ({ primary: 0, support: 1, coverage: 2, manager: 3 }[b.assignment_type] ?? 9));
    const explicitAssignment = employeeAssignments.find((assignment) => assignment.station_id);
    const areaCoverageAssignment = employeeAssignments.find((assignment) => assignment.area_id);
    const assignedStations = (employeeRecord?.assigned_stations || []).map(normalize);
    const assignedStation = activeStations.find((item) => explicitAssignment?.station_id === item.id) ||
      activeStations.find((item) => areaCoverageAssignment?.area_id && item.area_id === areaCoverageAssignment.area_id) ||
      activeStations.find((item) => (
        assignedStations.includes(normalize(item.id)) ||
        assignedStations.includes(normalize(item.name))
      )) || activeStations[0] || null;
    const stationArea = assignedStation
      ? areas.find((item) => item.id === assignedStation.area_id || item.name === assignedStation.area_name)
      : null;
    const stationEquipment = assignedStation
      ? allEquipment.filter((item) => isActive(item) && matchesStation(item, assignedStation))
      : [];
    let stationGeneratedTasks = assignedStation
      ? generated.filter((item) => item.station_id === assignedStation.id || stationEquipment.some((equipmentItem) => equipmentItem.id === item.equipment_id))
      : [];

    const stationCoverage = assignedStation
      ? assignments
          .filter((assignment) => assignmentCoversStation(assignment, assignedStation, stationArea))
          .sort((a, b) => assignmentRank(a, assignedStation, stationArea) - assignmentRank(b, assignedStation, stationArea))
      : [];
    const accountableAssignee = stationCoverage[0]?.employee_email || user.email;

    if (assignedStation && base44.entities.DailySideWorkTask) {
      const weekday = new Date(`${date}T00:00:00`).getDay();
      const activeTemplates = sideworkTemplates.filter((template) => {
        if (template.isActive === false) return false;
        if (template.station_id && template.station_id !== assignedStation.id) return false;
        if (!template.station_id && template.station && normalize(template.station) !== normalize(assignedStation.name)) return false;
        if (template.repeatType === 'weekly' && Array.isArray(template.repeatDays) && template.repeatDays.length && !template.repeatDays.includes(weekday)) return false;
        return true;
      });
      const existingSideworkKeys = new Set(sidework.map((task) => task.sideWorkTemplateItemId ? `${date}:${task.sideWorkTemplateItemId}` : '').filter(Boolean));
      const sideworkSeeds = [];
      activeTemplates.forEach((template) => {
        sideworkTemplateItems
          .filter((item) => item.sideWorkTemplateId === template.id)
          .forEach((item) => {
            const key = `${date}:${item.id}`;
            if (existingSideworkKeys.has(key)) return;
            sideworkSeeds.push({
              sideWorkTemplateId: template.id,
              sideWorkTemplateItemId: item.id,
              date,
              shift: template.shift || 'all',
              department: template.department,
              area_id: template.area_id || assignedStation.area_id || '',
              area_name: template.area_name || assignedStation.area_name || '',
              station_id: template.station_id || assignedStation.id,
              station: template.station || assignedStation.name,
              job_code_id: template.job_code_id || item.job_code_id || '',
              jobCode: template.jobCode || item.jobCode || '',
              taskName: item.taskName,
              dueTime: item.dueTime || '',
              shiftPhase: item.shiftPhase || 'anytime',
              priority: item.priority || 'medium',
              status: 'pending',
              requiresPhoto: Boolean(item.requiresPhoto || template.requiresPhoto),
              requiresManagerReview: Boolean(item.requiresManagerReview || template.requiresManagerReview),
            });
          });
      });
      if (sideworkSeeds.length > 0) {
        const createdSidework = await Promise.all(sideworkSeeds.map((seed) => base44.entities.DailySideWorkTask.create(seed).catch(() => null)));
        sidework.push(...createdSidework.filter(Boolean));
      }
    }

    if (assignedStation && base44.entities.GeneratedTask) {
      const seeds = equipmentAutomationSeeds(stationEquipment, assignedStation, stationArea, accountableAssignee);
      const existingKeys = new Set(stationGeneratedTasks.map((item) => item.duplicate_prevention_key).filter(Boolean));
      const missingSeeds = seeds.filter((seed) => !existingKeys.has(seed.duplicate_prevention_key));
      if (missingSeeds.length > 0) {
        const created = await Promise.all(missingSeeds.map((seed) => base44.entities.GeneratedTask.create(seed).catch(() => null)));
        stationGeneratedTasks = [...stationGeneratedTasks, ...created.filter(Boolean)];
      }
    }
    const existingSession = assignedStation
      ? sessions.find((item) => item.station_id === assignedStation.id) || sessions[0] || null
      : null;

    setEmployee(employeeRecord);
    setStation(assignedStation);
    setArea(stationArea || null);
    setEquipment(stationEquipment);
    setLineup(lineups[0] || null);
    setEightySixItems(active86s);
    setEvents(dayEvents.filter((item) => !item.is_sensitive));
    setPrepItems(assignedStation ? prep.filter((item) => matchesStation(item, assignedStation)) : []);
    setSideworkItems(assignedStation ? sidework.filter((item) => matchesStation(item, assignedStation)) : []);
    setGeneratedTasks(stationGeneratedTasks);
    setSession(existingSession);
    if (existingSession) {
      setAcknowledged(Boolean(existingSession.brief_acknowledged_at));
      setPhotoPreview(existingSession.opening_photo_url || '');
      setClosingPhotoPreview(existingSession.closing_photo_url || '');
      setCompletedTasks([
        ...(existingSession.tasks || []),
        ...(existingSession.closing_tasks || []),
      ].reduce((acc, task) => {
        if (task.status === 'completed') acc[task.task_id] = true;
        return acc;
      }, stationGeneratedTasks.reduce((acc, task) => {
        if (task.status === 'completed') acc[`generated-${task.id}`] = true;
        return acc;
      }, {})));

      if (existingSession.status === 'submitted') setStage('done');
      else if (existingSession.status === 'closing') setStage('closing');
      else if (existingSession.status === 'in_progress') setStage('work');
      else setStage('brief');
    } else {
      setCompletedTasks(stationGeneratedTasks.reduce((acc, task) => {
        if (task.status === 'completed') acc[`generated-${task.id}`] = true;
        return acc;
      }, {}));
    }
    setLoading(false);
  };

  const workTasks = useMemo(() => {
    const automationTasks = generatedTasks.map((item) => ({
      id: `generated-${item.id}`,
      generatedTaskId: item.id,
      type: item.task_type,
      title: item.task_title || 'Station task',
      meta: item.due_time ? `Due ${item.due_time}` : item.description || 'Equipment automation',
      icon: generatedTaskIcon(item.task_type),
      sourceStatus: item.status,
    }));
    const prepTasks = prepItems.map((item) => ({ id: `prep-${item.id}`, type: 'prep', title: item.name || 'Prep item', meta: item.due_time ? `Due ${item.due_time}` : 'Station prep list', icon: ClipboardCheck }));
    const sideworkTasks = sideworkItems.map((item) => ({ id: `side-${item.id}`, type: 'sidework', title: item.taskName || item.task_name || 'Side work', meta: item.dueTime || item.due_time ? `Due ${item.dueTime || item.due_time}` : 'Station side work', icon: ListChecks }));

    return [...automationTasks, ...prepTasks, ...sideworkTasks];
  }, [generatedTasks, prepItems, sideworkItems]);

  const closingTasks = useMemo(() => [
    ...equipment.map((item) => ({ id: `close-${item.id}`, title: `Reset ${item.name}`, meta: 'Clean, stock, and leave ready', icon: CheckCircle2 })),
    { id: 'close-photo', title: 'Final station photo', meta: 'Capture how the station was left', icon: Camera },
  ], [equipment]);

  const activeTasks = stage === 'closing' ? closingTasks : workTasks;
  const doneCount = activeTasks.filter((task) => completedTasks[task.id]).length;
  const allDone = activeTasks.length === 0 || doneCount === activeTasks.length;

  const serializeTasks = (tasks, completionMap) => tasks.map((task) => ({
    task_id: task.id,
    task_type: task.type || 'closing',
    title: task.title,
    meta: task.meta,
    status: completionMap[task.id] ? 'completed' : 'pending',
    completed_at: completionMap[task.id] ? new Date().toISOString() : '',
  }));

  const sessionPayload = (overrides = {}, completionMap = completedTasks) => ({
    session_key: `${today()}-${user?.email}-${station?.id}`,
    date: today(),
    employee_email: user?.email,
    employee_name: employee?.full_name || user?.full_name || user?.email,
    station_id: station?.id,
    station_name: station?.name,
    area_id: area?.id || station?.area_id || '',
    area_name: area?.name || station?.area_name || '',
    tasks: serializeTasks(workTasks, completionMap),
    closing_tasks: serializeTasks(closingTasks, completionMap),
    completion_summary: {
      work_total: workTasks.length,
      work_completed: workTasks.filter((task) => completionMap[task.id]).length,
      close_total: closingTasks.length,
      close_completed: closingTasks.filter((task) => completionMap[task.id]).length,
    },
    ...overrides,
  });

  const saveSession = async (overrides = {}, completionMap = completedTasks) => {
    if (!station || !user?.email || !base44.entities.StationShiftSession) return null;
    setSaving(true);
    try {
      const payload = sessionPayload(overrides, completionMap);
      const saved = session?.id
        ? await base44.entities.StationShiftSession.update(session.id, payload)
        : await base44.entities.StationShiftSession.create(payload);
      setSession(saved || { ...session, ...payload });
      return saved;
    } catch (error) {
      console.error('Failed to save station shift session:', error);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const acknowledgeBrief = async () => {
    setAcknowledged(true);
    await saveSession({ status: 'brief_acknowledged', brief_acknowledged_at: new Date().toISOString() });
  };

  const startShift = async () => {
    setStage('work');
    await saveSession({
      status: 'in_progress',
      brief_acknowledged_at: session?.brief_acknowledged_at || new Date().toISOString(),
      started_at: session?.started_at || new Date().toISOString(),
    });
  };

  const startClosing = async () => {
    setStage('closing');
    await saveSession({ status: 'closing', closing_started_at: session?.closing_started_at || new Date().toISOString() });
  };

  const submitShift = async () => {
    setStage('done');
    await saveSession({ status: 'submitted', submitted_at: new Date().toISOString() });
  };

  const toggleTask = async (taskId) => {
    const next = { ...completedTasks, [taskId]: !completedTasks[taskId] };
    setCompletedTasks(next);
    const task = workTasks.find((item) => item.id === taskId);
    if (task?.generatedTaskId) {
      await base44.entities.GeneratedTask.update(task.generatedTaskId, {
        status: next[taskId] ? 'completed' : 'pending',
        completed_at: next[taskId] ? new Date().toISOString() : '',
      }).catch((error) => console.error('Failed to update generated task:', error));
      setGeneratedTasks((prev) => prev.map((item) => (
        item.id === task.generatedTaskId
          ? { ...item, status: next[taskId] ? 'completed' : 'pending', completed_at: next[taskId] ? new Date().toISOString() : '' }
          : item
      )));
    }
    await saveSession({ status: stage === 'closing' ? 'closing' : 'in_progress' }, next);
  };

  const attachPhoto = async (file, kind) => {
    if (!file) return;
    const fieldPrefix = kind === 'closing' ? 'closing' : 'opening';
    const uploaded = await uploadShiftPhoto(file);
    if (kind === 'closing') setClosingPhotoPreview(uploaded.file_url);
    else setPhotoPreview(uploaded.file_url);

    await saveSession({
      [`${fieldPrefix}_photo_url`]: uploaded.file_url,
      [`${fieldPrefix}_photo_name`]: uploaded.file_name,
      status: kind === 'closing' ? 'closing' : 'in_progress',
    });
  };

  if (userLoading || loading) {
    return (
      <div className="app-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!station) {
    const firstName = (employee?.full_name || user?.full_name || '').split(' ')[0];
    return (
      <div className="app-screen">
        <main className="app-page mx-auto max-w-[620px] lg:max-w-6xl space-y-4 pb-28">
          <header className="pt-1 space-y-1">
            <p className="metric-label">My Shift</p>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {firstName ? `Hey, ${firstName}.` : 'Welcome.'}
            </h1>
            <p className="text-sm text-muted-foreground">You're not assigned to a station yet.</p>
          </header>

          <div
            className="rounded-2xl border border-amber-500/25 p-4 space-y-3"
            style={{ background: 'linear-gradient(160deg, rgba(180,90,0,0.10) 0%, rgba(0,0,0,0.25) 100%)' }}
          >
            <div className="flex items-start gap-3">
              <span className="status-marker status-marker-md status-warning shrink-0">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-black text-foreground">Waiting for station assignment</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  A manager needs to assign you to a station before your shift can begin. Find your manager or check back shortly.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 overflow-hidden"
            style={{ background: 'linear-gradient(160deg, rgba(13,20,27,0.97) 0%, rgba(6,10,14,0.97) 100%)' }}
          >
            <div className="px-4 py-3 border-b border-border/30">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">While you wait</p>
            </div>
            {[
              { label: 'Read training materials', detail: 'Courses and certifications', path: '/training', icon: BookOpen },
              { label: 'Check station comms', detail: "Today's announcements and notes", path: '/comms', icon: MessageSquare },
            ].map(({ label, detail, path, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left border-b border-border/30 last:border-b-0 active:scale-[0.99] transition-all hover:bg-white/3"
              >
                <span className="status-marker status-marker-sm status-neutral shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <main className="app-page mx-auto max-w-[620px] lg:max-w-6xl space-y-4 pb-28">
        <header className="space-y-3 pt-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="metric-label">{area?.name || 'Station'}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">{station.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{employee?.full_name || user?.full_name || user?.email}</p>
            </div>
            <span className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]',
              stage === 'done' ? 'border-green-500/40 bg-green-500/15 text-green-400' :
              stage === 'brief' ? 'border-primary/35 bg-primary/10 text-primary' :
              stage === 'work' ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' :
              'border-amber-500/40 bg-amber-500/10 text-amber-400'
            )}>
              {stage === 'brief' ? 'Brief' : stage === 'work' ? 'Open' : stage === 'done' ? 'Submitted' : 'Closing'}
            </span>
          </div>
          <StageBar stage={stage} />
        </header>

        {stage === 'brief' && (
          <>
            <SectionCard eyebrow="Day Brief" title="Read before starting">
              <div className="space-y-3">
                <div className="rounded-xl border border-border/50 bg-black/20 p-3">
                  <p className="text-xs font-black text-foreground">Management Notes</p>
                  <p className="mt-1 text-sm text-muted-foreground">{lineup?.notes || 'No management notes posted yet.'}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-black/20 p-3">
                  <p className="text-xs font-black text-foreground">Specials / Focus</p>
                  <p className="mt-1 text-sm text-muted-foreground">{lineup?.specials || lineup?.prep_priorities || 'No specials or focus items posted.'}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard eyebrow="86'd Items" title={`${eightySixItems.length} active`}>
              {eightySixItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active 86s.</p>
              ) : (
                <div className="space-y-2">
                  {eightySixItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-xl border border-border/50 bg-black/20 p-3">
                      <p className="text-sm font-bold text-foreground">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard eyebrow="Events" title={`${events.length} today`}>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No special events posted for today.</p>
              ) : (
                <div className="space-y-2">
                  {events.slice(0, 4).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-black/20 p-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-bold text-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.time || event.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <button
              type="button"
              onClick={acknowledgeBrief}
              disabled={saving}
              className={cn(
                'h-12 w-full rounded-2xl border text-sm font-black transition-all',
                acknowledged
                  ? 'border-green-500/40 bg-green-500/15 text-green-400'
                  : 'border-border/60 bg-card/70 text-foreground hover:border-primary/30 hover:bg-primary/5'
              )}
            >
              {saving ? 'Saving...' : acknowledged ? '✓ Brief Acknowledged' : 'Acknowledge Brief'}
            </button>
            <button
              type="button"
              disabled={!acknowledged || saving}
              onClick={startShift}
              className="relative h-14 w-full overflow-hidden rounded-2xl text-sm font-black text-white transition-all disabled:opacity-40"
              style={{
                background: acknowledged ? 'linear-gradient(135deg, rgba(230,106,31,0.9) 0%, rgba(190,75,15,0.95) 100%)' : undefined,
                backgroundColor: !acknowledged ? 'rgba(255,255,255,0.06)' : undefined,
                boxShadow: acknowledged ? '0 0 0 1px rgba(230,106,31,0.35), 0 4px 20px rgba(230,106,31,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
              }}
            >
              <Play className="mr-2 inline h-4 w-4" />
              Start Shift
            </button>
          </>
        )}

        {stage === 'work' && (
          <>
            <SectionCard eyebrow="Opening Photo" title="Capture station handoff">
              <PhotoCapture
                label="Take opening photo"
                hint="Show how the station was left before work starts"
                preview={photoPreview}
                onChange={attachPhoto}
                kind="opening"
              />
            </SectionCard>

            <SectionCard eyebrow="Station Work" title={`${doneCount} of ${workTasks.length} complete`}
              action={
                workTasks.length > 0 && (
                  <span className="text-xs font-bold text-muted-foreground">
                    {Math.round((doneCount / workTasks.length) * 100)}%
                  </span>
                )
              }
            >
              {workTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No station tasks are configured yet.</p>
              ) : (
                <>
                  {workTasks.length > 1 && (
                    <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.round((doneCount / workTasks.length) * 100)}%` }}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {workTasks.map((task) => (
                      <TaskRow key={task.id} task={task} checked={Boolean(completedTasks[task.id])} onToggle={() => toggleTask(task.id)} />
                    ))}
                  </div>
                </>
              )}
            </SectionCard>

            <button
              type="button"
              disabled={!allDone || saving}
              onClick={startClosing}
              className="relative h-14 w-full overflow-hidden rounded-2xl text-sm font-black text-white transition-all disabled:opacity-40"
              style={{
                background: (!allDone || saving) ? undefined : 'linear-gradient(135deg, rgba(230,106,31,0.9) 0%, rgba(190,75,15,0.95) 100%)',
                backgroundColor: (!allDone || saving) ? 'rgba(255,255,255,0.06)' : undefined,
                boxShadow: (!allDone || saving) ? 'none' : '0 0 0 1px rgba(230,106,31,0.35), 0 4px 20px rgba(230,106,31,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {saving ? 'Saving...' : allDone ? 'Start Close Shift →' : `Complete all tasks to close (${workTasks.length - doneCount} remaining)`}
            </button>
          </>
        )}

        {stage === 'closing' && (
          <>
            <SectionCard eyebrow="Close Station" title={`${doneCount} of ${closingTasks.length} complete`}>
              {closingTasks.length > 1 && (
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${Math.round((doneCount / closingTasks.length) * 100)}%` }}
                  />
                </div>
              )}
              <div className="space-y-2">
                {closingTasks.map((task) => (
                  <TaskRow key={task.id} task={task} checked={Boolean(completedTasks[task.id])} onToggle={() => toggleTask(task.id)} />
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Closing Photo" title="Station handoff proof">
              <PhotoCapture
                label="Take closing photo"
                hint="Show how the station was left for the next shift"
                preview={closingPhotoPreview}
                onChange={attachPhoto}
                kind="closing"
              />
            </SectionCard>

            <button
              type="button"
              disabled={!allDone || saving}
              onClick={submitShift}
              className="relative h-14 w-full overflow-hidden rounded-2xl text-sm font-black text-white transition-all disabled:opacity-40"
              style={{
                background: (!allDone || saving) ? undefined : 'linear-gradient(135deg, rgba(34,197,94,0.85) 0%, rgba(21,128,61,0.9) 100%)',
                backgroundColor: (!allDone || saving) ? 'rgba(255,255,255,0.06)' : undefined,
                boxShadow: (!allDone || saving) ? 'none' : '0 0 0 1px rgba(34,197,94,0.3), 0 4px 20px rgba(34,197,94,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {saving ? 'Saving...' : allDone ? 'Submit Shift Close →' : `Complete all tasks to submit (${closingTasks.length - doneCount} remaining)`}
            </button>
          </>
        )}

        {stage === 'done' && (
          <section
            className="rounded-2xl border border-green-500/25 p-6 text-center"
            style={{ background: 'linear-gradient(160deg, rgba(34,197,94,0.06) 0%, rgba(13,20,27,0.97) 100%)', boxShadow: '0 0 0 1px rgba(34,197,94,0.15), 0 4px 24px rgba(0,0,0,0.4)' }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-green-500/40 bg-green-500/15">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-foreground">Station Submitted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your station close has been submitted for manager review. Great work on {station.name}.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Pending manager review
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
