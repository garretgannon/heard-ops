import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { haptics } from '@/utils/haptics';
import {
  Utensils, Search, Plus, ChevronRight, Camera, AlertTriangle,
  Link2, Edit2, X, Package, Clock, AlertCircle
} from 'lucide-react';

const CATEGORIES = ['all','appetizer','entree','sandwich','salad','dessert','cocktail','na-drink','archived'];
const CATEGORY_LABELS = { 'na-drink': 'NA Drink', appetizer: 'Appetizer', entree: 'Entree', sandwich: 'Sandwich', salad: 'Salad', dessert: 'Dessert', cocktail: 'Cocktail' };
const STATIONS = ['Grill','Fry','Pantry','Expo','Bar','Bakery'];
const ALLERGEN_LIST = ['Gluten','Dairy','Egg','Soy','Shellfish','Nuts','Peanuts'];
const DIETARY_FLAGS = ['Vegetarian','Vegan','GF'];
const UNITS = ['oz','each','fl oz','tbsp','cup','slice','piece','lb'];
const SPICE_LEVELS = ['none','mild','medium','hot','extra-hot'];

const STATUS_STYLE = {
  active: 'bg-green-500/20 text-green-300',
  draft: 'bg-amber-500/20 text-amber-300',
  archived: 'bg-muted text-muted-foreground',
};
const AVAIL_STYLE = {
  available: null,
  low: 'border-amber-500/30 bg-amber-500/5',
  'eighty-six': 'border-red-500/40 bg-red-500/5',
};

