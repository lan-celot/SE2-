"use client"
import { Search } from "lucide-react"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Input } from "@/components/input"
import { CustomersTable } from "./customers-table"
import { useState } from "react"

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Customers" />
        </div>

        <div className="mb-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by name, phone number, ID..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <CustomersTable searchQuery={searchQuery} />
        </div>
      </main>
    </div>
  )
}

