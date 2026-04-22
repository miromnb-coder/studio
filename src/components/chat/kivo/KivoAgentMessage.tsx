"use client";

import { KivoResponseCard } from "./KivoResponseCard";
import { KivoExpandableBlock } from "./KivoExpandableBlock";
import { KivoStatusTimeline } from "./KivoStatusTimeline";

type Props = {
  content: string;
  status?: string;
};

function splitContent(text: string) {
  const parts = text.split("\n\n");

  return {
    main: parts[0] || "",
    extra:
      parts.slice(1).join("\n\n") || "",
  };
}

export function KivoAgentMessage({
  content,
  status,
}: Props) {
  const sections =
    splitContent(content);

  return (
    <div className="space-y-3">
      {status &&
        status !== "completed" && (
          <KivoStatusTimeline
            current={status}
          />
        )}

      <KivoResponseCard title="Main Answer">
        <div className="whitespace-pre-wrap">
          {sections.main ||
            "Working..."}
        </div>
      </KivoResponseCard>

      {sections.extra && (
        <KivoExpandableBlock
          title="More Details"
          content={
            sections.extra
          }
        />
      )}
    </div>
  );
}
