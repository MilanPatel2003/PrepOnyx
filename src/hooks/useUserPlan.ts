import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@clerk/clerk-react";
import { db } from "@/config/firebase.config";

export function useUserPlan() {
  const { userId } = useAuth();
  const [plan, setPlan] = useState<{ plan: string; planName: string; subscriptionStatus: string; stripeCustomerId?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getDoc(doc(db, "users", userId)).then((snap) => {
      setPlan(snap.exists() ? (snap.data() as any) : null);
      setLoading(false);
    });
  }, [userId]);

  return { plan, loading };
}
