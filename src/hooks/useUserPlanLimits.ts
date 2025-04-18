import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { db } from "@/config/firebase.config";
import { doc, getDoc } from "firebase/firestore";

/**
 * Hook to get user's feature limits and plan from Firestore.
 * Returns: { limits, plan, loading }
 */
export function useUserPlanLimits() {
  const { userId } = useAuth();
  const [limits, setLimits] = useState<{ [feature: string]: number | "unlimited" } | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getDoc(doc(db, "users", userId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLimits(data.featureLimits || null);
        setPlan(data.plan || null);
      }
      setLoading(false);
    });
  }, [userId]);

  return { limits, plan, loading };
}
