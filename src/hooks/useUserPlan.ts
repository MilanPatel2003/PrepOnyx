import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@clerk/clerk-react";
import { db } from "@/config/firebase.config";
// Import types for the user plan

export function useUserPlan() {
  const { userId } = useAuth();
  const [plan, setPlan] = useState<{ 
    plan: string; 
    planName: string; 
    subscriptionStatus: string; 
    stripeCustomerId?: string;
    subscriptionId?: string;
    subscriptionEndDate?: string | Date;
    featureLimits?: {
      mockInterview?: number | "unlimited";
      pdfAnalyze?: number | "unlimited";
      skribbleAI?: number | "unlimited";
      [key: string]: number | string | undefined;
    };
    name?: string;
    email?: string;
    imageUrl?: string;
    createdAt?: any;
    updatedAt?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    
    // Use onSnapshot to get real-time updates to the user's plan
    const unsubscribe = onSnapshot(doc(db, "users", userId), (snap) => {
      setPlan(snap.exists() ? (snap.data() as any) : null);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [userId]);

  return { plan, loading };
}
