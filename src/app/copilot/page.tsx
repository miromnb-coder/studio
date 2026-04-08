import { PRODUCT_NAME } from '../config/product';

export default function CopilotPage() {
  return (
    <main className="screen bg-[#f8f9fc]">
      <section className="surface-card p-6">
        <h1 className="text-3xl font-semibold text-slate-900">{PRODUCT_NAME} Copilot</h1>
        <p className="mt-3 text-slate-500">Use Home and Chat to run full agent orchestration with memory-aware responses.</p>
      </section>
    </main>
  );
}
