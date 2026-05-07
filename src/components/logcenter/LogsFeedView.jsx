import { FileText } from "lucide-react";
import LogCard from "./LogCard";

export default function LogsFeedView({ logs, onLogClick, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-bold">No logs found</p>
        <p className="text-xs mt-1">Try adjusting filters or create a new log</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
      {logs.map(log => (
        <LogCard key={`${log.type}-${log.id}`} log={log} onClick={onLogClick} />
      ))}
    </div>
  );
}