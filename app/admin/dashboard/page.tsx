"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin-components/table"
import { ReservationCalendar } from "@/components/admin-components/reservation-calendar"
import { DashboardLayout } from "@/components/admin-components/dashboard-layout"
import { collection, query, getDocs, orderBy, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Loading from "@/components/admin-components/loading"
import { formatDateTime } from "@/lib/date-utils"
import { ArrowUp, ArrowDown, Activity, Users, Calendar, Car, CheckCircle, Clock, AlertTriangle } from "lucide-react"

// Define types for our data
interface Log {
  id: number
  message: string
  timestamp: Date
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
  reservationDate: string | Date
  userId?: string
}

interface MetricWithTrend {
  current: number
  previous: number
  percentChange: number
}

export default function DashboardPage() {
  const [pendingMetrics, setPendingMetrics] = useState<MetricWithTrend>({ current: 0, previous: 0, percentChange: 0 })
  const [completedTodayMetrics, setCompletedTodayMetrics] = useState<MetricWithTrend>({ current: 0, previous: 0, percentChange: 0 })
  const [repairingTodayMetrics, setRepairingTodayMetrics] = useState<MetricWithTrend>({ current: 0, previous: 0, percentChange: 0 })
  const [confirmedTodayMetrics, setConfirmedTodayMetrics] = useState<MetricWithTrend>({ current: 0, previous: 0, percentChange: 0 })
  const [newClientsMetrics, setNewClientsMetrics] = useState<MetricWithTrend>({ current: 0, previous: 0, percentChange: 0 })
  const [returningClientsMetrics, setReturningClientsMetrics] = useState<MetricWithTrend>({ current: 0, previous: 0, percentChange: 0 })
  const [arrivingToday, setArrivingToday] = useState<Reservation[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalThisMonth, setTotalThisMonth] = useState(0)
  const [totalLastMonth, setTotalLastMonth] = useState(0)

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  const calculatePercentChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Number(((current - previous) / previous) * 100).toFixed(1) as unknown as number
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Get today's date at midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get yesterday's date for comparison
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Get tomorrow's date for comparison
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Get first day of current month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      // Get first day of previous month
      const firstDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0)

      // Fetch all bookings to calculate counts
      const bookingsQuery = query(collection(db, "bookings"), orderBy("reservationDate", "desc"))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookings = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[]

      // Calculate counts based on status
      const pendingBookings = bookings.filter((booking) => booking.status === "PENDING")
      
      // Compare with previous day's pending count (for trend)
      const prevDayBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.reservationDate)
        return bookingDate >= yesterday && bookingDate < today
      })
      const prevDayPendingCount = prevDayBookings.filter((booking) => booking.status === "PENDING").length
      
      setPendingMetrics({
        current: pendingBookings.length,
        previous: prevDayPendingCount,
        percentChange: calculatePercentChange(pendingBookings.length, prevDayPendingCount)
      })

      // For today's stats, filter by date
      const todayBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.reservationDate)
        return bookingDate >= today && bookingDate < tomorrow
      })

      const yesterdayBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.reservationDate)
        return bookingDate >= yesterday && bookingDate < today
      })

      // Calculate completed metrics with trend
      const completedTodayCount = todayBookings.filter((booking) => booking.status === "COMPLETED").length
      const completedYesterdayCount = yesterdayBookings.filter((booking) => booking.status === "COMPLETED").length
      setCompletedTodayMetrics({
        current: completedTodayCount,
        previous: completedYesterdayCount,
        percentChange: calculatePercentChange(completedTodayCount, completedYesterdayCount)
      })

      // Calculate repairing metrics with trend
      const repairingTodayCount = todayBookings.filter((booking) => booking.status === "REPAIRING").length
      const repairingYesterdayCount = yesterdayBookings.filter((booking) => booking.status === "REPAIRING").length
      setRepairingTodayMetrics({
        current: repairingTodayCount,
        previous: repairingYesterdayCount,
        percentChange: calculatePercentChange(repairingTodayCount, repairingYesterdayCount)
      })

      // Calculate confirmed metrics with trend
      const confirmedTodayCount = todayBookings.filter((booking) => booking.status === "CONFIRMED").length
      const confirmedYesterdayCount = yesterdayBookings.filter((booking) => booking.status === "CONFIRMED").length
      setConfirmedTodayMetrics({
        current: confirmedTodayCount,
        previous: confirmedYesterdayCount,
        percentChange: calculatePercentChange(confirmedTodayCount, confirmedYesterdayCount)
      })

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

      // For clients this month vs. last month
      const thisMonthBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.reservationDate)
        return bookingDate >= firstDayOfMonth
      })

      const lastMonthBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.reservationDate)
        return bookingDate >= firstDayOfPrevMonth && bookingDate <= lastDayOfPrevMonth
      })

      // Count unique customer IDs for this month and last month
      const thisMonthUniqueCustomerIds = new Set<string>()
      thisMonthBookings.forEach((booking) => {
        if (booking.userId) thisMonthUniqueCustomerIds.add(booking.userId)
      })

      const lastMonthUniqueCustomerIds = new Set<string>()
      lastMonthBookings.forEach((booking) => {
        if (booking.userId) lastMonthUniqueCustomerIds.add(booking.userId)
      })

      // Calculate total booking counts for month-over-month comparison
      setTotalThisMonth(thisMonthBookings.length)
      setTotalLastMonth(lastMonthBookings.length)

      // For demo purposes, split these into new and returning with trends
      const newClientsThisMonth = Math.ceil(thisMonthUniqueCustomerIds.size * 0.6)
      const newClientsLastMonth = Math.ceil(lastMonthUniqueCustomerIds.size * 0.6)
      setNewClientsMetrics({
        current: newClientsThisMonth,
        previous: newClientsLastMonth,
        percentChange: calculatePercentChange(newClientsThisMonth, newClientsLastMonth)
      })

      const returningClientsThisMonth = Math.floor(thisMonthUniqueCustomerIds.size * 0.4)
      const returningClientsLastMonth = Math.floor(lastMonthUniqueCustomerIds.size * 0.4)
      setReturningClientsMetrics({
        current: returningClientsThisMonth,
        previous: returningClientsLastMonth,
        percentChange: calculatePercentChange(returningClientsThisMonth, returningClientsLastMonth)
      })

      // For logs, we'll use a simplified approach with dummy data
      // In a real app, you'd have a dedicated logs collection
      const dummyLogs: Log[] = [
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

  const formatLogDate = (timestamp: Date | null | undefined): string => {
    if (!timestamp) return ""
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return formatDateTime(date.toString())
  }

  // Helper to render trend indicator
  const renderTrendIndicator = (percentChange: number) => {
    if (percentChange === 0) return null
    
    const isPositive = percentChange > 0
    const absoluteChange = Math.abs(percentChange)
    
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        <span className="text-xs font-medium ml-1">{absoluteChange}%</span>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="grid gap-4">
        {/* Monthly Performance Overview */}
        <div className="rounded-xl bg-gradient-to-r from-[#1A365D] to-[#2A69AC] p-5 shadow-md text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Monthly Performance</h2>
              <p className="text-blue-100 text-sm">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="mt-2 md:mt-0 bg-white/10 rounded-lg px-3 py-1 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                {totalThisMonth} bookings 
                {totalLastMonth > 0 && (
                  <span className={totalThisMonth >= totalLastMonth ? "text-green-300 ml-1" : "text-red-300 ml-1"}>
                    ({calculatePercentChange(totalThisMonth, totalLastMonth)}% {totalThisMonth >= totalLastMonth ? "↑" : "↓"})
                  </span>
                )}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center text-blue-100 mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-xs">Pending</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{pendingMetrics.current}</span>
                {renderTrendIndicator(pendingMetrics.percentChange)}
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center text-blue-100 mb-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">Completed Today</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{completedTodayMetrics.current}</span>
                {renderTrendIndicator(completedTodayMetrics.percentChange)}
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center text-blue-100 mb-1">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-xs">New Clients</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{newClientsMetrics.current}</span>
                {renderTrendIndicator(newClientsMetrics.percentChange)}
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center text-blue-100 mb-1">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-xs">Returning Clients</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{returningClientsMetrics.current}</span>
                {renderTrendIndicator(returningClientsMetrics.percentChange)}
              </div>
            </div>
          </div>
        </div>
        
        {/* First row: Calendar and Logs */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <ReservationCalendar />
          </div>

          {/* Logs */}
          <div className="rounded-xl bg-white p-5 shadow-sm flex flex-col">
            <div className="flex items-center mb-3">
              <Activity className="h-5 w-5 text-[#2a69ac] mr-2" />
              <h3 className="text-lg font-semibold text-[#2a69ac]">Activity Log</h3>
            </div>
            <div className="flex-1 overflow-auto text-sm">
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="pb-2 border-b border-gray-100">
                    <div className="text-[#1A365D] font-medium">{log.message}</div>
                    <div className="text-xs text-[#8B909A]">{formatLogDate(log.timestamp)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Second row: Daily Metrics */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Pending Reservations */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-[#2a69ac]/10 p-2 rounded-lg mr-3">
                  <Calendar className="h-5 w-5 text-[#2a69ac]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A365D]">Pending Reservations</h3>
              </div>
              {!isLoading && (
                <div 
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    pendingMetrics.percentChange > 0 
                      ? 'bg-amber-100 text-amber-800' 
                      : pendingMetrics.percentChange < 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {pendingMetrics.percentChange > 0 ? '↑' : pendingMetrics.percentChange < 0 ? '↓' : '='} {Math.abs(pendingMetrics.percentChange)}%
                </div>
              )}
            </div>
            
            <div className="flex items-baseline justify-start">
              {isLoading ? (
                <Loading />
              ) : (
                <>
                  <span className="text-5xl font-bold text-[#1A365D]">{pendingMetrics.current}</span>
                  {pendingMetrics.previous > 0 && (
                    <span className="ml-2 text-sm text-gray-500">vs {pendingMetrics.previous} yesterday</span>
                  )}
                </>
              )}
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              {!isLoading && pendingMetrics.percentChange !== 0 && (
                <span>
                  {pendingMetrics.percentChange > 0 
                    ? `Increased by ${pendingMetrics.percentChange}% from yesterday` 
                    : `Decreased by ${Math.abs(pendingMetrics.percentChange)}% from yesterday`}
                </span>
              )}
            </div>
          </div>

          {/* Clients */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-[#2a69ac]/10 p-2 rounded-lg mr-3">
                <Users className="h-5 w-5 text-[#2a69ac]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1A365D]">Clients This Month</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="mb-1 text-xs font-medium text-[#2A69AC]">New Clients</h3>
                {isLoading ? (
                  <Loading />
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-[#1A365D]">{newClientsMetrics.current}</p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs font-medium ${newClientsMetrics.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {newClientsMetrics.percentChange >= 0 ? '↑' : '↓'} {Math.abs(newClientsMetrics.percentChange)}%
                      </span>
                      <span className="text-xs text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-indigo-50 p-3 rounded-lg">
                <h3 className="mb-1 text-xs font-medium text-indigo-600">Returning Clients</h3>
                {isLoading ? (
                  <Loading />
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-[#1A365D]">{returningClientsMetrics.current}</p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs font-medium ${returningClientsMetrics.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {returningClientsMetrics.percentChange >= 0 ? '↑' : '↓'} {Math.abs(returningClientsMetrics.percentChange)}%
                      </span>
                      <span className="text-xs text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-[#2a69ac]/10 p-2 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-[#2a69ac]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1A365D]">Today's Activity</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <h3 className="mb-1 text-xs font-medium text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" /> Completed
                </h3>
                {isLoading ? (
                  <Loading />
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-[#1A365D]">{completedTodayMetrics.current}</p>
                    {completedTodayMetrics.previous > 0 && (
                      <div className="mt-1 text-xs text-gray-500">vs {completedTodayMetrics.previous} yesterday</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="mb-1 text-xs font-medium text-blue-600 flex items-center">
                  <Activity className="h-3 w-3 mr-1" /> Repairing
                </h3>
                {isLoading ? (
                  <Loading />
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-[#1A365D]">{repairingTodayMetrics.current}</p>
                    {repairingTodayMetrics.previous > 0 && (
                      <div className="mt-1 text-xs text-gray-500">vs {repairingTodayMetrics.previous} yesterday</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-amber-50 p-3 rounded-lg">
                <h3 className="mb-1 text-xs font-medium text-amber-600 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Confirmed
                </h3>
                {isLoading ? (
                  <Loading />
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-[#1A365D]">{confirmedTodayMetrics.current}</p>
                    {confirmedTodayMetrics.previous > 0 && (
                      <div className="mt-1 text-xs text-gray-500">vs {confirmedTodayMetrics.previous} yesterday</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Third row: Arriving Today */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-[#2a69ac]/10 p-2 rounded-lg mr-3">
                <Car className="h-5 w-5 text-[#2a69ac]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1A365D]">Arriving Today</h2>
            </div>
            {!isLoading && (
              <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                {arrivingToday.length} appointments
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-[#2A69AC] font-medium">Reservation ID</TableHead>
                  <TableHead className="text-[#2A69AC] font-medium">Customer</TableHead>
                  <TableHead className="text-[#2A69AC] font-medium">Car Model</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : arrivingToday.length > 0 ? (
                  arrivingToday.map((reservation) => (
                    <TableRow key={reservation.id} className="hover:bg-gray-50">
                      <TableCell className="text-[#1A365D] font-medium">#{reservation.id}</TableCell>
                      <TableCell className="text-[#1A365D]">{reservation.customerName}</TableCell>
                      <TableCell className="text-[#1A365D]">{reservation.carModel}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-[#8B909A] py-6">
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