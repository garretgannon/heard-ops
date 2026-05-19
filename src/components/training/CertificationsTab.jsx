import { useState } from 'react';
import { Plus } from 'lucide-react';
import CertificationFormModal from './CertificationFormModal';

export default function CertificationsTab({ certifications, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600';
      case 'expiring_soon': return 'bg-amber-500/10 text-amber-600';
      case 'expired': return 'bg-red-500/10 text-red-600';
      default: return 'bg-slate-500/10 text-slate-600';
    }
  };

  const getDaysUntilExpiry = (expirationDate) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold">Certifications</h2>
        <button
          onClick={() => { setSelectedCert(null); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> New Certification
        </button>
      </div>

      {certifications.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No certification records yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {certifications.map(cert => {
            const daysLeft = cert.expirationDate ? getDaysUntilExpiry(cert.expirationDate) : null;
            return (
              <div key={cert.id} className="p-4 rounded-xl border border-border/30 space-y-3" style={{ background: 'linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{cert.certificationName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{cert.employeeName}</p>
                    <div className="flex gap-2 mt-2 flex-wrap text-xs text-muted-foreground">
                      {cert.issueDate && (
                        <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                      )}
                      {cert.expirationDate && (
                        <span>Expires: {new Date(cert.expirationDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {daysLeft !== null && daysLeft < 30 && daysLeft >= 0 && (
                      <p className="text-xs text-amber-600 font-semibold mt-2">
                        ⚠️ Expires in {daysLeft} days
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-semibold ${getStatusColor(cert.status)}`}>
                    {cert.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedCert(cert); setShowForm(true); }}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-semibold transition-all"
                  >
                    Edit
                  </button>
                  {cert.renewalRequired && (
                    <button
                      className="flex-1 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-sm font-semibold transition-all"
                    >
                      Schedule Renewal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <CertificationFormModal
          certification={selectedCert}
          onClose={() => { setShowForm(false); setSelectedCert(null); }}
          onSuccess={() => { setShowForm(false); setSelectedCert(null); onRefresh(); }}
        />
      )}
    </div>
  );
}