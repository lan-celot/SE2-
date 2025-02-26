"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

export function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [unavailableDates, setUnavailableDates] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("unavailableDates") || "{}")
      } catch (error) {
        console.error("Error parsing unavailable dates from localStorage", error)
        return {}
      }
    }
    return {}
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("unavailableDates", JSON.stringify(unavailableDates))
    }
  }, [unavailableDates])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
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

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${month + 1}-${day}`
  }

  const toggleUnavailable = (day: number) => {
    const key = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
    setUnavailableDates((prev) => {
      const newState = { ...prev }
      if (newState[key]) {
        delete newState[key] // Remove from unavailable dates
      } else {
        newState[key] = true // Mark as unavailable
      }
      return newState
    })
  }

  const toggleSelected = (day: number) => {
    const key = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate((prev) => (prev === key ? null : key))
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
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-sm">
          {Array.from({ length: 42 }).map((_, i) => {
            const dayNumber = i - getFirstDayOfMonth(currentDate) + 1
            const isCurrentMonth = dayNumber > 0 && dayNumber <= getDaysInMonth(currentDate)
            const key = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), dayNumber)
            const isUnavailable = unavailableDates[key]
            const isSelected = selectedDate === key

            if (!isCurrentMonth) return <div key={i} className="p-2" />

            return (
              <button
                key={i}
                onClick={() => toggleSelected(dayNumber)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  toggleUnavailable(dayNumber)
                }}
                className={cn(
                  "p-2 rounded-lg font-medium transition-colors",
                  isUnavailable ? "bg-gray-400 text-gray-600" : "",
                  isSelected ? "bg-blue-400 text-white" : "text-gray-900 hover:bg-blue-200"
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
