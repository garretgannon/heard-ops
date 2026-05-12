import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Calendar, Plus } from 'lucide-react';
import { haptics } from '@/utils/haptics';
import TodayTab from '@/components/reservations/TodayTab';
import ReservationsTab from '@/components/reservations/ReservationsTab';
import BEOsTab from '@/components/reservations/BEOsTab';
import CalendarTab from '@/components/reservations/CalendarTab';
import PrepImpactTab from '@/components/reservations/PrepImpactTab';
import BEODetail from '@/components/reservations/BEODetail';
import ReservationForm from '@/components/reservations/ReservationForm';
import BEOForm from '@/components/reservations/BEOForm';
import QuickActionModal from '@/components/quickactions/QuickActionModal';
import DesktopPageHeader from '@/components/DesktopPageHeader';

const TABS = ['Today', 'Reservations', 'BEOs', 'Calendar', 'Prep Impact'];

const today = () => new Date().toISOString().split('T')[0];

function OverviewChip({ label, value, color = 'text-foreground', bg = 'bg-muted' }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl ${bg} min-w-[64px]`}>
      <span className={`text-lg font-extrabold ${color}`}>{value}</span>
      <span className="text-[9px] font-bold text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function OverviewCard({ reservations, beos }) {
  const todayRes = reservations.filter(r => r.date === today() && r.status !== 'cancelled');
  const todayBEOs = beos.filter(b => b.eventDate === today() && b.status !== 'cancelled');
  const totalCovers = todayRes.reduce((s, r) => s + (r.partySize || 0), 0) + todayBEOs.reduce((s, b) => s + (b.guestCount || 0), 0);
  const largeParties = todayRes.filter(r => (r.partySize || 0) >= 8).length;
  const vips = todayRes.filter(r => r.isVIP).length;
  const dietaryAlerts = todayRes.filter(r => r.hasDietaryRestrictions).length + todayBEOs.filter(b => b.dietaryNotes).length;
  const prepImpact = todayBEOs.length > 2 ? 'High' : todayBEOs.length > 0 ? 'Medium' : largeParties > 2 ? 'Medium' : 'Low';
  const serviceImpact = totalCovers > 100 ? 'High' : totalCovers > 50 ? 'Medium' : 'Low';
  const impactColor = (v) => v === 'High' ? 'text-red-400 bg-red-500/10' : v === 'Medium' ? 'text-amber-400 bg-amber-500/10' : 'text-green-400 bg-green-500/10';

  return (
    <div className="card-glass border border-border rounded-xl p-3 mb-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{"Today's Overview"}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <OverviewChip label="Reservations" value={todayRes.length} />
        <OverviewChip label="Covers" value={totalCovers} color="text-primary" bg="bg-primary/10" />
        <OverviewChip label="Large Parties" value={largeParties} color={largeParties > 0 ? 'text-amber-400' : 'text-foreground'} bg={largeParties > 0 ? 'bg-amber-500/10' : 'bg-muted'} />
        <OverviewChip label="BEOs" value={todayBEOs.length} color={todayBEOs.length > 0 ? 'text-blue-400' : 'text-foreground'} bg={todayBEOs.length > 0 ? 'bg-blue-500/10' : 'bg-muted'} />
        <OverviewChip label="VIPs" value={vips} color={vips > 0 ? 'text-yellow-400' : 'text-foreground'} bg={vips > 0 ? 'bg-yellow-500/10' : 'bg-muted'} />
        <OverviewChip label="Diet Alerts" value={dietaryAlerts} color={dietaryAlerts > 0 ? 'text-red-400' : 'text-foreground'} bg={dietaryAlerts > 0 ? 'bg-red-500/10' : 'bg-muted'} />
        <div className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[64px] ${impactColor(prepImpact)}`}>
          <span className="text-sm font-extrabold">{prepImpact}</span>
          <span className="text-[9px] font-bold text-center leading-tight opacity-80">Prep Impact</span>
        </div>
        <div className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[64px] ${impactColor(serviceImpact)}`}>
          <span className="text-sm font-extrabold">{serviceImpact}</span>
          <span className="text-[9px] font-bold text-center leading-tight opacity-80">Svc Impact</span>
        </div>
      </div>
    </div>
  );
}

export default function ReservationsAndBEOs() {
  const { isAdmin, user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('Today');
  const [reservations, setReservations] = useState([]);
  const [beos, setBeos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBEO, setSelectedBEO] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [showBEOForm, setShowBEOForm] = useState(false);
  const [editingBEO, setEditingBEO] = useState(null);
  const [showEventCreate, setShowEventCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    const [res, beoList] = await Promise.all([
      base44.entities.Reservation.list('-date', 200).catch(() => []),
      base44.entities.BEO.list('-eventDate', 200).catch(() => []),
    ]);
    setReservations(res);
    setBeos(beoList);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = () => {
    load();
    setShowReservationForm(false);
    setEditingReservation(null);
    setShowBEOForm(false);
    setEditingBEO(null);
    setShowEventCreate(false);
    setSelectedBEO(null);
  };

  if (selectedBEO) {
    return (
      <BEODetail
        beo={selectedBEO}
        isAdmin={isAdmin}
        user={user}
        onClose={() => setSelectedBEO(null)}
        onEdit={(b) => { setSelectedBEO(null); setEditingBEO(b); setShowBEOForm(true); }}
        onSave={handleSave}
      />
    );
  }

  if (showReservationForm) {
    return (
      <ReservationForm
        reservation={editingReservation}
        onSave={handleSave}
        onClose={() => { setShowReservationForm(false); setEditingReservation(null); }}
      />
    );
  }

  if (showBEOForm) {
    return (
      <BEOForm
        beo={editingBEO}
        onSave={handleSave}
        onClose={() => { setShowBEOForm(false); setEditingBEO(null); }}
      />
    );
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <DesktopPageHeader title="Reservations & BEOs" subtitle="Events, reservations, and prep impact planning" />
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 pt-4 pb-2 lg:hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h1 className="text-2xl font-black tracking-tight text-foreground">Reservations &amp; BEOs</h1>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setShowEventCreate(true); haptics.medium(); }}
                className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/20 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Event
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto px-4 pb-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); haptics.light(); }}
              className={`shrink-0 px-3 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3">
        {!loading && <OverviewCard reservations={reservations} beos={beos} />}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'Today' && (
              <TodayTab
                reservations={reservations}
                beos={beos}
                isAdmin={isAdmin}
                onSelectBEO={setSelectedBEO}
                onEditReservation={(r) => { setEditingReservation(r); setShowReservationForm(true); }}
              />
            )}
            {activeTab === 'Reservations' && (
              <ReservationsTab
                reservations={reservations}
                isAdmin={isAdmin}
                onEdit={(r) => { setEditingReservation(r); setShowReservationForm(true); }}
                onRefresh={load}
              />
            )}
            {activeTab === 'BEOs' && (
              <BEOsTab
                beos={beos}
                isAdmin={isAdmin}
                onSelect={setSelectedBEO}
                onEdit={(b) => { setEditingBEO(b); setShowBEOForm(true); }}
                onRefresh={load}
              />
            )}
            {activeTab === 'Calendar' && (
              <CalendarTab
                reservations={reservations}
                beos={beos}
                onSelectBEO={setSelectedBEO}
              />
            )}
            {activeTab === 'Prep Impact' && (
              <PrepImpactTab
                beos={beos}
                reservations={reservations}
                isAdmin={isAdmin}
                onRefresh={load}
              />
            )}
          </>
        )}
      </div>

      {showEventCreate && (
        <QuickActionModal
          actionType="add_beo"
          onClose={() => setShowEventCreate(false)}
          onSuccess={handleSave}
        />
      )}
    </div>
  );
}

export const hideBase44Index = true;
