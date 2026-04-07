"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function IntegrationPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-2 text-slate-500">Manage profile, integrations, and app preferences.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="app-card p-5 space-y-4">
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Miro" className="h-11 rounded-xl border-slate-200 bg-slate-50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue="miro@example.com" className="h-11 rounded-xl border-slate-200 bg-slate-50" />
          </div>
          <Button className="h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800">Save changes</Button>
        </article>

        <article className="app-card p-5 space-y-4">
          <h2 className="text-xl font-semibold">Integrations</h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium text-slate-800">Gmail</p>
            <p className="text-sm text-slate-500">Connected · Last sync 2 hours ago</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium text-slate-800">Forwarding address</p>
            <p className="text-sm text-slate-500">forward@miroai.app</p>
          </div>
          <Button variant="outline" className="h-11 rounded-xl border-slate-200">Sync now</Button>
        </article>
      </section>
    </div>
  );
}
