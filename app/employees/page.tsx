"use client"

import { Search } from "lucide-react"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmployeesTable } from "./employees-table"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Employee Management" />
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by name, role, ID..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-[#1A365D] hover:bg-[#1E4E8C]" onClick={() => router.push("/employees/add")}>
            Add Employee
          </Button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <EmployeesTable searchQuery={searchQuery} />
        </div>
      </main>
    </div>
  )
}