function BuildCardCard({ card, onClick }) {
  const isEightySix = card.availabilityStatus === 'eighty-six';
  const isLow = card.availabilityStatus === 'low';
  return (
    <button onClick={onClick} className={`w-full text-left bg-card border rounded-xl overflow-hidden active:scale-[0.99] transition-all ${AVAIL_STYLE[card.availabilityStatus] || 'border-border'}`}>
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight truncate">{card.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
              {card.station}{card.category ? ` · ${CATEGORY_LABELS[card.category] || card.category}` : ''}
            </p>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 capitalize ${STATUS_STYLE[card.status] || STATUS_STYLE.draft}`}>
            {card.status || 'Draft'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {card.plateVessel && <span className="flex items-center gap-1"><Utensils className="h-3 w-3" />{card.plateVessel}</span>}
          {card.fireTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{card.fireTime}</span>}
          {card.menuPrice && <span className="ml-auto font-bold text-foreground">${card.menuPrice}</span>}
        </div>
        {(isEightySix || isLow) && (
          <div className={`mt-2 flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg w-fit ${isEightySix ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
            <AlertCircle className="h-3 w-3" />
            {isEightySix ? `86'd${card.eightySixReason ? ` — ${card.eightySixReason}` : ''}` : 'Low Stock'}
          </div>
        )}
        {card.allergens?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {card.allergens.slice(0,4).map(a => <span key={a} className="text-[9px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-bold">{a}</span>)}
          </div>
        )}
      </div>
      <div className="border-t border-border/60 px-4 py-2 flex items-center justify-between bg-muted/30">
        <span className="text-[10px] text-muted-foreground">
          {card.updated_date ? `Updated ${new Date(card.updated_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No date'}
        </span>
        <span className="text-[10px] font-bold text-primary flex items-center gap-1">View Build <ChevronRight className="h-3 w-3" /></span>
      </div>
    </button>
  );
}

function SectionBlock({ title, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  );
}

function SpecChip({ label, value }) {
  if (!value) return null;
  return (
    <div className="bg-muted rounded-lg px-3 py-2 text-center">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function BuildCardDetail({ card, onClose, onEdit, isAdmin }) {
  const [components, setComponents] = useState([]);
  const [steps, setSteps] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [linkedRecipes, setLinkedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.BuildCardComponent.filter({ buildCardId: card.id }, 'sortOrder', 50).catch(() => []),
      base44.entities.BuildCardStep.filter({ buildCardId: card.id }, 'sortOrder', 50).catch(() => []),
      base44.entities.BuildCardModifier.filter({ buildCardId: card.id }, 'sortOrder', 50).catch(() => []),
    ]).then(([comps, stps, mods]) => {
      setComponents(comps.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0)));
      setSteps(stps.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0)));
      setModifiers(mods.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0)));
      setLoading(false);
    });
    if (card.linkedRecipes?.length) {
      Promise.all(card.linkedRecipes.map(id => base44.entities.Recipe.get(id).catch(() => null)))
        .then(recs => setLinkedRecipes(recs.filter(Boolean)));
    }
  }, [card.id]);

  const isEightySix = card.availabilityStatus === 'eighty-six';
  const isLow = card.availabilityStatus === 'low';

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-extrabold text-foreground truncate">{card.name}</h1>
          <p className="text-[10px] text-muted-foreground capitalize">{card.station}{card.category ? ` · ${CATEGORY_LABELS[card.category] || card.category}` : ''}</p>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[card.status] || STATUS_STYLE.draft}`}>
          {card.status || 'Draft'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 px-4 py-4 space-y-1">
        {/* 86 / Availability Banner */}
        {(isEightySix || isLow) && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2 ${isEightySix ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
            <AlertCircle className={`h-4 w-4 shrink-0 ${isEightySix ? 'text-red-400' : 'text-amber-400'}`} />
            <div>
              <p className={`text-sm font-bold ${isEightySix ? 'text-red-300' : 'text-amber-300'}`}>{isEightySix ? "Currently 86'd" : 'Low Stock'}</p>
              {card.eightySixReason && <p className="text-xs text-muted-foreground">{card.eightySixReason}</p>}
            </div>
          </div>
        )}

        {/* Plating Photo */}
        <SectionBlock title="Plating Photo">
          {card.platingImageUrl ? (
            <img src={card.platingImageUrl} alt="Plating" className="w-full rounded-xl object-cover max-h-48 border border-border" />
          ) : (
            <div className="w-full h-28 rounded-xl bg-muted border border-border border-dashed flex flex-col items-center justify-center gap-1.5">
              <Camera className="h-5 w-5 text-muted-foreground opacity-50" />
              <p className="text-[11px] text-muted-foreground">No plating photo added.</p>
            </div>
          )}
        </SectionBlock>

        {/* Quick Specs */}
        <SectionBlock title="Quick Specs">
          <div className="grid grid-cols-3 gap-2">
            <SpecChip label="Station" value={card.station} />
            <SpecChip label="Plate / Vessel" value={card.plateVessel} />
            <SpecChip label="Fire Time" value={card.fireTime} />
            <SpecChip label="Portion" value={card.portionSize} />
            <SpecChip label="Spice" value={card.spiceLevel !== 'none' ? card.spiceLevel : null} />
            <SpecChip label="Price" value={card.menuPrice ? `$${card.menuPrice}` : null} />
          </div>
        </SectionBlock>

        {/* Allergens */}
        {card.allergens?.length > 0 && (
          <SectionBlock title="Allergens & Dietary">
            <div className="flex flex-wrap gap-1.5">
              {card.allergens.map(a => (
                <span key={a} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />{a}
                </span>
              ))}
              {card.dietaryFlags?.map(f => (
                <span key={f} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/20">{f}</span>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Components */}
        {!loading && (
          <SectionBlock title={`Components${components.length ? ` (${components.length})` : ''}`}>
            {components.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No components added.</p>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] bg-muted/40 px-3 py-1.5 gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Component</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase text-right w-14">Qty / Unit</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase w-24">Placement</span>
                </div>
                {components.map((comp, i) => (
                  <div key={comp.id} className={`grid grid-cols-[1fr_auto_auto] px-3 py-2 gap-2 items-start border-t border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <div>
                      <span className="text-xs font-semibold text-foreground">{comp.componentName}</span>
                      {comp.linkedRecipeId && <span className="ml-1 text-[9px] text-primary font-bold">recipe</span>}
                    </div>
                    <span className="text-xs text-muted-foreground text-right w-14">{comp.quantity} {comp.unit}</span>
                    <span className="text-[10px] text-muted-foreground w-24 leading-snug">{comp.placementInstruction || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionBlock>
        )}

        {/* Assembly Steps */}
        {!loading && steps.length > 0 && (
          <SectionBlock title="Assembly Steps">
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={step.id} className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {step.stepNumber || i + 1}
                  </div>
                  <p className="text-sm text-foreground leading-snug flex-1">{step.instruction}</p>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Plating & Presentation */}
        {(card.platingNotes || card.expoNotes) && (
          <SectionBlock title="Plating & Expo Notes">
            <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2 text-sm">
              {card.platingNotes && <p><span className="font-bold text-foreground">Plating:</span> <span className="text-muted-foreground">{card.platingNotes}</span></p>}
              {card.expoNotes && <p><span className="font-bold text-foreground">Expo:</span> <span className="text-muted-foreground">{card.expoNotes}</span></p>}
            </div>
          </SectionBlock>
        )}

        {/* Modifiers */}
        {!loading && modifiers.length > 0 && (
          <SectionBlock title="Modifiers">
            <div className="space-y-1.5">
              {modifiers.map(mod => (
                <div key={mod.id} className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${mod.allergyRelevant ? 'border-red-500/20 bg-red-500/5' : 'border-border bg-muted/20'}`}>
                  {mod.allergyRelevant && <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-xs font-bold text-foreground">{mod.modifierName}</p>
                    {mod.instruction && <p className="text-[10px] text-muted-foreground">{mod.instruction}</p>}
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Linked Recipes */}
        {linkedRecipes.length > 0 && (
          <SectionBlock title="Linked Recipes">
            <div className="space-y-1.5">
              {linkedRecipes.map(rec => (
                <div key={rec.id} className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
                  <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground">{rec.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground capitalize">{rec.category}</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Notes */}
        {card.notes && (
          <SectionBlock title="Notes">
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 rounded-xl p-3">{card.notes}</p>
          </SectionBlock>
        )}
      </div>

      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-2">
          <button onClick={() => onEdit(card)} className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 h-10">
            <Edit2 className="h-3.5 w-3.5" /> Edit Build Card
          </button>
        </div>
      )}
    </div>
  );
}

function BuildCardForm({ card, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', category: '', station: '', status: 'draft', menuPrice: '',
    plateVessel: '', fireTime: '', portionSize: '', spiceLevel: 'none',
    allergens: [], dietaryFlags: [], platingNotes: '', expoNotes: '',
    availabilityStatus: 'available', eightySixReason: '', notes: '',
    ...card,
  });
  const [components, setComponents] = useState([]);
  const [steps, setSteps] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (card?.id) {
      base44.entities.BuildCardComponent.filter({ buildCardId: card.id }, 'sortOrder', 50).then(d => setComponents(d.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))));
      base44.entities.BuildCardStep.filter({ buildCardId: card.id }, 'sortOrder', 50).then(d => setSteps(d.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))));
      base44.entities.BuildCardModifier.filter({ buildCardId: card.id }, 'sortOrder', 50).then(d => setModifiers(d.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))));
    }
  }, [card?.id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (k, v) => setForm(p => ({ ...p, [k]: p[k]?.includes(v) ? p[k].filter(x => x !== v) : [...(p[k] || []), v] }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    let cardId = card?.id;
    const payload = { ...form };
    if (cardId) { await base44.entities.BuildCard.update(cardId, payload); }
    else { const c = await base44.entities.BuildCard.create(payload); cardId = c.id; }

    for (const comp of components) {
      if (comp._new) { const { _new, id, ...d } = comp; await base44.entities.BuildCardComponent.create({ ...d, buildCardId: cardId }); }
      else if (comp._deleted && comp.id) { await base44.entities.BuildCardComponent.delete(comp.id); }
      else if (comp.id && comp._dirty) { const { _dirty, ...d } = comp; await base44.entities.BuildCardComponent.update(comp.id, d); }
    }
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step._new) { const { _new, id, ...d } = step; await base44.entities.BuildCardStep.create({ ...d, buildCardId: cardId, stepNumber: i + 1 }); }
      else if (step._deleted && step.id) { await base44.entities.BuildCardStep.delete(step.id); }
      else if (step.id && step._dirty) { const { _dirty, ...d } = step; await base44.entities.BuildCardStep.update(step.id, { ...d, stepNumber: i + 1 }); }
    }
    for (const mod of modifiers) {
      if (mod._new) { const { _new, id, ...d } = mod; await base44.entities.BuildCardModifier.create({ ...d, buildCardId: cardId }); }
      else if (mod._deleted && mod.id) { await base44.entities.BuildCardModifier.delete(mod.id); }
      else if (mod.id && mod._dirty) { const { _dirty, ...d } = mod; await base44.entities.BuildCardModifier.update(mod.id, d); }
    }
    haptics.success();
    onSave?.();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"><X className="h-4 w-4 text-muted-foreground" /></button>
        <h2 className="flex-1 text-sm font-extrabold text-foreground">{card ? 'Edit Build Card' : 'New Build Card'}</h2>
        <button onClick={save} disabled={saving} className="btn-primary text-xs px-4 h-8">{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-10">
        <div className="space-y-2">
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Menu item name *" className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground font-bold" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={e => set('category', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="">Category</option>
              {['appetizer','entree','sandwich','salad','dessert','cocktail','na-drink','other'].map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
            </select>
            <input value={form.station} onChange={e => set('station', e.target.value)} placeholder="Station" className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.status} onChange={e => set('status', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option>
            </select>
            <select value={form.availabilityStatus} onChange={e => set('availabilityStatus', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              <option value="available">Available</option><option value="low">Low Stock</option><option value="eighty-six">86'd</option>
            </select>
          </div>
          {form.availabilityStatus === 'eighty-six' && (
            <input value={form.eightySixReason} onChange={e => set('eightySixReason', e.target.value)} placeholder="86 reason" className="w-full px-3 py-2 bg-background border border-red-500/30 rounded-lg text-sm text-foreground" />
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Specs</p>
          <div className="grid grid-cols-2 gap-2">
            {[['menuPrice','Menu Price','number'],['plateVessel','Plate / Vessel','text'],['fireTime','Fire Time','text'],['portionSize','Portion Size','text']].map(([k,l,t]) => (
              <input key={k} type={t} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={l} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            ))}
            <select value={form.spiceLevel} onChange={e => set('spiceLevel', e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              {SPICE_LEVELS.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Allergens</p>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGEN_LIST.map(a => (
              <button key={a} onClick={() => toggleArr('allergens', a)} className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${form.allergens?.includes(a) ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-muted border-border text-muted-foreground'}`}>{a}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {DIETARY_FLAGS.map(f => (
              <button key={f} onClick={() => toggleArr('dietaryFlags', f)} className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${form.dietaryFlags?.includes(f) ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted border-border text-muted-foreground'}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Components */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Components</p>
            <button onClick={() => setComponents(p => [...p, { componentName: '', quantity: '', unit: '', placementInstruction: '', sortOrder: p.length, _new: true }])} className="text-[10px] font-bold text-primary flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
          </div>
          <div className="space-y-2">
            {components.filter(c => !c._deleted).map((comp, idx) => (
              <div key={idx} className="flex gap-1.5 items-center">
                <input value={comp.componentName} onChange={e => setComponents(p => p.map((x,i) => i===idx ? {...x, componentName: e.target.value, _dirty: true} : x))} placeholder="Component" className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <input type="number" value={comp.quantity} onChange={e => setComponents(p => p.map((x,i) => i===idx ? {...x, quantity: e.target.value, _dirty: true} : x))} placeholder="Qty" className="w-12 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <select value={comp.unit} onChange={e => setComponents(p => p.map((x,i) => i===idx ? {...x, unit: e.target.value, _dirty: true} : x))} className="w-16 px-1 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground">
                  <option value="">Unit</option>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input value={comp.placementInstruction} onChange={e => setComponents(p => p.map((x,i) => i===idx ? {...x, placementInstruction: e.target.value, _dirty: true} : x))} placeholder="Placement" className="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <button onClick={() => setComponents(p => p.map((x,i) => i===idx ? {...x, _deleted: true} : x))} className="text-red-400 px-1"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Assembly Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Assembly Steps</p>
            <button onClick={() => setSteps(p => [...p, { instruction: '', sortOrder: p.length, _new: true }])} className="text-[10px] font-bold text-primary flex items-center gap-1"><Plus className="h-3 w-3" />Add Step</button>
          </div>
          <div className="space-y-2">
            {steps.filter(s => !s._deleted).map((step, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-1">{idx+1}</div>
                <textarea value={step.instruction} onChange={e => setSteps(p => p.map((x,i) => i===idx ? {...x, instruction: e.target.value, _dirty: true} : x))} placeholder="Step instruction…" rows={2} className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground resize-none" />
                <button onClick={() => setSteps(p => p.map((x,i) => i===idx ? {...x, _deleted: true} : x))} className="text-red-400 px-1 mt-1"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Modifiers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Modifiers</p>
            <button onClick={() => setModifiers(p => [...p, { modifierName: '', instruction: '', allergyRelevant: false, sortOrder: p.length, _new: true }])} className="text-[10px] font-bold text-primary flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
          </div>
          <div className="space-y-2">
            {modifiers.filter(m => !m._deleted).map((mod, idx) => (
              <div key={idx} className="flex gap-1.5 items-center">
                <input value={mod.modifierName} onChange={e => setModifiers(p => p.map((x,i) => i===idx ? {...x, modifierName: e.target.value, _dirty: true} : x))} placeholder="Modifier name" className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <input value={mod.instruction} onChange={e => setModifiers(p => p.map((x,i) => i===idx ? {...x, instruction: e.target.value, _dirty: true} : x))} placeholder="Instructions" className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground" />
                <label className="flex items-center gap-1 text-[10px] text-red-400 font-bold shrink-0">
                  <input type="checkbox" checked={mod.allergyRelevant} onChange={e => setModifiers(p => p.map((x,i) => i===idx ? {...x, allergyRelevant: e.target.checked, _dirty: true} : x))} className="rounded" />Allergy
                </label>
                <button onClick={() => setModifiers(p => p.map((x,i) => i===idx ? {...x, _deleted: true} : x))} className="text-red-400 px-1"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Plating / Expo Notes */}
        <div className="space-y-2">
          <textarea value={form.platingNotes} onChange={e => set('platingNotes', e.target.value)} placeholder="Plating notes (garnish, sauce placement, visual check…)" rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
          <textarea value={form.expoNotes} onChange={e => set('expoNotes', e.target.value)} placeholder="Expo notes" rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes (optional)" rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" />
        </div>
      </div>
    </div>
  );
}

export default function BuildCards() {
  const { isAdmin } = useCurrentUser();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStation, setFilterStation] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.BuildCard.list('-updated_date', 200).catch(() => []);
    setCards(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = cards.filter(c => {
    if (filterCat === 'archived') return c.status === 'archived';
    if (filterCat !== 'all') { if (c.category !== filterCat) return false; }
    else { if (c.status === 'archived') return false; }
    if (filterStation && c.station !== filterStation) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = async () => { await load(); setShowForm(false); setEditing(null); };

  if (selected) return <BuildCardDetail card={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onEdit={c => { setSelected(null); setEditing(c); setShowForm(true); }} />;
  if (showForm) return <BuildCardForm card={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />;

  return (
    <div className="pb-28">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-extrabold text-foreground">Build Cards</h1>
            </div>
            {isAdmin && (
              <button onClick={() => { setEditing(null); setShowForm(true); haptics.medium(); }} className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Menu specs, plating guides, modifiers, and service execution.</p>

          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search build cards…" className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilterCat(c)} className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-bold capitalize transition-all ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {CATEGORY_LABELS[c] || c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5">
          <button onClick={() => setFilterStation('')} className={`shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${!filterStation ? 'bg-card border border-primary/40 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>All Stations</button>
          {STATIONS.map(s => (
            <button key={s} onClick={() => setFilterStation(filterStation === s ? '' : s)} className={`shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${filterStation === s ? 'bg-card border border-primary/40 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Utensils className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No build cards found</p>
            {isAdmin && <button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-3 btn-primary text-xs px-4 py-2 flex items-center gap-1 mx-auto"><Plus className="h-3.5 w-3.5" />Create Build Card</button>}
          </div>
        ) : (
          filtered.map(c => <BuildCardCard key={c.id} card={c} onClick={() => { haptics.light(); setSelected(c); }} />)
        )}
      </div>
    </div>
  );
}

export const hideBase44Index = true;