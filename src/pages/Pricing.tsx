import React from 'react';
import PricingCards from "@/components/PricingCards";


const Pricing: React.FC = () => {
  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#18181b] dark:via-[#18181b] dark:to-[#232334] flex flex-col items-center pt-28 pb-12 px-2 md:px-6">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 text-center tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4 text-center max-w-2xl">Start for free. Upgrade anytime for more power. No hidden fees. Cancel anytime.</p>
        <div className="mb-8 text-indigo-600 dark:text-indigo-300 font-medium text-center text-sm">Trusted by 5,000+ students & professionals</div>
        <PricingCards />
      </div>
    </>
  );
};

export default Pricing;
