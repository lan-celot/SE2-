"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, CalendarRange, Receipt, Car, UserCircle, LogOut } from "lucide-react"
import Cookies from "js-cookie"
import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Button } from "@/components/customer-components/ui/button"

const navigation = [
  {
    name: "Dashboard",
    href: "/customer/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Reservations",
    href: "/customer/dashboard/reservations",
    icon: CalendarRange,
  },
  {
    name: "Transactions",
    href: "/customer/dashboard/transactions",
    icon: Receipt,
  },
  {
    name: "Book",
    href: "/customer/dashboard/book",
    icon: Car,
  },
]

const userNavigation = [
  {
    name: "Profile",
    href: "/customer/dashboard/profile",
    icon: UserCircle,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleLogout = async () => {
    try {
      // Close the dialog
      setLogoutDialogOpen(false)

      // Show notification
      setNotification({
        type: "error",
        message: "Logging you out...",
      })

      // Delay the actual logout by 2 seconds
      setTimeout(async () => {
        try {
          // Get current user email before signing out
          const userEmail = auth.currentUser?.email || "Unknown user"

          // Sign out from Firebase
          await signOut(auth)

          // Clear all authentication cookies
          Cookies.remove("isAuthenticated")
          Cookies.remove("userRole")
          Cookies.remove("userId")
          Cookies.remove("userName")

          // Show success toast
          toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
            variant: "default",
          })

          // Redirect to the home page
          router.push("/")
        } catch (error) {
          // Handle any logout errors
          console.error("Logout error:", error)
          toast({
            title: "Logout Error",
            description: "An error occurred while logging out.",
            variant: "destructive",
          })
        }
      }, 2000)
    } catch (error) {
      console.error("Error in logout process:", error)
    }
  }

  return (
    <div className="w-64 bg-[#1A365D] text-white flex flex-col">
      {/* Fixed position notification container that's always present but only visible when needed */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div
          className={`px-6 py-2 rounded-full shadow-md transition-opacity duration-300 ${
            notification ? "opacity-100" : "opacity-0"
          } ${notification?.type === "success" ? "bg-[#E6FFF3] text-[#28C76F]" : "bg-[#FFE6E6] text-[#EA5455]"}`}
          style={{
            transform: "translateY(0)",
            animation: notification ? "slideInFromTop 0.3s ease-out forwards" : "none",
            minWidth: "200px",
            textAlign: "center",
          }}
        >
          {notification?.message || ""}
        </div>
      </div>

      <div className="p-6">
        <Link href="/customer/logged-in" className="flex flex-col items-start gap-2">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IvHIqsnbZo32MpjL3mD01Urzi5xkwE.svg"
            alt="MAR & NOR AUTO REPAIR"
            width={41}
            height={25}
            className="h-6 w-auto"
          />
          <span className="font-bold text-[#EBF8FF] whitespace-nowrap">MAR & NOR AUTO REPAIR</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold text-[#8B909A] uppercase mb-2">MAIN MENU</p>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-2 py-2 text-sm rounded-lg",
                pathname === item.href
                  ? "bg-[#EBF8FF] text-[#1A365D] font-bold"
                  : "text-[#8B909A] hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="space-y-1 mt-8">
          <p className="px-2 text-xs font-semibold text-[#8B909A] uppercase mb-2">USER</p>
          {userNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-2 py-2 text-sm rounded-lg",
                pathname === item.href
                  ? "bg-[#EBF8FF] text-[#1A365D] font-bold"
                  : "text-[#8B909A] hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
          <button
            onClick={() => setLogoutDialogOpen(true)}
            className={cn(
              "flex items-center gap-2 px-2 py-2 text-sm rounded-lg w-full text-left",
              "text-[#8B909A] hover:text-white hover:bg-white/5",
            )}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogTitle className="text-center text-xl font-semibold">Are you sure?</DialogTitle>
          <div className="text-center space-y-4 py-2">
            <p className="text-gray-500">You are about to log out of the system.</p>

            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setLogoutDialogOpen(false)}
                className="bg-red-100 hover:bg-red-200 border-0 text-red-600 hover:text-red-700 min-w-[120px]"
              >
                No, go back
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-green-100 hover:bg-green-200 border-0 text-green-600 hover:text-green-700 min-w-[120px]"
              >
                Yes, logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes slideInFromTop {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
