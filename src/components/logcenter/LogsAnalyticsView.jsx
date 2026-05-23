import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LogsAnalyticsView({ logs }) {
  // Logs by type
  const logsByType = logs.reduce((acc, log) => {
    const existing = acc.find((l) => l.name === log.type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: log.type.replace(/_/g, ' '), value: 1 });
    }
    return acc;
  }, []);

  // Open issues by status
  const byStatus = logs.reduce((acc, log) => {
    const existing = acc.find((s) => s.name === log.status);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: log.status.replace(/_/g, ' '), value: 1 });
    }
    return acc;
  }, []);

  // Failed temps
  const failedTemps = logs.filter((l) => l.type === 'temperature' && l.status !== 'resolved').length;
  const totalTemps = logs.filter((l) => l.type === 'temperature').length;

  // Needs review
  const needsReview = logs.filter((l) => l.requires_review).length;

  const COLORS = ['#FF6B00', '#22C55E', '#FACC15', '#EF4444', '#38BDF8', '#A78BFA'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg card-glass border border-border/20">
          <div className="text-2xl font-bold text-primary">{logs.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Logs</div>
        </div>
        <div className="p-4 rounded-lg card-glass border border-border/20">
          <div className="text-2xl font-bold text-yellow-400">{needsReview}</div>
          <div className="text-xs text-muted-foreground mt-1">Needs Review</div>
        </div>
        <div className="p-4 rounded-lg card-glass border border-border/20">
          <div className="text-2xl font-bold text-red-500">{failedTemps}</div>
          <div className="text-xs text-muted-foreground mt-1">Failed Temps</div>
        </div>
        <div className="p-4 rounded-lg card-glass border border-border/20">
          <div className="text-2xl font-bold text-green-500">
            {totalTemps > 0 ? Math.round(((totalTemps - failedTemps) / totalTemps) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">Temp Compliance</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs by Type */}
        {logsByType.length > 0 && (
          <div className="bg-card rounded-lg border border-border/20 p-4">
            <h3 className="text-sm font-bold text-foreground mb-4">Logs by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={logsByType} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {logsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Logs by Status */}
        {byStatus.length > 0 && (
          <div className="bg-card rounded-lg border border-border/20 p-4">
            <h3 className="text-sm font-bold text-foreground mb-4">Logs by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: `1px solid hsl(var(--border))` }} />
                <Bar dataKey="value" fill="#FF6B00" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}