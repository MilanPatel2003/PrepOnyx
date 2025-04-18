export type PlanFeature = {
  feature: 'mockInterview' | 'pdfAnalyze' | 'skribbleAI';
  limit: number | 'unlimited';
};

export type Plan = {
  id: string;
  name: string;
  description: string;
  features: PlanFeature[];
  priceMonthly: number;
  priceYearly: number;
  priceIdMonthly?: string;
  priceIdYearly?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
};

export const plans: Plan[] = [ 
  {
    id: 'free',
    name: 'Free',
    description: 'Basic access to PrepOnyx features.',
    features: [
      { feature: 'mockInterview', limit: 2 },
      { feature: 'pdfAnalyze', limit: 5 },
      { feature: 'skribbleAI', limit: 'unlimited' }
    ],
    priceMonthly: 0,
    priceYearly: 0,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: '10 mock interviews and 25 PDF analyses per month.',
    features: [
      { feature: 'mockInterview', limit: 10 },
      { feature: 'pdfAnalyze', limit: 25 },
      { feature: 'skribbleAI', limit: 'unlimited' }
    ],
    priceMonthly: 299, // Example price, adjust as needed
    priceYearly: 2999,
    priceIdMonthly: 'price_1REom3SDRUk0pjjIaFkMgS5A', // <-- Replace with your actual Stripe Price ID
    priceIdYearly: 'price_1REonDSDRUk0pjjI1KtZrCJO', // <-- Replace with your actual Stripe Price ID
    isPopular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Unlimited access to all features.',
    features: [
      { feature: 'mockInterview', limit: 'unlimited' },
      { feature: 'pdfAnalyze', limit: 'unlimited' },
      { feature: 'skribbleAI', limit: 'unlimited' }
    ],
    priceMonthly: 699, // Example price, adjust as needed
    priceYearly: 5999,
    priceIdMonthly: 'price_1REop5SDRUk0pjjIHIrb7U5e', // <-- Replace with your actual Stripe Price ID
    priceIdYearly: 'price_1REoodSDRUk0pjjIIFNczrWQ', // <-- Replace with your actual Stripe Price ID
    isBestValue: true,
  }
];
