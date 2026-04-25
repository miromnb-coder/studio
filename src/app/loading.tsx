export default function Loading() {
  return (
    <main className="min-h-[100dvh] bg-[#f7f7f5] px-4 py-6">
      <div className="mx-auto flex min-h-[90dvh] w-full max-w-[560px] flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-full kivo-skeleton" />
          <div className="h-5 w-28 rounded-full kivo-skeleton" />
          <div className="h-7 w-14 rounded-full kivo-skeleton" />
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-4 w-32 rounded-full kivo-skeleton" />
          <div className="h-16 rounded-[24px] kivo-skeleton" />
          <div className="h-16 rounded-[24px] kivo-skeleton" />
          <div className="h-16 w-[82%] rounded-[24px] kivo-skeleton" />
        </div>
        <div className="mt-auto rounded-[28px] border border-black/[0.05] bg-white/70 p-3">
          <div className="h-10 rounded-full kivo-skeleton" />
        </div>
      </div>
    </main>
  );
}
