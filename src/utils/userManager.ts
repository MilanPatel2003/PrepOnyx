import { doc, setDoc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { plans } from "@/config/plans";

/**
 * Creates or updates a user in Firestore with default plan settings
 * @param userId - The user ID from Clerk
 * @param userData - User data from Clerk (name, email, etc.)
 */
export async function createOrUpdateUser(
  userId: string,
  userData: {
    name?: string;
    email?: string;
    imageUrl?: string;
  }
): Promise<void> {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    // Get the free plan details
    const freePlan = plans.find(p => p.id === 'free');
    const featureLimits: Record<string, number | "unlimited"> = {};
    
    // Convert plan features to feature limits object
    if (freePlan) {
      freePlan.features.forEach(feature => {
        featureLimits[feature.feature] = feature.limit;
      });
    }

    if (!userSnap.exists()) {
      // Create new user with free plan
      await setDoc(userRef, {
        ...userData,
        plan: "free",
        planName: "Free",
        subscriptionStatus: "active",
        featureLimits,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Initialize usage document
      const usageRef = doc(db, "usage", userId);
      await setDoc(usageRef, {
        mockInterview: 0,
        pdfAnalyze: 0,
        skribbleAI: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } else {
      // Update existing user data (only update provided fields)
      const updateData: Record<string, any> = {
        updatedAt: Timestamp.now()
      };

      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.imageUrl) updateData.imageUrl = userData.imageUrl;

      await updateDoc(userRef, updateData);
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
}

/**
 * Updates a user's subscription plan in Firestore
 * @param userId - The user ID
 * @param planId - The plan ID (free, premium, pro)
 * @param subscriptionData - Additional subscription data from Stripe
 */
export async function updateUserPlan(
  userId: string,
  planId: string,
  subscriptionData?: {
    subscriptionId?: string;
    stripeCustomerId?: string;
    subscriptionStatus?: string;
  }
): Promise<void> {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User does not exist");
    }

    // Get the plan details
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) {
      throw new Error(`Plan with ID ${planId} not found`);
    }

    const featureLimits: Record<string, number | "unlimited"> = {};
    
    // Convert plan features to feature limits object
    selectedPlan.features.forEach(feature => {
      featureLimits[feature.feature] = feature.limit;
    });

    // Update user with new plan
    await updateDoc(userRef, {
      plan: planId,
      planName: selectedPlan.name,
      featureLimits,
      ...subscriptionData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    throw error;
  }
}
