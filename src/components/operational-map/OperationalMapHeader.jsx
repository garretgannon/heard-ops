import { Search, Filter, Plus, AlertTriangle } from 'lucide-react';

export default function OperationalMapHeader({
  metrics,
  search,
  onSearchChange,
  onAddArea,
  onRefresh,
}) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/30 px-6 py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Operational Map</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Live operations structure and equipment status</p>
      </div>

      {/* Metrics Bar */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-green-400">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <span className="font-semibold">{metrics.readiness}% Ready</span>
        </div>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{metrics.areaCount} Areas</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{metrics.stationCount} Stations</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{metrics.equipmentCount} Equipment</span>
        {metrics.warnings > 0 && (
          <>
            <span className="text-muted-foreground">·</span>
            <div className="flex items-center gap-1.5 text-orange-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-semibold">{metrics.warnings} Warnings</span>
            </div>
          </>
        )}
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search locations, stations, equipment..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-card border border-border/40 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
        </div>
        <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-card transition-all">
          <Filter className="h-4 w-4" />
        </button>
        <button
          onClick={onAddArea}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:brightness-110 transition-all active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Area
        </button>
      </div>
    </div>
  );
}