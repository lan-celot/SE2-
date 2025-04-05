"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils"; // Make sure you have the cn utility imported

interface MetricCardProps {
  title: string;
  type: "completed" | "repairing";
  className?: string; // Added optional className prop
}

export function MetricCard({ title, type, className }: MetricCardProps) {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log("User is not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const bookingsCollectionRef = collection(db, "bookings");
        
        let q = query(
          bookingsCollectionRef,
          where("userId", "==", user.uid),
          where("status", "==", type === "completed" ? "COMPLETED" : "REPAIRING")
        );

        const snapshot = await getDocs(q);
        setCount(snapshot.size);
      } catch (error) {
        console.error(`Error fetching ${type} metrics:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [type]);

  return (
    <div className={cn("bg-white rounded-lg p-6 shadow-sm h-full", className)}>
      <h3 className="text-xl font-semibold text-[#2a69ac] mb-2">{title}</h3>
      <div className="flex items-end">
        <p className="text-4xl font-bold text-[#1a365d]">
          {isLoading ? "..." : count}
        </p>
      </div>
    </div>
  );
}