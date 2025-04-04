"use client"

import Link from "next/link"
import { Home, ClipboardList, BarChart2, Users, LogOut, Receipt, UserCog } from "lucide-react"
import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/admin-components/dialog"
import { Button } from "@/components/admin-components/button"
import Cookies from "js-cookie"

export function Sidebar() {
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
          Cookies.remove("userFirstName")

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
    <aside className="fixed left-0 top-0 z-40 h-screen w-65 bg-[#1A365D] text-white flex flex-col">
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
        <Link href="/admin/dashboard" className="flex flex-col items-start gap-2">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/marnor_logooo-i719G89p6MTFfgH5UIC2R69vG0Fkfs.svg"
            alt="MAR & NOR AUTO REPAIR Logo"
            width={35}
            height={27}
            className="h-auto w-auto"
          />
          <h1 className="text-lg font-bold text-[#EBF8FF] whitespace-nowrap">MAR & NOR AUTO REPAIR</h1>
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold text-[#8B909A] uppercase mb-2">MAIN MENU</p>
          <NavLink href="/admin/dashboard" icon={Home} label="Dashboard" />
          <NavLink href="/admin/reservations" icon={ClipboardList} label="Reservations" />
          <NavLink href="/admin/transactions" icon={Receipt} label="Transactions" />
          <NavLink href="/admin/sales" icon={BarChart2} label="Sales" />
        </div>

        <div className="space-y-1 mt-8">
          <p className="px-2 text-xs font-semibold text-[#8B909A] uppercase mb-2">USER</p>
          <NavLink href="/admin/employees" icon={UserCog} label="Employees" />
          <NavLink href="/admin/customers" icon={Users} label="Customers" />
          <button
            onClick={() => setLogoutDialogOpen(true)}
            className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg text-[#8B909A] hover:text-white hover:bg-white/5 w-full text-left"
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
    </aside>
  )
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-2 py-2 text-sm rounded-lg",
        isActive ? "bg-[#EBF8FF] text-[#1A365D] font-bold" : "text-[#8B909A] hover:text-white hover:bg-white/5",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  )
}

