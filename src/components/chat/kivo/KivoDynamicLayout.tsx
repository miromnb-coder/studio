"use client";

import { KivoMarkdown } from "./KivoMarkdown";

type Props = {
  content: string;
};

function detectType(
  text: string,
) {
  if (
    text.includes("```")
  )
    return "code";

  if (
    text.includes("- ")
  )
    return "list";

  return "text";
}

export function KivoDynamicLayout({
  content,
}: Props) {
  const type =
    detectType(content);

  if (type === "code") {
    return (
      <pre className="overflow-x-auto rounded-3xl bg-black/30 p-4 text-xs text-cyan-200">
        {content}
      </pre>
    );
  }

  return (
    <KivoMarkdown
      content={content}
    />
  );
}
