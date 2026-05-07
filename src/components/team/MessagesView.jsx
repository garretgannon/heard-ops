import { MessageCircle, Bell } from 'lucide-react';

export default function MessagesView({ announcements, shiftNotes, managerMessages }) {
  const allMessages = [
    ...(announcements || []).map((msg) => ({ ...msg, type: 'announcement', icon: '📢' })),
    ...(shiftNotes || []).map((msg) => ({ ...msg, type: 'shift_note', icon: '📝' })),
    ...(managerMessages || []).map((msg) => ({ ...msg, type: 'manager_msg', icon: '👔' })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-3">
      {allMessages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No messages yet</p>
        </div>
      ) : (
        allMessages.map((msg) => (
          <div key={msg.id} className="p-4 rounded-lg bg-card border border-border/40">
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{msg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {msg.type === 'announcement' && 'Announcement'}
                  {msg.type === 'shift_note' && 'Shift Note'}
                  {msg.type === 'manager_msg' && `From ${msg.from_name || 'Manager'}`}
                </p>
                <h3 className="font-semibold text-foreground text-sm">{msg.title}</h3>
                {msg.content && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.content}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">
                  {msg.created_date
                    ? new Date(msg.created_date).toLocaleString()
                    : 'No date'}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}