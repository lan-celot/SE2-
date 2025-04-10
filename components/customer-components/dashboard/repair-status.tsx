"use client"

import { useState, useEffect } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import Cookies from "js-cookie"

interface Repair {
  reservationDate: string
  carModel: string
  status: string
  createdAt?: string
}

export function RepairStatus() {
  const [latestRepair, setLatestRepair] = useState<Repair | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLatestRepair = async () => {
      // Get the user ID from Cookies or localStorage as a fallback
      const userId = Cookies.get("userId") || localStorage.getItem("userId")

      // If no userId found, try to get from Firebase auth
      if (!userId && !auth.currentUser) {
        console.log("User is not authenticated")
        setIsLoading(false)
        return
      }

      // Use either the cookie/localStorage userId or the one from auth
      const currentUserId = userId || auth.currentUser?.uid

      try {
        setIsLoading(true)

        // To avoid composite index errors, we'll query only by userId
        // and then sort the results on the client side
        const bookingsCollectionRef = collection(db, "bookings")
        const userBookingsQuery = query(bookingsCollectionRef, where("userId", "==", currentUserId))

        const snapshot = await getDocs(userBookingsQuery)

        if (snapshot.empty) {
          console.log("No repairs found for user")
          setLatestRepair(null)
          setIsLoading(false)
          return
        }

        // Get all bookings and sort them in memory
        const bookings = snapshot.docs.map((doc) => {
          const data = doc.data() as { reservationDate: string; carModel: string; status: string; createdAt?: any }
          return {
            ...data,
            id: doc.id,
            // Create a numeric timestamp value for sorting
            sortableTimestamp: getSortableTimestamp(data),
          }
        })

        // Sort by the calculated timestamp (newest first)
        bookings.sort((a, b) => b.sortableTimestamp - a.sortableTimestamp)

        // Take the first one (most recent)
        const latestBooking = bookings[0]

        setLatestRepair({
          reservationDate: formatDate(latestBooking.reservationDate),
          carModel: latestBooking.carModel || "Unknown Vehicle",
          status: (latestBooking.status || "PENDING").toUpperCase(),
          createdAt: latestBooking.createdAt
            ? formatDate(
                new Date(
                  latestBooking.createdAt.toDate ? latestBooking.createdAt.toDate() : latestBooking.createdAt,
                ).toISOString(),
              )
            : "N/A",
        })
      } catch (error) {
        console.error("Error fetching latest repair:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Helper function to extract a sortable timestamp from various fields
    // Returns a numeric value representing the timestamp
    const getSortableTimestamp = (booking: any): number => {
      // Try createdAt first (preferred field)
      if (booking.createdAt) {
        if (booking.createdAt.toDate) {
          // Firebase Timestamp object
          return booking.createdAt.toDate().getTime()
        } else if (typeof booking.createdAt === "string") {
          // ISO string
          return new Date(booking.createdAt).getTime()
        } else if (booking.createdAt.seconds) {
          return booking.createdAt.seconds * 1000
        }
      }

      // Try timestamp field
      if (booking.timestamp) {
        if (booking.timestamp.toDate) {
          return booking.timestamp.toDate().getTime()
        } else if (typeof booking.timestamp === "string") {
          return new Date(booking.timestamp).getTime()
        } else if (booking.timestamp.seconds) {
          return booking.timestamp.seconds * 1000
        }
      }

      // As a fallback, use the reservationDate
      if (booking.reservationDate) {
        if (typeof booking.reservationDate === "string") {
          return new Date(booking.reservationDate).getTime()
        }
      }

      // If all else fails, return 0 (will be sorted last)
      return 0
    }

    fetchLatestRepair()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "N/A"

      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr

      return date.toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  // Function to determine the appropriate color based on status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "text-[#FF9F43]"
      case "confirmed":
        return "text-[#63B3ED]"
      case "repairing":
        return "text-[#EFBF14]"
      case "completed":
        return "text-[#28C76F]"
      case "cancelled":
        return "text-[#EA5455]"
      default:
        return "text-[#8B909A]"
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm h-full flex flex-col">
        <h3 className="text-2xl font-semibold text-[#2a69ac] mb-6">Status of Recent Reservation</h3>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-gray-500">Loading latest repair information...</p>
        </div>
      </div>
    )
  }

  if (!latestRepair) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm h-full flex flex-col">
        <h3 className="text-2xl font-semibold text-[#2a69ac] mb-6">Status of Recent Reservation</h3>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-gray-500">No repair history found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-2xl font-semibold text-[#2a69ac] mb-4">Status of Recent Reservation</h3>
      <div className="flex-1 flex flex-col justify-evenly space-y-2">
        <div className="flex items-center">
          <div className="w-8 h-8 mr-3 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#2a69ac]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-xl font-medium text-[#1a365d]">{latestRepair.reservationDate}</p>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 mr-3 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#2a69ac]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <p className="text-xl font-medium text-[#1a365d]">{latestRepair.carModel}</p>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 mr-3 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#2a69ac]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className={`text-2xl font-bold ${getStatusColor(latestRepair.status)}`}>{latestRepair.status}</p>
        </div>
      </div>
    </div>
  )
}
