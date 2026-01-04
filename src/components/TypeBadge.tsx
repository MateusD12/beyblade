import { cn } from '@/lib/utils';
import { TYPE_COLORS } from '@/types/beyblade';

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const colorClass = TYPE_COLORS[type] || 'bg-muted';
  
  return (
    <span 
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-md',
        colorClass,
        className
      )}
    >
      {type}
    </span>
  );
}
