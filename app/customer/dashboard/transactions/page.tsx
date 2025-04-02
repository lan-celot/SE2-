"use client"

import { useState } from "react"
import { TransactionsTable } from "@/components/customer-components/dashboard/transactions/table"
import { Search } from "@/components/customer-components/dashboard/transactions/search"

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-[#1A365D] mb-6">Transactions</h1>
      <Search onSearch={setSearchQuery} />
      <TransactionsTable searchQuery={searchQuery} />
    </div>
  )
}

