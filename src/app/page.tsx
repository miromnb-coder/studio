"use client";

import Link from "next/link";
import { ArrowUp, Bot, Clock3, Sparkles, TrendingUp } from "lucide-react";

const recent = [
  { title: "Analyzed monthly subscriptions", time: "8 minutes ago" },
  { title: "Prepared weekly insights", time: "42 minutes ago" },
  { title: "Updated knowledge memory", time: "1 hour ago" },
];

const agents = ["Research Agent", "Analysis Agent", "Memory Agent"];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="space-y-2 pt-2">
        <p className="text-sm font-medium text-indigo-600">Good morning 👋</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Your AI workspace is ready.</h1>
        <p className="text-slate-500">One place for chat, analysis, agents, and alerts.</p>
      </section>

      <section className="app-card p-4 sm:p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <textarea
            rows={3}
            placeholder="What would you like to accomplish today?"
            className="w-full resize-none border-0 bg-transparent text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Research</span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Analyze</span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Create</span>
            </div>
            <Link href="/analyze" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <ArrowUp className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="app-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent activity</h2>
            <Link href="/history" className="text-sm text-slate-500 hover:text-slate-700">View all</Link>
          </div>
          <div className="space-y-3">
            {recent.map((item) => (
              <div key={item.title} className="flex items-center justify-between rounded-2xl border border-slate-200/70 px-4 py-3">
                <p className="font-medium text-slate-700">{item.title}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" />{item.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="app-card p-5">
            <h3 className="mb-3 text-lg font-semibold">Active agents</h3>
            <div className="space-y-2">
              {agents.map((agent) => (
                <div key={agent} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <Bot className="h-4 w-4 text-indigo-500" />
                  <p className="text-sm text-slate-700">{agent}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-slate-500">Savings identified</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">$1,240</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600"><TrendingUp className="h-4 w-4" /> +18% this month</p>
          </div>
          <div className="app-card p-5">
            <p className="flex items-center gap-2 text-sm text-slate-500"><Sparkles className="h-4 w-4 text-indigo-500" /> AI confidence</p>
            <p className="mt-1 text-2xl font-semibold">94%</p>
          </div>
        </div>
      </section>
    </div>
  );
}
