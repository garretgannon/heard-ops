import { Link } from "react-router-dom";
import { AlertTriangle, ImageOff, Clock, ArrowRight } from "lucide-react";

export default function ShiftStatusPanel({ prepLists, prepItems, stations }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayListIds = new Set(prepLists.filter(pl => pl.date === todayStr).map(pl => pl.id));
  const todayItems = prepItems.filter(pi => todayListIds.has(pi.prep_list_id));

  const incomplete = todayItems.filter(pi => pi.status !== "completed");
  const missingPhotos = todayItems.filter(pi => pi.status === "completed" && !pi.photo_url);

  const getListName = (listId) => prepLists.find(pl => pl.id === listId)?.name || "Unknown List";
  const getStation = (stationId) => stations.find(s => s.id === stationId);

  const Section = ({ icon: Icon, iconColor, title, items, emptyText }) => (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-border ${iconColor}`}>
        <Icon className="h-4 w-4" />
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="ml-auto text-sm font-bold">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
      ) : (
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {items.slice(0, 20).map(item => {
            const station = getStation(item.station_id);
            return (
              <Link
                key={item.id}
                to="/tasks?tab=prep"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/40 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getListName(item.prep_list_id)}
                    {station && ` · ${station.name}`}
                    {item.quantity && ` · ${item.quantity}${item.unit ? ` ${item.unit}` : ""}`}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2 transition-opacity" />
              </Link>
            );
          })}
          {items.length > 20 && (
            <p className="text-xs text-muted-foreground text-center py-2">+{items.length - 20} more</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Today's Shift Status
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section
          icon={AlertTriangle}
          iconColor="text-yellow-400"
          title="Not Yet Completed"
          items={incomplete}
          emptyText="🎉 All prep items are completed!"
        />
        <Section
          icon={ImageOff}
          iconColor="text-red-400"
          title="Completed — Missing Photo"
          items={missingPhotos}
          emptyText="✅ No missing photos"
        />
      </div>
    </div>
  );
}