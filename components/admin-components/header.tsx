"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import Cookies from "js-cookie"
import { NotificationAPIProvider, NotificationPopup } from "@notificationapi/react"
import { Bell } from "lucide-react"

interface HeaderProps {
  title?: string
}

export function DashboardHeader({ title }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [userFirstName, setUserFirstName] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const firstName = Cookies.get("userFirstName")
    if (firstName) {
      setUserFirstName(firstName)
    }
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

  // Ensure client ID isn't empty
  const clientId = process.env.NEXT_PUBLIC_NOTIFICATION_CLIENT_ID || ""

  return (
    <header className="bg-[#EBF8FF] pt-1">
      <div className="flex justify-between items-center px-6 py-2">
        <h1 className="text-2xl font-semibold text-[#1A365D]">
          {title || (
            <>
              Welcome back, <span className="text-[#2a69ac]">{userFirstName || "Marcial"}</span>
            </>
          )}
        </h1>

        <div className="flex items-center gap-4">
          <div className="text-gray-600 font-medium">
            {formatDate(currentDate)} {getDayName(currentDate)}
          </div>

          <div className="relative">
            {clientId ? (
              <NotificationAPIProvider userId="admin1" clientId={clientId}>
                <NotificationPopup />
              </NotificationAPIProvider>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                <Bell className="h-4 w-4 text-gray-400" /> {/* Use the Bell icon here */}
              </div>
            )}
          </div>

          <div className="h-8 w-8 rounded-full overflow-hidden">
            <Link href="/employees/e00001">
              <Image
                src="https://i.pravatar.cc/32?u=marcial"
                alt="Marcial Tamondong"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
