"use client"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "terminated", label: "Terminated" },
]

interface EmployeesTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function EmployeesTabs({ activeTab, onTabChange }: EmployeesTabsProps) {
  return (
    <nav className="flex space-x-2 md:space-x-4 lg:space-x-8 overflow-x-auto border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "whitespace-nowrap py-3 px-1 font-medium text-xs sm:text-sm relative",
            activeTab === tab.id ? "text-[#2a69ac]" : "text-gray-500 hover:text-gray-700",
          )}
        >
          {tab.label}
          {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2a69ac]" />}
        </button>
      ))}
    </nav>
  )
}

