"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"

interface DayBookings {
  bookings: number;
  isUnavailable: boolean;
}

interface BookingDetails {
  id: string;
  customerName: string;
  carModel: string;
  time: string;
}

interface CalendarData {
  [date: string]: {
    bookings: number;
    isUnavailable: boolean;
  };
}

export function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [bookingData, setBookingData] = useState<CalendarData>({})
  const [showBookingsDialog, setShowBookingsDialog] = useState(false)
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false)
  const [selectedDateBookings, setSelectedDateBookings] = useState<BookingDetails[]>([])
  const [dateToMarkUnavailable, setDateToMarkUnavailable] = useState<string | null>(null)

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  useEffect(() => {
    fetchMonthBookings()
  }, [currentDate])

  const isSunday = (dayNumber: number): boolean => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      dayNumber
    );
    return date.getDay() === 0; // 0 represents Sunday
  };

  const fetchMonthBookings = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      const calendarRef = doc(db, "calendar", `${year}-${month}`)
      const calendarDoc = await getDoc(calendarRef)

      if (calendarDoc.exists()) {
        setBookingData(calendarDoc.data() as CalendarData)
        console.log("Fetched calendar data:", calendarDoc.data())
      } else {
        const newCalendarData: CalendarData = {}
        setBookingData(newCalendarData)
        await setDoc(calendarRef, newCalendarData)
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch calendar data",
        variant: "destructive",
      })
    }
  }

  const handleDateClick = async (dayNumber: number) => {
    if (isSunday(dayNumber)) {
      toast({
        title: "Not Available",
        description: "Bookings are not available on Sundays.",
        variant: "destructive",
      });
      return;
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
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("reservationDate", "==", dateString)
      )
      const snapshot = await getDocs(bookingsQuery)
      
      const bookings: BookingDetails[] = snapshot.docs.map(doc => ({
        id: doc.id,
        customerName: doc.data().customerName,
        carModel: doc.data().carModel,
        time: doc.data().time
      }))

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
      });
      return;
    }

    const dateString = formatDateString(dayNumber)
    setDateToMarkUnavailable(dateString)
    setShowUnavailableDialog(true)
  }

  const markDateUnavailable = async () => {
    if (!dateToMarkUnavailable) return

    try {
      const [year, month] = dateToMarkUnavailable.split('-')
      const calendarRef = doc(db, "calendar", `${year}-${month}`)

      const updatedCalendarData = {
        ...bookingData,
        [dateToMarkUnavailable]: {
          bookings: bookingData[dateToMarkUnavailable]?.bookings || 0,
          isUnavailable: true
        }
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
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const day = dayNumber.toString().padStart(2, '0')
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
    return "text-blue-500"
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

        <div className="grid grid-cols-7 gap-1 text-sm">
          {Array.from({ length: 42 }).map((_, i) => {
            const dayNumber = i - getFirstDayOfMonth(currentDate) + 1
            const isCurrentMonth = dayNumber > 0 && dayNumber <= getDaysInMonth(currentDate)
            const dateString = formatDateString(dayNumber)
            const isUnavailable = bookingData[dateString]?.isUnavailable || isSunday(dayNumber)

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
                  !isUnavailable && "hover:bg-gray-100",
                  isUnavailable && "bg-gray-200 cursor-not-allowed"
                )}
              >
                {dayNumber}
                {isUnavailable && (
                  <span className="absolute inset-0 bg-gray-200 opacity-50 rounded-lg" />
                )}
                {isSunday(dayNumber) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
                    
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <Dialog open={showBookingsDialog} onOpenChange={setShowBookingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bookings for {selectedDate && formatDateString(selectedDate)}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedDateBookings.length === 0 ? (
              <p>No bookings for this date.</p>
            ) : (
              <div className="space-y-2">
                {selectedDateBookings.map((booking) => (
                  <div key={booking.id} className="p-2 border rounded">
                    <p>Customer: {booking.customerName}</p>
                    <p>Car: {booking.carModel}</p>
                    <p>Time: {booking.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnavailableDialog} onOpenChange={setShowUnavailableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Date as Unavailable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {dateToMarkUnavailable} as unavailable for booking?
              This will prevent customers from making new reservations on this date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnavailableDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={markDateUnavailable}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}