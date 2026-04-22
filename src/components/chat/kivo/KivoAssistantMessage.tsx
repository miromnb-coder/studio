export function KivoAssistantMessage({
  message,
  latestUserContent,
}: {
  message: Message;
  latestUserContent: string;
}) {
  return (
    <div className="w-full max-w-[840px]">
      <ResponseRenderer
        message={message}
        latestUserContent={latestUserContent}
      />
    </div>
  );
}
