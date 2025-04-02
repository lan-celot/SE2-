"use client"

import type React from "react"
import { Sidebar } from "@/components/admin-components/sidebar"
import { DashboardHeader } from "@/components/admin-components/header"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function DashboardLayout({ children, className, title }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="w-full ml-0 md:ml-64 flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-4">
          <DashboardHeader title={title} />
        </div>
        {children}
      </main>
    </div>
  )
}

