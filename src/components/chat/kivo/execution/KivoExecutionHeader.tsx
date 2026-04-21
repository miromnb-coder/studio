'use client';

export function KivoExecutionHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/20" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-black/60" />
      </span>

      <h4 className="text-[15px] font-semibold tracking-[-0.02em] text-[#141419]">
        {title}
      </h4>
    </div>
  );
}
