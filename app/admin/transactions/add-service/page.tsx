"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/admin-components/header"
import { Sidebar } from "@/components/admin-components/sidebar"
import { Button } from "@/components/admin-components/button"
import { Input } from "@/components/admin-components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin-components/select"
import { toast } from "@/hooks/use-toast"
import Loading from "@/components/admin-components/loading"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from "firebase/firestore"
import { getActiveEmployees, type Employee } from "@/lib/employee-utils"

// Define types for services and customers
interface Service {
  id: string
  label: string
  services: string[]
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
  subtotal: number
  discountAmount: number
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

// ↓ NEW GENERAL SERVICE CATEGORIES ↓
const services = [
  {
    id: "general",
    label: "General Auto Repair & Maintenance",
    services: [
      "Engine diagnostics, tuning, and repairs",
      "Oil change, fluid checks, and filter replacements",
      "Battery inspection and replacement",
      "Transmission service and repairs",
      "Fuel system and cooling system maintenance",
      "Oil Change with or w/o Filter",
      "Air Filter Replacement",
      "PMS (Preventive Maintenance Service)",
      "Engine Timing Repair",
    ],
  },
  {
    id: "brake",
    label: "Brake & Suspension Services",
    services: [
      "Brake inspection, cleaning, and replacement",
      "Suspension system repairs and upgrades",
      "Wheel alignment and balancing",
      "BrakeMaster Repair",
    ],
  },
  {
    id: "body",
    label: "Body & Exterior Services",
    services: [
      "Paint jobs, dent removal, and scratch repair",
      "Window, headlight, and taillight restoration",
      "Rust prevention and undercoating",
    ],
  },
  {
    id: "tires",
    label: "Tires & Wheels",
    services: ["Tire replacement", "Rim repair and refinishing"],
  },
  {
    id: "electrical",
    label: "Electrical & Diagnostic Services",
    services: [
      "Computerized engine diagnostics",
      "Alternator, starter, and battery checks",
      "Sensor calibration and replacement",
    ],
  },
  {
    id: "air",
    label: "Air Conditioning Services",
    services: [
      "Freon Recharging",
      "Compressor Repair",
      "Aircon Fan Repair",
      "Evaporator Replacement",
      "Aircon Full Service",
      "Compressor Assembly",
    ],
  },
  {
    id: "performance",
    label: "Performance & Customization",
    services: [
      "Exhaust system and suspension upgrades",
      "ECU tuning and performance modifications",
    ],
  },
  {
    id: "emergency",
    label: "Emergency & Roadside Assistance",
    services: [
      "Towing services and roadside assistance",
      "Lockout, jumpstart, and flat tire services",
    ],
  },
  {
    id: "insurance",
    label: "Insurance & Inspection Services",
    services: ["Vehicle inspection and repair estimates", "Emissions testing and compliance"],
  },
]


function AddServicePageContent() {
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
  const [isCustomService, setIsCustomService] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [duplicateErrors, setDuplicateErrors] = useState<{ [key: string]: string }>({})
  const [firebaseTransaction, setFirebaseTransaction] = useState<any>(null)
  // Add a state to track if we're in the process of submitting
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Add a state to track if we've initialized from localStorage
  const [initialized, setInitialized] = useState(false)
  // Add this state variable in the AddServicePageContent function:
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([])

  // Load transaction data based on ID from URL
  useEffect(() => {
    if (!transactionId) {
      toast({
        title: "Error",
        description: "No transaction ID provided",
        variant: "destructive",
      })
      router.push("/admin/transactions")
      return
    }

    const fetchTransaction = async () => {
      try {
        // Try to fetch the booking directly from Firebase
        const success = await fetchFromFirebase(transactionId)
        if (!success) {
          toast({
            title: "Error",
            description: `Transaction with ID ${transactionId} not found`,
            variant: "destructive",
          })
          router.push("/admin/transactions")
        }
      } catch (error: unknown) {
        console.error("Error fetching transaction:", error)
        toast({
          title: "Error",
          description: `Failed to fetch transaction: ${(error as Error).message}`,
          variant: "destructive",
        })
        router.push("/admin/transactions")
      } finally {
        setPageLoading(false)
        setInitialized(true)
      }
    }

    fetchTransaction()
  }, [transactionId, router])

  // Add this useEffect to fetch active employees when the component mounts
  // Add this after the other useEffect hooks:
  useEffect(() => {
    const fetchActiveEmployees = async () => {
      try {
        const employees = await getActiveEmployees()
        setActiveEmployees(employees)
      } catch (error) {
        console.error("Error fetching active employees:", error)
        toast({
          title: "Error",
          description: "Failed to fetch active employees",
          variant: "destructive",
        })
      }
    }

    fetchActiveEmployees()
  }, [])

  // Function to fetch transaction from Firebase
  const fetchFromFirebase = async (id: string): Promise<boolean> => {
    try {
      console.log("Fetching transaction from Firebase with ID:", id)

      // Try direct document lookup first in bookings collection
      const bookingRef = doc(db, "bookings", id)
      const bookingDoc = await getDoc(bookingRef)

      if (bookingDoc.exists()) {
        const data = bookingDoc.data()
        console.log("Booking found directly in Firebase:", data)

        // Convert Firebase timestamp to Date if needed
        const createdAt = data.date?.toDate ? data.date.toDate() : new Date()
        const completionDate = data.completionDate?.toDate ? data.completionDate.toDate() : new Date()

        // Create a default service if none exists
        const defaultServices =
          data.services && Array.isArray(data.services) && data.services.length > 0
            ? data.services.map((service: string) => ({
                service,
                mechanic: "",
                price: 0,
                quantity: 1,
                discount: 0,
                total: 0,
              }))
            : [
                {
                  service: "General Service",
                  mechanic: "",
                  price: 0,
                  quantity: 1,
                  discount: 0,
                  total: 0,
                },
              ]

        const firebaseTransaction: Transaction = {
          id: id,
          reservationId: id,
          customerName: data.fullName || "Unknown Customer",
          customerId: data.authUid || "---",
          carModel: data.carModel || "---",
          reservationDate: data.date ? createdAt.toLocaleDateString() : "---",
          completionDate: data.completionDate ? completionDate.toLocaleDateString() : new Date().toLocaleDateString(),
          services: data.transactionServices || defaultServices,
          totalPrice: data.totalPrice || 0,
          subtotal: data.subtotal || 0,
          discountAmount: data.discountAmount || 0,
          createdAt: createdAt,
          carDetails: data.carDetails || {
            yearModel: "",
            transmission: "",
            fuelType: "",
            odometer: "",
            plateNo: "",
          },
        }

        setFirebaseTransaction(firebaseTransaction)
        setTransaction(firebaseTransaction)
        return true
      }

      // If direct lookup fails, try querying by custom field
      console.log("Direct lookup failed, trying query by custom field")

      const bookingsCollection = collection(db, "bookings")

      // Try different field names that might contain the transaction ID
      const possibleFields = ["id", "transactionId", "reservationId"]

      for (const field of possibleFields) {
        const q = query(bookingsCollection, where(field, "==", id))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]
          const data = doc.data()
          console.log(`Booking found in Firebase using ${field} field:`, data)

          // Convert Firebase timestamp to Date if needed
          const createdAt = data.date?.toDate ? data.date.toDate() : new Date()
          const completionDate = data.completionDate?.toDate ? data.completionDate.toDate() : new Date()

          // Create a default service if none exists
          const defaultServices =
            data.services && Array.isArray(data.services) && data.services.length > 0
              ? data.services.map((service: string) => ({
                  service,
                  mechanic: "",
                  price: 0,
                  quantity: 1,
                  discount: 0,
                  total: 0,
                }))
              : [
                  {
                    service: "General Service",
                    mechanic: "",
                    price: 0,
                    quantity: 1,
                    discount: 0,
                    total: 0,
                  },
                ]

          const firebaseTransaction: Transaction = {
            id: id,
            reservationId: id,
            customerName: data.fullName || "Unknown Customer",
            customerId: data.customerId || "---",
            carModel: data.carModel || "---",
            reservationDate: data.date ? createdAt.toLocaleDateString() : "---",
            completionDate: data.completionDate ? completionDate.toLocaleDateString() : new Date().toLocaleDateString(),
            services: data.transactionServices || defaultServices,
            totalPrice: data.totalPrice || 0,
            subtotal: data.subtotal || 0,
            discountAmount: data.discountAmount || 0,
            createdAt: createdAt,
            carDetails: data.carDetails || {
              yearModel: "",
              transmission: "",
              fuelType: "",
              odometer: "",
              plateNo: "",
            },
          }

          setFirebaseTransaction(firebaseTransaction)
          setTransaction(firebaseTransaction)
          return true
        }
      }

      console.log("Transaction not found in Firebase")
      return false
    } catch (error) {
      console.error("Error fetching from Firebase:", error)
      return false
    }
  }

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    )
  }

  // Check for duplicate services when service type or name changes
  useEffect(() => {
    // Skip if not initialized or during submission
    if (!initialized || isSubmitting || !transaction) return

    // Clear previous errors
    const newErrors: { [key: string]: string } = {}

    // First, collect all services being added in the current form
    const currentFormServices = serviceRows
      .map((row) => {
        if (row.type === "custom") {
          return row.customService.trim().toUpperCase()
        } else if (row.type === "general") {
          return (services.find((s) => s.id === row.generalService)?.label || "").toUpperCase()
        }
        return ""
      })
      .filter((name) => name !== "")

    // Check each row for duplicates against EXISTING transaction services only
    serviceRows.forEach((row) => {
      let serviceName = ""

      if (row.type === "custom") {
        serviceName = row.customService.trim()
      } else if (row.type === "general") {
        serviceName = services.find((s) => s.id === row.generalService)?.label || ""
      }

      // Only check if service name is not empty
      if (serviceName) {
        // Check if this service already exists in the transaction's EXISTING services
        const isDuplicate = transaction.services.some(
          (existingService) => existingService.service.toUpperCase() === serviceName.toUpperCase(),
        )

        if (isDuplicate) {
          newErrors[row.id] = `"${serviceName}" already exists in this transaction`
        }
      }
    })

    // Now check for duplicates within the form itself (multiple rows with same service)
    serviceRows.forEach((row, index) => {
      let serviceName = ""

      if (row.type === "custom") {
        serviceName = row.customService.trim().toUpperCase()
      } else if (row.type === "general") {
        serviceName = (services.find((s) => s.id === row.generalService)?.label || "").toUpperCase()
      }

      // Skip empty service names
      if (!serviceName) return

      // Count occurrences of this service name in the current form
      const occurrences = currentFormServices.filter((name) => name === serviceName).length

      // If there's more than one occurrence, it's a duplicate within the form
      if (occurrences > 1 && !newErrors[row.id]) {
        newErrors[row.id] = `"${serviceName}" appears multiple times in your form`
      }
    })

    setDuplicateErrors(newErrors)
  }, [serviceRows, transaction, services, isSubmitting, initialized])

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

  // Find the handleConfirm function and add logging
  const handleConfirm = async () => {
    if (!transaction) {
      toast({
        title: "Error",
        description: "Transaction not found",
        variant: "destructive",
      })
      return
    }

    // Set isSubmitting to true to disable duplicate checking during submission
    setIsSubmitting(true)
    setIsLoading(true)

    try {
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

      if (servicesToAdd.length === 0) {
        toast({
          title: "No valid services",
          description: "Please add at least one service with a price",
          variant: "destructive",
        })
        setIsLoading(false)
        setIsSubmitting(false)
        return
      }

      // Check for duplicate services ONLY WITHIN the current transaction's existing services
      // NOT including the ones being added now
      const duplicates: string[] = []
      const existingServiceNames = transaction.services.map((s) => s.service.toUpperCase())

      // Check each service to be added against existing services
      servicesToAdd.forEach((service) => {
        if (existingServiceNames.includes(service.service.toUpperCase())) {
          duplicates.push(service.service)
        }
      })

      // Also check for duplicates within the services being added
      const newServiceNames = servicesToAdd.map((s) => s.service.toUpperCase())
      for (let i = 0; i < newServiceNames.length; i++) {
        for (let j = i + 1; j < newServiceNames.length; j++) {
          if (newServiceNames[i] === newServiceNames[j] && !duplicates.includes(servicesToAdd[i].service)) {
            duplicates.push(servicesToAdd[i].service)
          }
        }
      }

      // If duplicates found, show error and don't proceed
      if (duplicates.length > 0) {
        toast({
          title: "Duplicate Services",
          description: `The following services already exist or are duplicated: ${duplicates.join(", ")}`,
          variant: "destructive",
        })
        setIsLoading(false)
        setIsSubmitting(false)
        return
      }

      // Calculate total for each service
      servicesToAdd.forEach((service) => {
        service.total = service.price * service.quantity * (1 - service.discount / 100)
      })

      console.log("Starting to add services to transaction:", transaction.id)

      // Update the transaction with the new services
      const updatedServices = [...transaction.services, ...servicesToAdd]
      const subtotal = updatedServices.reduce((sum, service) => sum + service.price * service.quantity, 0)
      const discountAmount = updatedServices.reduce(
        (sum, service) => sum + (service.price * service.quantity * service.discount) / 100,
        0,
      )
      const totalPrice = subtotal - discountAmount

      // Update the transaction in state
      const updatedTransaction = {
        ...transaction,
        services: updatedServices,
        totalPrice: totalPrice,
        subtotal: subtotal,
        discountAmount: discountAmount,
        updatedAt: new Date(),
      }

      setTransaction(updatedTransaction)

      // Now try to update in Firebase
      try {
        // Update the booking document
        const bookingRef = doc(db, "bookings", transaction.id)

        // Update the booking with transaction data
        await updateDoc(bookingRef, {
          transactionServices: updatedServices,
          totalPrice: totalPrice,
          subtotal: subtotal,
          discountAmount: discountAmount,
          updatedAt: new Date(),
        })

        console.log("Successfully updated booking in Firebase")

        // Also save to transactions collection if needed
        const transactionsRef = collection(db, "transactions")
        await addDoc(transactionsRef, {
          bookingId: transaction.id,
          reservationId: transaction.reservationId,
          customerName: transaction.customerName,
          customerId: transaction.customerId,
          carModel: transaction.carModel,
          reservationDate: transaction.reservationDate,
          completionDate: transaction.completionDate,
          subtotal: subtotal,
          discountAmount: discountAmount,
          totalPrice: totalPrice,
          services: updatedServices,
          createdAt: new Date(),
        })
      } catch (firebaseError) {
        console.error("Error updating Firebase:", firebaseError)
        // We'll continue even if Firebase update fails
      }

      toast({
        title: `${servicesToAdd.length} Service${servicesToAdd.length > 1 ? "s" : ""} Added`,
        description: `Service${servicesToAdd.length > 1 ? "s have" : " has"} been added to transaction ${transaction.id}`,
        variant: "default",
      })

      // Navigate back to transactions page
      setTimeout(() => {
        setIsLoading(false)
        setIsSubmitting(false)
        router.push("/admin/transactions")
      }, 1000)
    } catch (error) {
      console.error("Error adding services:", error)
      toast({
        title: "Error",
        description: "Failed to add services to the transaction",
        variant: "destructive",
      })
      setIsLoading(false)
      setIsSubmitting(false)
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
                onClick={() => router.push("/admin/transactions")}
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
                          {/* Replace the SelectContent in the mechanic selection dropdown: */}
                          <SelectContent>
                            {activeEmployees.map((employee) => (
                              <SelectItem
                                key={employee.id}
                                value={`${employee.firstName} ${employee.lastName}`.toUpperCase()}
                              >
                                {`${employee.firstName} ${employee.lastName}`.toUpperCase()}
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
                            className={`w-full ${duplicateErrors[row.id] && !isSubmitting ? "border-red-500" : ""}`}
                          />
                          {duplicateErrors[row.id] && !isSubmitting && (
                            <p className="text-red-500 text-sm mt-1">{duplicateErrors[row.id]}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <Select
                            value={row.generalService}
                            onValueChange={(value) => handleInputChange(row.id, "generalService", value)}
                          >
                            <SelectTrigger
                              className={`w-full ${duplicateErrors[row.id] && !isSubmitting ? "border-red-500" : ""}`}
                            >
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
                          {duplicateErrors[row.id] && !isSubmitting && (
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
                  onClick={() => router.push("/admin/transactions")}
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

export default function AddServicePage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <AddServicePageContent />
    </Suspense>
  )
}

