'use client';

import { motion } from 'framer-motion';

type DataPoint = {
  date: string;
  savings: number;
};

type SavingsChartProps = {
  points: DataPoint[];
  currency?: string;
};

function formatMoney(value: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export function SavingsChart({ points, currency = 'EUR' }: SavingsChartProps) {
  if (!points || points.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 text-sm text-slate-500">
        No savings data yet.
      </div>
    );
  }

  const max = Math.max(...points.map((d) => d.savings));
  const min = Math.min(...points.map((d) => d.savings));

  const normalize = (value: number) => {
    if (max === min) return 50;
    return ((value - min) / (max - min)) * 100;
  };

  const chartPoints = points.map((d, i) => {
    const x = points.length === 1 ? 50 : (i / (points.length - 1)) * 100;
    const y = 100 - normalize(d.savings);
    return `${x},${y}`;
  });

  const path = `M ${chartPoints.join(' L ')}`;

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Savings over time
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">
            Your savings growth
          </h3>
        </div>

        <div className="text-sm text-slate-500">
          {formatMoney(points[points.length - 1].savings, currency)}
        </div>
      </div>

      <div className="relative h-40 w-full">
        {/* Glow background */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-white/50 blur-xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {/* Line */}
          <motion.path
            d={path}
            fill="none"
            stroke="rgba(15,23,42,0.8)"
            strokeWidth="1.8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Area fill */}
          <motion.path
            d={`${path} L 100,100 L 0,100 Z`}
            fill="rgba(15,23,42,0.06)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
        </svg>

        {/* Points */}
        {points.map((d, i) => {
          const x = points.length === 1 ? 50 : (i / (points.length - 1)) * 100;
          const y = 100 - normalize(d.savings);

          return (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-slate-900"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="mt-3 flex justify-between text-xs text-slate-400">
        <span>{points[0].date}</span>
        <span>{points[points.length - 1].date}</span>
      </div>
    </div>
  );
}
