"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import useLocalStorage from "@/hooks/useLocalStorage"
import Loading from "@/components/loading"

// Define types for services and customers
interface Service {
  id: string
  label: string
}

interface Transaction {
  id: string
  reservationId: string
  customerName: string
  customerId: string
  carModel: string
  reservationDate: string
  completionDate: string
  totalPrice: number
  services: {
    service: string
    mechanic: string
    price: number
    quantity: number
    discount: number
    total: number
  }[]
  carDetails?: {
    yearModel: string
    transmission: string
    fuelType: string
    odometer: string
    plateNo: string
  }
  createdAt: Date
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

  // Update the state management section to handle multiple services
  const [serviceRows, setServiceRows] = useState([
    {
      id: "service-0",
      type: "custom", // or "general"
      mechanic: "",
      service: "",
      customService: "",
      generalService: "",
      price: "",
      rawPrice: "", // Add raw price field to store numeric value
      quantity: "",
      discount: "",
    },
  ])

  // Add helper functions for adding and removing rows
  const addServiceRow = () => {
    const newRowId = `service-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    setServiceRows([
      ...serviceRows,
      {
        id: newRowId,
        type: "custom", // default to custom
        mechanic: "",
        service: "",
        customService: "",
        generalService: "",
        price: "",
        rawPrice: "", // Add raw price field
        quantity: "",
        discount: "",
      },
    ])
  }

  const removeServiceRow = (id: string) => {
    if (serviceRows.length === 1) {
      // Don't remove if it's the only row
      return
    }
    setServiceRows(serviceRows.filter((row) => row.id !== id))
  }

  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customServiceName, setCustomServiceName] = useState("")
  const [formData, setFormData] = useState({
    mechanic: "",
    price: "",
    quantity: "",
    discount: "",
  })
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", [])
  const [isCustomService, setIsCustomService] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [duplicateErrors, setDuplicateErrors] = useState<{ [key: string]: string }>({})

  // Load transaction data based on ID from URL
  useEffect(() => {
    if (!transactionId) {
      toast({
        title: "Error",
        description: "No transaction ID provided",
        variant: "destructive",
      })
      router.push("/transactions")
      return
    }

    const foundTransaction = transactions.find((t) => t.id === transactionId)
    if (foundTransaction) {
      setTransaction(foundTransaction)
    } else {
      toast({
        title: "Error",
        description: `Transaction with ID ${transactionId} not found`,
        variant: "destructive",
      })
      router.push("/transactions")
    }

    setPageLoading(false)
  }, [transactionId, transactions, router])

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    )
  }

  // Check for duplicate services when service type or name changes
  useEffect(() => {
    if (!transaction) return

    // Clear previous errors
    const newErrors: { [key: string]: string } = {}

    // Check each row for duplicates
    serviceRows.forEach((row) => {
      let serviceName = ""

      if (row.type === "custom") {
        serviceName = row.customService.trim()
      } else if (row.type === "general") {
        serviceName = services.find((s) => s.id === row.generalService)?.label || ""
      }

      // Only check if service name is not empty
      if (serviceName) {
        // Check if this service already exists in the transaction
        const isDuplicate = transaction.services.some(
          (existingService) => existingService.service.toUpperCase() === serviceName.toUpperCase(),
        )

        if (isDuplicate) {
          newErrors[row.id] = `"${serviceName}" already exists in this transaction`
        }
      }
    })

    setDuplicateErrors(newErrors)
  }, [serviceRows, transaction])

  // Update the handleInputChange function to work with multiple rows
  const handleInputChange = (rowId: string, field: string, value: string) => {
    let formattedValue = value

    // Special handling for price field
    if (field === "price") {
      // Store the raw numeric value without formatting
      const numericValue = value.replace(/[^\d]/g, "")

      setServiceRows(
        serviceRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                rawPrice: numericValue, // Store raw numeric value
                price: numericValue ? `₱${numericValue}` : "", // Just add the peso sign for display
              }
            : row,
        ),
      )
      return
    }

    // Handle other fields (quantity, discount)
    const serviceRow = serviceRows.find((row) => row.id === rowId)
    if (!serviceRow) return

    const isBackspacing =
      (field === "quantity" && value.length < serviceRow.quantity.length) ||
      (field === "discount" && value.length < serviceRow.discount.length)

    if (field === "quantity") {
      // Special handling for backspace on quantity
      if (isBackspacing && (value === "x" || value === "")) {
        formattedValue = ""
      } else {
        formattedValue = formatQuantity(value)
      }
    } else if (field === "discount") {
      // Special handling for backspace on discount
      if (isBackspacing && (value === "%" || value === "")) {
        formattedValue = ""
      } else {
        formattedValue = formatDiscount(value)
      }
    }

    setServiceRows(
      serviceRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: formattedValue,
            }
          : row,
      ),
    )
  }

  // Format quantity with 'x' prefix
  const formatQuantity = (value: string): string => {
    // If the value is just 'x' or empty, return empty
    if (value === "x" || value === "") {
      return ""
    }

    // Remove the 'x' prefix and any non-numeric characters
    const numericValue = value.replace(/^x/, "").replace(/\D/g, "")

    // Return with 'x' prefix if there's a value
    return numericValue ? `x${numericValue}` : ""
  }

  // Format discount with '%' suffix
  const formatDiscount = (value: string): string => {
    // If the value is just '%' or empty, return empty
    if (value === "%" || value === "") {
      return ""
    }

    // Remove the '%' suffix and any non-numeric characters
    const numericValue = value.replace(/%$/, "").replace(/\D/g, "")

    // Return with '%' suffix if there's a value
    return numericValue ? `${numericValue}%` : ""
  }

  // This function is no longer needed as we handle formatting directly in the onBlur handler
  // We can remove it or keep it as a no-op for backward compatibility
  const formatPriceOnBlur = (rowId: string) => {
    // Formatting is now handled directly in the onBlur handler of the input
  }

  // Update the handleConfirm function to process multiple services
  const handleConfirm = () => {
    if (!transaction) {
      toast({
        title: "Error",
        description: "Transaction not found",
        variant: "destructive",
      })
      return
    }

    // Check for duplicate services
    const duplicates: string[] = []

    serviceRows.forEach((row) => {
      let serviceName = ""

      if (row.type === "custom") {
        serviceName = row.customService.trim()
      } else if (row.type === "general") {
        serviceName = services.find((s) => s.id === row.generalService)?.label || ""
      }

      // Only check if service name is not empty
      if (serviceName) {
        // Check if this service already exists in the transaction
        const isDuplicate = transaction.services.some(
          (existingService) => existingService.service.toUpperCase() === serviceName.toUpperCase(),
        )

        if (isDuplicate) {
          duplicates.push(serviceName)
        }
      }
    })

    // If duplicates found, show error and don't proceed
    if (duplicates.length > 0) {
      toast({
        title: "Duplicate Services",
        description: `The following services already exist in this transaction: ${duplicates.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Create service objects for each row
    const servicesToAdd = serviceRows
      .filter((row) => {
        // Skip empty rows
        const serviceValue = row.type === "custom" ? row.customService : row.generalService
        return serviceValue && row.price
      })
      .map((row) => {
        const serviceName =
          row.type === "custom"
            ? row.customService
            : services.find((s) => s.id === row.generalService)?.label || row.generalService

        // Use the raw price value for calculations, properly handling decimal values
        const price = row.rawPrice ? Number.parseFloat(row.rawPrice) : 0

        return {
          service: serviceName,
          mechanic: row.mechanic,
          price: price,
          quantity: Number.parseInt(row.quantity.replace(/x/g, "")) || 1,
          discount: Number.parseInt(row.discount.replace(/%/g, "")) || 0,
          total: 0, // Will calculate below
        }
      })

    // Calculate total for each service
    servicesToAdd.forEach((service) => {
      service.total = service.price * service.quantity * (1 - service.discount / 100)
    })

    if (servicesToAdd.length === 0) {
      toast({
        title: "No valid services",
        description: "Please add at least one service with a price",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Get existing transactions from localStorage
    const updatedTransactions = [...transactions]

    // Find the transaction in our local state
    const existingTransactionIndex = updatedTransactions.findIndex((t) => t.id === transaction.id)

    if (existingTransactionIndex >= 0) {
      // Add services to existing transaction
      updatedTransactions[existingTransactionIndex].services.push(...servicesToAdd)

      // Recalculate total price
      const subtotal = updatedTransactions[existingTransactionIndex].services.reduce(
        (sum, service) => sum + service.price * service.quantity,
        0,
      )
      const discountAmount = updatedTransactions[existingTransactionIndex].services.reduce(
        (sum, service) => sum + (service.price * service.quantity * service.discount) / 100,
        0,
      )
      updatedTransactions[existingTransactionIndex].totalPrice = subtotal - discountAmount

      // Save updated transactions to localStorage
      setTransactions(updatedTransactions)

      // Also directly update localStorage to ensure data persistence
      try {
        localStorage.setItem("transactions", JSON.stringify(updatedTransactions))
        console.log("Saved transactions to localStorage:", updatedTransactions)
      } catch (err) {
        console.error("Error saving to localStorage:", err)
      }

      toast({
        title: `${servicesToAdd.length} Service${servicesToAdd.length > 1 ? "s" : ""} Added`,
        description: `Service${servicesToAdd.length > 1 ? "s have" : " has"} been added to transaction ${transaction.id}`,
        variant: "default",
      })

      // Navigate back to transactions page
      setTimeout(() => {
        setIsLoading(false)
        router.push("/transactions")
      }, 1000)
    } else {
      toast({
        title: "Error",
        description: "Transaction not found",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <DashboardHeader title="Transactions" />
          </div>
          <div className="flex justify-center items-center h-[60vh]">
            <Loading />
          </div>
        </main>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <DashboardHeader title="Transactions" />
          </div>
          <div className="flex justify-center items-center h-[60vh]">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#1A365D] mb-4">Transaction Not Found</h2>
              <Button
                onClick={() => router.push("/transactions")}
                className="bg-[#2A69AC] hover:bg-[#1A365D] text-white"
              >
                Back to Transactions
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Transactions" />
        </div>

        <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1A365D]">Add Service to Transaction {transaction.id}</h2>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-6">
              <div className="grid gap-4">
                {/* Customer and Car Details Section (Keep this unchanged) */}
                <div className="mb-6 bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{transaction.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Car Model</p>
                      <p className="font-medium">{transaction.carModel}</p>
                    </div>
                  </div>
                </div>

                {/* Service Rows Section (This is new) */}
                {serviceRows.map((row, index) => (
                  <div key={row.id} className="p-4 border border-gray-100 rounded-md">
                    {/* Row 2: Mechanic and Service Type Selection */}
                    <div className="flex flex-row gap-4 mb-4">
                      {/* Mechanic Selection (shortened) */}
                      <div className="w-1/2">
                        <Select
                          value={row.mechanic}
                          onValueChange={(value) => handleInputChange(row.id, "mechanic", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Mechanic (Optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {mechanics.map((mechanic) => (
                              <SelectItem key={mechanic} value={mechanic}>
                                {mechanic}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Service Type Selection (new) */}
                      <div className="w-1/2">
                        <Select value={row.type} onValueChange={(value) => handleInputChange(row.id, "type", value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Custom / General Service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom Service</SelectItem>
                            <SelectItem value="general">General Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 3: Conditional Service Input */}
                    <div className="mb-4">
                      {row.type === "custom" ? (
                        <>
                          <Input
                            placeholder="Custom Service/Item Name"
                            value={row.customService}
                            onChange={(e) => handleInputChange(row.id, "customService", e.target.value)}
                            className={`w-full ${duplicateErrors[row.id] ? "border-red-500" : ""}`}
                          />
                          {duplicateErrors[row.id] && (
                            <p className="text-red-500 text-sm mt-1">{duplicateErrors[row.id]}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <Select
                            value={row.generalService}
                            onValueChange={(value) => handleInputChange(row.id, "generalService", value)}
                          >
                            <SelectTrigger className={`w-full ${duplicateErrors[row.id] ? "border-red-500" : ""}`}>
                              <SelectValue placeholder="General Services" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {duplicateErrors[row.id] && (
                            <p className="text-red-500 text-sm mt-1">{duplicateErrors[row.id]}</p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Row 4: Price, Quantity, Discount */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Price (₱0,000.00)"
                          value={row.price}
                          onChange={(e) => {
                            const value = e.target.value

                            // If backspacing to empty or just the symbol, clear it
                            if (value === "₱" || value === "") {
                              setServiceRows(
                                serviceRows.map((r) => (r.id === row.id ? { ...r, price: "", rawPrice: "" } : r)),
                              )
                              return
                            }

                            // Remove currency symbol and non-numeric chars except decimal
                            const numericValue = value.replace(/₱/g, "").replace(/[^\d.]/g, "")

                            // Handle decimal point - ensure only one decimal point
                            let formattedValue = numericValue
                            const parts = numericValue.split(".")
                            if (parts.length > 2) {
                              // Keep only the first decimal point
                              formattedValue = parts[0] + "." + parts.slice(1).join("")
                            }

                            // Format with peso sign
                            const displayValue = formattedValue ? `₱${formattedValue}` : ""

                            // Update both the display value and raw value
                            setServiceRows(
                              serviceRows.map((r) =>
                                r.id === row.id ? { ...r, price: displayValue, rawPrice: formattedValue } : r,
                              ),
                            )
                          }}
                          onBlur={(e) => {
                            const value = e.target.value

                            // Format properly on blur
                            if (!value || value === "₱") {
                              setServiceRows(
                                serviceRows.map((r) => (r.id === row.id ? { ...r, price: "", rawPrice: "" } : r)),
                              )
                              return
                            }

                            // Extract numeric value
                            const numericValue = value.replace(/₱/g, "")

                            try {
                              const number = Number.parseFloat(numericValue)
                              if (!isNaN(number)) {
                                // Format with commas and proper decimal places
                                const formatted = `₱${number.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`

                                setServiceRows(
                                  serviceRows.map((r) =>
                                    r.id === row.id ? { ...r, price: formatted, rawPrice: number.toString() } : r,
                                  ),
                                )
                              }
                            } catch (error) {
                              // Keep as is if parsing fails
                            }
                          }}
                          className="w-full placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Quantity (x1)"
                          value={row.quantity}
                          onChange={(e) => {
                            // Get the current value and new value
                            const currentValue = row.quantity
                            const newValue = e.target.value

                            // Check if backspace is being used
                            const isBackspacing = newValue.length < currentValue.length

                            // If backspacing to empty or just the symbol, clear it
                            if (isBackspacing && (newValue === "x" || newValue === "")) {
                              handleInputChange(row.id, "quantity", "")
                              return
                            }

                            // Remove prefix and non-numeric chars
                            const value = newValue.replace(/^x/, "").replace(/\D/g, "")

                            // Format with x prefix
                            const formattedValue = value ? `x${value}` : ""
                            handleInputChange(row.id, "quantity", formattedValue)
                          }}
                          className="w-full placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Discount (0%)"
                          value={row.discount}
                          onChange={(e) => {
                            // Get the current value and new value
                            const currentValue = row.discount
                            const newValue = e.target.value

                            // Check if backspace is being used
                            const isBackspacing = newValue.length < currentValue.length

                            // If backspacing and removing the % sign or emptying the field
                            if (isBackspacing && (newValue === "" || !newValue.includes("%"))) {
                              handleInputChange(row.id, "discount", "")
                              return
                            }

                            // Normal input handling
                            let value = newValue

                            // Remove suffix and non-numeric chars
                            value = value.replace(/%$/, "").replace(/\D/g, "")

                            // Format with % suffix
                            const formattedValue = value ? `${value}%` : ""
                            handleInputChange(row.id, "discount", formattedValue)
                          }}
                          className="w-full placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>

                    {/* Remove button for this row */}
                    {serviceRows.length > 1 && (
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeServiceRow(row.id)}
                          className="text-[#EA5455] border-[#EA5455] hover:bg-[#FFE5E5] hover:text-[#EA5455]"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Another Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={addServiceRow}
                    variant="outline"
                    className="border-[#2A69AC] text-[#2A69AC] hover:bg-[#EBF8FF] hover:text-[#2A69AC]"
                  >
                    Add Another Service
                  </Button>
                </div>
              </div>

              {/* Button Row - keep the same */}
              <div className="flex justify-between pt-6">
                <Button
                  onClick={() => router.push("/transactions")}
                  variant="outline"
                  className="bg-white hover:bg-[#1A365D] hover:text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading || Object.keys(duplicateErrors).length > 0}
                  className="bg-[#2A69AC] hover:bg-[#1A365D] text-white"
                >
                  {isLoading ? "Processing..." : "Add Service"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

