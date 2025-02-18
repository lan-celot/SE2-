"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const services = [
  { id: "paint_jobs", label: "PAINT JOBS" },
  { id: "brake_shoes_clean", label: "BRAKE SHOES CLEAN" },
  { id: "engine_overhaul", label: "ENGINE OVERHAUL" },
  { id: "suspension_systems", label: "SUSPENSION SYSTEMS" },
  { id: "brake_shoes_replace", label: "BRAKE SHOES REPLACE" },
  { id: "brake_clean", label: "BRAKE CLEAN" },
  { id: "engine_tuning", label: "ENGINE TUNING" },
  { id: "air_conditioning", label: "AIR CONDITIONING" },
  { id: "brake_replace", label: "BRAKE REPLACE" },
  { id: "oil_change", label: "OIL CHANGE" },
]

const mechanics = [
  "MARCIAL TAMONDONG",
  "NOR TAMONDONG",
  "DONOVAN MITCHELL",
  "ANTHONY EDWARDS",
  "LUKA DONCIC",
  "MANU GINOBILI",
  "TIM DUNCAN",
  "RAY ALLEN",
  "KOBE BRYANT",
  "STEPHEN CURRY",
]

const reservations = [
  { id: "#R00100", customer: "ANDREA SALAZAR", car: "HONDA CIVIC" },
  { id: "#R00099", customer: "BLAINE RAMOS", car: "FORD RAPTOR" },
  { id: "#R00098", customer: "LEO MACAYA", car: "TOYOTA VIOS" },
]

export default function AddTransactionPage() {
  const router = useRouter()
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [formData, setFormData] = useState({
    reservationId: "",
    mechanic: "",
    price: "",
    quantity: "",
    discount: "",
  })

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleConfirm = () => {
    // Add transaction logic here
    router.push("/transactions")
  }

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Add a Transaction" />
        </div>

        <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-2xl font-semibold text-[#1A365D]">Transaction Details</h2>

          <div className="grid gap-6">
            <div className="grid gap-4">
              <Select
                value={formData.reservationId}
                onValueChange={(value) => handleInputChange("reservationId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reservation ID" />
                </SelectTrigger>
                <SelectContent>
                  {reservations.map((reservation) => (
                    <SelectItem key={reservation.id} value={reservation.id}>
                      {`${reservation.id} - ${reservation.customer} (${reservation.car})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={formData.mechanic} onValueChange={(value) => handleInputChange("mechanic", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Mechanics" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic} value={mechanic}>
                      {mechanic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-4">
                <label className="text-sm text-gray-500">Services</label>
                <div className="grid grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <label
                        htmlFor={service.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {service.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Input
                type="text"
                placeholder="Price (₱0,000.00)"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-6">
                <Input
                  type="number"
                  placeholder="Quantity (x1)"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  min="1"
                />
                <Input
                  type="number"
                  placeholder="Discount (0%)"
                  value={formData.discount}
                  onChange={(e) => handleInputChange("discount", e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button
                onClick={() => router.push("/transactions")}
                variant="outline"
                className="bg-white hover:bg-gray-100"
              >
                Back
              </Button>
              <Button onClick={handleConfirm} className="bg-[#1A365D] hover:bg-[#1E4E8C]">
                Confirm Transaction
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

