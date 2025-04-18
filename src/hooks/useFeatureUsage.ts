import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/config/firebase.config";
import { doc, onSnapshot } from "firebase/firestore";
import { useUserPlan } from "./useUserPlan";
import { toast } from "sonner";
import { trackFeatureUsage, resetFeatureUsage, getFeatureUsageAndLimits } from "@/utils/featureTracker";

// Define types for feature usage
export type FeatureUsage = {
  mockInterview?: number;
  pdfAnalyze?: number;
  skribbleAI?: number;
  [key: string]: number | undefined;
};

export type FeatureLimits = {
  mockInterview?: number | "unlimited";
  pdfAnalyze?: number | "unlimited";
  skribbleAI?: number | "unlimited";
  [key: string]: number | string | undefined;
};

type UsageData = {
  usage: number;
  limit: number | "unlimited";
  percentage: number;
  remaining: number | "unlimited";
  loading: boolean;
  incrementUsage: () => Promise<void>;
  resetUsage: () => Promise<void>;
};

/**
 * Hook to get and increment feature usage for a user.
 * Returns usage data, limits, and functions to update usage.
 */
export function useFeatureUsage(feature: "mockInterview" | "pdfAnalyze" | "skribbleAI"): UsageData {
  const { userId } = useAuth();
  const { plan, loading: planLoading } = useUserPlan();
  const [usage, setUsage] = useState<number>(0);
  const [limit, setLimit] = useState<number | "unlimited">(0);
  const [loading, setLoading] = useState(true);

  // Get feature limits from user document
  useEffect(() => {
    if (!userId || planLoading) return;

    // Get the feature limit from the user's plan
    if (plan && plan.featureLimits) {
      setLimit(plan.featureLimits[feature] || 0);
    }
  }, [userId, feature, plan, planLoading]);

  // Get and listen to usage updates
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    // Initialize usage data if needed and set up listener
    const initializeAndListen = async () => {
      // Get initial usage and limits
      const { usage: initialUsage } = await getFeatureUsageAndLimits(userId);
      setUsage(initialUsage[feature] || 0);
      
      // Listen for real-time updates to usage
      const unsubscribe = onSnapshot(doc(db, "usage", userId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setUsage(data[feature] || 0);
        } else {
          setUsage(0);
        }
        setLoading(false);
      });
      
      return unsubscribe;
    };

    const unsubPromise = initializeAndListen();
    
    return () => {
      unsubPromise.then(unsub => unsub());
    };
  }, [userId, feature]);

  // Calculate percentage of usage
  const percentage = typeof limit === "number" && limit > 0 
    ? Math.min(Math.round((usage / limit) * 100), 100)
    : 0;

  // Calculate remaining usage
  const remaining = typeof limit === "number" 
    ? Math.max(limit - usage, 0) 
    : "unlimited";

  // Function to increment usage
  const incrementUsage = useCallback(async () => {
    if (!userId) return;
    
    // Check if user has reached their limit
    if (typeof limit === "number" && usage >= limit) {
      toast.error(`You've reached your ${feature} limit. Please upgrade your plan for more usage.`);
      return;
    }
    
    try {
      // Use the centralized feature tracker with a unique action ID to prevent duplicate increments
      // Include timestamp to make the action unique for each call
      const actionId = `increment_${feature}_${Date.now()}`;
      const result = await trackFeatureUsage(userId, feature, actionId);
      
      // Check if approaching limit (80% usage)
      if (typeof result.limit === "number" && result.usage >= result.limit * 0.8 && result.usage < result.limit) {
        toast.warning(`You're approaching your ${feature} limit. ${result.limit - result.usage} uses remaining.`);
      }
      
      // If reached limit, show error
      if (result.hasReachedLimit) {
        toast.error(`You've reached your ${feature} limit. Please upgrade your plan for more usage.`);
      }
      
      // Local state is updated by the onSnapshot listener
    } catch (error) {
      console.error("Error incrementing usage:", error);
      toast.error("Failed to track feature usage. Please try again.");
    }
  }, [userId, feature, limit, usage]);

  // Function to reset usage
  const resetUsage = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Use the centralized feature tracker
      const success = await resetFeatureUsage(userId, feature);
      
      if (success) {
        toast.success(`Your ${feature} usage has been reset.`);
      } else {
        toast.error("Failed to reset usage. Please try again.");
      }
    } catch (error) {
      console.error("Error resetting usage:", error);
      toast.error("Failed to reset usage. Please try again.");
    }
  }, [userId, feature]);

  return { 
    usage, 
    limit, 
    percentage,
    remaining,
    loading: loading || planLoading,
    incrementUsage,
    resetUsage
  };
}
