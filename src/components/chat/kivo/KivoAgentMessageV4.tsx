"use client";

import { KivoStatusTimeline } from "./KivoStatusTimeline";
import { KivoDynamicLayout } from "./KivoDynamicLayout";
import { KivoLiveStream } from "./KivoLiveStream";
import { KivoMemoryCard } from "./KivoMemoryCard";
import { KivoSourceCard } from "./KivoSourceCard";
import { KivoArtifactCard } from "./KivoArtifactCard";
import { KivoDataTable } from "./KivoDataTable";
import { KivoToolEventCard } from "./KivoToolEventCard";

type ToolEvent = {
  id: string;
  tool: string;
  title: string;
  subtitle?: string;
  status: "running" | "completed" | "failed";
  output?: string;
};

type Props = {
  content: string;
  status?: string;
  streaming?: boolean;
  toolEvents?: ToolEvent[];
};

export function KivoAgentMessageV4({
  content,
  status,
  streaming = false,
  toolEvents = [],
}: Props) {
  return (
    <div className="space-y-3">
      {status && status !== "completed" && (
        <KivoStatusTimeline current={status} />
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        {streaming ? (
          <KivoLiveStream text={content} />
        ) : (
          <KivoDynamicLayout content={content} />
        )}
      </div>

      {toolEvents.length > 0 && (
        <div className="space-y-3">
          {toolEvents.map((event) => (
            <KivoToolEventCard
              key={event.id}
              title={event.title}
              subtitle={event.subtitle}
              status={event.status}
              output={event.output}
            />
          ))}
        </div>
      )}

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
            value: status || "READY",
          },
          {
            label: "ENGINE",
            value: "GPT-5.4-MINI",
          },
        ]}
      />
    </div>
  );
}
