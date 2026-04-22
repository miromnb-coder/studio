"use client";

import { KivoStatusTimeline } from "./KivoStatusTimeline";
import { KivoDynamicLayout } from "./KivoDynamicLayout";
import { KivoLiveStream } from "./KivoLiveStream";
import { KivoToolCard } from "./KivoToolCard";
import { KivoMemoryCard } from "./KivoMemoryCard";
import { KivoSourceCard } from "./KivoSourceCard";
import { KivoArtifactCard } from "./KivoArtifactCard";
import { KivoDataTable } from "./KivoDataTable";

type Props = {
  content: string;
  status?: string;
  streaming?: boolean;
};

export function KivoAgentMessageV4({
  content,
  status,
  streaming,
}: Props) {
  return (
    <div className="space-y-3">
      {status &&
        status !==
          "completed" && (
          <KivoStatusTimeline
            current={status}
          />
        )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        {streaming ? (
          <KivoLiveStream
            text={content}
          />
        ) : (
          <KivoDynamicLayout
            content={content}
          />
        )}
      </div>

      <KivoToolCard
        title="Tool Layer Ready"
        subtitle="Prepared for live tool events"
      />

      <KivoMemoryCard text="Prepared for memory retrieval UI." />

      <KivoSourceCard
        title="Future Source Integration"
        reason="Ready to display evidence cards"
      />

      <KivoArtifactCard
        title="Action Plan"
        body="This area can display generated plans, summaries, or tasks."
      />

      <KivoDataTable
        rows={[
          {
            label: "MODE",
            value: "AGENT",
          },
          {
            label: "STATUS",
            value:
              status ||
              "READY",
          },
          {
            label: "ENGINE",
            value:
              "GPT-5.4-MINI",
          },
        ]}
      />
    </div>
  );
}
