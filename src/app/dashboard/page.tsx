"use client";

import Link from "next/link";
import { ArrowRight, Bell, ChartColumn, Clock3, DollarSign } from "lucide-react";

const stats = [
  { label: "Monthly savings", value: "$820", icon: DollarSign },
  { label: "Open alerts", value: "4", icon: Bell },
  { label: "Completed analyses", value: "23", icon: ChartColumn },
  { label: "Time reclaimed", value: "14.2h", icon: Clock3 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-slate-500">A clean overview of your latest AI activity and outcomes.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="app-card p-5">
            <div className="mb-3 inline-flex rounded-2xl bg-indigo-50 p-2 text-indigo-600">
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="app-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent activity</h2>
            <Link href="/history" className="text-sm text-slate-500">Open history</Link>
          </div>
          <div className="space-y-3">
            {[
              "Agent found duplicate software subscription",
              "Created action plan for reducing spending",
              "Synced new receipts from Gmail",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200/70 px-4 py-3 text-slate-700">{item}</div>
            ))}
          </div>
        </article>

        <article className="app-card p-5">
          <h2 className="text-xl font-semibold">Active agents</h2>
          <div className="mt-4 space-y-2">
            {[
              "Research Agent — running",
              "Alert Agent — monitoring",
              "Memory Agent — syncing",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{item}</div>
            ))}
          </div>
          <Link href="/tools" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
            Manage agents <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>
    </div>
  );
}
