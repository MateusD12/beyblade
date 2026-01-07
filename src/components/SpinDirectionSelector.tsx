import { RotateCcw, RotateCw, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpinDirection = 'L' | 'R' | 'R/L';

interface SpinDirectionSelectorProps {
  value: SpinDirection | null | undefined;
  onChange: (direction: SpinDirection) => void;
  disabled?: boolean;
}

export function SpinDirectionSelector({ value, onChange, disabled }: SpinDirectionSelectorProps) {
  const options: { direction: SpinDirection; label: string; icon: React.ReactNode }[] = [
    { direction: 'L', label: 'Esquerda', icon: <RotateCcw className="w-4 h-4" /> },
    { direction: 'R', label: 'Direita', icon: <RotateCw className="w-4 h-4" /> },
    { direction: 'R/L', label: 'Ambos', icon: <RefreshCw className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Direção de Rotação</h4>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.direction}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.direction)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
              "hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed",
              value === option.direction
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-muted/30 text-muted-foreground"
            )}
          >
            {option.icon}
            <span className="text-lg font-bold">{option.direction}</span>
            <span className="text-xs">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
