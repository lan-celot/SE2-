"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/customer-components/ui/button"
import { cn } from "@/lib/utils"

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

export function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(7)

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
            const isSelected = dayNumber === selectedDate && isCurrentMonth
            const isReserved = [1, 2, 3, 4].includes(dayNumber) && isCurrentMonth

            if (!isCurrentMonth) return <div key={i} className="p-2" />

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dayNumber)}
                className={cn(
                  "p-2 rounded-lg font-medium transition-colors",
                  isSelected && "bg-[#2a69ac] text-white",
                  isReserved && !isSelected && "text-red-500",
                  !isReserved && !isSelected && "text-gray-900 hover:bg-gray-100",
                )}
              >
                {dayNumber}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

