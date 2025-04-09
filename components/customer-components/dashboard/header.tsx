"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/customer-components/ui/button"
import { db, auth } from "@/lib/firebase" // Import Firebase
import { doc, getDoc } from "firebase/firestore" // Firestore functions
import { onAuthStateChanged } from "firebase/auth" // Firebase Auth
import Cookies from "js-cookie"
import { NotificationAPIProvider, NotificationPopup } from '@notificationapi/react';

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
    // First try to get the name from cookies
    const firstName = Cookies.get("userFirstName")
    if (firstName) {
      setUserFirstName(firstName)
      return
    }

    // If not in cookies, fall back to Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "accounts", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const firstName = userDocSnap.data().firstName
          setUserFirstName(firstName)
          // Save to cookies for future use
          Cookies.set("userFirstName", firstName, { expires: 7 })
        } else {
          console.log("User document not found in Firestore")
        }
      } else {
        setUserFirstName(null)
      }
    })

    return () => unsubscribe()
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
    <header className="bg-[#EBF8FF]">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {title || (
            <>
              Welcome back, <span className="text-[#2a69ac]">{userFirstName ? userFirstName : "User"}</span>
            </>
          )}
        </h1>

        <div className="flex items-center gap-4">
          <div className="text-gray-600 font-medium">
            {formatDate(currentDate)} {getDayName(currentDate)}
          </div>

          <div className="relative">
              <NotificationAPIProvider
              userId="admin1"
              clientId="owvp6sijxsgcijmqlu69gzfgcs"
              >
              <NotificationPopup/>
              </NotificationAPIProvider>
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

