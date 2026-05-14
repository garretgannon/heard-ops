import { useState, useEffect, useRef } from 'react';
import { Camera, X, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import BottomSheet from '@/components/BottomSheet';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const WASTE_REASONS = ['Spoiled', 'Overproduced', 'Burned', 'Dropped', 'Expired', 'Guest return', 'Other'];
const UNITS = ['oz', 'lb', 'g', 'kg', 'L', 'mL', 'cup', 'tbsp', 'tsp', 'piece', 'portion', 'case'];

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
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files[0])} />
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

export default function QuickAddWasteModal({ open, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const toast = useToast();
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('oz');
  const [reason, setReason] = useState('');
  const [stationId, setStationId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [stations, setStations] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      base44.entities.Station.list('-updated_date', 100).catch(() => []),
      base44.entities.PrepItem.list('-updated_date', 200).catch(() => []),
    ]).then(([s, p]) => {
      setStations(s.filter(x => x.isActive !== false));
      setPrepItems(p);
    });
  }, [open]);

  const reset = () => {
    setItemName(''); setQuantity(''); setUnit('oz'); setReason('');
    setStationId(''); setPhotoUrl('');
  };

  const handleClose = () => { reset(); onClose?.(); };

  const canSubmit = itemName.trim() && quantity && reason && stationId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    haptics.medium?.();
    setSaving(true);
    try {
      const station = stations.find(s => s.id === stationId);
      await base44.entities.WasteEntry.create({
        item_name: itemName.trim(),
        quantity: parseFloat(quantity),
        unit,
        reason,
        station_area: station?.name || stationId,
        logged_by: user?.full_name || user?.email || '',
        waste_date: format(new Date(), 'yyyy-MM-dd'),
        waste_time: format(new Date(), 'HH:mm'),
        photo_url: photoUrl || undefined,
      });
      toast('Waste logged');
      onSuccess?.();
      handleClose();
    } catch {
      toast('Failed to log waste');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="Log Waste">
      <div className="space-y-4 pb-2">

        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Item Wasted *</label>
          <input
            list="waste-items-list"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            placeholder="Search or type item name…"
            className={inputCls}
            autoFocus
          />
          <datalist id="waste-items-list">
            {prepItems.map(p => <option key={p.id} value={p.name} />)}
          </datalist>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Quantity *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Unit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)} className={inputCls}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Reason *</label>
          <select value={reason} onChange={e => setReason(e.target.value)} className={inputCls}>
            <option value="">Select reason…</option>
            {WASTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Station *</label>
          <select value={stationId} onChange={e => setStationId(e.target.value)} className={inputCls}>
            <option value="">Select station…</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <PhotoField
          label="Photo (optional)"
          url={photoUrl}
          onUpload={setPhotoUrl}
          onClear={() => setPhotoUrl('')}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? 'Logging…' : 'Log Waste'}
        </button>
      </div>
    </BottomSheet>
  );
}
