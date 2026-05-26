import { useState, useEffect, useRef } from 'react';
import { Camera, X, Loader2, Check, Building2, User } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn('relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors', value ? 'bg-primary' : 'bg-[#1E2A3B]')}
    >
      <span className={cn('absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', value && 'translate-x-4')} />
    </button>
  );
}

function PhotoField({ label, url, onUpload, onClear }) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploader = base44.integrations?.Core?.UploadFile;
      const result = uploader ? await uploader({ file }) : { file_url: URL.createObjectURL(file) };
      onUpload(result?.file_url || '');
    } finally {
      setUploading(false);
    }
  };

  if (url) {
    return (
      <div>
        <p className="mb-1.5 text-xs font-bold text-muted-foreground">{label}</p>
        <div className="relative h-28 overflow-hidden rounded-xl border border-border">
          <img src={url} alt="reference" className="h-full w-full object-cover" />
          <button onClick={onClear} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60">
            <X className="h-3.5 w-3.5 text-white" />
          </button>
          <div className="absolute bottom-2 right-2 rounded-full bg-emerald-500 p-0.5">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-muted-foreground">{label}</p>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="ops-input hidden" onChange={e => handleFile(e.target.files[0])} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="flex h-16 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 transition-all active:scale-[0.98]"
      >
        {uploading
          ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          : <><Camera className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Take Photo</span></>
        }
      </button>
    </div>
  );
}

const inputCls = "h-11 w-full rounded-xl border border-border/60 bg-card/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50";

