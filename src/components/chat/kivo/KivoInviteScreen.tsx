'use client';

import { useRouter } from 'next/navigation';
import { Gift, ChevronRight } from 'lucide-react';

export function KivoInviteScreen({ code }: { code: string }) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f5f5f7] px-5 py-8 text-[#2f3640]">
      <div className="mx-auto max-w-[560px]">
        <div className="rounded-[32px] border border-black/[0.05] bg-white/82 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f6fa] text-[#4b5563]">
            <Gift className="h-7 w-7" strokeWidth={1.9} />
          </div>

          <h1 className="mt-5 text-[34px] font-semibold tracking-[-0.06em] text-[#2f3640]">
            You were invited to Kivo
          </h1>

          <p className="mt-3 text-[15px] leading-7 text-[#6f7785]">
            Join Kivo with this invite link and continue with your account setup.
          </p>

          <div className="mt-5 rounded-[22px] border border-black/[0.05] bg-[#f8f9fb] px-4 py-3">
            <p className="text-[13px] font-medium text-[#8a919e]">Invite code</p>
            <p className="mt-1 break-all text-[15px] font-medium text-[#2f3640]">
              {code}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push(`/signup?ref=${encodeURIComponent(code)}`)}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#111111] text-sm font-medium text-white"
            >
              Create account
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => router.push(`/login?ref=${encodeURIComponent(code)}`)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-black/[0.06] bg-white text-sm font-medium text-[#374151]"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
