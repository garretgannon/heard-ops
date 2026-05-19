import { useEffect, useRef } from 'react';
import { Edit2, Copy, Clipboard, GitBranch, CalendarDays, Trash2, Clock } from 'lucide-react';

export default function ShiftContextMenu({ x, y, shift, hasClipboard, onEdit, onCopy, onPaste, onDuplicate, onDuplicateWeek, onDelete, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('contextmenu', onClose);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('contextmenu', onClose);
    };
  }, [onClose]);

  // Clamp to viewport
  const left = Math.min(x, window.innerWidth - 200);
  const top = Math.min(y, window.innerHeight - 280);

  const items = shift ? [
    { icon: Edit2, label: 'Edit Shift', action: onEdit, color: 'text-foreground' },
    { icon: Copy, label: 'Copy Shift', action: onCopy, color: 'text-blue-400', shortcut: '⌘C' },
    hasClipboard && { icon: Clipboard, label: 'Paste Here', action: onPaste, color: 'text-green-400', shortcut: '⌘V' },
    { divider: true },
    { icon: GitBranch, label: 'Duplicate Shift', action: onDuplicate, color: 'text-purple-400', shortcut: '⌘D' },
    { icon: CalendarDays, label: 'Duplicate Across Week', action: onDuplicateWeek, color: 'text-purple-300' },
    { divider: true },
    { icon: Trash2, label: 'Delete Shift', action: onDelete, color: 'text-red-400' },
  ] : [
    hasClipboard && { icon: Clipboard, label: 'Paste Shift', action: onPaste, color: 'text-green-400', shortcut: '⌘V' },
    { icon: Clock, label: 'Add Shift', action: onEdit, color: 'text-primary' },
  ];

  const filtered = items.filter(Boolean);

  return (
    <div
      ref={ref}
      className="fixed z-[9999] w-48 rounded-xl border border-border/60 card-glass shadow-2xl py-1 overflow-hidden"
      style={{ left, top }}
    >
      {filtered.map((item, i) => {
        if (item.divider) return <div key={i} className="my-1 border-t border-border/40" />;
        return (
          <button
            key={i}
            onClick={() => { item.action?.(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-secondary transition-colors text-left"
          >
            <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
            <span className={`flex-1 ${item.color}`}>{item.label}</span>
            {item.shortcut && <span className="text-[10px] text-muted-foreground font-mono">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}