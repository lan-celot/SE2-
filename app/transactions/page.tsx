"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import TransactionsTable from "./TransactionsTable"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useRouter } from "next/navigation"

// Sample transaction data
const sampleTransactions = [
  {
    id: "#T00100",
    reservationDate: "11-20-24 12:00 PM",
    customerName: "ANDREA SALAZAR",
    customerId: "#C00100",
    carModel: "HONDA CIVIC",
    completionDate: "11-21-24 3:30 PM",
    totalPrice: 15000,
    services: [
      {
        service: "PAINT JOBS",
        mechanic: "MARCIAL TAMONDONG",
        price: 10000,
        quantity: 1,
        discount: 0,
        total: 10000,
      },
      {
        service: "OIL CHANGE",
        mechanic: "STEPHEN CURRY",
        price: 5000,
        quantity: 1,
        discount: 0,
        total: 5000,
      },
    ],
  },
  {
    id: "#T00099",
    reservationDate: "11-19-24 10:30 AM",
    customerName: "BLAINE RAMOS",
    customerId: "#C00099",
    carModel: "FORD RAPTOR",
    completionDate: "11-20-24 2:00 PM",
    totalPrice: 8500,
    services: [
      {
        service: "ENGINE TUNING",
        mechanic: "TIM DUNCAN",
        price: 8500,
        quantity: 1,
        discount: 0,
        total: 8500,
      },
    ],
  },
  {
    id: "#T00098",
    reservationDate: "11-18-24 9:15 AM",
    customerName: "LEO MACAYA",
    customerId: "#C00098",
    carModel: "TOYOTA VIOS",
    completionDate: "11-19-24 11:45 AM",
    totalPrice: 12000,
    services: [
      {
        service: "BRAKE SHOES REPLACE",
        mechanic: "KOBE BRYANT",
        price: 7000,
        quantity: 1,
        discount: 0,
        total: 7000,
      },
      {
        service: "WHEEL ALIGNMENT",
        mechanic: "RAY ALLEN",
        price: 5000,
        quantity: 1,
        discount: 0,
        total: 5000,
      },
    ],
  },
  {
    id: "#T00097",
    reservationDate: "11-17-24 2:30 PM",
    customerName: "RUSS DE GUZMAN",
    customerId: "#C00097",
    carModel: "MITSUBISHI MONTERO",
    completionDate: "11-18-24 5:00 PM",
    totalPrice: 3500,
    services: [
      {
        service: "OIL CHANGE",
        mechanic: "MANU GINOBILI",
        price: 3500,
        quantity: 1,
        discount: 0,
        total: 3500,
      },
    ],
  },
  {
    id: "#T00096",
    reservationDate: "11-16-24 11:00 AM",
    customerName: "AVERILL BUENVENIDA",
    customerId: "#C00096",
    carModel: "NISSAN NAVARA",
    completionDate: "11-17-24 1:30 PM",
    totalPrice: 9500,
    services: [
      {
        service: "SUSPENSION SYSTEMS",
        mechanic: "LUKA DONCIC",
        price: 9500,
        quantity: 1,
        discount: 0,
        total: 9500,
      },
    ],
  },
  {
    id: "#T00095",
    reservationDate: "11-15-24 3:45 PM",
    customerName: "HAN BASCAO",
    customerId: "#C00095",
    carModel: "ISUZU D-MAX",
    completionDate: "11-16-24 6:15 PM",
    totalPrice: 6500,
    services: [
      {
        service: "AIR CONDITIONING",
        mechanic: "ANTHONY EDWARDS",
        price: 6500,
        quantity: 1,
        discount: 0,
        total: 6500,
      },
    ],
  },
]

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  return (
    <DashboardLayout title="Transactions">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
          Add Transaction
        </Button>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <TransactionsTable transactions={sampleTransactions} searchQuery={searchQuery} />
      </div>
    </DashboardLayout>
  )
}

