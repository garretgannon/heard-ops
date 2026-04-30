import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, Mail, Loader2, ChevronDown, ChevronUp, Edit2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function dateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export default function WeeklyReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [edits, setEdits] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const cutoff = dateNDaysAgo(7);
        const [prepItems, sideWork, maintenance, incidents, shifts] = await Promise.all([
          base44.entities.PrepItem.list("-created_date", 2000),
          base44.entities.SideWorkAssignment.list("-created_date", 1000),
          base44.entities.MaintenanceRequest.list("-created_date", 500),
          base44.entities.IncidentReport.list("-created_date", 500),
          base44.entities.ShiftHandoff.list("-created_date", 100),
        ]);

        const weekPrep = prepItems.filter(p => p.completed_at && p.completed_at.split("T")[0] >= cutoff);
        const weekSideWork = sideWork.filter(s => s.completed_at && s.completed_at.split("T")[0] >= cutoff);
        const weekMaintenance = maintenance.filter(m => m.date >= cutoff);
        const weekIncidents = incidents.filter(i => i.date >= cutoff);

        // Calculate wins
        const prepCompleted = weekPrep.filter(p => p.status === "completed").length;
        const sideworkCompleted = weekSideWork.filter(s => s.status === "completed" || s.status === "approved").length;
        const maintResolved = weekMaintenance.filter(m => m.status === "resolved").length;

        // Identify missed tasks
        const missedPrep = weekPrep.filter(p => p.completion_status === "missed").map(p => p.name);
        const missedSideWork = weekSideWork.filter(s => s.completion_status === "missed").map(s => s.task_name);

        // Get top performers
        const empStats = {};
        weekPrep.forEach(p => {
          if (p.completed_by) {
            empStats[p.completed_by] = (empStats[p.completed_by] || 0) + 1;
          }
        });
        weekSideWork.forEach(s => {
          if (s.completed_by) {
            empStats[s.completed_by] = (empStats[s.completed_by] || 0) + 1;
          }
        });
        const topPerformers = Object.entries(empStats).sort((a, b) => b[1] - a[1]).slice(0, 3);

        // Parse shifts for vendor/cash/training issues
        const shiftNotes = shifts.map(s => ({ date: s.date, notes: s.notes_for_next_manager, issues: s.vendor_issues, cash: s.cash_issues }));

        const reportData = {
          weekStart: dateNDaysAgo(6),
          weekEnd: new Date().toISOString().split("T")[0],
          wins: {
            prepCompleted,
            sideworkCompleted,
            maintResolved,
          },
          missedTasks: {
            prep: missedPrep,
            sidework: missedSideWork,
          },
          maintenance: weekMaintenance.map(m => ({ name: m.location, status: m.status, type: m.type })),
          incidents: weekIncidents.map(i => ({ type: i.type, severity: i.severity, description: i.description })),
          topPerformers: topPerformers.map(([name, count]) => ({ name, tasks: count })),
          followUps: shiftNotes.filter(s => s.notes).map(s => s.notes),
        };

        setReport(reportData);
        setLoading(false);
      } catch (err) {
        console.error("Load error:", err);
        setLoading(false);
      }
    };
    init();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const startEdit = (section, content) => {
    setEditingSection(section);
    setEditedContent(content);
  };

  const saveEdit = (section) => {
    setEdits(prev => ({ ...prev, [section]: editedContent }));
    setEditingSection(null);
  };

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
      toast.success('PDF exported');
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Export failed');
    }
    setExporting(false);
  };

  const handleSendEmail = async () => {
    if (!emailRecipient.trim()) {
      toast.error('Email required');
      return;
    }
    setSendingEmail(true);
    try {
      const reportText = `
WEEKLY OPERATIONS REPORT
${report.weekStart} to ${report.weekEnd}

WINS
- Prep tasks completed: ${report.wins.prepCompleted}
- Side work tasks completed: ${report.wins.sideworkCompleted}
- Maintenance resolved: ${report.wins.maintResolved}

${edits.wins || ''}

MISSED TASKS
- Prep: ${report.missedTasks.prep.length}
- Side work: ${report.missedTasks.sidework.length}

${edits.missedTasks || ''}

MAINTENANCE
${report.maintenance.map(m => `- ${m.name}: ${m.status}`).join('\n')}

${edits.maintenance || ''}

INCIDENTS
${report.incidents.length > 0 ? report.incidents.map(i => `- ${i.type} (${i.severity})`).join('\n') : 'None'}

${edits.incidents || ''}

TOP PERFORMERS
${report.topPerformers.map(p => `- ${p.name}: ${p.tasks} tasks`).join('\n')}

${edits.topPerformers || ''}

FOLLOW-UPS FOR NEXT WEEK
${edits.followUps || report.followUps.join('\n')}
      `.trim();

      await base44.integrations.Core.SendEmail({
        to: emailRecipient,
        subject: `Weekly Operations Report - ${report.weekStart} to ${report.weekEnd}`,
        body: reportText,
      });
      toast.success('Email sent');
      setEmailDialog(false);
      setEmailRecipient('');
    } catch (err) {
      console.error('Email failed:', err);
      toast.error('Email failed');
    }
    setSendingEmail(false);
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

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Weekly Operations Report</h1>
          <p className="text-sm text-muted-foreground mt-1">{report.weekStart} to {report.weekEnd}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEmailDialog(true)}>
            <Mail className="h-4 w-4 mr-2" /> Email
          </Button>
          <Button onClick={exportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            PDF
          </Button>
        </div>
      </div>

      <div id="report-content" className="space-y-3">
        {/* Wins Summary */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('wins')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
          >
            <h2 className="font-bold text-green-600">✓ Wins</h2>
            {expandedSections.wins ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {expandedSections.wins && (
            <div className="px-5 pb-4 pt-0 border-t border-border space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-green-500/10 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Prep Completed</p>
                  <p className="text-2xl font-bold text-green-600">{report.wins.prepCompleted}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Side Work Done</p>
                  <p className="text-2xl font-bold text-green-600">{report.wins.sideworkCompleted}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Maintenance Fixed</p>
                  <p className="text-2xl font-bold text-green-600">{report.wins.maintResolved}</p>
                </div>
              </div>
              <div>
                {editingSection === 'wins' ? (
                  <div className="space-y-2">
                    <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} placeholder="Add notes..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit('wins')}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startEdit('wins', edits.wins || '')} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Edit2 className="h-3.5 w-3.5" /> Add manager notes
                  </button>
                )}
                {edits.wins && <p className="text-sm text-muted-foreground mt-2 italic">"{edits.wins}"</p>}
              </div>
            </div>
          )}
        </div>

        {/* Missed Tasks */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('missedTasks')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
          >
            <h2 className="font-bold text-red-600">⚠ Missed Tasks</h2>
            {expandedSections.missedTasks ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {expandedSections.missedTasks && (
            <div className="px-5 pb-4 pt-0 border-t border-border space-y-3">
              {(report.missedTasks.prep.length > 0 || report.missedTasks.sidework.length > 0) ? (
                <>
                  {report.missedTasks.prep.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Prep Items ({report.missedTasks.prep.length})</p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {report.missedTasks.prep.slice(0, 5).map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.missedTasks.sidework.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Side Work ({report.missedTasks.sidework.length})</p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {report.missedTasks.sidework.slice(0, 5).map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-green-600 font-semibold">No missed tasks!</p>
              )}
              <div>
                {editingSection === 'missedTasks' ? (
                  <div className="space-y-2">
                    <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} placeholder="Root causes & corrective actions..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit('missedTasks')}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startEdit('missedTasks', edits.missedTasks || '')} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Edit2 className="h-3.5 w-3.5" /> Add analysis
                  </button>
                )}
                {edits.missedTasks && <p className="text-sm text-muted-foreground mt-2 italic">"{edits.missedTasks}"</p>}
              </div>
            </div>
          )}
        </div>

        {/* Maintenance */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('maintenance')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
          >
            <h2 className="font-bold">🔧 Maintenance Issues</h2>
            {expandedSections.maintenance ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {expandedSections.maintenance && (
            <div className="px-5 pb-4 pt-0 border-t border-border space-y-3">
              {report.maintenance.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {report.maintenance.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 bg-secondary/30 rounded">
                      <span className={cn("h-2 w-2 rounded-full", m.status === "resolved" ? "bg-green-600" : "bg-orange-600")}></span>
                      <span>{m.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto capitalize">{m.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-600 font-semibold">No maintenance issues</p>
              )}
              <div>
                {editingSection === 'maintenance' ? (
                  <div className="space-y-2">
                    <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} placeholder="Priority actions, vendor contacts..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit('maintenance')}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startEdit('maintenance', edits.maintenance || '')} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Edit2 className="h-3.5 w-3.5" /> Add notes
                  </button>
                )}
                {edits.maintenance && <p className="text-sm text-muted-foreground mt-2 italic">"{edits.maintenance}"</p>}
              </div>
            </div>
          )}
        </div>

        {/* Incidents */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('incidents')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
          >
            <h2 className="font-bold text-orange-600">🚨 Incidents</h2>
            {expandedSections.incidents ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {expandedSections.incidents && (
            <div className="px-5 pb-4 pt-0 border-t border-border space-y-3">
              {report.incidents.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {report.incidents.map((i, idx) => (
                    <li key={idx} className="p-2 bg-orange-500/10 rounded border border-orange-500/20">
                      <p className="font-semibold text-orange-600">{i.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{i.severity} severity</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-600 font-semibold">No incidents reported</p>
              )}
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('topPerformers')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
          >
            <h2 className="font-bold text-primary">⭐ Top Performers</h2>
            {expandedSections.topPerformers ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {expandedSections.topPerformers && (
            <div className="px-5 pb-4 pt-0 border-t border-border">
              {report.topPerformers.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {report.topPerformers.map((p, i) => (
                    <li key={i} className="flex items-center justify-between p-2 bg-primary/10 rounded">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{p.tasks} tasks</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No performance data</p>
              )}
            </div>
          )}
        </div>

        {/* Follow-ups */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('followUps')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
          >
            <h2 className="font-bold">📋 Follow-ups for Next Week</h2>
            {expandedSections.followUps ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {expandedSections.followUps && (
            <div className="px-5 pb-4 pt-0 border-t border-border space-y-3">
              <div>
                {editingSection === 'followUps' ? (
                  <div className="space-y-2">
                    <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} placeholder="List key action items for next week..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit('followUps')}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {edits.followUps ? (
                      <div className="text-sm space-y-1">
                        {edits.followUps.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                      </div>
                    ) : (
                      <button onClick={() => startEdit('followUps', edits.followUps || '')} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Edit2 className="h-3.5 w-3.5" /> Add follow-ups
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Report via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-bold block mb-1">Recipient Email</label>
              <input
                type="email"
                placeholder="owner@restaurant.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const hideBase44Index = true;