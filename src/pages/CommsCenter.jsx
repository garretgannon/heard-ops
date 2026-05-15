import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import DesktopPageHeader from '@/components/DesktopPageHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { Bell, CheckCircle2, MapPin, MessageSquare, Plus, Reply, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_META = {
  announcement: { label: 'Announcement', icon: Bell, status: 'status-warning' },
  station_note: { label: 'Station Note', icon: MapPin, status: 'status-info' },
  task_comment: { label: 'Task Comment', icon: MessageSquare, status: 'status-neutral' },
};

const priorityClass = {
  low: 'status-neutral',
  normal: 'status-info',
  high: 'status-warning',
  critical: 'status-critical',
};

function formatTime(value) {
  if (!value) return 'Now';
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  } catch {
    return 'Now';
  }
}

function ThreadRow({ thread, active, acknowledged, onClick }) {
  const meta = TYPE_META[thread.type] || TYPE_META.announcement;
  const Icon = meta.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full max-w-full overflow-hidden rounded-xl border p-3 text-left transition-all active:scale-[0.99]',
        active ? 'border-primary/40' : 'border-border/40 hover:border-border/60'
      )}
      style={active
        ? { background: 'rgba(230,106,31,0.08)', boxShadow: '0 0 0 1px rgba(230,106,31,0.15)' }
        : { background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }
      }
    >
      <div className="flex items-start gap-3">
        <div className={cn('status-marker status-marker-md shrink-0', priorityClass[thread.priority] || meta.status)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-black text-foreground">{thread.title}</p>
            {thread.requires_acknowledgement && !acknowledged && (
              <span className="status-pill status-warning shrink-0">Ack</span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{thread.body || meta.label}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <span>{meta.label}</span>
            {thread.station_name && <span>{thread.station_name}</span>}
            <span>{formatTime(thread.last_message_at || thread.created_date)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function NewThreadForm({ isAdmin, stations, onCreate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'announcement',
    title: '',
    body: '',
    priority: 'normal',
    station_id: '',
    requires_acknowledgement: true,
  });

  if (!isAdmin) return null;

  const selectedStation = stations.find((station) => station.id === form.station_id);

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    await onCreate({
      ...form,
      title: form.title.trim(),
      body: form.body.trim(),
      station_name: selectedStation?.name || '',
      area_id: selectedStation?.area_id || '',
      area_name: selectedStation?.area_name || '',
    });
    setForm({
      type: 'announcement',
      title: '',
      body: '',
      priority: 'normal',
      station_id: '',
      requires_acknowledgement: true,
    });
    setSaving(false);
    setOpen(false);
  };

  return (
    <section className="app-card space-y-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="metric-label">Manager</p>
          <h2 className="mt-1 text-lg font-black text-foreground">Create communication</h2>
        </div>
        <div className="status-marker status-marker-md status-info">
          <Plus className="h-4 w-4" />
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/40 pt-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="h-11 min-w-0 rounded-xl border border-border/60 bg-background px-3 text-sm font-bold text-foreground"
            >
              <option value="announcement">Announcement</option>
              <option value="station_note">Station note</option>
              <option value="task_comment">Task comment</option>
            </select>
            <select
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
              className="h-11 min-w-0 rounded-xl border border-border/60 bg-background px-3 text-sm font-bold text-foreground"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
          </div>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Title"
            className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm font-bold text-foreground placeholder:text-muted-foreground"
          />
          <textarea
            value={form.body}
            onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
            placeholder="What does the team need to know?"
            rows={4}
            className="w-full resize-none rounded-xl border border-border/60 bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <select
            value={form.station_id}
            onChange={(event) => setForm((prev) => ({ ...prev, station_id: event.target.value }))}
            className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm font-bold text-foreground"
          >
            <option value="">All stations</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={form.requires_acknowledgement}
              onChange={(event) => setForm((prev) => ({ ...prev, requires_acknowledgement: event.target.checked }))}
            />
            Require acknowledgement
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !form.title.trim() || !form.body.trim()}
            className="btn-primary h-11 w-full disabled:opacity-50"
          >
            Post
          </button>
        </div>
      )}
    </section>
  );
}

