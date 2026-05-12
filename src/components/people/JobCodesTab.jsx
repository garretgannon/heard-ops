import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import JobCodeForm from '@/components/JobCodeForm';

function JobCodeCard({ jobCode, onEdit, onDelete }) {
  const deptColors = {
    BOH: 'bg-red-500/20 text-red-300',
    FOH: 'bg-blue-500/20 text-blue-300',
    Bar: 'bg-purple-500/20 text-purple-300',
    Management: 'bg-gray-500/20 text-gray-300',
  };

  return (
    <div className="card-glass border border-border rounded-lg p-3.5 flex items-center justify-between">
      <div>
        <p className="font-bold text-sm text-foreground">{jobCode.name}</p>
        <div className="flex gap-2 mt-1.5">
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${deptColors[jobCode.department]}`}>
            {jobCode.department}
          </span>
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${jobCode.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
            {jobCode.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(jobCode)} className="p-2 hover:bg-muted rounded-lg transition-all">
          <Edit2 className="h-4 w-4 text-secondary-text" />
        </button>
        <button onClick={() => onDelete(jobCode.id)} className="p-2 hover:bg-muted rounded-lg transition-all">
          <Trash2 className="h-4 w-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default function JobCodesTab() {
  const [jobCodes, setJobCodes] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJobCode, setEditingJobCode] = useState(null);

  useEffect(() => {
    loadJobCodes();
  }, []);

  const loadJobCodes = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.JobCode.list();
      setJobCodes(data);
    } catch (error) {
      console.error('Failed to load job codes:', error);
    }
    setLoading(false);
  };

  const filtered = jobCodes.filter(j => {
    const matchesSearch = (j.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'all' || j.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? j.isActive : !j.isActive);
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleDelete = async (id) => {
    haptics.light();
    if (confirm('Delete this job code?')) {
      await base44.entities.JobCode.delete(id);
      await loadJobCodes();
    }
  };

  const handleEdit = (jobCode) => {
    haptics.light();
    setEditingJobCode(jobCode);
    setShowForm(true);
  };

  const handleSave = async () => {
    await loadJobCodes();
    setShowForm(false);
    setEditingJobCode(null);
  };

  return (
    <div>
      <div className="space-y-3 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search job codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-secondary-text"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
          >
            <option value="all">All Departments</option>
            <option value="BOH">BOH</option>
            <option value="FOH">FOH</option>
            <option value="Bar">Bar</option>
            <option value="Management">Management</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-secondary-text text-sm">
            {jobCodes.length === 0 ? 'No job codes yet' : 'No job codes match your filters'}
          </div>
        ) : (
          <>
            <p className="text-xs text-secondary-text mb-2">
              Showing {filtered.length} of {jobCodes.length}
            </p>
            {filtered.map(jobCode => (
              <JobCodeCard
                key={jobCode.id}
                jobCode={jobCode}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>

      <button
        onClick={() => { haptics.medium(); setEditingJobCode(null); setShowForm(true); }}
        className="mt-4 w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <Plus className="h-4 w-4" /> Add Job Code
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden">
            <div className="bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="font-bold text-foreground">{editingJobCode ? 'Edit Job Code' : 'Create Job Code'}</h2>
              <button onClick={() => { setShowForm(false); setEditingJobCode(null); }} className="text-secondary-text hover:text-foreground">✕</button>
            </div>
            <div className="p-4">
              <JobCodeForm
                jobCode={editingJobCode}
                onSave={handleSave}
                onClose={() => { setShowForm(false); setEditingJobCode(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}