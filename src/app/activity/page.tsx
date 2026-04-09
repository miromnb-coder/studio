import { PRODUCT_NAME } from '../config/product';

export default function ActivityPage() {
  return (
    <main className="screen app-bg">
      <section className="card-surface p-6">
        <h1 className="text-3xl font-semibold text-primary">{PRODUCT_NAME} Activity</h1>
        <p className="mt-3 text-secondary">Review recent agent actions, memory updates, and generated outputs.</p>
      </section>
    </main>
  );
}
