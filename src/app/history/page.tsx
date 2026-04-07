"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const historyItems = [
  { id: "1", title: "Cellular plan optimization", savings: "$32/mo", date: "Apr 6" },
  { id: "2", title: "Streaming bundle cleanup", savings: "$24/mo", date: "Apr 5" },
  { id: "3", title: "Insurance renewal review", savings: "$58/mo", date: "Apr 4" },
];

export default function MemoryPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">History</h1>
        <p className="mt-2 text-slate-500">All completed analyses and actions in one clear timeline.</p>
      </section>

      <section className="app-card p-5">
        <div className="space-y-3">
          {historyItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500">{item.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-emerald-600">{item.savings}</p>
                <Link href="/results/placeholder" className="inline-flex items-center gap-1 text-sm text-indigo-600">
                  Details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
