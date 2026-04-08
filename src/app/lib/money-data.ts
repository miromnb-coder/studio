export type SubscriptionItem = {
  id: string;
  name: string;
  price: number;
  cycle: 'monthly' | 'yearly';
  waste: boolean;
  status: 'active' | 'trial';
  renewalDate: string;
};

export const subscriptions: SubscriptionItem[] = [
  { id: 'streamplus', name: 'StreamPlus', price: 14.99, cycle: 'monthly', waste: true, status: 'active', renewalDate: '2026-04-19' },
  { id: 'clouddrive', name: 'Cloud Drive Pro', price: 7.99, cycle: 'monthly', waste: false, status: 'active', renewalDate: '2026-04-26' },
  { id: 'designtoolkit', name: 'Design Toolkit', price: 119, cycle: 'yearly', waste: true, status: 'trial', renewalDate: '2026-05-02' },
];

export const moneyAlerts = [
  { id: 'dup-streaming', text: 'Duplicate streaming services detected', severity: 'high' as const },
  { id: 'price-increase', text: 'Price increase expected next billing cycle', severity: 'medium' as const },
];

export function monthlySavingsEstimate() {
  return subscriptions
    .filter((item) => item.waste)
    .reduce((sum, item) => sum + (item.cycle === 'monthly' ? item.price : item.price / 12), 0);
}
