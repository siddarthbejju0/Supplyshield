import React from 'react';

interface RiskBadgeProps {
  level: 'Critical' | 'High' | 'Moderate' | 'Low' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'sm' }) => {
  const norm = level.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (norm === 'critical') {
    styles = 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100';
    dotColor = 'bg-red-500 animate-pulse';
  } else if (norm === 'high') {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (norm === 'moderate') {
    styles = 'bg-sky-50 text-sky-800 border-sky-200';
    dotColor = 'bg-sky-500';
  } else if (norm === 'low') {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses} ${styles}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {level}
    </span>
  );
};
