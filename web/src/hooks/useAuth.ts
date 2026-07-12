import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import { auth, googleProvider, OWNER_EMAIL } from "../lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isOwner = !!user && user.email === OWNER_EMAIL;

  const signIn = async () => {
    if (auth.emulatorConfig) {
      // Firebase Auth emulator does not support interactive Google sign-in
      // through signInWithPopup, so we use a mock Google credential.
      const token = JSON.stringify({
        sub: "emulator-test-user",
        email: OWNER_EMAIL,
        email_verified: true,
      });
      await signInWithCredential(auth, GoogleAuthProvider.credential(token));
    } else {
      await signInWithPopup(auth, googleProvider);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, loading, isOwner, signIn, logout };
}
