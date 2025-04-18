import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@clerk/clerk-react";

/**
 * Logs a user activity to the Firestore 'user_activity' collection.
 * @param {string} action - The action performed (e.g., 'start_mock_interview', 'upload_pdf').
 * @param {object} [details] - Optional details about the action (e.g., interviewId, fileName).
 */
export async function logUserActivity(action: string, details?: Record<string, any>) {
  try {
    const db = getFirestore();
    // Get userId from Clerk
    const { userId } = useAuth();
    if (!userId) return;
    await addDoc(collection(db, "user_activity"), {
      userId,
      action,
      details: details || {},
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    // Optionally handle/log error
    console.error("Failed to log user activity", error);
  }
}
