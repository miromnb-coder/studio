"use client";

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-slate-200">
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-2 max-w-xs">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">{title}</h3>
        <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-wider">{description}</p>
      </div>
      {action}
    </div>
  );
}