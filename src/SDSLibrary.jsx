import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Trash2, Eye, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SDSLibrary() {
  const [sds, setSds] = useState([]);
  const [filteredSds, setFilteredSds] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSDS, setSelectedSDS] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const CATEGORIES = [
    'degreaser', 'sanitizer', 'delimer', 'disinfectant',
    'floor_cleaner', 'glass_cleaner', 'rinse_aid', 'detergent', 'lubricant', 'other'
  ];

  useEffect(() => {
    loadSDS();
  }, []);

  const loadSDS = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SDS.list('-updated_date', 100);
      setSds(data);
    } catch (err) {
      toast.error('Failed to load SDS records');
    }
    setLoading(false);
  };

  useEffect(() => {
    let filtered = sds;
    if (search) {
      filtered = filtered.filter(s => 
        s.chemical_name.toLowerCase().includes(search.toLowerCase()) ||
        s.vendor_brand?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }
    setFilteredSds(filtered);
  }, [sds, search, categoryFilter]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this SDS record?')) return;
    try {
      await base44.entities.SDS.delete(id);
      setSds(sds.filter(s => s.id !== id));
      toast.success('SDS deleted');
    } catch (err) {
      toast.error('Failed to delete SDS');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">SDS / MSDS Library</h1>
          <p className="text-sm text-muted-foreground">Searchable chemical safety data sheets and emergency information.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by chemical name or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" /> Add SDS
          </button>
        </div>

        {/* SDS Grid */}
        <div className="grid gap-4">
          {filteredSds.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No SDS records found.</p>
            </div>
          ) : (
            filteredSds.map(record => (
              <div key={record.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{record.chemical_name}</h3>
                      {record.vendor_brand && (
                        <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded">{record.vendor_brand}</span>
                      )}
                      <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">{record.category}</span>
                      {!record.is_active && (
                        <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{record.hazard_warnings}</p>
                    
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                      {record.ppe_required && record.ppe_required.length > 0 && (
                        <div className="bg-background p-2 rounded border border-border/50">
                          <p className="text-muted-foreground font-bold mb-1">PPE:</p>
                          <p className="text-foreground">{record.ppe_required.join(', ')}</p>
                        </div>
                      )}
                      {record.linked_equipment && record.linked_equipment.length > 0 && (
                        <div className="bg-background p-2 rounded border border-border/50">
                          <p className="text-muted-foreground font-bold mb-1">Equipment:</p>
                          <p className="text-foreground">{record.linked_equipment.length} item(s)</p>
                        </div>
                      )}
                      {record.linked_areas && record.linked_areas.length > 0 && (
                        <div className="bg-background p-2 rounded border border-border/50">
                          <p className="text-muted-foreground font-bold mb-1">Areas:</p>
                          <p className="text-foreground">{record.linked_areas.length} area(s)</p>
                        </div>
                      )}
                      {record.last_reviewed_date && (
                        <div className="bg-background p-2 rounded border border-border/50">
                          <p className="text-muted-foreground font-bold mb-1">Last Review:</p>
                          <p className="text-foreground">{new Date(record.last_reviewed_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {record.sds_pdf_url && (
                        <a href={record.sds_pdf_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded text-xs font-bold hover:bg-blue-500/25 transition-colors">
                          <FileText className="h-3 w-3" /> View PDF
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedSDS(record)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/15 text-primary rounded text-xs font-bold hover:bg-primary/25 transition-colors">
                        <Eye className="h-3 w-3" /> Details
                      </button>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 text-red-400 hover:bg-red-500/15 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSDS && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">{selectedSDS.chemical_name}</h2>
              <button onClick={() => setSelectedSDS(null)} className="text-muted-foreground hover:text-foreground text-2xl">×</button>
            </div>

            <div className="space-y-4 text-sm">
              {selectedSDS.vendor_brand && <p><strong>Vendor:</strong> {selectedSDS.vendor_brand}</p>}
              {selectedSDS.hazard_warnings && <p><strong>Hazards:</strong> {selectedSDS.hazard_warnings}</p>}
              {selectedSDS.ppe_required && selectedSDS.ppe_required.length > 0 && <p><strong>PPE:</strong> {selectedSDS.ppe_required.join(', ')}</p>}
              {selectedSDS.dilution_instructions && <p><strong>Dilution:</strong> {selectedSDS.dilution_instructions}</p>}
              {selectedSDS.storage_instructions && <p><strong>Storage:</strong> {selectedSDS.storage_instructions}</p>}
              {selectedSDS.first_aid_notes && <p><strong>First Aid:</strong> {selectedSDS.first_aid_notes}</p>}
              {selectedSDS.spill_response_notes && <p><strong>Spill Response:</strong> {selectedSDS.spill_response_notes}</p>}
            </div>

            <button onClick={() => setSelectedSDS(null)} className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const hideBase44Index = true;