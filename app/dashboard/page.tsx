"use client"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReservationCalendar } from "@/components/reservation-calendar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { collection, query, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Loading from "@/components/loading"

export default function DashboardPage() {
  const [pendingCount, setPendingCount] = useState(0)
  const [completedToday, setCompletedToday] = useState(0)
  const [repairingToday, setRepairingToday] = useState(0)
  const [confirmedToday, setConfirmedToday] = useState(0)
  const [newClientsCount, setNewClientsCount] = useState(0)
  const [returningClientsCount, setReturningClientsCount] = useState(0)
  const [arrivingToday, setArrivingToday] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

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
      }))

      // Calculate counts based on status
      const pendingBookings = bookings.filter((booking) => booking.status === "PENDING")
      setPendingCount(pendingBookings.length)

      // For today's stats, filter by date
      const todayBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.reservationDate)
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

      // For clients this month, we'll use a simplified approach
      // In a real app, you'd have more sophisticated client tracking
      const thisMonthBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.reservationDate)
        return bookingDate >= firstDayOfMonth
      })

      // Count unique customer IDs for this month
      const uniqueCustomerIds = new Set()
      thisMonthBookings.forEach((booking) => {
        if (booking.userId) uniqueCustomerIds.add(booking.userId)
      })

      // For demo purposes, split these into new and returning
      // In a real app, you'd track first visit date
      setNewClientsCount(Math.ceil(uniqueCustomerIds.size * 0.6)) // 60% new
      setReturningClientsCount(Math.floor(uniqueCustomerIds.size * 0.4)) // 40% returning

      // For logs, we'll use a simplified approach with dummy data
      // In a real app, you'd have a dedicated logs collection
      const dummyLogs = [
        {
          id: 1,
          message: "Transaction #T1234 completed for Andrea Salazar",
          timestamp: new Date(Date.now() - 15 * 60000),
        },
        {
          id: 2,
          message: "New reservation #R00101 created for John Doe",
          timestamp: new Date(Date.now() - 28 * 60000),
        },
        { id: 3, message: "Employee Mark Johnson logged in", timestamp: new Date(Date.now() - 35 * 60000) },
        { id: 4, message: "Inventory update: 5 oil filters added", timestamp: new Date(Date.now() - 50 * 60000) },
        {
          id: 5,
          message: "Customer feedback received for service #S0098",
          timestamp: new Date(Date.now() - 58 * 60000),
        },
        { id: 6, message: "Employee Sarah Lee logged out", timestamp: new Date(Date.now() - 75 * 60000) },
        {
          id: 7,
          message: "Reservation #R00100 status changed to 'In Progress'",
          timestamp: new Date(Date.now() - 90 * 60000),
        },
      ]
      setLogs(dummyLogs)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return date
      .toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "")
  }

  return (
    <DashboardLayout>
      <div className="grid gap-4">
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
                    {log.message} at {formatDate(log.timestamp)}
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
                      <TableCell className="text-[#1A365D]">#{reservation.id}</TableCell>
                      <TableCell className="text-[#1A365D]">{reservation.customerName}</TableCell>
                      <TableCell className="text-[#1A365D]">{reservation.carModel}</TableCell>
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

