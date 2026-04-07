"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Upload } from "lucide-react";

export default function AnalyzePage() {
  const [textInput, setTextInput] = useState("");

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Chat & Input</h1>
        <p className="mt-2 text-slate-500">Share text or a screenshot for AI analysis.</p>
      </section>

      <section className="app-card p-5 space-y-4">
        <Textarea
          placeholder="Paste receipts, statements, or ask a question..."
          className="min-h-[220px] rounded-2xl border-slate-200 bg-slate-50 text-base"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200">
            <Upload className="mr-2 h-4 w-4" /> Upload screenshot
          </Button>
          <div className="ml-auto">
            <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" disabled={!textInput}>
              Analyze <ArrowUp className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
