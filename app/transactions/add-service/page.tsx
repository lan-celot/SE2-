"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from "@/lib/firebase"
import { collection, doc, getDocs, updateDoc, arrayUnion } from "firebase/firestore"
import { toast } from "@/components/ui/use-toast"
import Loading from "@/components/loading"

interface Service {
  id: string
  label: string
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

export default function AddServicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("id")

  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customServiceName, setCustomServiceName] = useState("")
  const [formData, setFormData] = useState({
    mechanic: "",
    price: "",
    quantity: "1",
    discount: "0",
  })
  const [transaction, setTransaction] = useState<any>(null)
  const [isCustomService, setIsCustomService] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) {
        toast({
          title: "Error",
          description: "No transaction ID provided",
          variant: "destructive",
        })
        router.push("/transactions")
        return
      }

      try {
        // Get the transaction document from Firestore
        const transactionsRef = collection(db, "transactions")
        const querySnapshot = await getDocs(transactionsRef)

        // Find the transaction with the matching ID
        const transactionDoc = querySnapshot.docs.find((doc) => {
          const data = doc.data()
          return data.id === transactionId
        })

        if (!transactionDoc) {
          toast({
            title: "Error",
            description: "Transaction not found",
            variant: "destructive",
          })
          router.push("/transactions")
          return
        }

        setTransaction({
          ...transactionDoc.data(),
          docId: transactionDoc.id,
        })
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching transaction:", error)
        toast({
          title: "Error",
          description: "Failed to fetch transaction data",
          variant: "destructive",
        })
        router.push("/transactions")
      }
    }

    fetchTransaction()
  }, [transactionId, router])

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
    if (!transaction) return

    try {
      // Validate form data
      if ((!selectedServices.length && !customServiceName) || !formData.mechanic) {
        toast({
          title: "Missing Information",
          description: "Please select a service and mechanic",
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

      // Create service data
      const price = Number.parseFloat(formData.price)
      const quantity = Number.parseInt(formData.quantity || "1")
      const discount = Number.parseInt(formData.discount || "0")
      const total = price * quantity * (1 - discount / 100)

      const newServices = isCustomService
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

      // Update transaction in Firestore
      const transactionRef = doc(db, "transactions", transaction.docId)

      // Calculate new total price
      const newTotalPrice = transaction.totalPrice + newServices.reduce((sum, service) => sum + service.total, 0)

      await updateDoc(transactionRef, {
        services: arrayUnion(...newServices),
        totalPrice: newTotalPrice,
      })

      toast({
        title: "Service Added",
        description: "The service has been successfully added to the transaction",
        variant: "default",
      })

      router.push("/transactions")
    } catch (error) {
      console.error("Error adding service:", error)
      toast({
        title: "Error",
        description: "Failed to add service to transaction",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8 flex items-center justify-center">
          <Loading />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Add Service / Item" />
        </div>

        <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-2xl font-semibold text-[#1A365D]">Add to Transaction: {transaction?.id}</h2>

          <div className="mb-6">
            <p className="text-sm text-gray-500">Customer: {transaction?.customerName}</p>
            <p className="text-sm text-gray-500">Car Model: {transaction?.carModel}</p>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-4">
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
                className="bg-white hover:bg-gray-100"
              >
                Back
              </Button>
              <Button onClick={handleConfirm} className="bg-[#1A365D] hover:bg-[#1E4E8C]">
                Add to Transaction
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

