import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";

export default function SubscriptionCard() {
  const { plan, loading } = useUserPlan();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle upgrade to premium subscription
  async function handleUpgradeSubscription() {
    setIsProcessing(true);
    try {
      // This would be replaced with a real API call to your backend
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_premium_monthly', // Your Stripe price ID
        }),
      });
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }
  
  // Handle manage subscription (customer portal)
  async function handleManageSubscription() {
    setIsProcessing(true);
    try {
      // This would be replaced with a real API call to your backend
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/create-customer-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const { url } = await response.json();
      
      // Redirect to Stripe Customer Portal
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to create customer portal session');
      }
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      toast.error('Failed to access subscription management. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) {
    return (
      <Card className="shadow-md border-0 bg-card">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-40 mt-4" />
        </CardContent>
      </Card>
    );
  }

  const isPremium = plan?.plan === "premium";
  const isActive = plan?.subscriptionStatus === "active";
  
  return (
    <Card className="shadow-md border-0 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" />
          Subscription
        </CardTitle>
        <CardDescription>Your current subscription plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            {plan?.planName || (isPremium ? "Premium Plan" : "Free Plan")}
          </span>
          {isActive ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {isPremium 
            ? isActive 
              ? "You have access to all premium features" 
              : "Your subscription is currently inactive"
            : "Upgrade to Premium for unlimited access"}
        </p>
        
        {plan?.subscriptionStatus === "past_due" && (
          <p className="text-xs text-red-500 mt-1">
            Payment issue detected. Please update your payment method.
          </p>
        )}
        
        {plan?.subscriptionStatus === "canceled" && (
          <p className="text-xs text-amber-500 mt-1">
            Your subscription will end at the current billing period.
          </p>
        )}
        
        <div className="mt-4">
          {isPremium && isActive ? (
            <Button 
              variant="outline" 
              className="text-sm"
              onClick={handleManageSubscription}
              disabled={isProcessing}
            >
              Manage Subscription
            </Button>
          ) : (
            <Button 
              className="text-sm"
              onClick={handleUpgradeSubscription}
              disabled={isProcessing}
            >
              Upgrade to Premium
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
