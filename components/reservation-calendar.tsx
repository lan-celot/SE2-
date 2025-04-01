"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog"
import { collection, query, where, getDocs, doc, setDoc, getDoc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/hooks/use-toast"
import { formatDateOnly } from "@/lib/date-utils"

interface DayBookings {
  bookings: number
  isUnavailable: boolean
}

interface BookingDetails {
  id: string
  customerName: string
  carModel: string
  plateNo?: string
  time: string
  status: string // Added status field
}

interface CalendarData {
  [date: string]: {
    bookings: number
    isUnavailable: boolean
  }
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

export function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [bookingData, setBookingData] = useState<CalendarData>({})
  const [showBookingsDialog, setShowBookingsDialog] = useState(false)
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false)
  const [selectedDateBookings, setSelectedDateBookings] = useState<BookingDetails[]>([])
  const [dateToMarkUnavailable, setDateToMarkUnavailable] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const today = new Date()

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

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

      // Fetch all bookings for the month
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("reservationDate", ">=", firstDayStr),
        where("reservationDate", "<=", lastDayStr),
        orderBy("reservationDate"),
      )

      const bookingsSnapshot = await getDocs(bookingsQuery)

      // Count bookings per date
      bookingsSnapshot.forEach((doc) => {
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

      setBookingData(newCalendarData)
      console.log("Calendar data:", newCalendarData)
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch calendar data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateClick = async (dayNumber: number) => {
    if (isSunday(dayNumber)) {
      toast({
        title: "Not Available",
        description: "Bookings are not available on Sundays.",
        variant: "destructive",
      })
      return
    }

    const dateString = formatDateString(dayNumber)

    if (bookingData[dateString]?.isUnavailable) {
      toast({
        title: "Date Unavailable",
        description: "This date is marked as unavailable for bookings.",
        variant: "destructive",
      })
      return
    }

    setSelectedDate(dayNumber)

    try {
      // Fetch bookings for the selected date
      const bookingsQuery = query(collection(db, "bookings"), where("reservationDate", "==", dateString))
      const snapshot = await getDocs(bookingsQuery)

      const bookings: BookingDetails[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          customerName: `${data.firstName || ""} ${data.lastName || ""}`.trim().toUpperCase() || "Unknown",
          carModel: data.carModel || "Unknown",
          plateNo: data.plateNo || "No data",
          time: data.time || "Not specified",
          status: (data.status || "PENDING").toUpperCase(), // Added status with default value
        }
      })

      setSelectedDateBookings(bookings)
      setShowBookingsDialog(true)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast({
        title: "Error",
        description: "Failed to fetch bookings for this date",
        variant: "destructive",
      })
    }
  }

  const handleDateRightClick = async (e: React.MouseEvent, dayNumber: number) => {
    e.preventDefault()

    if (isSunday(dayNumber)) {
      toast({
        title: "Cannot Modify Sundays",
        description: "Sundays are permanently marked as unavailable.",
        variant: "destructive",
      })
      return
    }

    const dateString = formatDateString(dayNumber)
    setDateToMarkUnavailable(dateString)
    setShowUnavailableDialog(true)
  }

  const markDateUnavailable = async () => {
    if (!dateToMarkUnavailable) return

    try {
      const [year, month] = dateToMarkUnavailable.split("-")
      const calendarRef = doc(db, "calendar", `${year}-${month}`)

      const updatedCalendarData = {
        ...bookingData,
        [dateToMarkUnavailable]: {
          bookings: bookingData[dateToMarkUnavailable]?.bookings || 0,
          isUnavailable: true,
        },
      }

      await setDoc(calendarRef, updatedCalendarData)
      setBookingData(updatedCalendarData)

      toast({
        title: "Success",
        description: "Date marked as unavailable",
        variant: "default",
      })

      setShowUnavailableDialog(false)
      setDateToMarkUnavailable(null)
      await fetchMonthBookings()
    } catch (error) {
      console.error("Error marking date as unavailable:", error)
      toast({
        title: "Error",
        description: "Failed to mark date as unavailable",
        variant: "destructive",
      })
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
    return "text-gray-500" // Changed from "text-blue-500" to "text-gray-500" for dates with no bookings
  }

  const getDateBgColor = (dayNumber: number, isCurrentMonth: boolean): string => {
    if (!isCurrentMonth) return ""
    if (isSunday(dayNumber)) return "bg-gray-200"

    const dateString = formatDateString(dayNumber)
    const dayData = bookingData[dateString]

    if (dayData?.isUnavailable) return "bg-gray-200"
    if (dayData?.bookings >= 4) return "bg-red-100"
    if (dayData?.bookings >= 2) return "bg-orange-100"
    if (dayData?.bookings >= 1) return "bg-blue-100"
    return ""
  }

  const getBookingIndicator = (dayNumber: number, isCurrentMonth: boolean): React.ReactNode => {
    return null // Remove all booking indicators from dates
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const goToPreviousYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))
    setSelectedDate(null)
  }

  const goToNextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
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

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="text-xl font-semibold text-[#2a69ac] mb-4">Reservation Calendar</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousYear}
              className="hover:bg-gray-100"
              title="Previous Year"
            >
              <div className="flex">
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-2" />
              </div>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="hover:bg-gray-100"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <h4 className="font-medium">{formatMonth(currentDate)}</h4>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="hover:bg-gray-100"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextYear} className="hover:bg-gray-100" title="Next Year">
              <div className="flex">
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-2" />
              </div>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500">
          {days.map((day) => (
            <div key={day} className="py-1">
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

              if (!isCurrentMonth) return <div key={i} className="p-2" />

              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(dayNumber)}
                  onContextMenu={(e) => handleDateRightClick(e, dayNumber)}
                  disabled={isUnavailable}
                  className={cn(
                    "p-2 rounded-lg font-medium transition-colors relative",
                    getDateColor(dayNumber, isCurrentMonth),
                    getDateBgColor(dayNumber, isCurrentMonth),
                    !isUnavailable && "hover:bg-gray-100",
                    isUnavailable && "cursor-not-allowed",
                    "h-12", // Fixed height for consistency
                  )}
                >
                  {dayNumber}
                  {isTodayDate && (
                    <div
                      className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"
                      title="Today"
                    ></div>
                  )}
                  {getBookingIndicator(dayNumber, isCurrentMonth)}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-blue-100 mr-1"></div>
              <span>1 booking</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-orange-100 mr-1"></div>
              <span>2-3 bookings</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-red-100 mr-1"></div>
              <span>4+ bookings</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showBookingsDialog} onOpenChange={setShowBookingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {/* Update the dialog that shows bookings for a selected date */}
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
                      {/* Update the booking details display */}
                      <div className="text-sm text-[#1A365D] truncate overflow-hidden" title={booking.id}>
                        #{booking.id}
                      </div>

                      <div className="text-sm font-medium text-gray-500">Customer:</div>
                      <div className="text-sm text-[#1A365D] uppercase">{booking.customerName}</div>

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
                            statusStyles[booking.status]?.text || "text-gray-500",
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

      <AlertDialog open={showUnavailableDialog} onOpenChange={setShowUnavailableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Date as Unavailable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {dateToMarkUnavailable} as unavailable for booking? This will prevent
              customers from making new reservations on this date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => setShowUnavailableDialog(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={markDateUnavailable} className="bg-blue-600 hover:bg-blue-700">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

