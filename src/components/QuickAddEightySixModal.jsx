import { useState, useEffect, useRef } from 'react';
import { Camera, X, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import BottomSheet from '@/components/BottomSheet';
import { base44 } from '@/api/base44Client';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { posSync } from '@/lib/posSync';

const NOTIFY_ROLES = [
  { id: 'managers', label: 'Managers' },
  { id: 'servers', label: 'Servers' },
  { id: 'bartenders', label: 'Bartenders' },
  { id: 'cooks', label: 'Cooks' },
];

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

export default function QuickAddEightySixModal({ open, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const toast = useToast();
  const [itemName, setItemName] = useState('');
  const [reason, setReason] = useState('');
  const [menuCategory, setMenuCategory] = useState('');
  const [notifyRoles, setNotifyRoles] = useState(['managers', 'servers']);
  const [expectedReturn, setExpectedReturn] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    base44.entities.Recipe.list('-updated_date', 100).catch(() => []).then(setRecipes);
  }, [open]);

  const reset = () => {
    setItemName(''); setReason(''); setMenuCategory('');
    setNotifyRoles(['managers', 'servers']); setExpectedReturn(''); setPhotoUrl('');
  };

  const handleClose = () => { reset(); onClose?.(); };

  const toggleRole = (role) => {
    setNotifyRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const canSubmit = itemName.trim() && reason.trim() && menuCategory.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    haptics.medium?.();
    setSaving(true);
    try {
      let posSynced = false;
      if (posSync.isConnected()) {
        const syncRes = await posSync.sync86ToPOS(itemName.trim(), reason.trim());
        posSynced = syncRes.success;
      }

      await base44.entities.EightySixItem.create({
        item_name: itemName.trim(),
        reason: reason.trim(),
        area_menu_category: menuCategory.trim(),
        date_time_started: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        logged_by: user?.full_name || user?.email || '',
        expected_return_date: expectedReturn || undefined,
        notify_roles: notifyRoles,
        photo_url: photoUrl || undefined,
        status: 'active',
        pos_synced: posSynced,
      });
      toast(posSynced ? '86 item logged & Synced to POS' : '86 item logged');
      onSuccess?.();
      handleClose();
    } catch {
      toast('Failed to log 86 item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="Add 86">
      <div className="space-y-4 pb-2">

        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Item Unavailable *</label>
          <input
            list="eighty-six-items-list"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            placeholder="e.g. Ribeye Steak…"
            className={inputCls}
            autoFocus
          />
          <datalist id="eighty-six-items-list">
            {recipes.map(r => <option key={r.id} value={r.name || r.title} />)}
          </datalist>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Reason *</label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Out of stock, equipment down…"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Area / Menu Category *</label>
          <input
            value={menuCategory}
            onChange={e => setMenuCategory(e.target.value)}
            placeholder="e.g. Entrees, Bar, Appetizers…"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Notify Roles</label>
          <div className="grid grid-cols-2 gap-2">
            {NOTIFY_ROLES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleRole(id)}
                className={cn(
                  'rounded-xl border py-2 text-xs font-bold transition-all',
                  notifyRoles.includes(id)
                    ? 'border-primary/40 bg-primary/15 text-primary'
                    : 'border-border/60 bg-card/30 text-muted-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Expected Return (optional)</label>
          <input
            type="date"
            value={expectedReturn}
            onChange={e => setExpectedReturn(e.target.value)}
            className={inputCls}
          />
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
          {saving ? 'Logging…' : 'Log 86 Item'}
        </button>
      </div>
    </BottomSheet>
  );
}
