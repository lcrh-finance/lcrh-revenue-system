import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./config";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase user
  const [profile, setProfile] = useState(null); // Firestore user profile (role etc.)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load role profile from Firestore
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setProfile(snap.exists() ? snap.data() : { role: "viewer", name: firebaseUser.email });
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
