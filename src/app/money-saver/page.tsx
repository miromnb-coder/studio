"use client";

import { BadgeDollarSign, ShieldCheck, TrendingUp } from "lucide-react";

export default function AuditLedgerPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Savings Ledger</h1>
        <p className="mt-2 text-slate-500">Track opportunities, projected savings, and completed wins.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="app-card p-5">
          <BadgeDollarSign className="h-5 w-5 text-indigo-600" />
          <p className="mt-2 text-sm text-slate-500">Projected annual savings</p>
          <p className="text-2xl font-semibold">$9,840</p>
        </article>
        <article className="app-card p-5">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <p className="mt-2 text-sm text-slate-500">Efficiency score</p>
          <p className="text-2xl font-semibold">87%</p>
        </article>
        <article className="app-card p-5">
          <ShieldCheck className="h-5 w-5 text-slate-700" />
          <p className="mt-2 text-sm text-slate-500">Confidence</p>
          <p className="text-2xl font-semibold">High</p>
        </article>
      </section>

      <section className="app-card p-5">
        <h2 className="mb-4 text-xl font-semibold">Opportunities</h2>
        <div className="space-y-3">
          {[
            "Switch mobile carrier plan · +$42/mo",
            "Remove duplicate storage subscription · +$10/mo",
            "Adjust unused premium add-on · +$19/mo",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200/70 px-4 py-3 text-slate-700">{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
