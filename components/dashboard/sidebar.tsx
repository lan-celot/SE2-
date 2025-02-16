"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, CalendarRange, Receipt, Car, UserCircle, LogOut } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Reservations",
    href: "/dashboard/reservations",
    icon: CalendarRange,
  },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: Receipt,
  },
  {
    name: "Book",
    href: "/dashboard/book",
    icon: Car,
  },
]

const userNavigation = [
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
  {
    name: "Logout",
    href: "/login",
    icon: LogOut,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-[#1A365D] text-white flex flex-col">
      <div className="p-6">
        <Link href="/logged-in" className="flex flex-col items-start gap-2">
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
        </div>
      </div>
    </div>
  )
}

