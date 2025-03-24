"use client"

import Link from "next/link"
import { Home, ClipboardList, BarChart2, Users, LogOut, Receipt, UserCog } from "lucide-react"
import type React from "react" // Import React
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { toast } from "@/components/ui/use-toast"

export function Sidebar() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth)

      // Show success toast
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "default"
      })

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      // Handle any logout errors
      console.error("Logout error:", error)
      toast({
        title: "Logout Error",
        description: "An error occurred while logging out.",
        variant: "destructive"
      })
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#1A365D] text-white flex flex-col">
      <div className="p-6">
        <Link href="/" className="flex flex-col items-start gap-2">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/marnor_logooo-i719G89p6MTFfgH5UIC2R69vG0Fkfs.svg"
            alt="MAR & NOR AUTO REPAIR Logo"
            width={35}
            height={27}
            className="h-auto w-auto"
          />
          <h1 className="text-lg font-bold text-[#EBF8FF]">MAR & NOR AUTO REPAIR</h1>
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-4 py-6">
        <div className="space-y-1">
          <p className="px-2 text-xs font-semibold text-[#8B909A] uppercase mb-2">MAIN MENU</p>
          <NavLink href="/dashboard" icon={Home} label="Dashboard" />
          <NavLink href="/reservations" icon={ClipboardList} label="Reservations" />
          <NavLink href="/transactions" icon={Receipt} label="Transactions" />
          <NavLink href="/sales" icon={BarChart2} label="Sales" />
        </div>

        <div className="space-y-1 mt-8">
          <p className="px-2 text-xs font-semibold text-[#8B909A] uppercase mb-2">USER</p>
          <NavLink href="/employees" icon={UserCog} label="Employees" />
          <NavLink href="/customers" icon={Users} label="Customers" />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg text-[#8B909A] hover:text-white hover:bg-white/5 w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
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