'use client';

import { useEffect } from 'react';
import { CheckCircle2, Compass, FileSearch, Lightbulb, Wrench, Zap } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { ActionRow, AppShell, PremiumCard, SectionHeader } from '../components/premium-ui';

const taskActions = [
  { title: 'Find information', description: 'Research a topic quickly with a clean summary.', icon: FileSearch, category: 'Research' },
  { title: 'Analyze something', description: 'Compare options, spot tradeoffs, and recommend the best path.', icon: Compass, category: 'Analysis' },
  { title: 'Troubleshoot an issue', description: 'Diagnose problems and get practical fixes step by step.', icon: Wrench, category: 'Execution' },
  { title: 'Plan my next move', description: 'Turn goals into an actionable plan with clear priorities.', icon: CheckCircle2, category: 'Planning' },
  { title: 'Generate ideas', description: 'Brainstorm quality concepts and narrow to the strongest direction.', icon: Lightbulb, category: 'Creative' },
];

export default function TasksPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return (
    <AppShell>
      <PremiumCard className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-[#eef2f7] p-2.5 text-[#59606d]"><Zap className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#22262c]">Tasks</h1>
            <p className="text-sm text-[#7a838f]">Choose what to execute. Your operator structures the work instantly.</p>
          </div>
        </div>

        <SectionHeader title="Suggested workflows" subtitle="Grouped by operator capability" />

        <div className="space-y-2.5">
          {taskActions.map((task) => {
            const Icon = task.icon;
            return (
              <ActionRow
                key={task.title}
                title={task.title}
                description={`${task.category} • ${task.description}`}
                icon={<Icon className="h-4 w-4" />}
                onClick={() => enqueuePromptAndGoToChat(`${task.title}: ${task.description}`)}
              />
            );
          })}
        </div>
      </PremiumCard>
    </AppShell>
  );
}
