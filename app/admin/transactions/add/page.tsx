"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/admin-components/header"
import { Sidebar } from "@/components/admin-components/sidebar"
import { Button } from "@/components/admin-components/button"
import { Checkbox } from "@/components/admin-components/checkbox"
import { Input } from "@/components/admin-components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin-components/select"
import { toast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { collection, addDoc, Timestamp, getDocs, query, orderBy, limit } from "firebase/firestore"
import { getActiveEmployees, type Employee } from "@/lib/employee-utils"

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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [isCustomService, setIsCustomService] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)

  const customerDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch customers from Firestore
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoadingCustomers(true)
        const accountsCollection = collection(db, "accounts")
        // Sorting by createdAt or lastName to get a consistent order
        const q = query(accountsCollection, orderBy("createdAt", "desc"), limit(100))
        
        const querySnapshot = await getDocs(q)
        const fetchedCustomers: Customer[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          
          // Skip accounts with admin role
          if (
            data.role === 'admin' || 
            (typeof data.role === 'string' && data.role.toLowerCase().includes('admin'))
          ) {
            return
          }
          
          fetchedCustomers.push({
            id: doc.id,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim().toUpperCase(),
            username: data.username || '',
            phone: data.phoneNumber || '',
          })
        })
        
        setCustomers(fetchedCustomers)
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast({
          title: "Error",
          description: "Failed to load customers. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingCustomers(false)
      }
    }

    fetchCustomers()
  }, [])

  // Fetch active employees on component mount
  useEffect(() => {
    const fetchActiveEmployees = async () => {
      try {
        setIsLoadingEmployees(true)
        const employees = await getActiveEmployees()
        setActiveEmployees(employees)
      } catch (error) {
        console.error("Error fetching active employees:", error)
        toast({
          title: "Error",
          description: "Failed to load mechanics. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingEmployees(false)
      }
    }

    fetchActiveEmployees()
  }, [])

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
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter customers when customerName changes
  useEffect(() => {
    if (formData.customerName) {
      const searchTerm = formData.customerName.toLowerCase()
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.id.toLowerCase().includes(searchTerm) ||
          (customer.username && customer.username.toLowerCase().includes(searchTerm)) ||
          (customer.phone && customer.phone.includes(searchTerm))
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers([])
    }
  }, [formData.customerName, customers])

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

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
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

      // Create new transaction ID
      const newTransactionId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`

      // Create transaction object
      const newTransaction = {
        customerName: formData.customerName,
        customerId: formData.customerId || `#C${Math.floor(10000 + Math.random() * 90000)}`,
        carModel: formData.carModel,
        reservationDate: new Date().toLocaleDateString(),
        completionDate: "Completed", // Use string to match existing data
        totalPrice: serviceToAdd.total,
        subtotal: serviceToAdd.price * serviceToAdd.quantity,
        discountAmount: serviceToAdd.price * serviceToAdd.quantity * (serviceToAdd.discount / 100),
        transactionServices: [serviceToAdd], // Store full service objects here
        services: isCustomService
          ? [customServiceName]
          : selectedServices.map((id) => services.find((s) => s.id === id)?.label || ""),
        generalServices: isCustomService
          ? [customServiceName]
          : selectedServices.map((id) => services.find((s) => s.id === id)?.label || ""),
        carDetails: {
          yearModel: formData.yearModel,
          transmission: formData.transmission,
          fuelType: formData.fuelType,
          odometer: formData.odometer,
          plateNo: formData.plateNo,
        },
        yearModel: formData.yearModel,
        transmission: formData.transmission,
        fuelType: formData.fuelType,
        odometer: formData.odometer,
        plateNo: formData.plateNo,
        status: "COMPLETED", // Mark as completed so it shows up in transactions
        createdAt: Timestamp.fromDate(new Date()),
        date: Timestamp.fromDate(new Date()),
      }

      // Save to Firebase
      try {
        // Add to bookings collection
        const bookingsRef = collection(db, "bookings")
        const docRef = await addDoc(bookingsRef, newTransaction)

        // Also add to transactions collection
        const transactionsRef = collection(db, "transactions")
        await addDoc(transactionsRef, {
          ...newTransaction,
          bookingId: docRef.id,
        })

        toast({
          title: "Transaction Created",
          description: `New transaction ${newTransactionId} has been created`,
          variant: "default",
        })

        // Navigate back to transactions page
        setTimeout(() => {
          setIsLoading(false)
          router.push("/admin/transactions")
        }, 1000)
      } catch (error) {
        console.error("Error saving to Firebase:", error)
        toast({
          title: "Error",
          description: "Failed to save transaction to database",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error creating transaction:", error)
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Format employee name for display
  const formatEmployeeName = (employee: Employee): string => {
    return `${employee.firstName} ${employee.lastName}`.toUpperCase()
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
                  placeholder={isLoadingCustomers ? "Loading customers..." : "Customer Name, ID, or Username"}
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  className="w-full"
                  disabled={isLoadingCustomers}
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
                          {customer.username && (
                            <div className="text-sm text-gray-500">
                              Username: {customer.username}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="text-sm text-gray-500">
                              Phone: {customer.phone}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {showCustomerDropdown && formData.customerName && filteredCustomers.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No customers found matching "{formData.customerName}"
                    </div>
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

              {/* Mechanic Selection (Only Active Employees) */}
              <Select value={formData.mechanic} onValueChange={(value) => handleInputChange("mechanic", value)}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={isLoadingEmployees ? "Loading mechanics..." : "Select Mechanic (Optional)"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingEmployees ? (
                    <SelectItem value="loading" disabled>
                      Loading mechanics...
                    </SelectItem>
                  ) : activeEmployees.length > 0 ? (
                    activeEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={formatEmployeeName(employee)}>
                        {formatEmployeeName(employee)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No active mechanics available
                    </SelectItem>
                  )}
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
                onClick={() => router.push("/admin/transactions")}
                variant="outline"
                className="bg-white hover:bg-[#1A365D] hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading || isLoadingCustomers}
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