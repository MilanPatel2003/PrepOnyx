import { useUserPlan } from "@/hooks/useUserPlan";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { toast } from "sonner";

// Types of features available in the app
export type Feature = "mockInterview" | "pdfAnalyze" | "skribbleAI";

/**
 * Check if a user can access a specific feature based on their plan and current usage
 * @param feature The feature to check access for
 * @param userId The user's ID
 * @param plan The user's current plan
 * @param usageData The user's current feature usage data
 * @returns An object containing whether the user can access the feature and relevant messages
 */
export function checkFeatureAccess(
  feature: Feature,
  _plan: string, // Unused parameter, prefixed with underscore
  usageData: {
    usage: number;
    limit: number | "unlimited";
    percentage: number;
  }
): { 
  canAccess: boolean; 
  message?: string;
  upgradeRequired?: boolean;
} {
  // If the user has unlimited access, they can always access the feature
  if (usageData.limit === "unlimited") {
    return { canAccess: true };
  }

  // If the user has reached their limit, they cannot access the feature
  if (usageData.usage >= usageData.limit) {
    return { 
      canAccess: false, 
      message: `You've reached your ${getFeatureLabel(feature)} limit for this month.`,
      upgradeRequired: true
    };
  }

  // If the user is approaching their limit, warn them but allow access
  if (usageData.percentage >= 80) {
    return { 
      canAccess: true, 
      message: `You're approaching your ${getFeatureLabel(feature)} limit (${usageData.usage}/${usageData.limit}).`
    };
  }

  // Otherwise, the user can access the feature
  return { canAccess: true };
}

/**
 * Hook to check if a user can access a specific feature
 * @param feature The feature to check access for
 * @returns An object containing whether the user can access the feature and relevant messages
 */
export function useFeatureAccess(feature: Feature) {
  const { plan, loading: planLoading } = useUserPlan();
  const { usage, limit, percentage, loading: usageLoading } = useFeatureUsage(feature);

  const loading = planLoading || usageLoading;

  if (loading) {
    return { canAccess: false, loading: true, usage: 0, limit: 0, percentage: 0 };
  }

  // Extract the plan ID string from the plan object
  const planId = typeof plan === 'object' && plan !== null ? (plan.plan || 'Free') : (plan || 'Free');
  const accessInfo = checkFeatureAccess(feature, planId, { usage, limit, percentage });

  return {
    ...accessInfo,
    loading: false,
    usage,
    limit,
    percentage
  };
}

/**
 * Get a human-readable label for a feature
 * @param feature The feature to get a label for
 * @returns A human-readable label for the feature
 */
export function getFeatureLabel(feature: Feature): string {
  switch (feature) {
    case "mockInterview":
      return "Mock Interview";
    case "pdfAnalyze":
      return "PDF Analysis";
    case "skribbleAI":
      return "SkribbleAI";
    default:
      return feature;
  }
}

/**
 * Attempt to use a feature, checking if the user has access first
 * @param feature The feature to use
 * @param onSuccess Callback to execute if the user can access the feature
 * @param onFailure Optional callback to execute if the user cannot access the feature
 */
export function useFeature(
  feature: Feature,
  onSuccess: () => void,
  onFailure?: (message: string, upgradeRequired: boolean) => void
) {
  const accessInfo = useFeatureAccess(feature);
  const { canAccess, loading } = accessInfo;
  const message = 'message' in accessInfo ? accessInfo.message : undefined;
  const upgradeRequired = 'upgradeRequired' in accessInfo ? accessInfo.upgradeRequired : false;

  if (loading) {
    toast.loading("Checking access...");
    return;
  }

  if (canAccess) {
    if (message) {
      toast.warning(message);
    }
    onSuccess();
  } else if (message) {
    if (onFailure) {
      onFailure(message, upgradeRequired || false);
    } else {
      toast.error(message);
      if (upgradeRequired) {
        toast.info("Upgrade your plan to get more access.", {
          action: {
            label: "Upgrade",
            onClick: () => window.location.href = "/pricing"
          }
        });
      }
    }
  }
}
