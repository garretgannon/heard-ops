import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const DEPARTMENTS = [
  { value: 'BOH', label: 'Back of House' },
  { value: 'FOH', label: 'Front of House' },
  { value: 'Bar', label: 'Bar' },
  { value: 'Management', label: 'Management' },
];

const DEPT_COLORS = {
  BOH: 'bg-orange-500/20 text-orange-400',
  FOH: 'bg-blue-500/20 text-blue-400',
  Bar: 'bg-purple-500/20 text-purple-400',
  Management: 'bg-green-500/20 text-green-400',
};

const BLANK_ROLE = { name: '', description: '', department: 'FOH', can_approve_tasks: false, can_create_issues: true, can_close_shift: false, is_active: true };

export default function RolesManagerTab() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newRole, setNewRole] = useState(BLANK_ROLE);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    setLoading(true);
    const data = await base44.entities.Role.list();
    setRoles(data);
    setLoading(false);
  };

  const startEdit = (role) => {
    setEditingId(role.id);
    setEditData({ ...role });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async () => {
    setSaving(true);
    await base44.entities.Role.update(editingId, editData);
    toast.success('Role updated');
    setEditingId(null);
    await loadRoles();
    setSaving(false);
  };

  const deleteRole = async (id) => {
    if (!confirm('Delete this role? This cannot be undone.')) return;
    await base44.entities.Role.delete(id);
    toast.success('Role deleted');
    loadRoles();
  };

  const createRole = async () => {
    if (!newRole.name?.trim()) { toast.error('Role name is required'); return; }
    setSaving(true);
    await base44.entities.Role.create(newRole);
    toast.success('Role created');
    setNewRole(BLANK_ROLE);
    setShowAdd(false);
    await loadRoles();
    setSaving(false);
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground text-sm">Loading roles…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Roles</p>
          <p className="text-xs text-muted-foreground">Customize roles for your restaurant</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-xs h-8 px-3 flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> New Role
        </button>
      </div>

      {/* Add New Role */}
      {showAdd && (
        <div className="bg-card border border-primary/40 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-primary uppercase">New Role</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Role name *"
              value={newRole.name}
              onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            />
            <select
              value={newRole.department}
              onChange={e => setNewRole(p => ({ ...p, department: e.target.value }))}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            >
              {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input
              placeholder="Description (optional)"
              value={newRole.description}
              onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
              className="col-span-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {[['can_approve_tasks','Can Approve Tasks'],['can_create_issues','Can Create Issues'],['can_close_shift','Can Close Shift']].map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5 text-foreground cursor-pointer">
                <input type="checkbox" checked={newRole[key]} onChange={e => setNewRole(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
                {label}
              </label>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowAdd(false); setNewRole(BLANK_ROLE); }} className="btn-secondary text-xs h-8 px-3">Cancel</button>
            <button onClick={createRole} disabled={saving} className="btn-primary text-xs h-8 px-4">
              {saving ? 'Saving…' : 'Create Role'}
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border/30">
        {roles.length === 0 && (
          <p className="text-center py-8 text-muted-foreground text-sm">No roles yet. Create one above.</p>
        )}
        {roles.map(role => (
          <div key={role.id} className="px-4 py-3">
            {editingId === role.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={editData.name}
                    onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                    className="px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground"
                  />
                  <select
                    value={editData.department}
                    onChange={e => setEditData(p => ({ ...p, department: e.target.value }))}
                    className="px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground"
                  >
                    {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                  <input
                    value={editData.description || ''}
                    onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description"
                    className="col-span-2 px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground"
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {[['can_approve_tasks','Can Approve Tasks'],['can_create_issues','Can Create Issues'],['can_close_shift','Can Close Shift'],['is_active','Active']].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 text-foreground cursor-pointer">
                      <input type="checkbox" checked={editData[key]} onChange={e => setEditData(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className="h-7 px-2 rounded border border-border text-xs text-muted-foreground hover:bg-muted flex items-center gap-1"><X className="h-3 w-3" /> Cancel</button>
                  <button onClick={saveEdit} disabled={saving} className="h-7 px-3 rounded bg-primary text-white text-xs font-bold flex items-center gap-1"><Check className="h-3 w-3" /> Save</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{role.name}</p>
                    {role.department && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${DEPT_COLORS[role.department] || 'bg-muted text-muted-foreground'}`}>
                        {role.department}
                      </span>
                    )}
                    {!role.is_active && <span className="text-[10px] text-muted-foreground italic">Inactive</span>}
                  </div>
                  {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {role.can_approve_tasks && <span className="text-[10px] text-green-400">✓ Approves tasks</span>}
                    {role.can_close_shift && <span className="text-[10px] text-blue-400">✓ Closes shift</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(role)} className="h-7 w-7 rounded border border-border hover:bg-muted flex items-center justify-center text-muted-foreground">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteRole(role.id)} className="h-7 w-7 rounded border border-border hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center text-muted-foreground">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}