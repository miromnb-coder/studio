import { PRODUCT_NAME } from '../config/product';

export default function CopilotPage() {
  return (
    <main className="screen app-bg">
      <section className="card-surface p-6">
        <h1 className="text-3xl font-semibold text-primary">{PRODUCT_NAME} Copilot</h1>
        <p className="mt-3 text-secondary">Use Home and Chat to run full agent orchestration with memory-aware responses.</p>
      </section>
    </main>
  );
}
