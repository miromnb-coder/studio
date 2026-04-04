/**
 * @fileOverview Types for the Premium Upgrade System.
 */

export interface UpgradeFeature {
  title: string;
  desc: string;
  benefit: string;
  icon: string;
  isPremium: boolean;
}

export interface UpgradePlan {
  id: 'starter' | 'ultra';
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  color: string;
}
