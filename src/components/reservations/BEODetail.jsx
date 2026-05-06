import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Edit2, Copy, Archive, Users, Clock, ChefHat, AlertTriangle, Star, Zap, CheckCircle2, Plus } from 'lucide-react';
import { haptics } from '@/utils/haptics';

function SectionBlock({ title, children, color = '' }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${color || 'text-muted-foreground'}`}>{title}</p>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-[10px] font-bold text-muted-foreground uppercase w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export default function BEODetail({ beo, isAdmin, user, onClose, onEdit, onSave }) {
  const [menuItems, setMenuItems] = useState([]);
  const [prepItems, setPrepItems] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [dietary, setDietary] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role detection
  const role = user?.role || 'user';
  const isChef = isAdmin || ['chef', 'executive-chef', 'sous-chef', 'head-chef'].includes(role);
  const isFOH = ['foh', 'server', 'host', 'hostess', 'food-runner'].includes(role);
  const isBar = ['bartender', 'bar', 'barback'].includes(role);
  const isPrep = ['prep', 'prep-cook', 'prep cook'].includes(role);
  const isLine = ['line-cook', 'cook', 'line cook'].includes(role);
  // Managers and admins see everything; basic 'user' role sees only guest-facing info
  const canSeeKitchen = isAdmin || isChef || isLine || isPrep;
  const canSeeFOH = isAdmin || isFOH || isChef;
  const canSeeBar = isAdmin || isBar || isChef;
  const canSeePrep = isAdmin || isChef || isPrep;
  const canSeeStaffing = isAdmin;
  const canSeeInternal = isAdmin;

  useEffect(() => {
    Promise.all([
      base44.entities.BEOMenuItem.filter({ beoId: beo.id }, 'sortOrder').catch(() => []),
      base44.entities.BEOPrepItem.filter({ beoId: beo.id }, 'sortOrder').catch(() => []),
      base44.entities.BEOTimelineItem.filter({ beoId: beo.id }, 'sortOrder').catch(() => []),
      base44.entities.BEODietaryRestriction.filter({ beoId: beo.id }).catch(() => []),
      base44.entities.BEOEquipmentNeed.filter({ beoId: beo.id }).catch(() => []),
      base44.entities.BEOAttachment.filter({ beoId: beo.id }).catch(() => []),
    ]).then(([m, p, t, d, e, a]) => {
      setMenuItems(m.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0)));
      setPrepItems(p.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0)));
      setTimeline(t.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0)));
      setDietary(d);
      setEquipment(e);
      setAttachments(a);
      setLoading(false);
    });
  }, [beo.id]);

  const STATUS_COLOR = {
    inquiry: 'bg-muted text-muted-foreground',
    tentative: 'bg-amber-500/15 text-amber-400',
    confirmed: 'bg-green-500/15 text-green-400',
    'in-production': 'bg-blue-500/15 text-blue-400',
    ready: 'bg-primary/15 text-primary',
    completed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-red-500/15 text-red-400',
  };

  const SEV_COLOR = {
    preference: 'text-muted-foreground',
    intolerance: 'text-amber-400',
    allergy: 'text-red-400',
    'life-threatening': 'text-red-500',
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0 sticky top-0 z-10">
        <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-extrabold text-foreground truncate">{beo.eventName}</h1>
          <p className="text-[10px] text-muted-foreground">{beo.eventDate} · {beo.startTime}{beo.endTime ? `–${beo.endTime}` : ''}</p>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_COLOR[beo.status] || 'bg-muted text-muted-foreground'}`}>
          {(beo.status || 'tentative').replace(/-/g, ' ')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 px-4 py-4">
        {/* Event Summary */}
        <SectionBlock title="Event Summary">
          <div className="bg-muted/20 border border-border rounded-xl p-3 space-y-0">
            <InfoRow label="Event" value={beo.eventName} />
            <InfoRow label="Date" value={beo.eventDate} />
            <InfoRow label="Time" value={`${beo.startTime || ''}${beo.endTime ? `–${beo.endTime}` : ''}`} />
            <InfoRow label="Guests" value={beo.guestCount ? `${beo.guestCount} guests` : null} />
            <InfoRow label="Room / Area" value={beo.room || beo.area} />
            <InfoRow label="Type" value={beo.eventType?.replace(/-/g, ' ')} />
            <InfoRow label="Service Style" value={beo.serviceStyle?.replace(/-/g, ' ')} />
            <InfoRow label="Client" value={beo.clientName} />
            <InfoRow label="Event Owner" value={beo.internalEventOwner} />
          </div>
        </SectionBlock>

        {/* Timeline */}
        {timeline.length > 0 && (
          <SectionBlock title="Event Timeline">
            <div className="space-y-1.5">
              {timeline.map(t => (
                <div key={t.id} className="flex gap-3 items-start">
                  <span className="text-xs font-extrabold text-primary w-14 shrink-0">{t.time}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.label}</p>
                    {t.description && <p className="text-[10px] text-muted-foreground">{t.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Menu */}
        {menuItems.length > 0 && (
          <SectionBlock title="Menu">
            <div className="border border-border rounded-xl overflow-hidden">
              {menuItems.map((item, i) => (
                <div key={item.id} className={`px-3 py-2.5 ${i > 0 ? 'border-t border-border/50' : ''} ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-semibold text-foreground">{item.itemName}</span>
                    {item.quantity && <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>}
                    {item.course && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">{item.course}</span>}
                  </div>
                  {item.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{item.notes}</p>}
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Prep & Production */}
        {canSeePrep && prepItems.length > 0 && (
          <SectionBlock title="Prep & Production" color="text-orange-400">
            <div className="space-y-1.5">
              {prepItems.map(item => (
                <div key={item.id} className="bg-card border border-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-bold text-foreground">{item.prepItem}</span>
                    {item.quantity && <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.status === 'done' ? 'bg-green-500/15 text-green-400' :
                      item.status === 'in-progress' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-amber-500/15 text-amber-400'
                    }`}>{item.status || 'pending'}</span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-[9px] text-muted-foreground">
                    {item.dueTime && <span>Due: {item.dueTime}</span>}
                    {item.assignedStation && <span>Station: {item.assignedStation}</span>}
                    {item.generatedPrepTaskId && <span className="text-green-400 flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" />Task linked</span>}
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Kitchen Notes */}
        {canSeeKitchen && beo.kitchenNotes && (
          <SectionBlock title="Kitchen Notes" color="text-red-400">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{beo.kitchenNotes}</p>
            </div>
          </SectionBlock>
        )}

        {/* FOH Notes */}
        {canSeeFOH && beo.fohNotes && (
          <SectionBlock title="FOH Notes" color="text-blue-400">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{beo.fohNotes}</p>
            </div>
          </SectionBlock>
        )}

        {/* Bar Notes */}
        {canSeeBar && beo.barNotes && (
          <SectionBlock title="Bar Notes" color="text-purple-400">
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{beo.barNotes}</p>
            </div>
          </SectionBlock>
        )}

        {/* Setup */}
        {beo.setupNotes && (
          <SectionBlock title="Setup Requirements">
            <div className="bg-muted/20 border border-border rounded-xl p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{beo.setupNotes}</p>
            </div>
          </SectionBlock>
        )}

        {/* Dietary & Allergens */}
        {(dietary.length > 0 || beo.dietaryNotes || beo.allergenNotes) && (
          <SectionBlock title="Dietary & Allergens" color="text-red-400">
            {dietary.map(d => (
              <div key={d.id} className="flex items-start gap-2 py-1.5 border-b border-border/40 last:border-0">
                <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${SEV_COLOR[d.severity] || 'text-muted-foreground'}`} />
                <div>
                  {d.guestName && <p className="text-[10px] font-bold text-foreground">{d.guestName}</p>}
                  <p className={`text-sm font-semibold ${SEV_COLOR[d.severity]}`}>{d.restriction}</p>
                  {d.menuAdjustment && <p className="text-[10px] text-muted-foreground">Adjustment: {d.menuAdjustment}</p>}
                  {d.notes && <p className="text-[10px] text-muted-foreground">{d.notes}</p>}
                </div>
              </div>
            ))}
            {beo.dietaryNotes && <p className="text-sm text-foreground mt-2">{beo.dietaryNotes}</p>}
            {beo.allergenNotes && <p className="text-xs text-red-400 mt-1">{beo.allergenNotes}</p>}
          </SectionBlock>
        )}

        {/* Equipment */}
        {equipment.length > 0 && (
          <SectionBlock title="Equipment Needs">
            <div className="space-y-1.5">
              {equipment.map(e => (
                <div key={e.id} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm font-semibold text-foreground">{e.equipmentName}</span>
                  {e.quantity && <span className="text-xs text-muted-foreground">× {e.quantity}</span>}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.status === 'on-site' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                    {e.status || 'needed'}
                  </span>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Staffing */}
        {canSeeStaffing && (beo.serversNeeded || beo.bartendersNeeded || beo.cooksNeeded || beo.eventCaptain || beo.managerOnDuty) && (
          <SectionBlock title="Staffing" color="text-amber-400">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-0">
              <InfoRow label="Servers" value={beo.serversNeeded ? `${beo.serversNeeded} needed` : null} />
              <InfoRow label="Bartenders" value={beo.bartendersNeeded ? `${beo.bartendersNeeded} needed` : null} />
              <InfoRow label="Cooks" value={beo.cooksNeeded ? `${beo.cooksNeeded} needed` : null} />
              <InfoRow label="Setup Staff" value={beo.setupStaffNeeded ? `${beo.setupStaffNeeded} needed` : null} />
              <InfoRow label="Event Captain" value={beo.eventCaptain} />
              <InfoRow label="Manager on Duty" value={beo.managerOnDuty} />
            </div>
          </SectionBlock>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <SectionBlock title="Attachments">
            <div className="space-y-1.5">
              {attachments.map(a => (
                <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 active:scale-[0.99]">
                  <span className="flex-1 text-sm font-semibold text-primary truncate">{a.fileName}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{a.fileType}</span>
                </a>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Chef Notes */}
        {isChef && beo.chefNotes && (
          <SectionBlock title="Chef Notes" color="text-primary">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{beo.chefNotes}</p>
            </div>
          </SectionBlock>
        )}

        {/* Internal / Manager Notes */}
        {canSeeInternal && beo.managerNotes && (
          <SectionBlock title="Manager Notes (Internal)" color="text-red-400">
            <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{beo.managerNotes}</p>
            </div>
          </SectionBlock>
        )}
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex gap-2">
          <button onClick={() => onEdit(beo)} className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 h-10">
            <Edit2 className="h-3.5 w-3.5" /> Edit BEO
          </button>
        </div>
      )}
    </div>
  );
}