"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar"
import { Search } from "lucide-react"
import TransactionsTable from "./TransactionsTable"
import { Button } from "@/components/ui/button"

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Transactions" className="text-[#1A365D]" />
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by ID, name, car model, date..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-[#2A69AC] hover:bg-[#1A365D] text-white text-sm font-medium px-4 py-2 rounded-md" onClick={() => router.push("/transactions/add")}>
            Add Transaction
          </Button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <TransactionsTable searchQuery={searchQuery} />
        </div>
      </main>
    </div>
  )
}

