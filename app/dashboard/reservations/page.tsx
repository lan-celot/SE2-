"use client"

import { useState } from "react"
import { ReservationsTable } from "@/components/dashboard/reservations/table"
import { ReservationsTabs } from "@/components/dashboard/reservations/tabs"
import { Search } from "@/components/dashboard/reservations/search"

export default function ReservationsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-[#1A365D] mb-6">Reservations</h1>
      <ReservationsTabs />
      <Search onSearch={setSearchQuery} />
      <ReservationsTable searchQuery={searchQuery} />
    </div>
  )
}

