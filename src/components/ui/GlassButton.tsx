"use client";

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function GlassButton({ 
  children, 
  className, 
  variant = 'primary', 
  loading, 
  size = 'md',
  ...props 
}: GlassButtonProps) {
  const variants = {
    primary: "bg-primary text-white shadow-glow hover:bg-primary/90",
    secondary: "bg-white/60 text-slate-900 border border-white/80 hover:bg-white/80",
    ghost: "bg-transparent text-slate-500 hover:bg-white/40 hover:text-slate-900",
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px] rounded-xl",
    md: "px-6 py-3 text-xs rounded-2xl",
    lg: "px-8 py-4 text-sm rounded-3xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-bold uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
      {children}
    </button>
  );
}