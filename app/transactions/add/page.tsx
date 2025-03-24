"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc } from "firebase/firestore"
import { toast } from "@/components/ui/use-toast"

// Define types for services and reservations
interface Service {
  id: string
  label: string
}

interface Reservation {
  id: string
  customer: string
  car: string
  customerId: string
}

const services: Service[] = [
  { id: "PAINT_JOBS", label: "PAINT JOBS" },
  { id: "BRAKE_SHOES_CLEAN", label: "BRAKE SHOES CLEAN" },
  { id: "ENGINE_OVERHAUL", label: "ENGINE OVERHAUL" },
  { id: "SUSPENSION_SYSTEMS", label: "SUSPENSION SYSTEMS" },
  { id: "BRAKE_SHOES_REPLACE", label: "BRAKE SHOES REPLACE" },
  { id: "BRAKE_CLEAN", label: "BRAKE CLEAN" },
  { id: "ENGINE_TUNING", label: "ENGINE TUNING" },
  { id: "AIR_CONDITIONING", label: "AIR CONDITIONING" },
  { id: "BRAKE_REPLACE", label: "BRAKE REPLACE" },
  { id: "OIL_CHANGE", label: "OIL CHANGE" },
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

export default function AddTransactionPage() {
  const router = useRouter()
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customServiceName, setCustomServiceName] = useState("")
  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "",
    carModel: "",
    mechanic: "",
    price: "",
    quantity: "1",
    discount: "0",
  })
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isCustomService, setIsCustomService] = useState(false)

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bookings"))
        const reservationsData: Reservation[] = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: data.bookingId || doc.id,
            customer: `${data.firstName || ""} ${data.lastName || ""}`,
            car: data.carModel || "",
            customerId: data.userId || "",
          }
        })
        setReservations(reservationsData)
      } catch (error) {
        console.error("Error fetching reservations:", error)
        toast({
          title: "Error",
          description: "Failed to fetch reservations data",
          variant: "destructive",
        })
      }
    }

    fetchReservations()
  }, [])

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

  const handleConfirm = async () => {
    try {
      // Validate form data
      if (!formData.customerName || !formData.carModel || (!selectedServices.length && !customServiceName)) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price",
          variant: "destructive",
        })
        return
      }

      // Create transaction data
      const price = Number.parseFloat(formData.price)
      const quantity = Number.parseInt(formData.quantity || "1")
      const discount = Number.parseInt(formData.discount || "0")
      const total = price * quantity * (1 - discount / 100)

      const servicesList = isCustomService
        ? [
            {
              service: customServiceName,
              mechanic: formData.mechanic,
              price,
              quantity,
              discount,
              total,
            },
          ]
        : selectedServices.map((serviceId) => {
            const service = services.find((s) => s.id === serviceId)
            return {
              service: service?.label || serviceId,
              mechanic: formData.mechanic,
              price,
              quantity,
              discount,
              total,
            }
          })

      const transactionData = {
        id: `T${Date.now().toString().slice(-6)}`,
        reservationDate: new Date().toLocaleString(),
        customerName: formData.customerName,
        customerId: formData.customerId || `C${Date.now().toString().slice(-6)}`,
        carModel: formData.carModel,
        completionDate: new Date().toLocaleString(),
        totalPrice: servicesList.reduce((sum, service) => sum + service.total, 0),
        services: servicesList,
      }

      // Add transaction to Firestore
      await addDoc(collection(db, "transactions"), transactionData)

      toast({
        title: "Transaction Added",
        description: "The transaction has been successfully added",
        variant: "default",
      })

      router.push("/transactions")
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      })
    }
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
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Customer Name"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  className="w-full"
                />
                <Input
                  placeholder="Customer ID (optional)"
                  value={formData.customerId}
                  onChange={(e) => handleInputChange("customerId", e.target.value)}
                  className="w-full"
                />
              </div>

              <Input
                placeholder="Car Model"
                value={formData.carModel}
                onChange={(e) => handleInputChange("carModel", e.target.value)}
                className="w-full"
              />

              <Select value={formData.mechanic} onValueChange={(value) => handleInputChange("mechanic", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Mechanic" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic} value={mechanic}>
                      {mechanic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="custom-service"
                  checked={isCustomService}
                  onCheckedChange={(checked) => setIsCustomService(!!checked)}
                />
                <label
                  htmlFor="custom-service"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Add custom service/item
                </label>
              </div>

              {isCustomService ? (
                <Input
                  placeholder="Custom Service/Item Name"
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                  className="w-full"
                />
              ) : (
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
              )}

              <div className="grid grid-cols-3 gap-4 mt-4">
                <Input
                  type="text"
                  placeholder="Price (₱0,000.00)"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Quantity (x1)"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  min="1"
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Discount (0%)"
                  value={formData.discount}
                  onChange={(e) => handleInputChange("discount", e.target.value)}
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button
                onClick={() => router.push("/transactions")}
                variant="outline"
                className="bg-white hover:bg-[#1A365D] hover:text-white"
              >
                Back
              </Button>
              <Button onClick={handleConfirm} className="bg-[#2A69AC] hover:bg-[#1A365D] text-white">
                Confirm Transaction
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

