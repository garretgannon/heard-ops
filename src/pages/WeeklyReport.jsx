import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Download, Loader2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function WeeklyReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await base44.functions.invoke('generateWeeklyReport', {});
      setReport(res.data);
      setLoading(false);
    };
    load();
  }, []);

  const exportPDF = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const element = document.getElementById('report-content');
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0a0f10' });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`weekly-report-${report.weekStart}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
        Failed to load report.
      </div>
    );
  }

  const completionRate = report.summary.total
    ? Math.round((report.summary.totalCompleted / (report.summary.totalCompleted + report.summary.totalMissed)) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Performance Report</h1>
          <p className="text-muted-foreground mt-1">
            {report.weekStart} to {report.weekEnd}
          </p>
        </div>
        <Button onClick={exportPDF} disabled={exporting} size="lg">
          {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {exporting ? 'Exporting...' : 'Export PDF'}
        </Button>
      </div>

      <div id="report-content" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            className="bg-card rounded-2xl border border-border p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CheckCircle2 className="h-5 w-5 text-green-400 mb-2" />
            <p className="text-2xl font-bold">{report.summary.totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Tasks Completed</p>
          </motion.div>

          <motion.div
            className="bg-card rounded-2xl border border-border p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <AlertCircle className="h-5 w-5 text-red-400 mb-2" />
            <p className="text-2xl font-bold">{report.summary.totalMissed}</p>
            <p className="text-xs text-muted-foreground">Tasks Missed</p>
          </motion.div>

          <motion.div
            className="bg-card rounded-2xl border border-border p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <TrendingUp className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </motion.div>

          <motion.div
            className="bg-card rounded-2xl border border-border p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="h-5 w-5 text-accent mb-2">📊</div>
            <p className="text-2xl font-bold">{report.summary.prep.total + report.summary.sidework.total}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </motion.div>
        </div>

        {/* Breakdown */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-semibold mb-4">Prep Tasks</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-semibold">{report.summary.prep.completed}/{report.summary.prep.total}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${report.summary.prep.total > 0 ? (report.summary.prep.completed / report.summary.prep.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="text-muted-foreground">Missed: <span className="font-semibold text-red-400">{report.summary.prep.missed}</span></div>
                <div className="text-muted-foreground">Pending: <span className="font-semibold text-yellow-400">{report.summary.prep.pending}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-semibold mb-4">Side Work</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-semibold">{report.summary.sidework.completed}/{report.summary.sidework.total}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${report.summary.sidework.total > 0 ? (report.summary.sidework.completed / report.summary.sidework.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="text-muted-foreground">Missed: <span className="font-semibold text-red-400">{report.summary.sidework.missed}</span></div>
                <div className="text-muted-foreground">In Review: <span className="font-semibold text-yellow-400">{report.summary.sidework.inReview}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Trends */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-semibold mb-4">Daily Trends</h2>
          <div className="space-y-3">
            {report.dailyTrends.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">{day.date}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{
                        width: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {day.completed}/{day.total}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Repeat Missed Tasks */}
        {report.repeatMissedTasks.length > 0 && (
          <div className="bg-card rounded-2xl border border-red-500/20 p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Repeat Missed Tasks
            </h2>
            <div className="space-y-2">
              {report.repeatMissedTasks.map((task, i) => (
                <motion.div
                  key={task.name}
                  className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/10"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span className="text-sm font-medium">{task.name}</span>
                  <span className="text-xs font-semibold bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full">
                    {task.count}x missed
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Employee Performance */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-semibold mb-4">Employee Performance</h2>
          <div className="space-y-4">
            {Object.entries(report.employeeStats)
              .sort((a, b) => {
                const aTotal = a[1].prep.total + a[1].sidework.total;
                const bTotal = b[1].prep.total + b[1].sidework.total;
                return bTotal - aTotal;
              })
              .map(([employee, stats]) => {
                const total = stats.prep.total + stats.sidework.total;
                const completed = stats.prep.completed + stats.sidework.completed;
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <motion.div
                    key={employee}
                    className="p-4 bg-secondary/30 rounded-lg border border-border"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{employee}</span>
                      <span className={`text-sm font-semibold ${rate >= 80 ? 'text-green-400' : rate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {rate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div>Prep: {stats.prep.completed}/{stats.prep.total}</div>
                      <div>Side: {stats.sidework.completed}/{stats.sidework.total}</div>
                      <div>On Time: {stats.prep.onTime}</div>
                      <div>Late: {stats.prep.late}</div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}