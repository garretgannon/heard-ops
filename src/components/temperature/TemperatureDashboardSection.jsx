import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import TemperatureAlertsList from './TemperatureAlertsList';
import TemperatureManagerReview from './TemperatureManagerReview';

export default function TemperatureDashboardSection({ title, filter, icon: Icon, initialOpen = false }) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showReview, setShowReview] = useState(false);

  return (
    <>
      <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-background/50 transition-all"
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            <h3 className="font-bold text-foreground">{title}</h3>
          </div>
          <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
        </button>

        {/* Content */}
        {isOpen && (
          <div className="border-t border-border/20 px-6 py-4">
            <TemperatureAlertsList
              filter={filter}
              onLogClick={(log) => {
                setSelectedLog(log);
                setShowReview(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Review Modal */}
      <TemperatureManagerReview
        log={selectedLog}
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        onUpdate={() => {
          setShowReview(false);
          setSelectedLog(null);
        }}
      />
    </>
  );
}