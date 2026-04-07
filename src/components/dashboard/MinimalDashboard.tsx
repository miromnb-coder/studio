"use client";

import { Activity, Bot, Brain, Clock3, Database, LineChart, Search, Wand2 } from "lucide-react";

type Analysis = {
  id: string;
  title?: string;
  createdAt?: any;
};

const fallbackActivity = [
  { id: "1", title: "Analyzed market trends", time: "2 minutes ago" },
  { id: "2", title: "Updated project memory", time: "15 minutes ago" },
  { id: "3", title: "Generated weekly report", time: "1 hour ago" },
];

export function MinimalDashboard({ analyses = [] }: { analyses?: Analysis[] }) {
  const recentActivity = analyses.length
    ? analyses.slice(0, 3).map((a, index) => ({
        id: a.id,
        title: a.title || "Completed task",
        time: index === 0 ? "Just now" : `${index * 10 + 5} minutes ago`,
      }))
    : fallbackActivity;

  return (
    <div className="space-y-5">
      <section className="space-y-2 px-2">
        <h1 className="text-5xl font-semibold tracking-[-0.03em] text-slate-900">Good morning, Miro 👋</h1>
        <p className="text-2xl text-slate-500">Your AI agents are ready to help you today.</p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-5">
          <input
            placeholder="What would you like to accomplish today?"
            className="w-full border-0 bg-transparent text-3xl text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { label: "Research", icon: Search },
              { label: "Analyze", icon: LineChart },
              { label: "Create", icon: Wand2 },
              { label: "Automate", icon: Bot },
            ].map((item) => (
              <button key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-lg text-slate-700">
                <item.icon className="h-4 w-4 text-slate-500" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-3 text-lg text-slate-400">
          <span className="font-semibold text-slate-600">Try:</span> Analyze my weekly productivity · Summarize recent news
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.045)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">Recent Activity</h2>
          <button className="text-lg text-slate-400">View all</button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-4 rounded-2xl px-1 py-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <LineChart className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl text-slate-800">{item.title}</p>
                <div className="mt-1 flex items-center gap-2 text-base text-slate-400">
                  <Clock3 className="h-4 w-4" />
                  {item.time}
                </div>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${idx < 2 ? "bg-emerald-400" : "bg-indigo-500"}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.045)]">
          <h3 className="mb-4 text-3xl font-semibold tracking-[-0.03em] text-slate-900">Active Agents</h3>
          <div className="space-y-4">
            {[
              ["Research Agent", "Gathering latest information"],
              ["Analysis Agent", "Processing your data"],
              ["Memory Agent", "Updating knowledge base"],
            ].map(([name, subtitle]) => (
              <div key={name} className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl text-slate-800">{name}</p>
                  <p className="text-base text-slate-400">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg text-slate-500">Memory Usage</p>
              <p className="text-2xl font-semibold text-slate-900">2.2 GB / 5 GB</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg text-slate-500">Response Time</p>
              <p className="text-2xl font-semibold text-slate-900">1.2s avg</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
