"use client"

import { cn } from "@/lib/utils"

const tabs = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "repairing", label: "Repairing" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
]

interface ReservationsTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function ReservationsTabs({ activeTab, onTabChange }: ReservationsTabsProps) {
  return (
    <nav className="flex space-x-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
            activeTab === tab.id
              ? "border-[#2a69ac] text-[#2a69ac]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

