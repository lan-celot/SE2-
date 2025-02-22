"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { app, auth } from "@/lib/firebase";

const db = getFirestore(app);

interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  customUid: string;  // Changed from uid to customUid
  email: string;
  phoneNumber: string;
  gender: string;
  avatar: string;
}

export function ProfileHeader() {
  const [user, setUser] = useState<UserData>({
    firstName: "",
    lastName: "",
    username: "",
    customUid: "",  // Changed from uid to customUid
    email: "",
    phoneNumber: "",
    gender: "",
    avatar: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user data using Firebase Auth UID
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserData);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="relative h-24 w-24">
        <Image
          src={user.avatar || "/placeholder.svg?height=96&width=96"}
          alt={`${user.firstName} ${user.lastName}` || "User"}
          width={96}
          height={96}
          className="rounded-full object-cover"
        />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#1A365D]">
          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "Loading..."}
        </h2>
        <p className="text-[#8B909A]">{user.username || "Loading..."}</p>
        <p className="text-sm text-[#8B909A]">{user.customUid || "Loading..."}</p>
      </div>
    </div>
  );
}