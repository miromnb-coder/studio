export type DashboardInsight = {
  id: string;
  title: string;
  summary: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  contextPrompt: string;
  actionType?: 'open_chat' | 'create_savings_plan' | 'find_alternatives' | 'draft_cancellation' | 'review_subscription';
};

export type SubscriptionItem = {
  id: string;
  name: string;
  monthlyCost: number;
  status: 'active' | 'issue';
  rawStatus: string;
};

export type OpportunityItem = {
  id: string;
  title: string;
  detail: string;
  monthlyImpact: number;
  contextPrompt: string;
};

export type RecentActivityItem = {
  title: string;
  summary: string;
  date: string;
};

export type SavingsPoint = {
  label: string;
  value: number;
};

export type DashboardPayload = {
  stats: {
    monthlyTotal: number;
    estimatedSavings: number;
    activeSubscriptions: number;
  };
  subscriptions: SubscriptionItem[];
  topOpportunities: OpportunityItem[];
  recentActions: RecentActivityItem[];
  proactiveInsights: DashboardInsight[];
  savingsSeries: SavingsPoint[];
  profileSummary: string;
};
