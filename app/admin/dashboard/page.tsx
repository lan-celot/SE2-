"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin-components/table"
import { ReservationCalendar } from "@/components/admin-components/reservation-calendar"
import { DashboardLayout } from "@/components/admin-components/dashboard-layout"
import { collection, query, getDocs, orderBy, where, onSnapshot, Timestamp, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Loading from "@/components/admin-components/loading"
import { formatDateTime } from "@/lib/date-utils"

// Define types for our data
interface Log {
  id: string
  message: string
  timestamp: Timestamp
  userId?: string
  type?: string
}

interface Reservation {
  id: string
  customerName: string
  carModel: string
}

interface Booking {
  id: string
  firstName: string
  lastName: string
  carModel: string
  status: string
  reservationDate: string | Date | Timestamp
  userId?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
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
  const [isRealtime, setIsRealtime] = useState(true)

  // Set up real-time listeners for Firestore collections
  useEffect(() => {
    // Only use real-time updates if enabled
    if (!isRealtime) {
      fetchDashboardData()
      return
    }

    setIsLoading(true)

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get tomorrow's date for comparison
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Convert dates to Firestore Timestamps
    const todayTimestamp = Timestamp.fromDate(today)
    const tomorrowTimestamp = Timestamp.fromDate(tomorrow)
    const firstDayOfMonthTimestamp = Timestamp.fromDate(firstDayOfMonth)

    // Set up listeners

    // 1. All bookings for general stats
    const bookingsQuery = query(collection(db, "bookings"), orderBy("reservationDate", "desc"))
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[]

      // Calculate counts based on status
      const pendingBookings = bookings.filter((booking) => booking.status === "PENDING")
      setPendingCount(pendingBookings.length)

      // For today's stats, filter by date
      const todayBookings = bookings.filter((booking) => {
        const bookingDate = booking.reservationDate instanceof Timestamp 
          ? booking.reservationDate.toDate() 
          : new Date(booking.reservationDate)
        
        return bookingDate >= today && bookingDate < tomorrow
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
          carModel: booking.carModel,
        }))
      )

      // For clients this month, filter by date and count unique customer IDs
      const thisMonthBookings = bookings.filter((booking) => {
        const bookingDate = booking.reservationDate instanceof Timestamp 
          ? booking.reservationDate.toDate() 
          : new Date(booking.reservationDate)
        
        return bookingDate >= firstDayOfMonth
      })

      // Count unique users
      const uniqueUserIds = new Set<string>()
      const returningUserIds = new Set<string>()
      
      // Process bookings to identify new vs returning users
      // A returning user is one who has more than one booking
      const userBookingCounts: Record<string, number> = {}
      
      bookings.forEach(booking => {
        if (booking.userId) {
          if (userBookingCounts[booking.userId]) {
            userBookingCounts[booking.userId]++
            returningUserIds.add(booking.userId)
          } else {
            userBookingCounts[booking.userId] = 1
            uniqueUserIds.add(booking.userId)
          }
        }
      })
      
      // New clients are those who only appear in this month's bookings and have only one booking
      const newClientThisMonth = thisMonthBookings.filter(booking => 
        booking.userId && 
        userBookingCounts[booking.userId] === 1 &&
        !returningUserIds.has(booking.userId)
      )
      
      // Returning clients are those who have more than one booking
      const returningClientsThisMonth = thisMonthBookings.filter(booking => 
        booking.userId && 
        returningUserIds.has(booking.userId)
      )
      
      // Count unique client IDs
      const uniqueNewClients = new Set(newClientThisMonth.map(b => b.userId))
      const uniqueReturningClients = new Set(returningClientsThisMonth.map(b => b.userId))
      
      setNewClientsCount(uniqueNewClients.size)
      setReturningClientsCount(uniqueReturningClients.size)

      setIsLoading(false)
    }, (error) => {
      console.error("Error fetching bookings:", error)
      setIsLoading(false)
    })

    // 2. Logs collection
    const logsQuery = query(
      collection(db, "logs"), 
      orderBy("timestamp", "desc"),
      limit(10)
    )
    
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Log[]
      
      setLogs(logData)
    }, (error) => {
      console.error("Error fetching logs:", error)
      // If logs collection doesn't exist or has permission issues, 
      // use demo data instead
      const dummyLogs: Log[] = [
        {
          id: "1",
          message: "Transaction #T1234 completed for Andrea Salazar",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 15 * 60000)),
          type: "transaction"
        },
        {
          id: "2",
          message: "New reservation #R00101 created for John Doe",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 28 * 60000)),
          type: "reservation"
        },
        { 
          id: "3", 
          message: "Employee Mark Johnson logged in", 
          timestamp: Timestamp.fromDate(new Date(Date.now() - 35 * 60000)),
          type: "auth"
        },
        { 
          id: "4", 
          message: "Inventory update: 5 oil filters added", 
          timestamp: Timestamp.fromDate(new Date(Date.now() - 50 * 60000)),
          type: "inventory"
        },
        {
          id: "5",
          message: "Customer feedback received for service #S0098",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 58 * 60000)),
          type: "feedback"
        }
      ]
      setLogs(dummyLogs)
    })

    // Clean up listeners on unmount
    return () => {
      unsubscribeBookings()
      unsubscribeLogs()
    }
  }, [isRealtime])

  // Regular fetch method (used if real-time updates are disabled)
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Get today's date at midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get tomorrow's date for comparison
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Get first day of current month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      // Fetch all bookings to calculate counts
      const bookingsQuery = query(collection(db, "bookings"), orderBy("reservationDate", "desc"))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookings = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[]

      // Calculate counts based on status
      const pendingBookings = bookings.filter((booking) => booking.status === "PENDING")
      setPendingCount(pendingBookings.length)

      // For today's stats, filter by date
      const todayBookings = bookings.filter((booking) => {
        const bookingDate = booking.reservationDate instanceof Timestamp 
          ? booking.reservationDate.toDate() 
          : new Date(booking.reservationDate)
        
        return bookingDate >= today && bookingDate < tomorrow
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
          carModel: booking.carModel,
        })),
      )

      // For clients this month, we'll use a more sophisticated approach
      const thisMonthBookings = bookings.filter((booking) => {
        const bookingDate = booking.reservationDate instanceof Timestamp 
          ? booking.reservationDate.toDate() 
          : new Date(booking.reservationDate)
        
        return bookingDate >= firstDayOfMonth
      })

      // Process bookings to identify new vs returning users
      const userBookingCounts: Record<string, number> = {}
      
      bookings.forEach(booking => {
        if (booking.userId) {
          userBookingCounts[booking.userId] = (userBookingCounts[booking.userId] || 0) + 1
        }
      })
      
      // Count new vs returning clients
      const uniqueNewClients = new Set()
      const uniqueReturningClients = new Set()
      
      thisMonthBookings.forEach(booking => {
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

      // Try to fetch real logs data first
      try {
        const logsQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(7))
        const logsSnapshot = await getDocs(logsQuery)
        
        if (!logsSnapshot.empty) {
          const logData = logsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Log[]
          
          setLogs(logData)
        } else {
          // If logs collection is empty, use demo data
          const dummyLogs: Log[] = [
            {
              id: "1",
              message: "Transaction #T1234 completed for Andrea Salazar",
              timestamp: Timestamp.fromDate(new Date(Date.now() - 15 * 60000)),
              type: "transaction"
            },
            {
              id: "2",
              message: "New reservation #R00101 created for John Doe",
              timestamp: Timestamp.fromDate(new Date(Date.now() - 28 * 60000)),
              type: "reservation"
            },
            { 
              id: "3", 
              message: "Employee Mark Johnson logged in", 
              timestamp: Timestamp.fromDate(new Date(Date.now() - 35 * 60000)),
              type: "auth"
            },
            { 
              id: "4", 
              message: "Inventory update: 5 oil filters added", 
              timestamp: Timestamp.fromDate(new Date(Date.now() - 50 * 60000)),
              type: "inventory"
            },
            {
              id: "5",
              message: "Customer feedback received for service #S0098",
              timestamp: Timestamp.fromDate(new Date(Date.now() - 58 * 60000)),
              type: "feedback"
            }
          ]
          setLogs(dummyLogs)
        }
      } catch (error) {
        console.error("Error fetching logs:", error)
        // Use dummy logs as fallback
        const dummyLogs: Log[] = [
          {
            id: "1",
            message: "Transaction #T1234 completed for Andrea Salazar",
            timestamp: Timestamp.fromDate(new Date(Date.now() - 15 * 60000)),
            type: "transaction"
          },
          {
            id: "2",
            message: "New reservation #R00101 created for John Doe",
            timestamp: Timestamp.fromDate(new Date(Date.now() - 28 * 60000)),
            type: "reservation"
          },
          { 
            id: "3", 
            message: "Employee Mark Johnson logged in", 
            timestamp: Timestamp.fromDate(new Date(Date.now() - 35 * 60000)),
            type: "auth"
          },
          { 
            id: "4", 
            message: "Inventory update: 5 oil filters added", 
            timestamp: Timestamp.fromDate(new Date(Date.now() - 50 * 60000)),
            type: "inventory"
          },
          {
            id: "5",
            message: "Customer feedback received for service #S0098",
            timestamp: Timestamp.fromDate(new Date(Date.now() - 58 * 60000)),
            type: "feedback"
          }
        ]
        setLogs(dummyLogs)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatLogDate = (timestamp: Timestamp | Date | null | undefined): string => {
    if (!timestamp) return ""
    
    let date: Date
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      date = new Date(timestamp)
    }
    
    return formatDateTime(date.toString())
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
            <div className="flex-1 overflow-auto text-sm">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="text-[#8B909A]">
                    {log.message} at {formatLogDate(log.timestamp)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Second row: Pending Reservations, Clients, Today */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Pending Reservations */}
          <div className="rounded-xl bg-white p-4 shadow-sm flex flex-col">
            <h3 className="text-xl font-semibold text-[#2a69ac] mb-2">Pending Reservations</h3>
            <div className="flex items-start justify-start flex-1">
              {isLoading && <Loading />}
              <span className="text-6xl leading-none font-bold text-[#1A365D]">{isLoading ? "..." : pendingCount}</span>
            </div>
          </div>

          {/* Clients */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-[#2A69AC]">Clients</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">New This Month</h3>
                {isLoading && <Loading />}
                <p className="text-4xl font-bold text-[#1A365D]">{isLoading ? "..." : newClientsCount}</p>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">Returning This Month</h3>
                {isLoading && <Loading />}
                <p className="text-4xl font-bold text-[#1A365D]">{isLoading ? "..." : returningClientsCount}</p>
              </div>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-[#2A69AC]">Today</h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">Completed</h3>
                {isLoading && <Loading />}
                <p className="text-4xl font-bold text-[#1A365D]">{isLoading ? "..." : completedToday}</p>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">Repairing</h3>
                {isLoading && <Loading />}
                <p className="text-4xl font-bold text-[#1A365D]">{isLoading ? "..." : repairingToday}</p>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-medium text-[#8B909A]">Confirmed</h3>
                {isLoading && <Loading />}
                <p className="text-4xl font-bold text-[#1A365D]">{isLoading ? "..." : confirmedToday}</p>
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
                {isLoading ? (
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
                      <TableCell className="text-[#1A365D] uppercase">{reservation.carModel}</TableCell>
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