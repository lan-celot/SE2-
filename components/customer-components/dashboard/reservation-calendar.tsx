"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/customer-components/ui/button"
import { cn } from "@/lib/utils"
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatDateOnly } from "@/lib/date-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/customer-components/ui/dialog"
import Cookies from "js-cookie"

interface CalendarData {
  [date: string]: {
    bookings: number
    isUnavailable: boolean
  }
}

interface BookingDetails {
  id: string
  carModel: string
  plateNo?: string
  time: string
  status: string
}

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

export function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [bookingData, setBookingData] = useState<CalendarData>({})
  const [showBookingsDialog, setShowBookingsDialog] = useState(false)
  const [selectedDateBookings, setSelectedDateBookings] = useState<BookingDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const today = new Date()

  useEffect(() => {
    fetchMonthBookings()
  }, [currentDate])

  const isSunday = (dayNumber: number): boolean => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber)
    return date.getDay() === 0 // 0 represents Sunday
  }

  const isToday = (dayNumber: number): boolean => {
    return (
      today.getDate() === dayNumber &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    )
  }

  const fetchMonthBookings = async () => {
    try {
      setIsLoading(true)

      // Initialize calendar data
      const newCalendarData: CalendarData = {}

      // Get first and last day of the month
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      // Format dates for query
      const firstDayStr = firstDay.toISOString().split("T")[0]
      const lastDayStr = lastDay.toISOString().split("T")[0]

      // Get current user's ID
      const userId = Cookies.get("userId") || localStorage.getItem("userId")
      
      if (!userId) {
        console.error("User ID not found - user may not be logged in")
        setIsLoading(false)
        return
      }

      // Fetch only the current user's bookings for the month
      try {
        // Try to get user's bookings from their subcollection first
        const userBookingsRef = collection(db, "users", userId, "bookings")
        const userBookingsQuery = query(
          userBookingsRef,
          where("reservationDate", ">=", firstDayStr),
          where("reservationDate", "<=", lastDayStr)
        )
        
        const userBookingsSnapshot = await getDocs(userBookingsQuery)
        
        // If no user bookings found in subcollection, try global collection
        if (userBookingsSnapshot.empty) {
          // For global collection, avoid the Firebase index error by:
          // 1. First getting bookings by userId (without date filters)
          const globalBookingsRef = collection(db, "bookings")
          const globalBookingsQuery = query(
            globalBookingsRef,
            where("userId", "==", userId)
          )
          
          const globalBookingsSnapshot = await getDocs(globalBookingsQuery)
          
          // 2. Then filter the results manually by date
          globalBookingsSnapshot.forEach((doc) => {
            const booking = doc.data()
            const dateStr = booking.reservationDate
            
            // Apply date filters in JavaScript
            if (dateStr >= firstDayStr && dateStr <= lastDayStr) {
              if (!newCalendarData[dateStr]) {
                newCalendarData[dateStr] = {
                  bookings: 0,
                  isUnavailable: false,
                }
              }
              
              newCalendarData[dateStr].bookings += 1
            }
          })
        } else {
          // Count user's bookings per date from user subcollection
          userBookingsSnapshot.forEach((doc) => {
            const booking = doc.data()
            const dateStr = booking.reservationDate
            
            if (!newCalendarData[dateStr]) {
              newCalendarData[dateStr] = {
                bookings: 0,
                isUnavailable: false,
              }
            }
            
            newCalendarData[dateStr].bookings += 1
          })
        }
      } catch (err) {
        console.error("Error fetching user bookings:", err)
      }

      // Fetch unavailable dates from calendar collection
      const calendarRef = doc(db, "calendar", `${year}-${(month + 1).toString().padStart(2, "0")}`)
      const calendarDoc = await getDoc(calendarRef)

      if (calendarDoc.exists()) {
        const calendarData = calendarDoc.data() as CalendarData

        // Merge unavailable dates with booking counts
        Object.keys(calendarData).forEach((dateStr) => {
          if (calendarData[dateStr]?.isUnavailable) {
            if (!newCalendarData[dateStr]) {
              newCalendarData[dateStr] = {
                bookings: 0,
                isUnavailable: true,
              }
            } else {
              newCalendarData[dateStr].isUnavailable = true
            }
          }
        })
      }

      // Mark Sundays as unavailable
      const daysInMonth = getDaysInMonth(currentDate)
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        if (date.getDay() === 0) { // Sunday
          const dateStr = formatDateString(day)
          if (!newCalendarData[dateStr]) {
            newCalendarData[dateStr] = {
              bookings: 0,
              isUnavailable: true,
            }
          } else {
            newCalendarData[dateStr].isUnavailable = true
          }
        }
      }

      setBookingData(newCalendarData)
    } catch (error) {
      console.error("Error fetching calendar data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateClick = async (dayNumber: number) => {
    if (isSunday(dayNumber)) {
      return // Sundays are not available for booking
    }

    const dateString = formatDateString(dayNumber)

    if (bookingData[dateString]?.isUnavailable) {
      return // Date is marked as unavailable
    }

    setSelectedDate(dayNumber)

    try {
      // Get current user ID from cookies or localStorage
      const userId = Cookies.get("userId") || localStorage.getItem("userId")
      
      if (!userId) {
        console.error("User ID not found - user may not be logged in")
        return
      }

      // Query only the current user's bookings for this date
      // Try both methods to ensure we find the user's bookings:
      // 1. First from the user's subcollection (if it exists)
      // 2. Then from global bookings collection filtered by userId
      
      let bookings: BookingDetails[] = []
      
      // Method 1: Check user's subcollection
      const userBookingsRef = collection(db, "users", userId, "bookings")
      const userBookingsQuery = query(userBookingsRef, where("reservationDate", "==", dateString))
      const userSnapshot = await getDocs(userBookingsQuery)
      
      if (!userSnapshot.empty) {
        bookings = userSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            carModel: data.carModel || "Unknown",
            plateNo: data.plateNo || "No data",
            time: data.time || "Not specified",
            status: (data.status || "PENDING").toUpperCase(),
          }
        })
      } else {
        // Method 2: Check global bookings collection with user filter
        // Using a single where clause to avoid index errors
        const globalBookingsRef = collection(db, "bookings")
        const globalBookingsQuery = query(
          globalBookingsRef, 
          where("userId", "==", userId)
        )
        const globalSnapshot = await getDocs(globalBookingsQuery)
        
        // Filter the results manually by date
        bookings = globalSnapshot.docs
          .filter(doc => doc.data().reservationDate === dateString)
          .map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              carModel: data.carModel || "Unknown",
              plateNo: data.plateNo || "No data",
              time: data.time || "Not specified",
              status: (data.status || "PENDING").toUpperCase(),
            }
          })
      }

      setSelectedDateBookings(bookings)
      setShowBookingsDialog(true)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    }
  }

  const formatDateString = (dayNumber: number): string => {
    const year = currentDate.getFullYear()
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0")
    const day = dayNumber.toString().padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const getDateColor = (dayNumber: number, isCurrentMonth: boolean): string => {
    if (!isCurrentMonth) return "text-gray-300"
    if (isSunday(dayNumber)) return "bg-gray-200 text-gray-500 cursor-not-allowed"

    const dateString = formatDateString(dayNumber)
    const dayData = bookingData[dateString]

    if (dayData?.isUnavailable) return "bg-gray-200 text-gray-500 cursor-not-allowed"
    if (dayData?.bookings >= 4) return "text-red-500"
    if (dayData?.bookings >= 2) return "text-orange-500"
    if (dayData?.bookings >= 1) return "text-blue-500"
    
    return "text-gray-900"
  }

  const getDateBgColor = (dayNumber: number, isCurrentMonth: boolean): string => {
    if (!isCurrentMonth) return ""
    if (isSunday(dayNumber)) return "bg-gray-200"

    const dateString = formatDateString(dayNumber)
    const dayData = bookingData[dateString]

    if (dayData?.isUnavailable) return "bg-gray-200"
    if (dayData?.bookings >= 1) return "bg-blue-100"
    
    return ""
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date)
  }

  // Helper function to get status display name
  const getStatusDisplay = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      REPAIRING: "Repairing",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    }
    return statusMap[status] || status
  }

  // Status styles mapping for consistent styling
  const statusStyles: Record<string, { bg: string; text: string }> = {
    PENDING: {
      bg: "bg-[#FFF5E0]",
      text: "text-[#FF9F43]",
    },
    CONFIRMED: {
      bg: "bg-[#EBF8FF]",
      text: "text-[#63B3ED]",
    },
    REPAIRING: {
      bg: "bg-[#FFF5E0]",
      text: "text-[#FFC600]",
    },
    COMPLETED: {
      bg: "bg-[#E6FFF3]",
      text: "text-[#28C76F]",
    },
    CANCELLED: {
      bg: "bg-[#FFE5E5]",
      text: "text-[#EA5455]",
    },
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-2xl font-semibold text-[#2a69ac] mb-6">Reservation Calendar</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h4 className="font-medium">{formatMonth(currentDate)}</h4>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="hover:bg-gray-100">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500">
          {days.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="h-[240px] flex items-center justify-center">
            <p className="text-gray-500">Loading calendar data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 text-sm">
            {Array.from({ length: 42 }).map((_, i) => {
              const dayNumber = i - getFirstDayOfMonth(currentDate) + 1
              const isCurrentMonth = dayNumber > 0 && dayNumber <= getDaysInMonth(currentDate)
              const dateString = formatDateString(dayNumber)
              const isUnavailable = bookingData[dateString]?.isUnavailable || isSunday(dayNumber)
              const isTodayDate = isToday(dayNumber)
              const isSelected = dayNumber === selectedDate && isCurrentMonth

              if (!isCurrentMonth) return <div key={i} className="p-2" />

              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(dayNumber)}
                  disabled={isUnavailable}
                  className={cn(
                    "p-2 rounded-lg font-medium transition-colors relative h-12",
                    isSelected && "bg-[#2a69ac] text-white",
                    !isSelected && getDateColor(dayNumber, isCurrentMonth),
                    !isSelected && getDateBgColor(dayNumber, isCurrentMonth),
                    !isUnavailable && "hover:bg-gray-100",
                    isUnavailable && "cursor-not-allowed"
                  )}
                >
                  {dayNumber}
                  {isTodayDate && (
                    <div
                      className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"
                      title="Today"
                    ></div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={showBookingsDialog} onOpenChange={setShowBookingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedDate && formatDateOnly(formatDateString(selectedDate))}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {selectedDateBookings.length > 0 ? (
              <div className="space-y-4">
                {selectedDateBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-md p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium text-gray-500">Reservation ID:</div>
                      <div className="text-sm text-[#1A365D] truncate overflow-hidden" title={booking.id}>
                        #{booking.id}
                      </div>

                      <div className="text-sm font-medium text-gray-500">Car Model:</div>
                      <div className="text-sm text-[#1A365D] uppercase">{booking.carModel}</div>

                      <div className="text-sm font-medium text-gray-500">Plate No:</div>
                      <div className="text-sm text-[#1A365D] uppercase">{booking.plateNo}</div>

                      <div className="text-sm font-medium text-gray-500">Status:</div>
                      <div className="text-sm">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-md text-xs font-medium",
                            statusStyles[booking.status]?.bg || "bg-gray-100",
                            statusStyles[booking.status]?.text || "text-gray-500"
                          )}
                        >
                          {getStatusDisplay(booking.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">No bookings for this date.</div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowBookingsDialog(false)}
              className="w-full bg-[#2A69AC] hover:bg-[#1A365D] text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}