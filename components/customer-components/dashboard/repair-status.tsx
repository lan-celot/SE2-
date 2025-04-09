"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import Cookies from "js-cookie";

interface Repair {
  reservationDate: string;
  carModel: string;
  status: string;
  createdAt?: string;
}

export function RepairStatus() {
  const [latestRepair, setLatestRepair] = useState<Repair | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestRepair = async () => {
      // Get the user ID from Cookies or localStorage as a fallback
      const userId = Cookies.get("userId") || localStorage.getItem("userId");
      
      // If no userId found, try to get from Firebase auth
      if (!userId && !auth.currentUser) {
        console.log("User is not authenticated");
        setIsLoading(false);
        return;
      }
      
      // Use either the cookie/localStorage userId or the one from auth
      const currentUserId = userId || auth.currentUser?.uid;

      try {
        setIsLoading(true);
        
        // To avoid composite index errors, we'll query only by userId
        // and then sort the results on the client side
        const bookingsCollectionRef = collection(db, "bookings");
        const userBookingsQuery = query(
          bookingsCollectionRef, 
          where("userId", "==", currentUserId)
        );
        
        const snapshot = await getDocs(userBookingsQuery);
        
        if (snapshot.empty) {
          console.log("No repairs found for user");
          setLatestRepair(null);
          setIsLoading(false);
          return;
        }

        // Get all bookings and sort them in memory
        const bookings = snapshot.docs.map(doc => {
          const data = doc.data() as { reservationDate: string; carModel: string; status: string; createdAt?: any };
          return {
            ...data,
            id: doc.id,
            // Create a numeric timestamp value for sorting
            sortableTimestamp: getSortableTimestamp(data)
          };
        });
        
        // Sort by the calculated timestamp (newest first)
        bookings.sort((a, b) => b.sortableTimestamp - a.sortableTimestamp);
        
        // Take the first one (most recent)
        const latestBooking = bookings[0];
        
        setLatestRepair({
          reservationDate: formatDate(latestBooking.reservationDate),
          carModel: latestBooking.carModel || "Unknown Vehicle",
          status: (latestBooking.status || "PENDING").toUpperCase(),
          createdAt: latestBooking.createdAt ? 
            formatDate(new Date(latestBooking.createdAt.toDate ? 
              latestBooking.createdAt.toDate() : latestBooking.createdAt).toISOString()) : 
            'N/A'
        });
      } catch (error) {
        console.error("Error fetching latest repair:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Helper function to extract a sortable timestamp from various fields
    // Returns a numeric value representing the timestamp
    const getSortableTimestamp = (booking: any): number => {
      // Try createdAt first (preferred field)
      if (booking.createdAt) {
        if (booking.createdAt.toDate) {
          // Firebase Timestamp object
          return booking.createdAt.toDate().getTime();
        } else if (typeof booking.createdAt === 'string') {
          // ISO string
          return new Date(booking.createdAt).getTime();
        } else if (booking.createdAt.seconds) {
          // Firebase timestamp seconds
          return booking.createdAt.seconds * 1000;
        }
      }
      
      // Try timestamp field
      if (booking.timestamp) {
        if (booking.timestamp.toDate) {
          return booking.timestamp.toDate().getTime();
        } else if (typeof booking.timestamp === 'string') {
          return new Date(booking.timestamp).getTime();
        } else if (booking.timestamp.seconds) {
          return booking.timestamp.seconds * 1000;
        }
      }
      
      // As a fallback, use the reservationDate
      if (booking.reservationDate) {
        if (typeof booking.reservationDate === 'string') {
          return new Date(booking.reservationDate).getTime();
        }
      }
      
      // If all else fails, return 0 (will be sorted last)
      return 0;
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