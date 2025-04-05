"use client";

import { useEffect, useState } from "react";
import { User as LucideUser } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: string;
  photoURL?: string;
}

export function ProfileHeader() {
  const [user, setUser] = useState<UserData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    gender: "",
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setFirebaseUser(authUser);
        
        try {
          // Fetch user profile from Firestore
          const profileRef = doc(db, "accounts", authUser.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const profileData = profileSnap.data() as UserData;
            setUser(profileData);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 bg-white p-6 rounded-lg shadow-sm animate-pulse">
        <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="relative h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-[#3579b8]/20">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="h-full w-full object-cover"
          />
        ) : (
          <LucideUser className="h-16 w-16 text-gray-400" />
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#1A365D]">
          {user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : firebaseUser?.displayName || "User Profile"}
        </h2>
        <p className="text-[#3579b8]">
          {user.username ? `@${user.username}` : ""}
        </p>
        {user.email && (
          <p className="text-sm text-[#8B909A]">{user.email}</p>
        )}
      </div>
    </div>
  );
}