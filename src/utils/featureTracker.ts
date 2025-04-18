import { doc, updateDoc, increment, setDoc, Timestamp, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/config/firebase.config";

/**
 * Log user activity to Firestore
 * @param userId - The user ID
 * @param action - The action being performed
 * @param details - Additional details about the action
 */
async function logUserActivity(userId: string, action: string, details?: Record<string, any>): Promise<void> {
  try {
    // Create activity log entry in Firestore
    // Store activities in a top-level collection with userId field for better querying
    const activityRef = collection(db, "user_activity");
    await addDoc(activityRef, { 
      userId,
      action,
      details: details || {},
      timestamp: Timestamp.now(),
    });
    
    console.log('Activity logged:', action, details);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Track active feature operations to prevent duplicate increments
const activeOperations: Record<string, boolean> = {};

/**
 * Track feature usage by logging the activity and incrementing usage counter
 * @param userId - The user ID
 * @param feature - The feature being used (mockInterview, pdfAnalyze, skribbleAI)
 * @param action - The action performed (for activity logging)
 * @param details - Optional details about the action
 * @param incrementCount - Whether to increment the usage count (default: true)
 * @returns A promise that resolves to an object with the updated usage and limit information
 */
export async function trackFeatureUsage(
  userId: string | null | undefined,
  feature: "mockInterview" | "pdfAnalyze" | "skribbleAI",
  action: string,
  details?: Record<string, any>,
  incrementCount: boolean = true
): Promise<{ usage: number; limit: number | "unlimited"; hasReachedLimit: boolean }> {
  if (!userId) {
    return { usage: 0, limit: 0, hasReachedLimit: true };
  }

  // Create a unique operation key to prevent duplicate increments
  const operationKey = `${userId}-${feature}-${action}`;
  
  // Check if this exact operation is already in progress
  if (activeOperations[operationKey]) {
    console.log(`Duplicate operation detected: ${operationKey}. Skipping.`);
    
    // Get current usage without incrementing
    const currentData = await getCurrentUsageAndLimits(userId, feature);
    return {
      usage: currentData.usage,
      limit: currentData.limit,
      hasReachedLimit: typeof currentData.limit === "number" && currentData.usage >= currentData.limit
    };
  }
  
  // Mark operation as active
  activeOperations[operationKey] = true;

  try {
    // 1. Log the activity (always log even if not incrementing)
    await logUserActivity(userId, action, details);
    
    // Get current usage and limits
    const { usage: currentUsage, limit } = await getCurrentUsageAndLimits(userId, feature);
    
    // 2. Check if user has reached their limit
    if (typeof limit === "number" && currentUsage >= limit) {
      console.log(`User ${userId} has reached their ${feature} limit of ${limit}`);
      return { usage: currentUsage, limit, hasReachedLimit: true };
    }
    
    // 3. Only increment if explicitly requested
    if (incrementCount) {
      // Get reference to usage document
      const usageRef = doc(db, "usage", userId);
      
      try {
        // Try to update the document first
        await updateDoc(usageRef, { 
          [feature]: increment(1),
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        // If document doesn't exist, create it
        console.log('Creating new usage document for user', userId);
        await setDoc(usageRef, { 
          [feature]: 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    }
    
    // 4. Get updated usage
    const { usage: updatedUsage } = await getCurrentUsageAndLimits(userId, feature);
    
    return { 
      usage: updatedUsage, 
      limit, 
      hasReachedLimit: typeof limit === "number" && updatedUsage >= limit 
    };
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    return { usage: 0, limit: 0, hasReachedLimit: true };
  } finally {
    // Always clean up the active operation flag
    delete activeOperations[operationKey];
  }
}

/**
 * Helper function to get current usage and limits without incrementing
 */
async function getCurrentUsageAndLimits(userId: string, feature: "mockInterview" | "pdfAnalyze" | "skribbleAI") {
  // Default free plan limits
  const defaultLimits: { [key: string]: number | "unlimited" } = { 
    mockInterview: 2, 
    pdfAnalyze: 5, 
    skribbleAI: "unlimited" 
  };
  
  try {
    // Get user plan and limits
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    let limit = defaultLimits[feature];
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.featureLimits && userData.featureLimits[feature]) {
        limit = userData.featureLimits[feature];
      }
    }
    
    // Get current usage
    const usageRef = doc(db, "usage", userId);
    const usageSnap = await getDoc(usageRef);
    let currentUsage = 0;
    
    if (usageSnap.exists()) {
      const usageData = usageSnap.data();
      currentUsage = usageData[feature] || 0;
    }
    
    return { usage: currentUsage, limit };
  } catch (error) {
    console.error('Error getting current usage and limits:', error);
    return { usage: 0, limit: defaultLimits[feature] };
  }
}

/**
 * Reset usage for a specific feature
 * @param userId - The user ID
 * @param feature - The feature to reset (mockInterview, pdfAnalyze, skribbleAI)
 * @returns A promise that resolves when the operation is complete
 */
export async function resetFeatureUsage(
  userId: string | null | undefined,
  feature: "mockInterview" | "pdfAnalyze" | "skribbleAI"
): Promise<boolean> {
  if (!userId) return false;

  try {
    const usageRef = doc(db, "usage", userId);
    const usageSnap = await getDoc(usageRef);
    
    if (usageSnap.exists()) {
      await updateDoc(usageRef, { 
        [feature]: 0,
        updatedAt: Timestamp.now()
      });
      console.log(`Reset ${feature} usage for user ${userId}`);
      
      // Log the reset action
      await logUserActivity(userId, `reset_${feature}`, { 
        previousUsage: usageSnap.data()[feature] || 0 
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error resetting feature usage:', error);
    return false;
  }
}

/**
 * Reset all feature usage for a user
 * @param userId - The user ID
 * @returns A promise that resolves to a boolean indicating success
 */
export async function resetAllFeatureUsage(
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId) return false;

  try {
    const usageRef = doc(db, "usage", userId);
    const usageSnap = await getDoc(usageRef);
    
    if (usageSnap.exists()) {
      const previousUsage = usageSnap.data();
      
      await updateDoc(usageRef, { 
        mockInterview: 0,
        pdfAnalyze: 0,
        skribbleAI: 0,
        updatedAt: Timestamp.now()
      });
      
      // Log the reset action
      await logUserActivity(userId, "reset_all_features", { previousUsage });
      
      console.log(`Reset all feature usage for user ${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error resetting all feature usage:', error);
    return false;
  }
}

/**
 * Get current feature usage and limits for a user
 * @param userId - The user ID
 * @returns A promise that resolves to an object with usage and limits information
 */
export async function getFeatureUsageAndLimits(
  userId: string | null | undefined
): Promise<{
  usage: {
    mockInterview: number;
    pdfAnalyze: number;
    skribbleAI: number;
    [key: string]: number;
  };
  limits: {
    mockInterview: number | "unlimited";
    pdfAnalyze: number | "unlimited";
    skribbleAI: number | "unlimited";
    [key: string]: number | "unlimited";
  };
}> {
  if (!userId) {
    // Return free plan default limits even when userId is not available
    return {
      usage: { mockInterview: 0, pdfAnalyze: 0, skribbleAI: 0 },
      limits: { 
        mockInterview: 2, 
        pdfAnalyze: 5, 
        skribbleAI: "unlimited" as const 
      }
    };
  }

  try {
    // Get user plan and limits
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    // Default to free plan limits if not found
    let limits: { 
      mockInterview: number | "unlimited"; 
      pdfAnalyze: number | "unlimited"; 
      skribbleAI: number | "unlimited";
      [key: string]: number | "unlimited"; 
    } = { 
      mockInterview: 2, 
      pdfAnalyze: 5, 
      skribbleAI: "unlimited" 
    };
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Only use the featureLimits from the user document if they exist and are valid
      if (userData.featureLimits && 
          (userData.featureLimits.mockInterview || 
           userData.featureLimits.pdfAnalyze || 
           userData.featureLimits.skribbleAI)) {
        limits = userData.featureLimits;
      } else {
        // If featureLimits are missing or invalid, update the user document with default limits
        console.log('Fixing missing feature limits for user:', userId);
        await updateDoc(userRef, { 
          featureLimits: limits,
          updatedAt: Timestamp.now() 
        });
      }
    }
    
    // Get current usage
    const usageRef = doc(db, "usage", userId);
    const usageSnap = await getDoc(usageRef);
    
    let usage = { mockInterview: 0, pdfAnalyze: 0, skribbleAI: 0 };
    
    if (usageSnap.exists()) {
      const usageData = usageSnap.data();
      usage = {
        mockInterview: usageData.mockInterview || 0,
        pdfAnalyze: usageData.pdfAnalyze || 0,
        skribbleAI: usageData.skribbleAI || 0
      };
    }
    
    return {usage, limits};
  } catch (error) {
    console.error('Error getting feature usage and limits:', error);
    // Even in error case, return free plan default limits instead of zeros
    return {
      usage: { mockInterview: 0, pdfAnalyze: 0, skribbleAI: 0 },
      limits: { 
        mockInterview: 2, 
        pdfAnalyze: 5, 
        skribbleAI: "unlimited" as const 
      }
    };
  }
}
