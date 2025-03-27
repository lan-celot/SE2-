"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import useLocalStorage from "@/hooks/useLocalStorage"

// Define types for services and customers
interface Service {
  id: string
  label: string
}

interface Customer {
  id: string
  name: string
  username: string
  phone: string
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

// Dummy customers data
const initialCustomers: Customer[] = [
  { id: "#C00100", name: "ANDREA SALAZAR", username: "andeng", phone: "09171234567" },
  { id: "#C00099", name: "BLAINE RAMOS", username: "blainey", phone: "09380605349" },
  { id: "#C00098", name: "LEO MACAYA", username: "oel", phone: "09283429109" },
  { id: "#C00097", name: "RUSS DE GUZMAN", username: "roired", phone: "09489539463" },
  { id: "#C00096", name: "AVERILL BUENVENIDA", username: "ave", phone: "09409450648" },
  { id: "#C00095", name: "HAN BASCAO", username: "hanning", phone: "09982603116" },
]

// Dummy transactions data
const initialTransactions: Transaction[] = [
  {
    id: "RES-123456",
    reservationId: "RES-123456",
    customerName: "ANDREA SALAZAR",
    customerId: "#C00100",
    carModel: "Toyota Vios",
    reservationDate: "3/15/2023",
    completionDate: "3/20/2023",
    totalPrice: 5000,
    services: [
      {
        service: "OIL CHANGE",
        mechanic: "MARCIAL TAMONDONG",
        price: 5000,
        quantity: 1,
        discount: 0,
        total: 5000,
      },
    ],
    carDetails: {
      yearModel: "2020",
      transmission: "AUTOMATIC",
      fuelType: "GASOLINE",
      odometer: "15000",
      plateNo: "ABC 123",
    },
    createdAt: new Date(),
  },
  {
    id: "RES-789012",
    reservationId: "RES-789012",
    customerName: "BLAINE RAMOS",
    customerId: "#C00099",
    carModel: "Honda Civic",
    reservationDate: "3/18/2023",
    completionDate: "3/22/2023",
    totalPrice: 8000,
    services: [
      {
        service: "BRAKE REPLACE",
        mechanic: "NOR TAMONDONG",
        price: 8000,
        quantity: 1,
        discount: 0,
        total: 8000,
      },
    ],
    carDetails: {
      yearModel: "2019",
      transmission: "MANUAL",
      fuelType: "DIESEL",
      odometer: "25000",
      plateNo: "XYZ 789",
    },
    createdAt: new Date(),
  },
]

// Transmission options
const transmissionOptions = ["AUTOMATIC", "MANUAL", "CVT", "SEMI-AUTOMATIC", "DUAL-CLUTCH"]

// Fuel type options
const fuelTypeOptions = ["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID", "LPG"]

export default function AddTransactionPage() {
  const router = useRouter()
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customServiceName, setCustomServiceName] = useState("")
  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "",
    carModel: "",
    yearModel: "",
    transmission: "",
    fuelType: "",
    odometer: "",
    plateNo: "",
    mechanic: "",
    price: "",
    quantity: "",
    discount: "",
  })
  const [customers, setCustomers] = useLocalStorage<Customer[]>("customers", initialCustomers)
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", initialTransactions)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showTransactionDropdown, setShowTransactionDropdown] = useState(false)
  const [isCustomService, setIsCustomService] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const customerDropdownRef = useRef<HTMLDivElement>(null)
  const transactionDropdownRef = useRef<HTMLDivElement>(null)

  // Format price with Philippine Peso sign and commas
  const formatPrice = (value: string): string => {
    // If the value is just the currency symbol or empty, return empty
    if (value === "₱" || value === "") {
      return ""
    }

    // Remove the currency symbol and any non-numeric characters except decimal point
    let numericValue = value.replace(/₱/g, "").replace(/[^\d.]/g, "")

    // Handle decimal point - ensure only one decimal point
    const parts = numericValue.split(".")
    if (parts.length > 2) {
      // Keep only the first decimal point
      numericValue = parts[0] + "." + parts.slice(1).join("")
    }

    // Format with commas for thousands
    let formattedValue
    if (numericValue.includes(".")) {
      const [wholePart, decimalPart] = numericValue.split(".")
      // Format whole part with commas
      const formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      // Limit decimal to 2 places
      formattedValue = `₱${formattedWholePart}.${decimalPart.slice(0, 2)}`
    } else {
      // No decimal point
      formattedValue = `₱${numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
    }

    return formattedValue
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

  // Handle click outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false)
      }
      if (transactionDropdownRef.current && !transactionDropdownRef.current.contains(event.target as Node)) {
        setShowTransactionDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter customers when customerName changes
  useEffect(() => {
    if (formData.customerName) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(formData.customerName.toLowerCase()) ||
          customer.id.toLowerCase().includes(formData.customerName.toLowerCase()),
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers([])
    }
  }, [formData.customerName, customers])

  // Filter transactions when searchValue changes
  useEffect(() => {
    if (searchValue) {
      const filtered = transactions.filter(
        (transaction) =>
          transaction.id.toLowerCase().includes(searchValue.toLowerCase()) ||
          transaction.reservationId.toLowerCase().includes(searchValue.toLowerCase()) ||
          transaction.customerName.toLowerCase().includes(searchValue.toLowerCase()),
      )
      setFilteredTransactions(filtered)
    } else {
      setFilteredTransactions(transactions)
    }
  }, [searchValue, transactions])

  // Populate form fields when a transaction is selected
  const selectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setSearchValue(transaction.id)
    setShowTransactionDropdown(false)

    // Populate form fields with transaction data
    setFormData({
      customerName: transaction.customerName,
      customerId: transaction.customerId,
      carModel: transaction.carModel,
      yearModel: transaction.carDetails?.yearModel || "",
      transmission: transaction.carDetails?.transmission || "",
      fuelType: transaction.carDetails?.fuelType || "",
      odometer: transaction.carDetails?.odometer || "",
      plateNo: transaction.carDetails?.plateNo || "",
      mechanic: "", // Reset mechanic for new service
      price: "",
      quantity: "",
      discount: "",
    })
  }

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    )
  }

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value

    // Check if backspace is being used (value is shorter than current value)
    const isBackspacing =
      (field === "price" && value.length < formData.price.length) ||
      (field === "quantity" && value.length < formData.quantity.length) ||
      (field === "discount" && value.length < formData.discount.length)

    if (field === "price") {
      // Special handling for backspace on price
      if (isBackspacing && (value === "₱" || value === "")) {
        formattedValue = ""
      } else {
        formattedValue = formatPrice(value)
      }
    } else if (field === "quantity") {
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

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }))

    // Show customer dropdown if typing in customerName
    if (field === "customerName") {
      setShowCustomerDropdown(true)
    }
  }

  const selectCustomer = (customer: Customer) => {
    setFormData((prev) => ({
      ...prev,
      customerName: customer.name,
      customerId: customer.id,
    }))
    setShowCustomerDropdown(false)
  }

  const handleConfirm = () => {
    setIsLoading(true)

    // Get service details
    const serviceToAdd = {
      service: isCustomService
        ? customServiceName
        : selectedServices.map((id) => services.find((s) => s.id === id)?.label || "").join(", "),
      mechanic: formData.mechanic,
      price: Number.parseFloat(formData.price.replace(/[₱,]/g, "")) || 0,
      quantity: Number.parseInt(formData.quantity.replace(/x/g, "")) || 1,
      discount: Number.parseInt(formData.discount.replace(/%/g, "")) || 0,
      total: 0, // Will calculate below
    }

    // Calculate total for this service
    serviceToAdd.total = serviceToAdd.price * serviceToAdd.quantity * (1 - serviceToAdd.discount / 100)

    // Create new transaction
    const newTransactionId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`

    const newTransaction = {
      id: newTransactionId,
      reservationId: "---",
      customerName: formData.customerName,
      customerId: formData.customerId || `#C${Math.floor(10000 + Math.random() * 90000)}`,
      carModel: formData.carModel,
      reservationDate: "---",
      completionDate: new Date().toLocaleDateString(),
      totalPrice: serviceToAdd.total,
      services: [serviceToAdd],
      carDetails: {
        yearModel: formData.yearModel,
        transmission: formData.transmission,
        fuelType: formData.fuelType,
        odometer: formData.odometer,
        plateNo: formData.plateNo,
      },
      createdAt: new Date(),
    }

    // Get existing transactions from localStorage
    const updatedTransactions = [...transactions, newTransaction]

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
      title: "Transaction Created",
      description: `New transaction ${newTransactionId} has been created`,
      variant: "default",
    })

    // Navigate back to transactions page
    setTimeout(() => {
      setIsLoading(false)
      router.push("/transactions")
    }, 1000)
  }

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Transactions" />
        </div>

        <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-2xl font-semibold text-[#1A365D]">Add a New Transaction</h2>

          <div className="grid gap-6">
            <div className="grid gap-4">
              {/* Customer Information */}
              <div className="relative" ref={customerDropdownRef}>
                <Input
                  placeholder="Customer Name or ID"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  className="w-full"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
                    <ul className="max-h-60 overflow-auto rounded-md py-1 text-base">
                      {filteredCustomers.map((customer) => (
                        <li
                          key={customer.id}
                          className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="flex justify-between">
                            <span>{customer.name}</span>
                            <span className="text-gray-500">{customer.id}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Car Details */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Car Model (optional)"
                  value={formData.carModel}
                  onChange={(e) => handleInputChange("carModel", e.target.value)}
                  className="w-full"
                />
                <Input
                  placeholder="Year Model (optional)"
                  value={formData.yearModel}
                  onChange={(e) => handleInputChange("yearModel", e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={formData.transmission}
                  onValueChange={(value) => handleInputChange("transmission", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Transmission Type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {transmissionOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fuel Type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Odometer Reading (km) (optional)"
                  value={formData.odometer}
                  onChange={(e) => handleInputChange("odometer", e.target.value)}
                  className="w-full"
                />
                <Input
                  placeholder="Plate Number (optional)"
                  value={formData.plateNo}
                  onChange={(e) => handleInputChange("plateNo", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Mechanic Selection (Optional) */}
              <Select value={formData.mechanic} onValueChange={(value) => handleInputChange("mechanic", value)}>
                <SelectTrigger>
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
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Price (₱0,000.00)"
                    value={formData.price}
                    onChange={(e) => {
                      // Only handle the raw input, format on blur
                      let value = e.target.value

                      // If backspacing to empty or just the symbol, clear it
                      if (value === "₱" || value === "") {
                        setFormData((prev) => ({ ...prev, price: "" }))
                        return
                      }

                      // Remove currency symbol and non-numeric chars except decimal
                      value = value.replace(/₱/g, "").replace(/[^\d.]/g, "")

                      // Format with peso sign
                      const formattedValue = value ? `₱${value}` : ""
                      setFormData((prev) => ({ ...prev, price: formattedValue }))
                    }}
                    onBlur={(e) => {
                      // Format properly on blur
                      if (!formData.price || formData.price === "₱") {
                        setFormData((prev) => ({ ...prev, price: "" }))
                        return
                      }

                      // Extract numeric value
                      const numericValue = formData.price.replace(/₱/g, "")

                      // Format with commas and proper decimal places
                      try {
                        const number = Number.parseFloat(numericValue)
                        if (!isNaN(number)) {
                          const formatted = `₱${number.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                          setFormData((prev) => ({ ...prev, price: formatted }))
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
                    value={formData.quantity}
                    onChange={(e) => {
                      // Only handle the raw input, format on blur
                      let value = e.target.value

                      // If backspacing to empty or just the symbol, clear it
                      if (value === "x" || value === "") {
                        setFormData((prev) => ({ ...prev, quantity: "" }))
                        return
                      }

                      // Remove prefix and non-numeric chars
                      value = value.replace(/^x/, "").replace(/\D/g, "")

                      // Format with x prefix
                      const formattedValue = value ? `x${value}` : ""
                      setFormData((prev) => ({ ...prev, quantity: formattedValue }))
                    }}
                    className="w-full placeholder:text-muted-foreground"
                  />
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Discount (0%)"
                    value={formData.discount}
                    onChange={(e) => {
                      // Get the current value and new value
                      const currentValue = formData.discount
                      const newValue = e.target.value

                      // Check if backspace is being used (value is shorter than current value)
                      const isBackspacing = newValue.length < currentValue.length

                      // If backspacing and removing the % sign or emptying the field
                      if (isBackspacing && (newValue === "" || !newValue.includes("%"))) {
                        setFormData((prev) => ({ ...prev, discount: "" }))
                        return
                      }

                      // Normal input handling
                      let value = newValue

                      // Remove suffix and non-numeric chars
                      value = value.replace(/%$/, "").replace(/\D/g, "")

                      // Format with % suffix
                      const formattedValue = value ? `${value}%` : ""
                      setFormData((prev) => ({ ...prev, discount: formattedValue }))
                    }}
                    className="w-full placeholder:text-muted-foreground"
                  />
                </div>
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
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-[#2A69AC] hover:bg-[#1A365D] text-white"
              >
                {isLoading ? "Processing..." : "Create Transaction"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

