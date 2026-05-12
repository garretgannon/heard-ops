import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { SYSTEM_ROLES } from '@/lib/roleVisibilityConfig';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function matchesEmployee(record, employee) {
  const keys = [
    employee.id,
    employee.employee_id,
    employee.email,
    employee.full_name,
  ].filter(Boolean).map(value => String(value).toLowerCase());

  return [
    record.employeeId,
    record.employee_id,
    record.employee_email,
    record.employee_name,
    record.employeeName,
    record.tagged_employee,
  ].some(value => value && keys.includes(String(value).toLowerCase()));
}

function statusClass(status) {
  if (['active', 'approved', 'acknowledged', 'resolved'].includes(status)) return 'text-green-300 bg-green-500/10 border-green-500/25';
  if (['pending', 'expiring_soon', 'open'].includes(status)) return 'text-amber-300 bg-amber-500/10 border-amber-500/25';
  if (['expired', 'denied', 'flagged'].includes(status)) return 'text-red-300 bg-red-500/10 border-red-500/25';
  return 'text-muted-foreground bg-secondary border-border/40';
}

export default function EmployeeEditModal({ employee, linkedRecords = {}, isAdmin, onClose, onSave }) {
  const [formData, setFormData] = useState(employee || {});
  const [saving, setSaving] = useState(false);
  const [jobCodes, setJobCodes] = useState([]);

  useEffect(() => {
    base44.entities.JobCode.list('-updated_date', 100).then(list =>
      setJobCodes(list.filter(j => j.isActive !== false))
    ).catch(() => {});
  }, []);

  const handleJobCodeChange = (name) => {
    const match = jobCodes.find(j => j.name === name);
    setFormData(prev => ({
      ...prev,
      job_code: name,
      ...(match?.maps_to_role ? { primary_role: match.maps_to_role } : {}),
    }));
  };
  const certifications = (linkedRecords.certifications || []).filter(record => matchesEmployee(record, employee));
  const availability = (linkedRecords.availability || []).filter(record => matchesEmployee(record, employee));
  const timeOff = (linkedRecords.timeOff || []).filter(record => matchesEmployee(record, employee));
  const managerLogs = (linkedRecords.managerLogs || []).filter(record => matchesEmployee(record, employee));

  const handleClose = () => {
    document.body.classList.remove('modal-open');
    onClose();
  };

  // Prevent body scroll and handle safe area
  React.useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  // Prevent nested scrolling
  const handleTouchMove = (e) => {
    const scrollable = e.target.closest('[data-scrollable]');
    if (!scrollable) e.preventDefault();
  };

  React.useEffect(() => {
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', handleTouchMove, { passive: false });
  }, []);

  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Employee.update(employee.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        primary_role: formData.primary_role || formData.role,
        job_code: formData.job_code,
        rate_of_pay: formData.rate_of_pay,
        start_date: formData.start_date,
        manager_id: formData.manager_id,
        manager_name: formData.manager_name,
        certifications: formData.certifications,
        notes: formData.notes,
        status: formData.status,
      });
      toast.success('Employee updated');
      onSave?.();
      handleClose();
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3, type: 'spring', damping: 20 }}
          className="w-[min(95vw,500px)] lg:w-full lg:max-w-md max-h-[90vh] lg:max-h-[95vh] card-glass border border-border rounded-t-2xl lg:rounded-2xl flex flex-col overflow-hidden"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border/30 shrink-0 bg-card">
            <h2 className="text-lg font-bold text-foreground">Edit Employee</h2>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-4 flex-1 overflow-y-auto" data-scrollable>
            {/* Name */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Name</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Employee Number</label>
                <input
                  type="text"
                  value={formData.employee_number || `EMP-${formData.id?.slice(0, 4).toUpperCase() || 'N/A'}`}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-border bg-secondary text-muted-foreground text-sm opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Employment */}
            <div className="space-y-3 pt-3 border-t border-border/20">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Employment</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Department</label>
                <select
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Department</option>
                  <option value="FOH">FOH</option>
                  <option value="BOH">BOH</option>
                  <option value="Bar">Bar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Job Code</label>
                <select
                  value={formData.job_code || ''}
                  onChange={(e) => handleJobCodeChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select job code...</option>
                  {jobCodes.map(j => (
                    <option key={j.id} value={j.name}>{j.name}{j.department ? ` (${j.department})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Rate of Pay</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate_of_pay || ''}
                  onChange={(e) => setFormData({ ...formData, rate_of_pay: e.target.value })}
                  placeholder="15.50"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">System Role</label>
                <select
                  value={formData.primary_role || ''}
                  onChange={(e) => setFormData({ ...formData, primary_role: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select system role...</option>
                  {SYSTEM_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Auto-set when a job code is selected. Controls what this employee sees in the app.</p>
              </div>
            </div>

            {/* Manager Link */}
            <div className="space-y-3 pt-3 border-t border-border/20">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Reporting</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Manager Name</label>
                <input
                  type="text"
                  value={formData.manager_name || ''}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Manager Employee ID</label>
                <input
                  type="text"
                  value={formData.manager_id || ''}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-3 pt-3 border-t border-border/20">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Contact</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-3 pt-3 border-t border-border/20">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Certifications</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">Manual Certifications</label>
                <input
                  type="text"
                  value={Array.isArray(formData.certifications) ? formData.certifications.join(', ') : formData.certifications || ''}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value.split(',').map(item => item.trim()).filter(Boolean) })}
                  placeholder="e.g., Food Handler, Alcohol Server"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <LinkedList
                empty="No certification records linked."
                items={certifications}
                renderItem={(cert) => (
                  <LinkedItem
                    title={cert.certificationName}
                    meta={[cert.issueDate, cert.expirationDate && `Expires ${cert.expirationDate}`].filter(Boolean).join(' • ')}
                    status={cert.status}
                  />
                )}
              />
            </div>

            <div className="space-y-3 pt-3 border-t border-border/20">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Availability</h3>
              <LinkedList
                empty="No availability records linked."
                items={availability}
                renderItem={(slot) => (
                  <LinkedItem
                    title={`${DAYS[slot.day_of_week] || 'Day'} ${slot.is_available === false ? 'Unavailable' : `${slot.start_time || 'Open'} - ${slot.end_time || 'Close'}`}`}
                    meta={[slot.preferred && 'Preferred', slot.max_hours_per_week && `${slot.max_hours_per_week} max hrs/wk`, slot.notes].filter(Boolean).join(' • ')}
                    status={slot.is_available === false ? 'unavailable' : 'active'}
                  />
                )}
              />
            </div>

            <div className="space-y-3 pt-3 border-t border-border/20">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Requested Time Off</h3>
              <LinkedList
                empty="No time off requests linked."
                items={timeOff}
                renderItem={(request) => (
                  <LinkedItem
                    title={`${request.start_date || 'Start'} to ${request.end_date || 'End'}`}
                    meta={[request.reason, request.manager_notes && `Manager: ${request.manager_notes}`].filter(Boolean).join(' • ')}
                    status={request.status}
                  />
                )}
              />
            </div>

            {isAdmin && (
              <div className="space-y-3 pt-3 border-t border-border/20">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Linked Manager Logs</h3>
                <LinkedList
                  empty="No manager-only employee logs linked."
                  items={managerLogs}
                  renderItem={(log) => (
                    <LinkedItem
                      title={log.title}
                      meta={[log.description, log.created_date && new Date(log.created_date).toLocaleDateString()].filter(Boolean).join(' • ')}
                      status={log.status}
                    />
                  )}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-4 lg:px-6 py-3 border-t border-border/30 flex gap-2 shrink-0 bg-card" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
            <button
              onClick={handleClose}
              className="flex-1 h-10 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function LinkedList({ items, empty, renderItem }) {
  if (!items.length) {
    return <p className="text-xs text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <React.Fragment key={item.id || index}>{renderItem(item)}</React.Fragment>
      ))}
    </div>
  );
}

function LinkedItem({ title, meta, status }) {
  return (
    <div className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-foreground">{title || 'Untitled'}</p>
        {status && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${statusClass(status)}`}>
            {String(status).replace(/_/g, ' ')}
          </span>
        )}
      </div>
      {meta && <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{meta}</p>}
    </div>
  );
}
