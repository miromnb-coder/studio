import { useMemo } from 'react';
import type { SavingsPoint } from './types';

type SavingsChartProps = {
  points: SavingsPoint[];
};

export function SavingsChart({ points }: SavingsChartProps) {
  const chart = useMemo(() => {
    if (!points.length) return null;
    const width = 300;
    const height = 120;
    const padding = 12;
    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

    const path = points
      .map((point, index) => {
        const x = padding + index * stepX;
        const y = height - padding - (point.value / maxValue) * (height - padding * 2);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');

    return { width, height, padding, path, maxValue };
  }, [points]);

  if (!chart) return null;

  return (
    <section className="card-surface dashboard-reveal p-4">
      <h2 className="mb-2 text-base font-semibold text-primary">Savings over time</h2>
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="w-full" role="img" aria-label="Savings trend chart">
        <path d={chart.path} fill="none" stroke="rgba(18, 18, 18, 0.9)" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <div className="mt-2 flex items-center justify-between gap-2">
        {points.map((point) => (
          <div key={`${point.label}-${point.value}`} className="min-w-0 text-center">
            <p className="text-[11px] font-medium text-primary">${Math.round(point.value)}</p>
            <p className="truncate text-[10px] text-secondary">{point.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
