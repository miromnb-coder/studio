'use client';

import { useEffect } from 'react';
import { CheckCircle2, Compass, FileSearch, Lightbulb, Wrench } from 'lucide-react';
import { useAppStore } from '../store/app-store';

const taskActions = [
  { title: 'Find information', description: 'Research a topic quickly with a clean summary.', icon: FileSearch },
  { title: 'Analyze something', description: 'Compare options, spot tradeoffs, and recommend the best path.', icon: Compass },
  { title: 'Troubleshoot an issue', description: 'Diagnose problems and get practical fixes step by step.', icon: Wrench },
  { title: 'Plan my next move', description: 'Turn goals into an actionable plan with clear priorities.', icon: CheckCircle2 },
  { title: 'Generate ideas', description: 'Brainstorm quality concepts and narrow to the strongest direction.', icon: Lightbulb },
];

export default function TasksPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return (
    <main className="screen app-bg">
      <section className="rounded-2xl bg-[#f7f7f7] p-5">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Tasks</h1>
        <p className="mb-4 text-sm text-secondary">Choose what you want to get done. Kivo handles the complexity behind the scenes.</p>
        <div className="space-y-3">
          {taskActions.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.title}
                onClick={() => enqueuePromptAndGoToChat(`${task.title}: ${task.description}`)}
                type="button"
                className="message-appear flex w-full items-start gap-3 rounded-2xl bg-[#f2f2f2] p-4 text-left"
              >
                <div className="rounded-xl bg-[#e9e9e9] p-2.5 text-[#333]"><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-base font-semibold text-primary">{task.title}</p>
                  <p className="text-sm text-secondary">{task.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
