import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { createOrUpdateUser } from '@/utils/userManager';

/**
 * Component that initializes user data in Firestore when a user signs in
 * This ensures all users have proper plan information and usage tracking
 */
export function UserInitializer() {
  const { userId } = useAuth();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !userId || !user) return;

    // Initialize user data in Firestore
    const initializeUser = async () => {
      try {
        await createOrUpdateUser(userId, {
          name: user.fullName || user.username || '',
          email: user.primaryEmailAddress?.emailAddress || '',
          imageUrl: user.imageUrl || '',
        });
        console.log('User initialized in Firestore');
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, [userId, user, isLoaded]);

  // This component doesn't render anything
  return null;
}
