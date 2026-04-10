import { ChevronRight } from 'lucide-react';
import type { SubscriptionItem } from './types';

type SubscriptionsListProps = {
  subscriptions: SubscriptionItem[];
  onOpenSubscription: (subscription: SubscriptionItem) => void;
};

export function SubscriptionsList({ subscriptions, onOpenSubscription }: SubscriptionsListProps) {
  return (
    <section className="card-surface dashboard-reveal p-4">
      <h2 className="mb-2 text-base font-semibold text-primary">Active subscriptions</h2>
      <div className="space-y-2">
        {subscriptions.map((subscription) => (
          <button
            key={subscription.id}
            type="button"
            onClick={() => onOpenSubscription(subscription)}
            className="card-interactive flex w-full items-center justify-between rounded-2xl bg-[#f2f2f2] px-3 py-3 text-left"
          >
            <div>
              <p className="text-sm font-medium text-primary">{subscription.name}</p>
              <p className="text-[11px] text-secondary">
                {subscription.status === 'issue' ? `Potential issue • ${subscription.rawStatus}` : 'Active'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-primary">${Math.round(subscription.monthlyCost)}/mo</p>
              <ChevronRight className="h-4 w-4 text-secondary" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
