import type { ProfileStat } from '@/app/profile/types';

type StatsGridProps = {
  stats: ProfileStat[];
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex snap-x snap-mandatory gap-3 pb-1">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.id}
              className="min-w-[158px] snap-start rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)] sm:min-w-[150px]"
            >
              <Icon className="h-5 w-5 text-[#242424]" strokeWidth={1.9} />
              <p className="mt-4 text-[38px] font-semibold leading-none tracking-[-0.03em] text-[#121212]">{stat.value}</p>
              <p className="mt-2 text-[15px] font-medium text-[#303030]">{stat.title}</p>
              <p className={`mt-1 text-[14px] ${stat.accent === 'green' ? 'text-[#1f9f73]' : 'text-[#727272]'}`}>{stat.subtext}</p>
              {typeof stat.progress === 'number' ? (
                <div className="mt-2 h-1 rounded-full bg-[#ececeb]">
                  <div className="h-full rounded-full bg-[#141414]" style={{ width: `${Math.max(0, Math.min(100, stat.progress))}%` }} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
