import { DashboardSidebar } from "@/components/customer-components/dashboard/sidebar"
import { DashboardHeader } from "@/components/customer-components/dashboard/header"
import type React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-[#ebf8ff]">
      <DashboardSidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

