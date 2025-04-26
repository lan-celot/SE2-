"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/customer-components/ui/button"
import { cn } from "@/lib/utils"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

interface DateSelectionFormProps {
  initialData: any
  onSubmit: (data: any) => void
  onBack: () => void
}

export function DateSelectionForm({ initialData, onSubmit, onBack }: DateSelectionFormProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialData.reservationDate ? new Date(initialData.reservationDate) : null,
  )
  const [bookingData, setBookingData] = useState<Record<string, number>>({})
  const [fullBookedDate, setFullBookedDate] = useState<string | null>(null)
  const today = new Date()

  useEffect(() => {
    fetchMonthBookings()
  }, [currentDate])

  // ======= Helpers =======
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const formatMonth = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date)

  const formatDateString = (dayNumber: number) => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(dayNumber).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatFullDate = (iso: string) => {
    const d = new Date(iso)
    return new Intl.DateTimeFormat("en-US", { month: '2-digit', day: '2-digit', year: 'numeric' }).format(d)
  }

  const isPast = (date: Date) => date < new Date(new Date().setHours(0,0,0,0))

  // ======= Fetch counts =======
  const fetchMonthBookings = async () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDayStr = new Date(year, month, 1).toISOString().split('T')[0]
    const lastDayStr = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const q = query(
      collection(db, 'bookings'),
      where('reservationDate', '>=', firstDayStr),
      where('reservationDate', '<=', lastDayStr)
    )
    const snapshot = await getDocs(q)
    const counts: Record<string, number> = {}
    snapshot.forEach(doc => {
      const dateStr = doc.data().reservationDate as string
      counts[dateStr] = (counts[dateStr] || 0) + 1
    })
    setBookingData(counts)
  }

  // ======= Color logic =======
  const getDateColor = (dayNumber: number, isCurrentMonth: boolean): string => {
    if (!isCurrentMonth) return 'text-gray-300'
    const dateStr = formatDateString(dayNumber)
    const count = bookingData[dateStr] || 0
    if (count >= 5) return 'bg-red-100 text-red-500'
    if (count >= 2) return 'bg-orange-100 text-orange-500'
    if (count >= 1) return 'bg-blue-100 text-blue-500'
    return 'bg-white text-gray-900 hover:bg-gray-100'
  }

  // ======= Navigation =======
  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  // ======= Submit =======
  const handleSubmit = () => {
    if (selectedDate) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      onSubmit({ reservationDate: `${year}-${month}-${day}` })
    }
  }

  // ======= Handle date clicks =======
  const onDateClick = (date: Date, count: number) => {
    if (count >= 5) {
      setFullBookedDate(formatDateString(date.getDate()))
      return
    }
    if (!isPast(date)) {
      setSelectedDate(date)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h4 className="font-medium">{formatMonth(currentDate)}</h4>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500">
            {days.map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-sm">
            {Array.from({ length: 42 }).map((_, i) => {
              const dayNumber = i - getFirstDayOfMonth(currentDate) + 1
              const isCurrentMonth = dayNumber > 0 && dayNumber <= getDaysInMonth(currentDate)
              if (!isCurrentMonth) return <div key={i} className="p-2" />

              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber)
              const past = isPast(date)
              const dateStr = formatDateString(dayNumber)
              const count = bookingData[dateStr] || 0
              const isFullyBooked = count >= 5
              const isSelected = selectedDate?.toDateString() === date.toDateString()

              return (
                <button
                  key={i}
                  disabled={past}
                  onClick={() => onDateClick(date, count)}
                  className={cn(
                    "p-2 rounded-lg font-medium transition-colors h-10",
                    isSelected
                      ? "bg-blue-500 text-white"
                      : getDateColor(dayNumber, isCurrentMonth),
                    past && 'cursor-not-allowed text-gray-400'
                  )}
                >
                  {dayNumber}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={handleSubmit} disabled={!selectedDate}>Proceed</Button>
        </div>

        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-white border border-gray-300 mr-1"></div><span>No bookings</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-blue-100 mr-1"></div><span>1 booking</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-orange-100 mr-1"></div><span>2-4 bookings</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-red-100 mr-1"></div><span>Fully booked</span>
          </div>
        </div>
      </div>

      {/* Full booked modal */}
      {fullBookedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h3 className="text-center text-lg font-semibold mb-4">{formatFullDate(fullBookedDate)}</h3>
            <p className="text-center mb-6">
              This date is fully booked. Select another available date or for any inquiries,
              please contact <strong>+632 897 5973</strong> or <strong>mar&nor.autorepair@gmail.com</strong>.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => setFullBookedDate(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
