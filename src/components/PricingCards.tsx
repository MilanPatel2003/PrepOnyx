import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { plans } from "@/config/plans";
import { Sparkles, FileText, Brain } from "lucide-react";

const currency = '₹';

const featureIcons: Record<string, React.ReactNode> = {
  mockInterview: <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />,
  pdfAnalyze: <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-300" />,
  skribbleAI: <Brain className="w-4 h-4 text-violet-500 dark:text-violet-300" />,
};

interface PricingCardsProps {
  onPlanSelect?: (plan: any) => void;
}

const PricingCards: React.FC<PricingCardsProps> = ({ onPlanSelect }) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const { userId } = useAuth();
  const { user } = useUser();

  // Use environment variable for backend URL
  // IMPORTANT: Set VITE_BACKEND_URL in your .env for production deployment!
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const handleChoosePlan = async (plan: any) => {
    if (!userId) {
      alert('Please sign in to upgrade your plan.');
      return;
    }
    const priceId = billing === 'monthly' ? plan.priceIdMonthly : plan.priceIdYearly;
    try {
      const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, { // <-- Change BACKEND_URL for deployment
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          priceId,
          userId,
          userEmail: user?.primaryEmailAddress?.emailAddress, // Pass user email for Stripe personalization
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      alert('Error initiating payment: ' + err);
    }
  };


  return (
    <>
      <div className="flex items-center justify-center space-x-3 mb-10">
        <span className={billing === 'monthly' ? 'font-semibold text-indigo-600 dark:text-indigo-300' : 'text-gray-400 dark:text-gray-500'}>Monthly</span>
        <Switch checked={billing === 'yearly'} onCheckedChange={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')} />
        <span className={billing === 'yearly' ? 'font-semibold text-indigo-600 dark:text-indigo-300' : 'text-gray-400 dark:text-gray-500'}>Yearly <span className="ml-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded px-2 py-0.5 text-xs font-semibold">Save 20%</span></span>
      </div>
      <div className="w-full flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {plans.map((plan, idx) => {
            const price = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            return (
              <Card
                key={plan.id}
                tabIndex={0}
                aria-label={plan.name + ' plan'}
                className={`relative flex flex-col items-center border border-gray-200 dark:border-gray-800 shadow-lg rounded-2xl bg-white dark:bg-[#232334] px-6 py-8 md:px-8 md:py-10 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-400 hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-500 dark:hover:border-indigo-400 ${plan.isBestValue ? 'ring-2 ring-indigo-600 z-10 bg-gradient-to-b from-indigo-50/80 to-white dark:from-indigo-900/40 dark:to-[#232334]' : ''}`}
              >
                {plan.isBestValue && (
                  <span className="absolute -top-6 left-0 right-0 mx-auto w-max bg-gradient-to-r from-indigo-600 to-indigo-400 text-white text-xs px-6 py-1 rounded-t-xl font-bold tracking-wide shadow-lg animate-pulse">MOST POPULAR</span>
                )}
                <CardHeader className="w-full flex flex-col items-center pt-6 pb-2">
                  <CardTitle className="text-2xl font-bold mb-1 text-gray-900 dark:text-white flex items-center gap-2">
                    {plan.isBestValue && <span className="inline-block"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91 4 9.27l5.91-.91L12 2z"/></svg></span>}
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-300 mb-2 text-center">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center w-full px-6 pb-2">
                  <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
                    {price === 0 ? 'Free' : `${currency}${price}`}
                    {price !== 0 && <span className="text-base font-normal text-gray-400 dark:text-gray-400 ml-1">/{billing}</span>}
                  </div>
                  <ul className="text-left space-y-3 mt-6 mb-8 w-full">
                    {plan.features.map((feature: any) => (
                      <li key={feature.feature} className="flex items-center gap-3 text-base text-gray-700 dark:text-gray-200">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900">
                          {featureIcons[feature.feature]}
                        </span>
                        <span className="capitalize">{feature.feature.replace('skribbleAI', 'Skribble AI')}</span>
                        <span className="ml-auto font-semibold text-indigo-600 dark:text-indigo-200">
                          {feature.limit === 'unlimited' ? 'Unlimited' : feature.limit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="w-full flex flex-col items-center mt-auto pb-10 px-6">
                  <Button
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all shadow-none border border-indigo-600 ${
                      plan.priceMonthly === 0 ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600'
                    }`}
                    disabled={plan.priceMonthly === 0}
                    size="lg"
                    onClick={() => {
                      if (plan.priceMonthly !== 0) {
                        handleChoosePlan(plan);
                      }
                    }}
                  >
                    {plan.priceMonthly === 0 ? 'Current Plan' : 'Choose Plan'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default PricingCards;
