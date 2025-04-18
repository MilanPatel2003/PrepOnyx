// Dashboard.tsx - Modern SaaS dashboard with activity tracking and usage metrics
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import DashboardV2 from "./DashboardV2";
import { getFeatureUsageAndLimits } from "@/utils/featureTracker";
import { createOrUpdateUser } from "@/utils/userManager";

export default function Dashboard() {
  const { userId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  // Ensure user data is properly initialized in Firestore
  useEffect(() => {
    if (!authLoaded || !userLoaded || !userId || !user) return;

    // Initialize user data and ensure feature usage tracking is set up
    const initializeUserData = async () => {
      try {
        // Create or update user in Firestore
        await createOrUpdateUser(userId, {
          name: user.fullName || user.username || '',
          email: user.primaryEmailAddress?.emailAddress || '',
          imageUrl: user.imageUrl || '',
        });
        
        // Ensure feature usage tracking is initialized
        await getFeatureUsageAndLimits(userId);
      } catch (error) {
        console.error('Error initializing user data:', error);
      }
    };

    initializeUserData();
  }, [userId, user, authLoaded, userLoaded]);

  // Render the new modern dashboard
  return <DashboardV2 />;
}
