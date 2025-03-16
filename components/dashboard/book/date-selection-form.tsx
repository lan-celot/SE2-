"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

  const handleSubmit = () => {
    if (selectedDate) {
      // Format date as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      onSubmit({
        reservationDate: formattedDate,
      })
    }
  }

  return (
    <div className="space-y-6">
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
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber)
            const isCurrentMonth = dayNumber > 0 && dayNumber <= getDaysInMonth(currentDate)
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

            if (!isCurrentMonth) return <div key={i} className="p-2" />

            return (
              <button
                key={i}
                disabled={isPast}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "p-2 rounded-lg font-medium transition-colors",
                  isSelected && "bg-[#1e4e8c] text-white",
                  !isSelected && !isPast && "text-gray-900 hover:bg-gray-100",
                  isPast && "text-gray-400 cursor-not-allowed",
                )}
              >
                {dayNumber}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="border-[#1e4e8c] text-[#1e4e8c]">
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={!selectedDate} className="bg-[#1e4e8c] text-white">
          Proceed
        </Button>
      </div>
    </div>  
  )
}