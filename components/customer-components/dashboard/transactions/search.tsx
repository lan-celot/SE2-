"use client"

import { SearchIcon } from "lucide-react"
import { Input } from "@/components/customer-components/ui/input"

interface SearchProps {
  onSearch: (query: string) => void
}

export function Search({ onSearch }: SearchProps) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="search"
        placeholder="Search by ID, car model, dates..."
        className="pl-10 bg-white"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  )
}

