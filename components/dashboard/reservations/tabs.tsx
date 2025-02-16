"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "repairing", label: "Repairing" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
]

export function ReservationsTabs() {
  const [activeTab, setActiveTab] = useState("all")

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              // Emit custom event for table filtering
              window.dispatchEvent(
                new CustomEvent("filterStatus", {
                  detail: tab.id === "all" ? null : tab.id.toUpperCase(),
                }),
              )
            }}
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
    </div>
  )
}

