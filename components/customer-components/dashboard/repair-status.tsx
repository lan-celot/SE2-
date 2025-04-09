"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

interface Repair {
  reservationDate: string;
  carModel: string;
  status: string;
}

export function RepairStatus() {
  const [latestRepair, setLatestRepair] = useState<Repair | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestRepair = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log("User is not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const bookingsCollectionRef = collection(db, "bookings");
        
        // Query for the user's bookings, ordered by reservationDate in descending order
        const q = query(
          bookingsCollectionRef, 
          where("userId", "==", user.uid),
          orderBy("reservationDate", "desc"),
          limit(1)
        );

        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          console.log("No recent repairs found");
          setLatestRepair(null);
          setIsLoading(false);
          return;
        }

        const latestBooking = snapshot.docs[0].data();
        
        setLatestRepair({
          reservationDate: formatDate(latestBooking.reservationDate),
          carModel: latestBooking.carModel,
          status: latestBooking.status.toUpperCase()
        });
      } catch (error) {
        console.error("Error fetching latest repair:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestRepair();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "N/A";
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleDateString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Function to determine the appropriate color based on status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "text-[#FF9F43]";
      case "confirmed": return "text-[#63B3ED]";
      case "repairing": return "text-[#EFBF14]";
      case "completed": return "text-[#28C76F]";
      case "cancelled": return "text-[#EA5455]";
      default: return "text-[#8B909A]";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm h-full flex flex-col">
        <h3 className="text-2xl font-semibold text-[#2a69ac] mb-6">Status of Recent Reservation</h3>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-gray-500">Loading latest repair information...</p>
        </div>
      </div>
    );
  }

  if (!latestRepair) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm h-full flex flex-col">
        <h3 className="text-2xl font-semibold text-[#2a69ac] mb-6">Status of Recent Reservation</h3>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-gray-500">No repair history found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-2xl font-semibold text-[#2a69ac] mb-6">Status of Recent Reservation</h3>
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <p className="text-2xl text-[#1a365d]">{latestRepair.reservationDate}</p>
        <p className="text-2xl text-[#1a365d]">{latestRepair.carModel}</p>
        <p className={`text-3xl font-semibold ${getStatusColor(latestRepair.status)}`}>
          {latestRepair.status}
        </p>
      </div>
    </div>
  );
}