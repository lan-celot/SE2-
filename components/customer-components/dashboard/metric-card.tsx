//metric card
"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CheckCircle, Wrench, Clock } from "lucide-react";

interface MetricCardProps {
  title: string;
  type: "completed" | "repairing";
}

export function MetricCard({ title, type }: MetricCardProps) {
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
        
        // Create the query exactly as in your original code to ensure consistency
        let q = query(
          bookingsCollectionRef,
          where("userId", "==", user.uid),
          where("status", "==", type === "completed" ? "COMPLETED" : "REPAIRING")
        );

        // Use getDocs directly as in your original code
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

  const getIcon = () => {
    if (type === "completed") {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (type === "repairing") {
      return <Wrench className="h-5 w-5 text-blue-500" />;
    }
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  const getCardBg = () => {
    if (type === "completed") {
      return "bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500";
    } else if (type === "repairing") {
      return "bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500";
    }
    return "bg-white";
  };

  return (
    <div className={`rounded-lg p-5 shadow-sm h-full ${getCardBg()}`}>
      <div className="flex items-center mb-4">
        <div className="bg-white p-2 rounded-lg shadow-sm mr-3">
          {getIcon()}
        </div>
        <h3 className="text-lg font-semibold text-[#1a365d]">{title}</h3>
      </div>
      
      <div className="flex items-baseline">
        <p className="text-5xl font-bold text-[#1a365d]">
          {isLoading ? "..." : count}
        </p>
        <p className="ml-2 text-sm text-gray-500">
          {type === "completed" ? "reservations" : "in progress"}
        </p>
      </div>
    </div>
  );
}