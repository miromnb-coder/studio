import { PRODUCT_NAME } from '../config/product';

export default function ActivityPage() {
  return (
    <main className="screen bg-[#f8f9fc]">
      <section className="surface-card p-6">
        <h1 className="text-3xl font-semibold text-slate-900">{PRODUCT_NAME} Activity</h1>
        <p className="mt-3 text-slate-500">Review recent agent actions, memory updates, and generated outputs.</p>
      </section>
    </main>
  );
}
