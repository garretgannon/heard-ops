import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Plus, Edit2, Copy, Archive, MoreVertical, Search, Filter } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import SideWorkTemplateForm from '@/components/SideWorkTemplateForm';

function TemplateCard({ template, onEdit, onDuplicate, onArchive }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="card-glass border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">{template.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-secondary-text">
            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-semibold">{template.department}</span>
            <span>•</span>
            <span>{template.station}</span>
            <span>•</span>
            <span>{template.itemCount || 0} items</span>
          </div>
        </div>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
          template.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
        }`}>
          {template.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            haptics.light();
            onEdit(template);
          }}
          className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1 h-8"
        >
          <Edit2 className="h-3 w-3" />
          Edit
        </button>
        <button
          onClick={() => {
            haptics.light();
            onDuplicate(template);
          }}
          className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1 h-8"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>
        <button
          onClick={() => {
            haptics.light();
            setMenuOpen(!menuOpen);
          }}
          className="btn-secondary text-xs py-2 px-2 h-8"
        >
          <MoreVertical className="h-3 w-3" />
        </button>
      </div>

      {menuOpen && (
        <button
          onClick={() => {
            haptics.light();
            onArchive(template);
            setMenuOpen(false);
          }}
          className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1 text-red-400"
        >
          <Archive className="h-3 w-3" />
          {template.isActive ? 'Archive' : 'Unarchive'}
        </button>
      )}
    </div>
  );
}

export default function SideWorkTemplates() {
  const { id: templateIdFromUrl } = useParams();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useCurrentUser();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterJobCode, setFilterJobCode] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [jobCodes, setJobCodes] = useState([]);

  useEffect(() => {
    loadTemplates();
    loadStationsAndCodes();
    const unsub = base44.entities.SideWorkTemplate.subscribe(() => loadTemplates());
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const stationFromUrl = searchParams.get('station');
    if (stationFromUrl) {
      const station = stations.find(s => s.id === stationFromUrl || s.name === stationFromUrl);
      setFilterStation(station?.id || stationFromUrl);
    }
  }, [searchParams, stations]);

  useEffect(() => {
    if (templateIdFromUrl) {
      const template = templates.find(t => t.id === templateIdFromUrl);
      if (template) {
        setEditingTemplate(template);
        setShowForm(true);
      }
    }
  }, [templateIdFromUrl, templates]);

  const loadStationsAndCodes = async () => {
    try {
      const [stationData, codeData] = await Promise.all([
        base44.entities.Station.list('-updated_date', 100).catch(() => []),
        base44.entities.JobCode.list('-updated_date', 100).catch(() => [])
      ]);
      setStations(stationData.filter(s => s.isActive));
      setJobCodes(codeData.filter(j => j.isActive));
    } catch (error) {
      console.error('Failed to load metadata:', error);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SideWorkTemplate.list('-updated_date', 100);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
    setLoading(false);
  };

  const filtered = templates.filter(t => {
    const matchDept = !filterDept || t.department === filterDept;
    const matchStation = !filterStation || t.station_id === filterStation || t.station === filterStation;
    const matchJobCode = !filterJobCode || t.job_code_id === filterJobCode || t.jobCode === filterJobCode;
    const matchSearch = !search || 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.station || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.area_name || '').toLowerCase().includes(search.toLowerCase());
    return matchDept && matchStation && matchJobCode && matchSearch;
  });

  const departments = [...new Set(templates.map(t => t.department))].sort();

  const handleSave = async () => {
    await loadTemplates();
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleDuplicate = async (template) => {
    const newTemplate = { ...template };
    delete newTemplate.id;
    delete newTemplate.created_date;
    delete newTemplate.updated_date;
    delete newTemplate.automation_template_id;
    newTemplate.name = `${template.name} (Copy)`;
    
    const created = await base44.entities.SideWorkTemplate.create(newTemplate);
    
    // Copy items
    const items = await base44.entities.SideWorkTemplateItem.filter({
      sideWorkTemplateId: template.id
    });
    
    for (const item of items) {
      const newItem = { ...item };
      delete newItem.id;
      delete newItem.created_date;
      delete newItem.updated_date;
      newItem.sideWorkTemplateId = created.id;
      await base44.entities.SideWorkTemplateItem.create(newItem);
    }
    
    await loadTemplates();
    haptics.success();
  };

  const handleArchive = async (template) => {
    await base44.entities.SideWorkTemplate.update(template.id, {
      isActive: !template.isActive
    });
    await loadTemplates();
    haptics.success();
  };

  if (!isAdmin) {
    return <div className="p-4 text-center text-secondary-text">Admin only</div>;
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-foreground mb-3">Side Work Templates</h1>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
          >
            <option value="">All Stations</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.area_name ? `${s.area_name} / ${s.name}` : s.name}</option>)}
          </select>
          <select
            value={filterJobCode}
            onChange={(e) => setFilterJobCode(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground"
          >
            <option value="">All Job Codes</option>
            {jobCodes.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-secondary-text">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-secondary-text text-sm">
            No templates found
          </div>
        ) : (
          filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={setEditingTemplate}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
            />
          ))
        )}
      </div>

      {/* Create Button */}
      <button
        onClick={() => {
          haptics.medium();
          setShowForm(true);
        }}
        className="fixed bottom-24 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="bg-card border-b border-border p-4 flex items-center justify-between sticky top-0">
              <h2 className="font-bold text-foreground">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingTemplate(null); }}
                className="text-secondary-text hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <SideWorkTemplateForm
                template={editingTemplate}
                onSave={handleSave}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;