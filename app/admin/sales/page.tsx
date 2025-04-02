"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DashboardHeader } from "@/components/admin-components/header"
import { Sidebar } from "@/components/admin-components/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin-components/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { SalesReportTable } from "./sales-report-table"

const data = [
  { name: "Mon", value: 15000 },
  { name: "Tue", value: 20000 },
  { name: "Wed", value: 22000 },
  { name: "Thu", value: 32000 },
  { name: "Fri", value: 25000 },
  { name: "Sat", value: 35000 },
  { name: "Sun", value: 30000 },
]

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("sales")

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Sales Report" />
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("sales")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sales"
                  ? "border-[#2a69ac] text-[#2a69ac]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "report"
                  ? "border-[#2a69ac] text-[#2a69ac]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Report
            </button>
          </nav>
        </div>

        {activeTab === "sales" ? (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Total Sales</h3>
                <p className="text-[#1A365D] text-3xl font-bold">₱5,294,303.54</p>
                <p className="text-[#8B909A] text-sm">as of today</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Total Profit</h3>
                <p className="text-[#1A365D] text-3xl font-bold">₱3,200,000.54</p>
                <p className="text-[#8B909A] text-sm">as of today</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Total Expenses</h3>
                <p className="text-[#1A365D] text-3xl font-bold">₱2,094,303.00</p>
                <p className="text-[#8B909A] text-sm">as of today</p>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[#2A69AC] text-2xl font-semibold">Sales</h3>
                <Select defaultValue="daily">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">DAILY</SelectItem>
                    <SelectItem value="weekly">WEEKLY</SelectItem>
                    <SelectItem value="monthly">MONTHLY</SelectItem>
                    <SelectItem value="yearly">YEARLY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                    <Line type="monotone" dataKey="value" stroke="#0F60FF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Daily Sales</h3>
                <p className="text-[#1A365D] text-3xl font-bold mb-4">₱26,281.12</p>
                <div className="flex items-center justify-between text-[#8B909A]">
                  <button className="hover:text-[#1A365D]">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">TODAY</span>
                  <button className="hover:text-[#1A365D]">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Weekly Sales</h3>
                <p className="text-[#1A365D] text-3xl font-bold mb-4">₱283,129.23</p>
                <div className="flex items-center justify-between text-[#8B909A]">
                  <button className="hover:text-[#1A365D]">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">THIS WEEK</span>
                  <button className="hover:text-[#1A365D]">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#2A69AC] text-2xl font-semibold mb-2">Yearly Sales</h3>
                <p className="text-[#1A365D] text-3xl font-bold mb-4">₱1,526,291.32</p>
                <div className="flex items-center justify-between text-[#8B909A]">
                  <button className="hover:text-[#1A365D]">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">THIS YEAR</span>
                  <button className="hover:text-[#1A365D]">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <SalesReportTable />
        )}
      </main>
    </div>
  )
}

