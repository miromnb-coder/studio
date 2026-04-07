"use client";

import { Bot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Agents</h1>
          <p className="mt-2 text-slate-500">Install and manage AI tools in a single consistent workspace.</p>
        </div>
        <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"><Plus className="mr-2 h-4 w-4" /> New tool</Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Research Agent", "Analysis Agent", "Inbox Agent", "Alert Agent", "Planner Agent", "Memory Agent"].map((item) => (
          <article key={item} className="app-card p-5">
            <div className="mb-3 inline-flex rounded-2xl bg-indigo-50 p-2 text-indigo-600">
              <Bot className="h-4 w-4" />
            </div>
            <p className="font-medium text-slate-800">{item}</p>
            <p className="mt-1 text-sm text-slate-500">Active and ready</p>
          </article>
        ))}
      </section>
    </div>
  );
}
