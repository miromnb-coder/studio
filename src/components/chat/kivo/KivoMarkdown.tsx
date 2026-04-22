"use client";

type Props = {
  content: string;
};

export function KivoMarkdown({
  content,
}: Props) {
  const lines =
    content.split("\n");

  return (
    <div className="space-y-3 text-sm leading-7 text-white/90">
      {lines.map((line, i) => {
        if (
          line.startsWith("### ")
        ) {
          return (
            <h3
              key={i}
              className="text-base font-semibold text-white"
            >
              {line.replace(
                "### ",
                "",
              )}
            </h3>
          );
        }

        if (
          line.startsWith("- ")
        ) {
          return (
            <div
              key={i}
              className="flex gap-2"
            >
              <span>•</span>
              <span>
                {line.replace(
                  "- ",
                  "",
                )}
              </span>
            </div>
          );
        }

        if (
          line.startsWith("```")
        ) {
          return null;
        }

        return (
          <div key={i}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
