import { db } from "@/config/firebase.config";
import { LoaderPage } from "@/pages/LoaderPage";
import { User } from "@/types";
import { useAuth, useUser } from "@clerk/clerk-react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthHandler = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storeUserData = async () => {
      if (isSignedIn && user) {
        setLoading(true);
        try {
          const userSnap = await getDoc(doc(db, "users", user.id));
          if (!userSnap.exists()) {
            const userData: User = {
              id: user.id,
              name: user.fullName || user.firstName || "Anonymous",
              email: user.primaryEmailAddress?.emailAddress || "N/A",
              imageUrl: user.imageUrl,
              createdAt: serverTimestamp(),
              updateAt: serverTimestamp(),
            };
            await setDoc(doc(db, "users", user.id), userData);
          }
        } catch (error) {
          console.log("Error storing the user in firebase : ", error);
        } finally {
          setLoading(false);
        }
      }
    };
    storeUserData();
  }, [isSignedIn, pathname, navigate, user]);
  if (loading) {
    return <LoaderPage />;
  }
  return null;
};

export default AuthHandler;
