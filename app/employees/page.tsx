"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmployeesTable } from "./employees-table"
import { useRouter } from "next/navigation"
import { EmployeesTabs } from "./employees-tabs"
// Remove the Loading import since it's not used in this file
// import Loading from "@/components/loading"

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Employee Management" />
        </div>

        <div className="mb-4">
          <EmployeesTabs activeTab={activeTab} onTabChange={setActiveTab} />
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
          <Button onClick={() => router.push("/employees/add")} className="bg-[#2A69AC] hover:bg-[#1A365D] text-white">
            Add Employee
          </Button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <EmployeesTable searchQuery={searchQuery} activeTab={activeTab} />
        </div>
      </main>
    </div>
  )
}

