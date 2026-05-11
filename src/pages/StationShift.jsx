import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ListChecks,
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

function SectionCard({ eyebrow, title, children, action }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-4">
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
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-black/20 px-3 py-3 text-left transition-all active:scale-[0.99]"
    >
      <span className={cn('status-marker status-marker-sm', checked ? 'status-success' : 'status-neutral')}>
        {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-foreground">{task.title}</span>
        <span className="block text-[10px] text-muted-foreground">{task.meta}</span>
      </span>
    </button>
  );
}

export default function StationShift() {
  const { user, loading: userLoading } = useCurrentUser();
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
    return (
      <div className="app-screen">
        <main className="app-page mx-auto max-w-[620px]">
          <SectionCard eyebrow="Station Assignment" title="No station assigned">
            <p className="text-sm text-muted-foreground">Ask a manager to assign you to a station before starting your shift.</p>
          </SectionCard>
        </main>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <main className="app-page mx-auto max-w-[620px] space-y-4 pb-28">
        <header className="flex items-start justify-between gap-4 pt-1">
          <div>
            <p className="metric-label">{area?.name || 'Station'}</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">{station.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{employee?.full_name || user?.full_name || user?.email}</p>
          </div>
          <span className="status-pill status-info">{stage === 'brief' ? 'Brief' : stage === 'work' ? 'Open' : stage === 'done' ? 'Submitted' : 'Closing'}</span>
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
              className={cn('h-12 w-full rounded-xl text-sm font-black transition-all', acknowledged ? 'bg-green-500/20 text-green-400' : 'bg-muted text-foreground')}
            >
              {saving ? 'Saving...' : acknowledged ? 'Acknowledged' : 'Acknowledge Brief'}
            </button>
            <button
              type="button"
              disabled={!acknowledged || saving}
              onClick={startShift}
              className="h-12 w-full rounded-xl bg-primary text-sm font-black text-primary-foreground transition-all disabled:opacity-50"
            >
              <Play className="mr-2 inline h-4 w-4" />
              Start Shift
            </button>
          </>
        )}

        {stage === 'work' && (
          <>
            <SectionCard eyebrow="Open Station" title="Capture station handoff">
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-black/20 p-4 text-center">
                <Camera className="h-6 w-6 text-primary" />
                <span className="mt-2 text-sm font-bold text-foreground">{photoPreview ? 'Opening photo attached' : 'Take opening photo'}</span>
                <span className="mt-1 text-xs text-muted-foreground">Show how the station was left before work starts.</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    attachPhoto(file, 'opening');
                  }}
                />
              </label>
              {photoPreview && <img src={photoPreview} alt="Opening station" className="mt-3 max-h-44 w-full rounded-xl object-cover" />}
            </SectionCard>

            <SectionCard eyebrow="Station Work" title={`${doneCount} of ${workTasks.length} complete`}>
              {workTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No station tasks are configured yet.</p>
              ) : (
                <div className="space-y-2">
                  {workTasks.map((task) => (
                    <TaskRow key={task.id} task={task} checked={Boolean(completedTasks[task.id])} onToggle={() => toggleTask(task.id)} />
                  ))}
                </div>
              )}
            </SectionCard>

            <button
              type="button"
              disabled={!allDone || saving}
              onClick={startClosing}
              className="h-12 w-full rounded-xl bg-primary text-sm font-black text-primary-foreground transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Start Close Shift'}
            </button>
          </>
        )}

        {stage === 'closing' && (
          <>
            <SectionCard eyebrow="Close Station" title={`${doneCount} of ${closingTasks.length} complete`}>
              <div className="space-y-2">
                {closingTasks.map((task) => (
                  <TaskRow key={task.id} task={task} checked={Boolean(completedTasks[task.id])} onToggle={() => toggleTask(task.id)} />
                ))}
              </div>
              <label className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-black/20 p-4 text-center">
                <Camera className="h-5 w-5 text-primary" />
                <span className="mt-2 text-sm font-bold text-foreground">{closingPhotoPreview ? 'Closing photo attached' : 'Take closing photo'}</span>
                <span className="mt-1 text-xs text-muted-foreground">Show how the station was left for the next shift.</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    attachPhoto(file, 'closing');
                  }}
                />
              </label>
              {closingPhotoPreview && <img src={closingPhotoPreview} alt="Closing station" className="mt-3 max-h-44 w-full rounded-xl object-cover" />}
            </SectionCard>

            <button
              type="button"
              disabled={!allDone || saving}
              onClick={submitShift}
              className="h-12 w-full rounded-xl bg-primary text-sm font-black text-primary-foreground transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Submit Shift Close'}
            </button>
          </>
        )}

        {stage === 'done' && (
          <SectionCard eyebrow="Shift Complete" title="Station submitted">
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm font-bold text-foreground">Your station close has been submitted for manager review.</p>
            </div>
          </SectionCard>
        )}
      </main>
    </div>
  );
}
