"use client";

import { KivoTypingStream } from "./KivoTypingStream";
import { KivoDynamicLayout } from "./KivoDynamicLayout";
import { KivoToolCard } from "./KivoToolCard";
import { KivoMemoryCard } from "./KivoMemoryCard";
import { KivoStatusTimeline } from "./KivoStatusTimeline";

type Props = {
  content: string;
  status?: string;
  streaming?: boolean;
};

export function KivoAgentMessageV3({
  content,
  status,
  streaming,
}: Props) {
  return (
    <div className="space-y-2.5 text-[14px] leading-[1.5]">
      {status &&
        status !==
          "completed" && (
          <KivoStatusTimeline
            current={status}
          />
        )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xl">
        {streaming ? (
          <KivoTypingStream
            text={content}
          />
        ) : (
          <KivoDynamicLayout
            content={content}
          />
        )}
      </div>

      <KivoToolCard
        title="Reasoning Layer Active"
        subtitle="Kernel processed structured response"
      />

      <KivoMemoryCard text="Ready for future memory integrations." />
    </div>
  );
}
