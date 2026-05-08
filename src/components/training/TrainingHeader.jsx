import { BookOpen } from 'lucide-react';

export default function TrainingHeader() {
  return (
    <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-4 py-4 lg:px-8 max-w-6xl mx-auto flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Training System</h1>
          <p className="text-xs text-muted-foreground">Create modules, assign training, track completions</p>
        </div>
      </div>
    </div>
  );
}