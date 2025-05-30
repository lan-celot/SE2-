"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin-components/table"
import { ReservationCalendar } from "@/components/admin-components/reservation-calendar"
import { DashboardLayout } from "@/components/admin-components/dashboard-layout"
import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  limit,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import Loading from "@/components/admin-components/loading"
import { formatDateTime } from "@/lib/date-utils" // Assuming formatDateTime is correct
import type { LogActionType } from "@/lib/log-utils"

// Define types for our data
interface Log {
  id: string
  activity: string
  // Explicitly type timestamp as Timestamp or null/undefined
  timestamp: Timestamp | null | undefined
  performedBy: string
  logType: LogActionType
  userId?: string
}

interface Reservation {
  id: string
  customerName: string
  carBrand: string
  carModel: string
}

interface Booking {
  id: string
  firstName: string
  lastName: string
  carBrand: string
  carModel: string
  status: string
  // Explicitly define potential types for reservationDate
  reservationDate: Timestamp | Date | string | null | undefined
  userId?: string
  createdAt?: Timestamp | null | undefined
  updatedAt?: Timestamp | null | undefined
}

export default function DashboardPage() {
  const [pendingCount, setPendingCount] = useState(0)
  const [completedToday, setCompletedToday] = useState(0)
  const [repairingToday, setRepairingToday] = useState(0)
  const [confirmedToday, setConfirmedToday] = useState(0)
  const [newClientsCount, setNewClientsCount] = useState(0)
  const [returningClientsCount, setReturningClientsCount] = useState(0)
  const [arrivingToday, setArrivingToday] = useState<Reservation[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRealtime, setIsRealtime] = useState(true) // Keep real-time on by default

  // Helper function to convert various date types to Date or return null
  const toDate = (date: Timestamp | Date | string | null | undefined): Date | null => {
    if (!date) return null
    if (date instanceof Timestamp) return date.toDate()
    if (date instanceof Date) return date
    if (typeof date === "string" || typeof date === "number") {
      const parsedDate = new Date(date)
      // Check for "Invalid Date"
      return isNaN(parsedDate.getTime()) ? null : parsedDate
    }
    return null // Return null for unexpected types
  }

  // Set up real-time listeners for Firestore collections
  useEffect(() => {
    // Only use real-time updates if enabled
    if (!isRealtime) {
      // If real-time is off, perform a one-time fetch and exit effect
      fetchDashboardData()
      return
    }

    setIsLoading(true)

    // Get today's date at midnight
    const today = toDate(new Date()) // Use toDate helper
    if (!today) {
      // Handle potential error in getting today's date
      console.error("Could not get a valid Date object for today.")
      setIsLoading(false)
      setLogs([]) // Clear logs if date handling fails
      // Optionally clear other date-dependent states
      return
    }
    today.setHours(0, 0, 0, 0)

    // Get tomorrow's date for comparison
    const tomorrow = new Date(today) // Create from a valid Date
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Set up listeners

    // 1. All bookings for general stats
    const bookingsQuery = query(collection(db, "bookings"), orderBy("reservationDate", "desc"))
    const unsubscribeBookings = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const bookings = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData // Cast to DocumentData
          const reservationDate = toDate(data.reservationDate) // Use toDate helper
          return {
            id: doc.id,
            // Explicitly cast to expected types, allowing for undefined or null
            firstName: (data.firstName as string) || "", // Provide default empty string if undefined/null
            lastName: (data.lastName as string) || "",
            carBrand: (data.carBrand as string) || "",
            carModel: (data.carModel as string) || "",
            status: (data.status as string) || "",
            reservationDate: data.reservationDate as Timestamp | Date | string | null | undefined, // Keep original for reference if needed
            userId: data.userId as string | undefined,
            createdAt: data.createdAt as Timestamp | null | undefined,
            updatedAt: data.updatedAt as Timestamp | null | undefined,
            // Add a processed date for comparisons
            processedReservationDate: reservationDate,
          }
        }) as (Booking & { processedReservationDate: Date | null })[] // Include processed date in type

        // Calculate counts based on status
        const pendingBookings = bookings.filter((booking) => booking.status === "PENDING")
        setPendingCount(pendingBookings.length)

        // For today's stats, filter by date using the processed date
        const todayBookings = bookings.filter((booking) => {
          // Ensure processedReservationDate is a valid Date before comparison
          return (
            booking.processedReservationDate &&
            booking.processedReservationDate >= today &&
            booking.processedReservationDate < tomorrow
          )
        })

        const completedTodayCount = todayBookings.filter((booking) => booking.status === "COMPLETED").length
        setCompletedToday(completedTodayCount)

        const repairingTodayCount = todayBookings.filter((booking) => booking.status === "REPAIRING").length
        setRepairingToday(repairingTodayCount)

        const confirmedTodayCount = todayBookings.filter((booking) => booking.status === "CONFIRMED").length
        setConfirmedToday(confirmedTodayCount)

        // Get arriving today (bookings for today with status PENDING or CONFIRMED)
        const arrivingTodayBookings = todayBookings
          .filter((booking) => booking.status === "PENDING" || booking.status === "CONFIRMED")
          .slice(0, 5) // Limit to 5 for display

        setArrivingToday(
          arrivingTodayBookings.map((booking) => ({
            id: booking.id,
            customerName: `${booking.firstName} ${booking.lastName}`.toUpperCase(),
            carBrand: booking.carBrand,
            carModel: booking.carModel,
          })),
        )

        // For clients this month, filter by date and count unique customer IDs using processed date
        const thisMonthBookings = bookings.filter((booking) => {
          // Ensure processedReservationDate is a valid Date before comparison
          return booking.processedReservationDate && booking.processedReservationDate >= firstDayOfMonth
        })

        // Count unique users
        const userBookingCounts: Record<string, number> = {}
        const returningUserIds = new Set<string>() // Keep track of users with more than one booking *ever*

        bookings.forEach((booking) => {
          if (booking.userId) {
            userBookingCounts[booking.userId] = (userBookingCounts[booking.userId] || 0) + 1
            if (userBookingCounts[booking.userId] > 1) {
              returningUserIds.add(booking.userId)
            }
          }
        })

        // New clients this month are those whose *first ever* booking is this month
        const newClientThisMonth = thisMonthBookings.filter(
          (booking) => booking.userId && userBookingCounts[booking.userId] === 1,
        )

        // Returning clients this month are those who have booked this month and have booked before
        const returningClientsThisMonth = thisMonthBookings.filter(
          (booking) => booking.userId && returningUserIds.has(booking.userId),
        )

        // Count unique client IDs from the filtered lists
        const uniqueNewClients = new Set(
          newClientThisMonth.map((b) => b.userId).filter((id): id is string => id !== undefined),
        ) // Filter out undefined
        const uniqueReturningClients = new Set(
          returningClientsThisMonth.map((b) => b.userId).filter((id): id is string => id !== undefined),
        ) // Filter out undefined

        setNewClientsCount(uniqueNewClients.size)
        setReturningClientsCount(uniqueReturningClients.size)

        // Set loading to false after all data is processed from this listener
        // We will set isLoading to false once both listeners have potentially finished
        // or handle it in a way that reflects the overall loading state.
        // For simplicity here, we'll rely on the last listener to finish or manage separately.
      },
      (error) => {
        console.error("Error fetching bookings:", error)
        // Set loading to false even on error
        // Consider a more sophisticated loading state if multiple listeners are independent
      },
    )

    // 2. Logs collection - only LOGIN and LOGOUT logs (Real-time)
    const logsQuery = query(
      collection(db, "logs"),
      where("logType", "in", ["LOGIN", "LOGOUT"]),
      orderBy("timestamp", "desc"),
      limit(10),
    )

    const unsubscribeLogs = onSnapshot(
      logsQuery,
      (snapshot) => {
        const logData = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData // Cast to DocumentData
          return {
            id: doc.id,
            activity: (data.activity as string) || "N/A", // Explicitly cast and provide default
            // Explicitly cast timestamp to Timestamp or null/undefined
            timestamp: data.timestamp as Timestamp | null | undefined,
            performedBy: (data.performedBy as string) || "N/A", // Explicitly cast and provide default
            logType: data.logType as LogActionType, // Explicitly cast logType
            userId: data.userId as string | undefined, // Explicitly cast userId
          }
        })
        setLogs(logData) // Update logs state, triggering re-render
        setIsLoading(false) // Set loading to false after logs are fetched
      },
      (error) => {
        console.error("Error fetching logs:", error)
        setLogs([]) // Clear logs on error
        setIsLoading(false) // Set loading to false on error
      },
    )

    // Clean up listeners on unmount or when isRealtime changes to false
    return () => {
      unsubscribeBookings()
      unsubscribeLogs()
    }
  }, [isRealtime]) // Rerun effect when isRealtime changes

  // Regular fetch method (used if real-time updates are disabled)
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Get today's date at midnight
      const today = toDate(new Date()) // Use toDate helper
      if (!today) {
        // Handle potential error in getting today's date
        console.error("Could not get a valid Date object for today.")
        setIsLoading(false)
        setLogs([]) // Clear logs if date handling fails
        // Optionally clear other date-dependent states
        return
      }
      today.setHours(0, 0, 0, 0)

      // Get tomorrow's date for comparison
      const tomorrow = new Date(today) // Create from a valid Date
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Get first day of current month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      // Fetch all bookings to calculate counts
      const bookingsQuery = query(collection(db, "bookings"), orderBy("reservationDate", "desc"))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookings = bookingsSnapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData // Cast to DocumentData
        const reservationDate = toDate(data.reservationDate) // Use toDate helper
        return {
          id: doc.id,
          // Explicitly cast to expected types, allowing for undefined or null
          firstName: (data.firstName as string) || "", // Provide default empty string if undefined/null
          lastName: (data.lastName as string) || "",
          carBrand: (data.carBrand as string) || "",
          carModel: (data.carModel as string) || "",
          status: (data.status as string) || "",
          reservationDate: data.reservationDate as Timestamp | Date | string | null | undefined, // Keep original for reference if needed
          userId: data.userId as string | undefined,
          createdAt: data.createdAt as Timestamp | null | undefined,
          updatedAt: data.updatedAt as Timestamp | null | undefined,
          // Add a processed date for comparisons
          processedReservationDate: reservationDate,
        }
      }) as (Booking & { processedReservationDate: Date | null })[] // Include processed date in type

      // Calculate counts based on status
      const pendingBookings = bookings.filter((booking) => booking.status === "PENDING")
      setPendingCount(pendingBookings.length)

      // For today's stats, filter by date using the processed date
      const todayBookings = bookings.filter((booking) => {
        // Ensure processedReservationDate is a valid Date before comparison
        return (
          booking.processedReservationDate &&
          booking.processedReservationDate >= today &&
          booking.processedReservationDate < tomorrow
        )
      })

      const completedTodayCount = todayBookings.filter((booking) => booking.status === "COMPLETED").length
      setCompletedToday(completedTodayCount)

      const repairingTodayCount = todayBookings.filter((booking) => booking.status === "REPAIRING").length
      setRepairingToday(repairingTodayCount)

      const confirmedTodayCount = todayBookings.filter((booking) => booking.status === "CONFIRMED").length
      setConfirmedToday(confirmedTodayCount)

      // Get arriving today (bookings for today with status PENDING or CONFIRMED)
      const arrivingTodayBookings = todayBookings
        .filter((booking) => booking.status === "PENDING" || booking.status === "CONFIRMED")
        .slice(0, 5) // Limit to 5 for display

      setArrivingToday(
        arrivingTodayBookings.map((booking) => ({
          id: booking.id,
          customerName: `${booking.firstName} ${booking.lastName}`.toUpperCase(),
          carBrand: booking.carBrand,
          carModel: booking.carModel,
        })),
      )

      // For clients this month, we'll use a more sophisticated approach
      const thisMonthBookings = bookings.filter((booking) => {
        // Ensure processedReservationDate is a valid Date before comparison
        return booking.processedReservationDate && booking.processedReservationDate >= firstDayOfMonth
      })

      // Process bookings to identify new vs returning users
      const userBookingCounts: Record<string, number> = {}

      bookings.forEach((booking) => {
        if (booking.userId) {
          userBookingCounts[booking.userId] = (userBookingCounts[booking.userId] || 0) + 1
        }
      })

      // Count new vs returning clients
      const uniqueNewClients = new Set()
      const uniqueReturningClients = new Set()

      thisMonthBookings.forEach((booking) => {
        if (booking.userId) {
          if (userBookingCounts[booking.userId] > 1) {
            uniqueReturningClients.add(booking.userId)
          } else {
            uniqueNewClients.add(booking.userId)
          }
        }
      })

      setNewClientsCount(uniqueNewClients.size)
      setReturningClientsCount(uniqueReturningClients.size)

      // Fetch login/logout logs
      try {
        const logsQuery = query(
          collection(db, "logs"),
          where("logType", "in", ["LOGIN", "LOGOUT"]),
          orderBy("timestamp", "desc"),
          limit(10),
        )
        const logsSnapshot = await getDocs(logsQuery)

        const logData = logsSnapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData // Cast to DocumentData
          return {
            id: doc.id,
            activity: (data.activity as string) || "N/A", // Explicitly cast and provide default
            // Explicitly cast timestamp to Timestamp or null/undefined
            timestamp: data.timestamp as Timestamp | null | undefined,
            performedBy: (data.performedBy as string) || "N/A", // Explicitly cast and provide default
            logType: data.logType as LogActionType, // Explicitly cast logType
            userId: data.userId as string | undefined, // Explicitly cast userId
          }
        })

        setLogs(logData)
      } catch (error) {
        console.error("Error fetching logs:", error)
        setLogs([])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refined formatLogDate to handle potential issues more gracefully
  // Now specifically expects Timestamp | null | undefined
  const formatLogDate = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) {
      return "Invalid date/time" // Handle null or undefined explicitly
    }

    let date: Date
    try {
      // Directly use toDate() as we are now ensuring timestamp is Timestamp | null | undefined
      date = timestamp.toDate()

      // Check if the created Date object is valid
      if (isNaN(date.getTime())) {
        return "Invalid date/time"
      }

      // Use the provided formatDateTime function
      // Ensure formatDateTime can handle a valid Date object or its ISO string
      return formatDateTime(date.toISOString()) // Passing ISO string
    } catch (error) {
      console.error("Error formatting timestamp:", error, timestamp)
      return "Invalid date/time" // Return error string if any exception occurs during formatting
    }
  }

  return (
    <DashboardLayout>
      <div className="grid gap-4">
        {/* Toggle for real-time updates */}
        <div className="flex justify-end mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Real-time updates:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isRealtime}
                onChange={() => setIsRealtime(!isRealtime)}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2a69ac]"></div>
            </label>
          </div>
        </div>

        {/* First row: Calendar and Logs */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <ReservationCalendar />
          </div>

          {/* Logs */}
          <div className="rounded-xl bg-white p-4 shadow-sm flex flex-col">
            <h3 className="text-xl font-semibold text-[#2a69ac] mb-2">Logs</h3>
            <div className="flex-1 overflow-y-auto text-sm max-h-[300px]">
              {isLoading && logs.length === 0 ? (
                <Loading />
              ) : logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded-md ${log.logType === "LOGIN" ? "bg-blue-50" : "bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${log.logType === "LOGIN" ? "bg-green-500" : "bg-orange-500"}`}
                        ></span>
                        {/* Display the activity field which contains the first name */}
                        <span className="font-medium">{log.activity}</span>
                      </div>
                      {/* Use the refined formatLogDate function */}
                      <div className="text-xs text-gray-500 mt-1">{formatLogDate(log.timestamp)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No login/logout activity logs found</div>
              )}
            </div>
          </div>
        </div>

        {/* Second row: Pending Reservations, Clients, Today */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Pending Reservations */}
          <div className="rounded-xl bg-white p-4 shadow-sm flex flex-col">
            <h3 className="text-xl font-semibold text-[#2a69ac] mb-2">Pending Reservations</h3>
            <div className="flex items-start justify-start flex-1">
              {isLoading && pendingCount === 0 ? (
                <Loading />
              ) : (
                <span className="text-6xl leading-none font-bold text-[#1A365D]">{pendingCount}</span>
              )}
            </div>
          </div>

          {/* Clients */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-[#2A69AC]">Clients</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">New This Month</h3>
                {isLoading && newClientsCount === 0 ? (
                  <Loading />
                ) : (
                  <p className="text-4xl font-bold text-[#1A365D]">{newClientsCount}</p>
                )}
              </div>
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">Returning This Month</h3>
                {isLoading && returningClientsCount === 0 ? (
                  <Loading />
                ) : (
                  <p className="text-4xl font-bold text-[#1A365D]">{returningClientsCount}</p>
                )}
              </div>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-[#2A69AC]">Today</h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">Completed</h3>
                {isLoading && completedToday === 0 ? (
                  <Loading />
                ) : (
                  <p className="text-4xl font-bold text-[#1A365D]">{completedToday}</p>
                )}
              </div>
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">Repairing</h3>
                {isLoading && repairingToday === 0 ? (
                  <Loading />
                ) : (
                  <p className="text-4xl font-bold text-[#1A365D]">{repairingToday}</p>
                )}
              </div>
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">Confirmed</h3>
                {isLoading && confirmedToday === 0 ? (
                  <Loading />
                ) : (
                  <p className="text-4xl font-bold text-[#1A365D]">{confirmedToday}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Third row: Arriving Today */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-[#2A69AC]">Arriving Today</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#8B909A]">Reservation ID</TableHead>
                  <TableHead className="text-[#8B909A]">Customer</TableHead>
                  <TableHead className="text-[#8B909A]">Car Model</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && arrivingToday.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-[#8B909A]">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : arrivingToday.length > 0 ? (
                  arrivingToday.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="text-[#1A365D] uppercase">#{reservation.id}</TableCell>
                      <TableCell className="text-[#1A365D] uppercase">{reservation.customerName}</TableCell>
                      <TableCell className="text-[#1A365D] uppercase">
                        {`${reservation.carBrand} ${reservation.carModel}`}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-[#8B909A]">
                      No reservations arriving today
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