export default function QuickAddPrepModal({ open, onClose, onSuccess }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [assignType, setAssignType] = useState('station');
  const [stationId, setStationId] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [personName, setPersonName] = useState('');
  const [refPhotoUrl, setRefPhotoUrl] = useState('');
  const [requireCompletionPhoto, setRequireCompletionPhoto] = useState(true);
  const [stations, setStations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [linkedRecipeId, setLinkedRecipeId] = useState('');
  const [linkedRecipeName, setLinkedRecipeName] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      base44.entities.Station.list('-updated_date', 100).catch(() => []),
      base44.entities.Employee.list('full_name', 100).catch(() => []),
      base44.entities.PrepItem.list('-updated_date', 200).catch(() => []),
      base44.entities.Recipe.list('name', 200).catch(() => []),
    ]).then(([s, e, p, r]) => {
      setStations(s.filter(x => x.isActive !== false));
      setEmployees(e.filter(x => x.status !== 'inactive'));
      setPrepItems(p);
      setRecipes(r.filter(x => x.status !== 'archived'));
    });
  }, [open]);

  const reset = () => {
    setName(''); setShowSuggestions(false); setAssignType('station'); setStationId('');
    setPersonEmail(''); setPersonName(''); setRefPhotoUrl(''); setRequireCompletionPhoto(true);
    setLinkedRecipeId(''); setLinkedRecipeName(''); setRecipeSearch(''); setShowRecipePicker(false);
  };

  const suggestions = name.trim().length >= 3
    ? prepItems.filter(p => p.name?.toLowerCase().includes(name.toLowerCase())).slice(0, 6)
    : [];

  const selectSuggestion = (val) => {
    setName(val);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleClose = () => { reset(); onClose?.(); };

  const canSubmit = name.trim() && (assignType === 'station' ? stationId : personEmail);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    haptics.medium?.();
    setSaving(true);
    try {
      const station = stations.find(s => s.id === stationId);
      const payload = {
        name: name.trim(),
        status: 'pending',
        priority: 'medium',
        prep_list_id: 'current',
        quantity: '1',
        sort_order: -1,
        photo_url: refPhotoUrl || undefined,
        require_completion_photo: requireCompletionPhoto,
        linked_recipe_id: linkedRecipeId || undefined,
      };
      if (assignType === 'station') {
        payload.station_name = station?.name || stationId;
        payload.station_id = stationId;
      } else {
        payload.assigned_to_individual = personEmail;
        payload.assigned_to_name = personName;
      }
      await base44.entities.PrepItem.create(payload);
      toast('Prep item added');
      onSuccess?.();
      handleClose();
    } catch {
      toast('Failed to add prep item');
    } finally {
      setSaving(false);
    }
  };

  const selectedEmployee = employees.find(e => e.email === personEmail);

  return (
    <BottomSheet open={open} onClose={handleClose} title="Add Prep">
      <div className="space-y-4 pb-2">

        {/* Prep item name */}
        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Prep Item *</label>
          <input
            ref={inputRef}
            value={name}
            onChange={e => { setName(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Type at least 3 letters to search…"
            className={inputCls}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg">
              {suggestions.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => selectSuggestion(p.name)}
                  onTouchStart={() => selectSuggestion(p.name)}
                  className="w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted/60 active:bg-muted border-b border-border/30 last:border-0"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assign to: Station or Person */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Assign To *</label>
          <div className="mb-2 flex rounded-xl border border-border/60 bg-muted/20 p-0.5">
            <button
              type="button"
              onClick={() => setAssignType('station')}
              className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all', assignType === 'station' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              <Building2 className="h-3.5 w-3.5" /> Station
            </button>
            <button
              type="button"
              onClick={() => setAssignType('person')}
              className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all', assignType === 'person' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              <User className="h-3.5 w-3.5" /> Person
            </button>
          </div>

          {assignType === 'station' ? (
            <select value={stationId} onChange={e => setStationId(e.target.value)} className={inputCls}>
              <option value="">Select station…</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          ) : (
            <select
              value={personEmail}
              onChange={e => {
                const emp = employees.find(x => x.email === e.target.value);
                setPersonEmail(e.target.value);
                setPersonName(emp?.full_name || '');
              }}
              className={inputCls}
            >
              <option value="">Select person…</option>
              {employees.map(e => <option key={e.id} value={e.email}>{e.full_name}</option>)}
            </select>
          )}
        </div>

        {/* Link Recipe */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Linked Recipe (optional)</label>
          {linkedRecipeId ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2.5">
              <span className="flex-1 text-sm font-semibold text-foreground truncate">📖 {linkedRecipeName}</span>
              <button type="button" onClick={() => { setLinkedRecipeId(''); setLinkedRecipeName(''); }} className="text-xs text-muted-foreground hover:text-red-400 transition-colors shrink-0">Remove</button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={recipeSearch}
                onChange={e => { setRecipeSearch(e.target.value); setShowRecipePicker(true); }}
                onFocus={() => setShowRecipePicker(true)}
                onBlur={() => setTimeout(() => setShowRecipePicker(false), 150)}
                placeholder="Search recipes…"
                className={inputCls}
              />
              {showRecipePicker && recipeSearch.length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg max-h-44 overflow-y-auto">
                  {recipes.filter(r => r.name?.toLowerCase().includes(recipeSearch.toLowerCase())).slice(0, 6).map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onMouseDown={() => { setLinkedRecipeId(r.id); setLinkedRecipeName(r.name); setRecipeSearch(''); setShowRecipePicker(false); }}
                      onTouchStart={() => { setLinkedRecipeId(r.id); setLinkedRecipeName(r.name); setRecipeSearch(''); setShowRecipePicker(false); }}
                      className="w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted/60 active:bg-muted border-b border-border/30 last:border-0"
                    >
                      <span className="font-semibold">{r.name}</span>
                      {r.category && <span className="ml-2 text-[10px] text-muted-foreground capitalize">{r.category}</span>}
                    </button>
                  ))}
                  {recipes.filter(r => r.name?.toLowerCase().includes(recipeSearch.toLowerCase())).length === 0 && (
                    <p className="px-3 py-3 text-sm text-muted-foreground">No recipes found</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reference photo */}
        <PhotoField
          label="Reference Photo (optional)"
          url={refPhotoUrl}
          onUpload={setRefPhotoUrl}
          onClear={() => setRefPhotoUrl('')}
        />

        {/* Require completion photo */}
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/30 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-foreground">Require Completion Photo</p>
            <p className="text-xs text-muted-foreground">Staff must photo when done</p>
          </div>
          <Toggle value={requireCompletionPhoto} onChange={setRequireCompletionPhoto} />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? 'Adding…' : 'Add Prep Item'}
        </button>
      </div>
    </BottomSheet>
  );
}
