import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string | number;
  icon: LucideIcon;
  iconColor: string;
  badge?: {
    text: string;
    type: 'success' | 'danger' | 'warning' | 'info';
  };
}

export default function MetricCard({
  title,
  value,
  subValue,
  icon: Icon,
  iconColor,
  badge
}: MetricCardProps) {
  return (
    <div className="bg-brand-card border border-brand-border rounded p-4 shadow-md flex flex-col justify-between hover:border-brand-border/80 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{title}</span>
        <div className="p-1.5 rounded bg-brand-alt border border-brand-border/60">
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div>
          <span className="text-xl md:text-2xl font-mono font-bold text-brand-light tracking-tight">
            {value}
          </span>
          {subValue && (
            <p className="text-[10px] text-brand-muted font-medium mt-0.5">
              {subValue}
            </p>
          )}
        </div>

        {badge && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            badge.type === 'success'
              ? 'bg-emerald-990/40 text-brand-green border-brand-green/20'
              : badge.type === 'danger'
              ? 'bg-rose-950/40 text-red-400 border-rose-500/20'
              : badge.type === 'warning'
              ? 'bg-amber-950/40 text-amber-400 border-amber-500/20'
              : 'bg-blue-950/40 text-blue-400 border-blue-500/20'
          }`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
