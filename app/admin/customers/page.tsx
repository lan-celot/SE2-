"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/admin-components/header"
import { Sidebar } from "@/components/admin-components/sidebar"
import { CustomersTable } from "./customers-table"

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Customers" />
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <CustomersTable 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
          />
        </div>
      </main>
    </div>
  )
}