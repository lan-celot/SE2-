"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title?: string
}

export function DashboardHeader({ title }: HeaderProps) {
  const [notifications, setNotifications] = useState([
    "Car is now ready for pick up",
    "Reservation status updated",
    "Reservation status updated",
    "Reservation status updated",
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const getDayName = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date).toUpperCase()
  }

  const handleMarkAsRead = () => {
    setNotifications([])
    setShowNotifications(false)
  }

  return (
    <header className="bg-[#EBF8FF]">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {title || (
            <>
              Welcome back, <span className="text-[#2a69ac]">Andrea</span>
            </>
          )}
        </h1>

        <div className="flex items-center gap-4">
          <div className="text-gray-600 font-medium">
            {formatDate(currentDate)} {getDayName(currentDate)}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <Bell className="h-6 w-6" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {notifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAsRead}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                          <div
                            key={index}
                            className="p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            {notification}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-2">No new notifications</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-8 w-8 rounded-full overflow-hidden">
            <Image
              src="/placeholder.svg"
              alt="User avatar"
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

