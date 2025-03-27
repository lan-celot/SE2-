// File: app/transactions/page.tsx

"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

// Use dynamic import with no SSR to avoid localStorage issues
const TransactionsTable = dynamic(
  () => import("@/app/transactions/TransactionsTable"),
  { ssr: false }
)

interface Transaction {
  id: string
  reservationId: string
  customerName: string
  customerId: string
  carModel: string
  reservationDate: string
  completionDate: string
  totalPrice: number
  services: {
    service: string
    mechanic: string
    price: number
    quantity: number
    discount: number
    total: number
  }[]
  carDetails?: {
    yearModel: string
    transmission: string
    fuelType: string
    odometer: string
    plateNo: string
  }
  createdAt: Date
  amountTendered?: number
}

export type { Transaction }

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Transactions" />
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by ID, name, car model, date..."
              className="pl-10 bg-white w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => router.push("/transactions/add")} className="bg-[#2A69AC] hover:bg-[#1A365D] text-white">
            Add New Transaction
          </Button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <TransactionsTable searchQuery={searchQuery} />
        </div>
      </main>
    </div>
  )
}