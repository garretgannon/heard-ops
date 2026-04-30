import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export default function MobileActionBar({ actions = [], className = '' }) {
  if (actions.length === 0) return null;

  return (
    <motion.div
      className={cn(
        'fixed bottom-0 left-0 right-0 lg:hidden bg-card border-t-2 border-border p-3 space-y-2 max-h-[40vh] overflow-y-auto',
        className
      )}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {actions.map((action, i) => (
        <Button
          key={i}
          onClick={action.onClick}
          disabled={action.disabled}
          variant={action.variant || 'default'}
          size="lg"
          className="w-full justify-center"
        >
          {action.icon && <action.icon className="h-5 w-5 mr-2" />}
          {action.label}
        </Button>
      ))}
    </motion.div>
  );
}