export default function CommsCenter() {
  const { user, isAdmin } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [acknowledgements, setAcknowledgements] = useState([]);
  const [stations, setStations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState('open');

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeId) || threads[0],
    [threads, activeId]
  );

  const ackedThreadIds = useMemo(() => new Set(acknowledgements.map((ack) => ack.thread_id)), [acknowledgements]);
  const threadMessages = useMemo(
    () => messages.filter((message) => message.thread_id === activeThread?.id),
    [messages, activeThread?.id]
  );

  const load = async () => {
    setLoading(true);
    const [threadRows, messageRows, ackRows, stationRows] = await Promise.all([
      base44.entities.MessageThread?.list?.('-last_message_at', 100).catch(() => []) || [],
      base44.entities.Message?.list?.('-created_date', 200).catch(() => []) || [],
      base44.entities.MessageAcknowledgement?.filter?.({ user_email: user?.email }).catch(() => []) || [],
      base44.entities.Station?.list?.('sortOrder', 100).catch(() => []) || [],
    ]);
    setThreads(threadRows);
    setMessages(messageRows);
    setAcknowledgements(ackRows);
    setStations(stationRows.filter((station) => station.isActive !== false));
    setActiveId((current) => current || threadRows[0]?.id || '');
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.email) return;
    load();
  }, [user?.email]);

  const visibleThreads = threads.filter((thread) => {
    if (filter === 'unread') return thread.requires_acknowledgement && !ackedThreadIds.has(thread.id);
    if (filter === 'station') return thread.type === 'station_note';
    if (filter === 'announcements') return thread.type === 'announcement';
    return thread.status !== 'archived';
  });

  const createThread = async (values) => {
    const now = new Date().toISOString();
    const thread = await base44.entities.MessageThread.create({
      ...values,
      status: 'open',
      created_by: user?.email,
      created_by_name: user?.full_name || user?.email,
      last_message_at: now,
    });
    await base44.entities.Message.create({
      thread_id: thread.id,
      body: values.body,
      created_by: user?.email,
      created_by_name: user?.full_name || user?.email,
    });
    toast.success('Communication posted');
    await load();
    setActiveId(thread.id);
  };

  const sendReply = async () => {
    if (!activeThread || !reply.trim()) return;
    const body = reply.trim();
    setReply('');
    await base44.entities.Message.create({
      thread_id: activeThread.id,
      body,
      created_by: user?.email,
      created_by_name: user?.full_name || user?.email,
    });
    await base44.entities.MessageThread.update(activeThread.id, { last_message_at: new Date().toISOString() });
    await load();
  };

  const acknowledge = async () => {
    if (!activeThread || ackedThreadIds.has(activeThread.id)) return;
    await base44.entities.MessageAcknowledgement.create({
      thread_id: activeThread.id,
      user_email: user?.email,
      user_name: user?.full_name || user?.email,
      acknowledged_at: new Date().toISOString(),
    });
    toast.success('Acknowledged');
    await load();
  };

  const resolveThread = async () => {
    if (!activeThread) return;
    await base44.entities.MessageThread.update(activeThread.id, { status: 'resolved' });
    toast.success('Thread resolved');
    await load();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="app-screen">
      <DesktopPageHeader title="Communications" />
      <main className="app-page space-y-5 overflow-hidden">
        <header className="pt-1 lg:hidden">
          <p className="metric-label">Comms</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Communication center</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Announcements, station notes, and comments tied to actual work.</p>
        </header>

        <div className="lg:mt-0">
          <NewThreadForm isAdmin={isAdmin} stations={stations} onCreate={createThread} />
        </div>

        <div className="grid min-w-0 max-w-full gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              {[
                ['open', 'Open'],
                ['unread', 'Need Ack'],
                ['announcements', 'Announcements'],
                ['station', 'Stations'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={cn('shrink-0 rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.12em]', filter === id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground')}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="min-w-0 space-y-2">
              {visibleThreads.length === 0 ? (
                <div className="app-card py-10 text-center">
                  <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-muted-foreground">No communications here.</p>
                </div>
              ) : visibleThreads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  active={thread.id === activeThread?.id}
                  acknowledged={ackedThreadIds.has(thread.id)}
                  onClick={() => setActiveId(thread.id)}
                />
              ))}
            </div>
          </section>

          <section className="app-card-lg min-w-0 max-w-full overflow-hidden space-y-5 lg:min-h-[520px]">
            {activeThread ? (
              <>
                <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border/40 pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('status-pill', priorityClass[activeThread.priority] || 'status-info')}>
                        {(TYPE_META[activeThread.type] || TYPE_META.announcement).label}
                      </span>
                      {activeThread.requires_acknowledgement && (
                        <span className={cn('status-pill', ackedThreadIds.has(activeThread.id) ? 'status-success' : 'status-warning')}>
                          {ackedThreadIds.has(activeThread.id) ? 'Acknowledged' : 'Needs Ack'}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 break-words text-2xl font-black tracking-tight text-foreground">{activeThread.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeThread.station_name || activeThread.area_name || 'All staff'} · {formatTime(activeThread.last_message_at || activeThread.created_date)}
                    </p>
                  </div>
                  <div className="status-marker status-marker-lg status-info">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  {threadMessages.map((message) => (
                    <div key={message.id} className="max-w-full overflow-hidden rounded-xl border border-border/30 p-4" style={{ background: 'rgba(255,255,255,0.025)' }}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{message.created_by_name || message.created_by || 'Team'}</p>
                        <p className="shrink-0 text-xs text-muted-foreground">{formatTime(message.created_date)}</p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{message.body}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto space-y-3 border-t border-border/40 pt-4">
                  {activeThread.requires_acknowledgement && !ackedThreadIds.has(activeThread.id) && (
                    <button type="button" onClick={acknowledge} className="btn-primary flex h-11 w-full items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Acknowledge
                    </button>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && sendReply()}
                      placeholder="Reply with an update..."
                      className="h-11 min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={sendReply} disabled={!reply.trim()} className="btn-primary h-11 px-4 disabled:opacity-50">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  {isAdmin && activeThread.status !== 'resolved' && (
                    <button type="button" onClick={resolveThread} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/60 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                      <Reply className="h-3.5 w-3.5" />
                      Mark resolved
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <MessageSquare className="h-9 w-9 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-muted-foreground">Select a communication thread.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export const hideBase44Index = true;
