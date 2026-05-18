import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DEPARTMENTS = ['FOH', 'BOH', 'Bar', 'Management', 'Support'];
const PAY_TYPES = ['/ hr', 'salary'];

export default function SingleEntryForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    clockInCode: '',
    jobCode: '',
    rateOfPay: '',
    payType: '/ hr',
    department: '',
    primaryRole: '',
    secondaryRoles: [],
    startDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
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
      jobCode: name,
      ...(match?.maps_to_role ? { primaryRole: match.maps_to_role } : {}),
      ...(match?.department && !prev.department ? { department: match.department } : {}),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';

    if (!formData.employeeId.trim()) newErrors.employeeId = 'Required';
    if (!formData.clockInCode.trim()) newErrors.clockInCode = 'Required';
    if (!formData.jobCode) newErrors.jobCode = 'Required';
    if (!formData.rateOfPay) newErrors.rateOfPay = 'Required';
    else if (isNaN(parseFloat(formData.rateOfPay))) newErrors.rateOfPay = 'Must be a number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Create employee record
      await base44.entities.Employee.create({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        employee_id: formData.employeeId.trim(),
        clock_in_code: formData.clockInCode.trim(),
        job_code: formData.jobCode,
        rate_of_pay: parseFloat(formData.rateOfPay),
        pay_type: formData.payType,
        department: formData.department,
        primary_role: formData.primaryRole,
        secondary_roles: formData.secondaryRoles,
        start_date: formData.startDate,
        notes: formData.notes.trim(),
        status: 'active',
      });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          employeeId: '',
          clockInCode: '',
          jobCode: '',
          rateOfPay: '',
          payType: '/ hr',
          department: '',
          primaryRole: '',
          secondaryRoles: [],
          startDate: '',
          notes: '',
        });
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add employee');
    }
    setIsSubmitting(false);
  };

  const isFormValid = formData.fullName && formData.email && formData.employeeId && formData.clockInCode && formData.jobCode && formData.rateOfPay;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-green-500/10 border border-green-500/50 flex items-center gap-3"
        >
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-300">{formData.fullName} added successfully</p>
            <p className="text-xs text-green-300/70 mt-0.5">Employee is ready to be scheduled</p>
          </div>
        </motion.div>
      )}

      {/* Required Fields Section */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Required Information</p>
        <div className="space-y-3">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Jamie Lee"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              onFocus={() => setErrors({ ...errors, fullName: '' })}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground text-sm transition-colors ${
                errors.fullName ? 'border-red-500/50' : 'border-border focus:border-primary'
              }`}
            />
            {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="jamie.lee@restaurant.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setErrors({ ...errors, email: '' })}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground text-sm transition-colors ${
                errors.email ? 'border-red-500/50' : 'border-border focus:border-primary'
              }`}
            />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Employee ID</label>
            <input
              type="text"
              placeholder="e.g. 1023"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              onFocus={() => setErrors({ ...errors, employeeId: '' })}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground text-sm transition-colors ${
                errors.employeeId ? 'border-red-500/50' : 'border-border focus:border-primary'
              }`}
            />
            {errors.employeeId && <p className="text-xs text-red-400 mt-1">{errors.employeeId}</p>}
          </div>

          {/* Clock-In Code */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Clock-In Code</label>
            <input
              type="text"
              placeholder="e.g. 2580"
              value={formData.clockInCode}
              onChange={(e) => setFormData({ ...formData, clockInCode: e.target.value })}
              onFocus={() => setErrors({ ...errors, clockInCode: '' })}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground text-sm transition-colors ${
                errors.clockInCode ? 'border-red-500/50' : 'border-border focus:border-primary'
              }`}
            />
            {errors.clockInCode && <p className="text-xs text-red-400 mt-1">{errors.clockInCode}</p>}
          </div>

          {/* Job Code */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Job Code</label>
            <select
              value={formData.jobCode}
              onChange={(e) => handleJobCodeChange(e.target.value)}
              onFocus={() => setErrors({ ...errors, jobCode: '' })}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm transition-colors ${
                errors.jobCode ? 'border-red-500/50' : 'border-border focus:border-primary'
              }`}
            >
              <option value="">Select a job code...</option>
              {jobCodes.map(j => (
                <option key={j.id} value={j.name}>{j.name}{j.department ? ` (${j.department})` : ''}</option>
              ))}
            </select>
            {errors.jobCode && <p className="text-xs text-red-400 mt-1">{errors.jobCode}</p>}
          </div>

          {/* Rate of Pay */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-foreground mb-1.5">Rate of Pay</label>
              <input
                type="number"
                placeholder="18.50"
                step="0.01"
                value={formData.rateOfPay}
                onChange={(e) => setFormData({ ...formData, rateOfPay: e.target.value })}
                onFocus={() => setErrors({ ...errors, rateOfPay: '' })}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder-muted-foreground text-sm transition-colors ${
                  errors.rateOfPay ? 'border-red-500/50' : 'border-border focus:border-primary'
                }`}
              />
              {errors.rateOfPay && <p className="text-xs text-red-400 mt-1">{errors.rateOfPay}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Type</label>
              <select
                value={formData.payType}
                onChange={(e) => setFormData({ ...formData, payType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                {PAY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Fields Section */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Optional Information</p>
        <div className="space-y-3">
          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground text-sm"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="">Select a department...</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Notes</label>
            <textarea
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground text-sm resize-none h-20"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 sticky bottom-0 pt-6 mt-6 border-t border-border/30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 bg-card/50 backdrop-blur-sm">
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting || success}
          className={`flex-1 h-10 rounded-lg font-bold text-sm transition-all ${
            isFormValid && !isSubmitting && !success
              ? 'bg-primary text-primary-foreground hover:brightness-110'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Adding...' : 'Add Employee'}
        </button>
      </div>
    </form>
  );
}