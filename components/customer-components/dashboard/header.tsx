"use client"

import { useState, useEffect } from "react"
import { Bell, User as LucideUser } from "lucide-react"
import { Button } from "@/components/customer-components/ui/button"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"
import Cookies from "js-cookie"

interface HeaderProps {
  title?: string
}

interface UserData {
  firstName: string;
  photoURL?: string;
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
  const [userFirstName, setUserFirstName] = useState<string | null>(null)
  const [user, setUser] = useState<UserData>({
    firstName: "",
    photoURL: ""
  })
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastPhotoURL, setLastPhotoURL] = useState<string | null>(null) // Track last known photo URL

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // First try to get user data from sessionStorage for immediate rendering
    const cachedUserData = sessionStorage.getItem('userData')
    if (cachedUserData) {
      try {
        const parsedData = JSON.parse(cachedUserData)
        setUser(parsedData)
        setUserFirstName(parsedData.firstName)
        setLastPhotoURL(parsedData.photoURL || null)
        // Don't set isLoading=false yet to allow fresh data to load
      } catch (e) {
        console.error("Failed to parse cached user data", e)
      }
    }

    // Get firstName from cookies
    const firstName = Cookies.get("userFirstName")
    if (firstName) {
      setUserFirstName(firstName)
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setFirebaseUser(authUser)
        const userDocRef = doc(db, "accounts", authUser.uid)
        
        try {
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData
            setUser(userData)
            setUserFirstName(userData.firstName)
            setLastPhotoURL(userData.photoURL || null)
            
            // Save to cookies for future use
            if (userData.firstName) {
              Cookies.set("userFirstName", userData.firstName, { expires: 7 })
            }
            
            // Cache in sessionStorage for faster loading
            sessionStorage.setItem('userData', JSON.stringify(userData))
          } else {
            console.log("User document not found in Firestore")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setUserFirstName(null)
        setLastPhotoURL(null)
        sessionStorage.removeItem('userData')
        setIsLoading(false)
      }
    })

    // Set up listeners for profile photo updates
    const handleProfilePhotoUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.photoURL) {
        setUser((prev) => ({ ...prev, photoURL: event.detail.photoURL }))
        setLastPhotoURL(event.detail.photoURL)
        
        // Update cached data
        try {
          const cachedData = sessionStorage.getItem('userData')
          if (cachedData) {
            const parsedData = JSON.parse(cachedData)
            parsedData.photoURL = event.detail.photoURL
            sessionStorage.setItem('userData', JSON.stringify(parsedData))
          }
        } catch (e) {
          console.error("Failed to update cached user data", e)
        }
      }
    }

    // Add typed event listener for the profile photo updates
    window.addEventListener("profilePhotoUpdated", handleProfilePhotoUpdate as EventListener)

    return () => {
      unsubscribe()
      window.removeEventListener("profilePhotoUpdated", handleProfilePhotoUpdate as EventListener)
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

  const handleMarkAsRead = () => {
    setNotifications([])
    setShowNotifications(false)
  }

  if (isLoading && !lastPhotoURL) {
    return (
      <header className="bg-[#EBF8FF]">
        <div className="flex justify-between items-center px-6 py-4 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-[#EBF8FF]">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {title || (
            <>
              Welcome back, <span className="text-[#2a69ac]">{userFirstName || "User"}</span>
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

          <div key={user.photoURL || 'default'} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-[#3579b8]/20">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            ) : (
              <LucideUser className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}