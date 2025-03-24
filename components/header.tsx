"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NotificationAPIProvider, NotificationPopup } from '@notificationapi/react';

interface HeaderProps {
  title?: string
}

export function DashboardHeader({ title }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true) // Set true when component mounts in browser

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

  return (
    <header className="bg-[#EBF8FF] pt-1">
      <div className="flex justify-between items-center px-6 py-2">
        <h1 className="text-2xl font-semibold text-[#1A365D]">
          {title || (
            <>
              Welcome back, <span className="text-[#2a69ac]">Marcial</span>
            </>
          )}
        </h1>

        <div className="flex items-center gap-4">
          <div className="text-gray-600 font-medium">
            {formatDate(currentDate)} {getDayName(currentDate)}
          </div>

          <div className="relative z-50">
            {isClient && (
              <NotificationAPIProvider
                userId="leorafael.macaya.cics@ust.edu.ph"
                clientId="owvp6sijxsgcijmqlu69gzfgcs"
              >
                <NotificationPopup />
              </NotificationAPIProvider>
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
