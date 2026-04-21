'use client';

export function KivoExecutionStatus({
  text,
}: {
  text: string;
}) {
  return (
    <div className="text-[13px] leading-5 text-[#6B7280]">
      {text}
    </div>
  );
}
