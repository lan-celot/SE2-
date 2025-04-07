"use client"

import React, { useState, useEffect, useRef } from "react"
import { ChevronUp, ChevronDown, Printer, Save } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/admin-components/dialog"
import { Button } from "@/components/admin-components/button"
import { Input } from "@/components/admin-components/input"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useResponsiveRows } from "@/hooks/use-responsive-rows"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, orderBy, type Timestamp, updateDoc, doc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { formatDateTime } from "@/lib/date-utils"
import Loading from "@/components/admin-components/loading"

interface TransactionsTableProps {
  searchQuery: string
}

interface ServiceItem {
  service: string
  mechanic: string
  price: number
  quantity: number
  discount: number
  total: number
}

interface CarDetails {
  yearModel: string
  transmission: string
  fuelType: string
  odometer: string
  plateNo: string
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
  services: ServiceItem[]
  carDetails?: CarDetails
  createdAt: Date
  amountTendered?: number
}

// Type for Firestore date-like values
type DateValue = Date | Timestamp | string | number | null | undefined;

const TransactionsTable: React.FC<TransactionsTableProps> = ({ searchQuery }) => {
  // Better function to handle Firestore timestamp conversion to readable date
  const formatFirestoreDate = (dateValue: DateValue): string => {
    if (!dateValue) return "---";
    
    try {
      // If it's a Firestore timestamp
      if (dateValue && typeof (dateValue as Timestamp).toDate === 'function') {
        const date = (dateValue as Timestamp).toDate();
        return date.toISOString().split('T')[0].replace(/-/g, '-');
      }
      
      // If it's a JavaScript Date object
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0].replace(/-/g, '-');
      }
      
      // If it's a string that might be in ISO format or another date format
      if (typeof dateValue === 'string') {
        // Check if it's already formatted with dashes yyyy-mm-dd
        if (/\d{4}-\d{2}-\d{2}/.test(dateValue)) {
          return dateValue;
        }
        
        // Try to parse it as a date
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0].replace(/-/g, '-');
        }
      }
      
      // If it's a number (timestamp)
      if (typeof dateValue === 'number') {
        const date = new Date(dateValue);
        return date.toISOString().split('T')[0].replace(/-/g, '-');
      }
      
      return String(dateValue) || "---";
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
      return "---";
    }
  };

  // Update the display in the table to use a consistent date formatter
  const renderDate = (dateString: string): string => {
    if (!dateString || dateString === "---" || dateString === "INVALID DATE" || dateString === "Pending") {
      return dateString;
    }
    
    try {
      // Try to standardize date display
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0].replace(/-/g, '-');
      }
      return dateString;
    } catch (error) {
      console.error("Error rendering date:", error, dateString);
      return dateString;
    }
  };

  // Function to create transaction object from Firestore document
  // Improved function to get mechanic from different possible data structures
const getMechanicName = (service: any, data: DocumentData, index: number): string => {
  // First check the service object itself if mechanic is directly assigned
  if (typeof service === 'object' && service.mechanic) {
    return service.mechanic;
  }
  
  // Check if there's a mechanics array matching the services array
  if (data.mechanics && Array.isArray(data.mechanics) && data.mechanics.length > index) {
    if (data.mechanics[index]) {
      return data.mechanics[index];
    }
  }
  
  // Check if there's a transactionServices array with detailed service info
  if (data.transactionServices && Array.isArray(data.transactionServices)) {
    const transactionService = data.transactionServices.find((ts: any) => {
      if (typeof service === 'string') {
        return ts.service === service;
      } else if (service.service) {
        return ts.service === service.service;
      } else if (service.name) {
        return ts.service === service.name;
      }
      return false;
    });
    
    if (transactionService && transactionService.mechanic) {
      return transactionService.mechanic;
    }
  }
  
  // Fall back to a global mechanic if specified
  if (data.mechanic) {
    return data.mechanic;
  }
  
  return "UNASSIGNED";
};

// Function to create transaction object from Firestore document - FIXED VERSION
const createTransaction = (doc: QueryDocumentSnapshot<DocumentData>, data: DocumentData): Transaction | null => {
  try {
    console.log(`Processing booking data for ${doc.id}:`, data);
    
    // Get customer information - normalized
    let customerName = data.customerName || "Unknown Customer";
    
    // Try other possible locations for customer name
    if (customerName === "Unknown Customer") {
      if (data.firstName && data.lastName) {
        customerName = `${data.firstName} ${data.lastName}`;
      } else if (data.customer) {
        if (typeof data.customer === 'string') {
          customerName = data.customer;
        } else if (data.customer.name) {
          customerName = data.customer.name;
        } else if (data.customer.fullName) {
          customerName = data.customer.fullName;
        } else if (data.customer.firstName && data.customer.lastName) {
          customerName = `${data.customer.firstName} ${data.customer.lastName}`;
        }
      }
    }
    
    // Get customer ID
    let customerId = data.customerId || data.customerUid || data.userId || "---";
    
    // Get completion date
    let completionDate = "Pending"
    if (data.status === "COMPLETED") {
      // First check for dedicated completion timestamp
      if (data.completedAt) {
        completionDate = formatFirestoreDate(data.completedAt);
      } else if (data.completionDate) {
        completionDate = formatFirestoreDate(data.completionDate);
      } else {
        // Use updated at time or current time as fallback
        completionDate = formatFirestoreDate(data.updatedAt || new Date());
      }
    }
    
    // Get reservation date
    const reservationDate = formatFirestoreDate(data.date || data.reservationDate);
    
    // Try to get services from different possible fields
    let servicesList: ServiceItem[] = [];
    
    // First check if there are any transactionServices with proper formatting
    if (data.transactionServices && Array.isArray(data.transactionServices) && data.transactionServices.length > 0) {
      servicesList = data.transactionServices.map((service: any) => ({
        service: typeof service === 'string' ? service : service.service || "Unknown Service",
        mechanic: typeof service === 'object' ? service.mechanic || "UNASSIGNED" : "UNASSIGNED",
        price: typeof service === 'object' ? service.price || 0 : 0,
        quantity: typeof service === 'object' ? service.quantity || 1 : 1,
        discount: typeof service === 'object' ? service.discount || 0 : 0,
        total: typeof service === 'object' ? 
          service.total || (service.price * (service.quantity || 1) * (1 - (service.discount || 0) / 100)) : 0
      }));
    } 
    // Next, try to get services from generalServices
    else if (data.generalServices && Array.isArray(data.generalServices) && data.generalServices.length > 0) {
      servicesList = data.generalServices.map((service: any, index: number) => {
        const mechanic = getMechanicName(service, data, index);
        
        // Check if the service is an object or string
        if (typeof service === 'object') {
          return {
            service: service.name || service.service || "Unknown Service",
            mechanic: mechanic,
            price: service.price || 0,
            quantity: service.quantity || 1,
            discount: service.discount || 0,
            total: service.total || (service.price * (service.quantity || 1) * (1 - (service.discount || 0) / 100))
          };
        } else {
          return {
            service: service,
            mechanic: mechanic,
            price: data.price || 0,
            quantity: 1,
            discount: 0,
            total: data.price || 0
          };
        }
      });
    }
    // Fall back to services array
    else if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      servicesList = data.services.map((service: any, index: number) => {
        const mechanic = getMechanicName(service, data, index);
        
        return {
          service: typeof service === 'object' ? service.name || service.service || "Unknown Service" : service,
          mechanic: mechanic,
          price: typeof service === 'object' ? service.price || 0 : data.price || 0,
          quantity: typeof service === 'object' ? service.quantity || 1 : 1,
          discount: typeof service === 'object' ? service.discount || 0 : 0,
          total: typeof service === 'object' ? 
            service.total || (service.price * (service.quantity || 1) * (1 - (service.discount || 0) / 100)) : 
            data.price || 0
        };
      });
    } 
    // Create a default service if no service info is found
    else {
      servicesList = [{
        service: "General Service",
        mechanic: data.mechanic || "UNASSIGNED",
        price: data.totalPrice || data.price || 0,
        quantity: 1,
        discount: 0,
        total: data.totalPrice || data.price || 0
      }];
    }
    
    // Create transaction object
    const transaction: Transaction = {
      id: doc.id,
      reservationId: doc.id,
      customerName: customerName,
      customerId: customerId,
      carModel: data.carModel || "---",
      reservationDate: reservationDate,
      completionDate: completionDate,
      totalPrice: data.totalPrice || servicesList.reduce((sum: number, service: ServiceItem) => sum + (service.total || 0), 0),
      services: servicesList,
      carDetails: data.carDetails || {
        yearModel: data.yearModel || "",
        transmission: data.transmission || "",
        fuelType: data.fuelType || "",
        odometer: data.odometer || "",
        plateNo: data.plateNo || "",
      },
      createdAt: data.date 
        ? (typeof (data.date as Timestamp).toDate === 'function' ? (data.date as Timestamp).toDate() : new Date(data.date)) 
        : new Date(),
      amountTendered: data.amountTendered || 0,
    };
  
    return transaction;
  } catch (error) {
    console.error(`Error creating transaction from doc ${doc.id}:`, error);
    return null;
  }
};

  // Format price for display with ₱ symbol and commas
  const formatPriceForDisplay = (price: number): string => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Parse input price string to number
  const parseInputPrice = (value: string): number => {
    // Remove currency symbol, commas, and non-numeric characters except decimal point
    const numericValue = value.replace(/₱|,/g, "").replace(/[^\d.]/g, "")

    // Handle decimal point - ensure only one decimal point
    const parts = numericValue.split(".")
    if (parts.length > 2) {
      // Keep only the first decimal point
      const cleanValue = parts[0] + "." + parts.slice(1).join("")
      return cleanValue ? Number.parseFloat(cleanValue) : 0
    }

    return numericValue ? Number.parseFloat(numericValue) : 0
  }

  // Function to format quantity input for display while typing
  const formatQuantityWhileTyping = (value: string): string => {
    // Remove 'x' prefix and non-numeric characters
    const numericValue = value.replace(/^x/, "").replace(/\D/g, "")

    if (!numericValue) return ""

    return `x${numericValue}`
  }

  const router = useRouter()
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof Transaction>("reservationDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [editedTransactions, setEditedTransactions] = useState<Record<string, Transaction>>({})
  const [savingTransactionId, setSavingTransactionId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [priceInputs, setPriceInputs] = useState<Record<string, Record<number, string>>>({})
  const [amountTenderedInputs, setAmountTenderedInputs] = useState<Record<string, string>>({})
  const initializedRef = useRef(false)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const responsiveRowCount = useResponsiveRows(180)
  // Use custom hook for responsive rows or fallback to a default
  const itemsPerPage = isClient ? responsiveRowCount || 5 : 5

  // Track if component is mounted on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch bookings from Firebase
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true)
        console.log("Fetching bookings...")
  
        // Create a query to get all bookings
        const bookingsRef = collection(db, "bookings")
        
        // Simple query without status filter to get all bookings
        const bookingsQuery = query(bookingsRef, where("status", "==", "COMPLETED"))
  
        const querySnapshot = await getDocs(bookingsQuery)
        console.log(`Query returned ${querySnapshot.size} documents`)
  
        if (querySnapshot.empty) {
          console.log("No bookings found")
          setTransactions([])
          setIsLoading(false)
          return
        }
  
        // Transform booking data to transaction format
        const transformedTransactions: Transaction[] = []
        
        // Process each booking document
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data()
          console.log(`Processing booking: ${docSnapshot.id}`, data)
          
          // Create transaction regardless of status
          const transaction = createTransaction(docSnapshot, data)
          if (transaction) {
            transformedTransactions.push(transaction)
            console.log(`Added transaction for booking ${docSnapshot.id}:`, {
              customerName: transaction.customerName,
              completionDate: transaction.completionDate,
              reservationDate: transaction.reservationDate,
              services: transaction.services.map(s => `${s.service} (${s.mechanic || 'No mechanic'})`)
            })
          }
          
          // Check if there's a corresponding "addedServices" subcollection
          // Look for added services in subcollections
try {
  const addedServicesRef = collection(db, `bookings/${docSnapshot.id}/addedServices`);
  const addedServicesSnapshot = await getDocs(addedServicesRef);
  
  if (!addedServicesSnapshot.empty) {
    console.log(`Found ${addedServicesSnapshot.size} added services for booking ${docSnapshot.id}`);
    
    // Get all added services
    const addedServices: ServiceItem[] = [];
    
    addedServicesSnapshot.forEach(serviceDoc => {
      const serviceData = serviceDoc.data();
      addedServices.push({
        service: serviceData.name || serviceData.service || "Additional Service",
        mechanic: serviceData.mechanic || "UNASSIGNED",
        price: serviceData.price || 0,
        quantity: serviceData.quantity || 1,
        discount: serviceData.discount || 0,
        total: serviceData.total || (serviceData.price * (serviceData.quantity || 1) * (1 - (serviceData.discount || 0) / 100))
      });
    });
    
    // Find the transaction we just added and update its services
    const transactionIndex = transformedTransactions.findIndex(t => t.id === docSnapshot.id);
    if (transactionIndex >= 0) {
      const existingTransaction = transformedTransactions[transactionIndex];
      
      // Add the new services to the existing ones (avoiding duplicates)
      const updatedServices = [...existingTransaction.services];
      
      // Only add services that aren't already in the list
      addedServices.forEach(newService => {
        const exists = updatedServices.some(
          existingService => existingService.service === newService.service
        );
        
        if (!exists) {
          updatedServices.push(newService);
        }
      });
      
      // Recalculate total price
      const updatedTotalPrice = updatedServices.reduce((sum, service) => sum + (service.total || 0), 0);
      
      // Update the transaction
      transformedTransactions[transactionIndex] = {
        ...existingTransaction,
        services: updatedServices,
        totalPrice: updatedTotalPrice
      };
    }
  }
} catch (error) {
  console.error(`Error fetching added services for booking ${docSnapshot.id}:`, error);
}
        }
  
        console.log(`Processed ${transformedTransactions.length} bookings`)
        
        // Sort by reservation date descending by default
        const sortedTransactions = [...transformedTransactions].sort((a, b) => {
          try {
            const dateA = new Date(a.reservationDate)
            const dateB = new Date(b.reservationDate)
            
            // If both dates are valid, compare them
            if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
              return dateB.getTime() - dateA.getTime()
            }
            
            // If one date is invalid, move it to the end
            if (isNaN(dateA.getTime())) return 1
            if (isNaN(dateB.getTime())) return -1
            
            return 0
          } catch (error) {
            console.error("Error sorting dates:", error)
            return 0
          }
        })
        
        setTransactions(sortedTransactions)
  
        // Initialize edited transactions
        const transactionsMap: Record<string, Transaction> = {}
        const initialPriceInputs: Record<string, Record<number, string>> = {}
        const initialAmountTenderedInputs: Record<string, string> = {}
  
        sortedTransactions.forEach((transaction) => {
          transactionsMap[transaction.id] = {
            ...transaction,
            amountTendered: transaction.amountTendered || 0,
          }
  
          // Initialize price inputs
          initialPriceInputs[transaction.id] = {}
          transaction.services.forEach((service, index) => {
            initialPriceInputs[transaction.id][index] =
              service.price > 0
                ? `₱${service.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : ""
          })
  
          // Initialize amount tendered inputs
          initialAmountTenderedInputs[transaction.id] =
            transaction.amountTendered && transaction.amountTendered > 0
              ? `₱${transaction.amountTendered.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : ""
        })
  
        setEditedTransactions(transactionsMap)
        setPriceInputs(initialPriceInputs)
        setAmountTenderedInputs(initialAmountTenderedInputs)
        initializedRef.current = true
      } catch (error) {
        console.error("Error fetching bookings:", error)
        toast({
          title: "Error",
          description: "Failed to load transactions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  
    if (isClient) {
      fetchBookings()
    }
  }, [isClient, toast])

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleAddServiceItem = (transactionId: string) => {
    // Debug log
    console.log(`Navigating to add service with transaction ID: ${transactionId}`)
  
    // Navigate to add service/item page with the specific transaction ID
    router.push(`/admin/transactions/add-service?id=${transactionId}`)
  }
  // Calculate subtotal, discount amount, and total price
  const calculatePrices = (services: ServiceItem[]) => {
    const subtotal = services.reduce((sum, service) => sum + service.price * service.quantity, 0)
    const discountAmount = services.reduce(
      (sum, service) => sum + (service.price * service.quantity * service.discount) / 100,
      0,
    )
    const totalPrice = subtotal - discountAmount

    return { subtotal, discountAmount, totalPrice }
  }

  // Handle price input change
  const handlePriceInputChange = (transactionId: string, serviceIndex: number, value: string) => {
    // If backspacing to empty or just the symbol, clear it
    if (value === "₱" || value === "") {
      setPriceInputs((prev) => {
        const transactionInputs = prev[transactionId] || {}
        return {
          ...prev,
          [transactionId]: {
            ...transactionInputs,
            [serviceIndex]: "",
          },
        }
      })

      // Also update the actual price in the transaction
      handleServiceChange(transactionId, serviceIndex, "price", "")
      return
    }

    // Remove currency symbol and non-numeric chars except decimal
    value = value.replace(/₱/g, "").replace(/[^\d.]/g, "")

    // Format with peso sign
    const formattedValue = value ? `₱${value}` : ""

    // Update the input state
    setPriceInputs((prev) => {
      const transactionInputs = prev[transactionId] || {}
      return {
        ...prev,
        [transactionId]: {
          ...transactionInputs,
          [serviceIndex]: formattedValue,
        },
      }
    })

    // Also update the actual price in the transaction
    handleServiceChange(transactionId, serviceIndex, "price", formattedValue)
  }

  // Handle price input blur
  const handlePriceInputBlur = (transactionId: string, serviceIndex: number, value: string) => {
    // Format properly on blur
    if (!value || value === "₱") {
      setPriceInputs((prev) => {
        const transactionInputs = prev[transactionId] || {}
        return {
          ...prev,
          [transactionId]: {
            ...transactionInputs,
            [serviceIndex]: "",
          },
        }
      })

      handleServiceChange(transactionId, serviceIndex, "price", "")
      return
    }

    // Extract numeric value
    const numericValue = value.replace(/₱/g, "")

    // Format with commas and proper decimal places
    try {
      const number = Number.parseFloat(numericValue)
      if (!isNaN(number)) {
        const formatted = `₱${number.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`

        // Update the input state
        setPriceInputs((prev) => {
          const transactionInputs = prev[transactionId] || {}
          return {
            ...prev,
            [transactionId]: {
              ...transactionInputs,
              [serviceIndex]: formatted,
            },
          }
        })

        // Also update the actual price in the transaction
        handleServiceChange(transactionId, serviceIndex, "price", formatted)
      }
    } catch (error) {
      // Keep as is if parsing fails
    }
  }

  // Handle amount tendered input change
  const handleAmountTenderedInputChange = (transactionId: string, value: string) => {
    // If backspacing to empty or just the symbol, clear it
    if (value === "₱" || value === "") {
      setAmountTenderedInputs((prev) => ({
        ...prev,
        [transactionId]: "",
      }))

      // Also update the actual amount tendered in the transaction
      handleAmountTenderedChange(transactionId, "")
      return
    }

    // Remove currency symbol and non-numeric chars except decimal
    value = value.replace(/₱/g, "").replace(/[^\d.]/g, "")

    // Format with peso sign
    const formattedValue = value ? `₱${value}` : ""

    // Update the input state
    setAmountTenderedInputs((prev) => ({
      ...prev,
      [transactionId]: formattedValue,
    }))

    // Also update the actual amount tendered in the transaction
    handleAmountTenderedChange(transactionId, formattedValue)
  }

  // Handle amount tendered input blur
  const handleAmountTenderedInputBlur = (transactionId: string, value: string) => {
    // Format properly on blur
    if (!value || value === "₱") {
      setAmountTenderedInputs((prev) => ({
        ...prev,
        [transactionId]: "",
      }))

      handleAmountTenderedChange(transactionId, "")
      return
    }

    // Extract numeric value
    const numericValue = value.replace(/₱/g, "")

    // Format with commas and proper decimal places
    try {
      const number = Number.parseFloat(numericValue)
      if (!isNaN(number)) {
        const formatted = `₱${number.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`

        // Update the input state
        setAmountTenderedInputs((prev) => ({
          ...prev,
          [transactionId]: formatted,
        }))

        // Also update the actual amount tendered in the transaction
        handleAmountTenderedChange(transactionId, formatted)
      }
    } catch (error) {
      // Keep as is if parsing fails
    }
  }

  // Handle service changes
  const handleServiceChange = (transactionId: string, serviceIndex: number, field: string, value: string | number) => {
    setEditedTransactions((prev) => {
      const transaction = { ...prev[transactionId] }
      const services = [...transaction.services]
      const service = { ...services[serviceIndex] }

      // Handle specific field changes
      if (field === "price") {
        // Parse price input
        service.price = typeof value === "string" ? parseInputPrice(value) : value as number
        // Recalculate total
        service.total = service.price * service.quantity * (1 - service.discount / 100)
      } else if (field === "quantity") {
        // Parse quantity input
        service.quantity = typeof value === "string" ? Number.parseInt(value.replace(/\D/g, "")) || 1 : value as number
        // Recalculate total
        service.total = service.price * service.quantity * (1 - service.discount / 100)
      } else if (field === "discount") {
        // Parse discount input
        service.discount = typeof value === "string" ? Number.parseInt(value.replace(/\D/g, "")) || 0 : value as number
        // Recalculate total
        service.total = service.price * service.quantity * (1 - service.discount / 100)
      } else {
        // Handle other fields - we need a type assertion here because TypeScript doesn't know what fields might exist
        (service as any)[field] = value
      }

      services[serviceIndex] = service

      // Recalculate total price for the transaction
      const totalPrice = services.reduce((sum, s) => sum + s.total, 0)

      return {
        ...prev,
        [transactionId]: {
          ...transaction,
          services,
          totalPrice,
        },
      }
    })
  }

  // Handle amount tendered changes
  const handleAmountTenderedChange = (transactionId: string, value: string) => {
    // Convert input string to a number
    const amountTendered = parseInputPrice(value)

    setEditedTransactions((prev) => {
      const transaction = { ...prev[transactionId] }
      return {
        ...prev,
        [transactionId]: {
          ...transaction,
          amountTendered,
        },
      }
    })
  }

  // Format input values for display
  const formatInputValue = (field: string, value: number) => {
    if (field === "price") {
      return `₱${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else if (field === "quantity") {
      return `x${value}`
    } else if (field === "discount") {
      return `${value}%`
    }
    return value.toString()
  }

  const saveTransactionChanges = async (transactionId: string) => {
    try {
      setSavingTransactionId(transactionId)
      const transaction = editedTransactions[transactionId]
  
      // Calculate values from services to ensure consistency
      const { subtotal, discountAmount, totalPrice } = calculatePrices(transaction.services)
  
      // Update the transactions array
      const updatedTransactions = transactions.map((t) => {
        if (t.id === transactionId) {
          return {
            ...t,
            services: transaction.services,
            totalPrice: totalPrice,
            completionDate: formatFirestoreDate(new Date()), // Set current date as completion date
            amountTendered: transaction.amountTendered || 0,
          }
        }
        return t
      })
  
      // Update state
      setTransactions(updatedTransactions)
  
      // Update in Firebase
      try {
        // First, try to update the existing booking document
        const bookingRef = doc(db, "bookings", transactionId)
  
        // Update the booking with transaction data and completion info
        await updateDoc(bookingRef, {
          transactionServices: transaction.services,
          services: transaction.services.map((s) => s.service),
          totalPrice: totalPrice,
          amountTendered: transaction.amountTendered || 0,
          subtotal: subtotal,
          discountAmount: discountAmount,
          status: "COMPLETED", // Ensure status is set to COMPLETED
          completedAt: new Date(), // Add timestamp of completion
          updatedAt: new Date(),
        })
  
        console.log("Successfully updated booking in Firebase")
  
        // Also save to transactions collection if needed
        const transactionsRef = collection(db, "transactions")
        await addDoc(transactionsRef, {
          reservationId: transaction.reservationId,
          customerName: transaction.customerName,
          customerId: transaction.customerId,
          carModel: transaction.carModel,
          reservationDate: transaction.reservationDate,
          completionDate: formatFirestoreDate(new Date()),
          subtotal: subtotal,
          discountAmount: discountAmount,
          totalPrice: totalPrice,
          amountTendered: transaction.amountTendered || 0,
          services: transaction.services,
          status: "COMPLETED",
          createdAt: new Date(),
        })
      } catch (error) {
        console.error("Error saving to Firebase:", error)
        // Continue since we already updated the state
      }
  
      toast({
        title: "Transaction Saved",
        description: "The transaction has been successfully saved and marked as completed",
        variant: "default",
      })
    } catch (error) {
      console.error("Error saving transaction:", error)
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      })
    } finally {
      setSavingTransactionId(null)
    }
  }
  
  const handlePrint = () => {
    const transaction = selectedTransactionId ? editedTransactions[selectedTransactionId] : null
    if (transaction) {
      setShowPrintDialog(false)

      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        console.error("Failed to open print window")
        return
      }

      // Calculate transaction details
      const { subtotal, discountAmount } = calculatePrices(transaction.services)
      const totalPrice = transaction.totalPrice
      const change = (transaction.amountTendered || 0) - transaction.totalPrice
      const currentDate = new Date().toLocaleDateString()

      // Generate HTML content for the receipt
      const receiptHTML = `
        <html>
          <head>
            <title>Invoice - ${transaction.id}</title>
            <style>
              body { 
                font-family: Arial, sans-serif;
                margin: 40px;
                color: #000;
              }
              .date-invoice {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
              }
              .header h1 {
                margin: 0 0 10px 0;
                font-size: 24px;
              }
              .header p {
                margin: 0;
                font-size: 14px;
              }
              .details {
                margin-bottom: 30px;
                font-size: 14px;
              }
              .details p {
                margin: 5px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 14px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #f8f8f8;
              }
              .total {
                text-align: right;
                font-size: 14px;
                font-weight: bold;
              }
              .totals-section {
                width: 300px;
                margin-left: auto;
                text-align: right;
              }
              .totals-section p {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 14px;
              }
              .totals-section .label {
                color: #666;
              }
              @media print {
                body { margin: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="date-invoice">
              <div>${currentDate}</div>
              <div>Invoice - ${transaction.id}</div>
            </div>
            <div class="header">
              <h1>Invoice</h1>
              <p>Transaction ID: ${transaction.id}</p>
            </div>
            <div class="details">
              <p><strong>Customer:</strong> ${transaction.customerName || "-----"}</p>
              <p><strong>Customer ID:</strong> ${transaction.customerId || "-----"}</p>
              <p><strong>Car Model:</strong> ${transaction.carModel || "-----"}</p>
              <p><strong>Completion Date:</strong> ${transaction.completionDate || "-----"}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Mechanic</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Discount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${
                  transaction.services
                    ?.map(
                      (service) => `
                  <tr>
                    <td>${service.service || "-----"}</td>
                    <td>${service.mechanic || "-----"}</td>
                    <td>${formatCurrency(service.price)}</td>
                    <td>${service.quantity}</td>
                    <td>${service.discount}%</td>
                    <td>${formatCurrency(service.total)}</td>
                  </tr>
                `,
                    )
                    .join("") || ""
                }
              </tbody>
            </table>
            <div class="totals-section">
              <p>
                <span class="label">SUBTOTAL</span>
                <span>${formatCurrency(subtotal)}</span>
              </p>
              <p>
                <span class="label">DISCOUNT</span>
                <span>${formatCurrency(discountAmount)}</span>
              </p>
              <p>
                <span class="label">TOTAL</span>
                <span>${formatCurrency(totalPrice)}</span>
              </p>
              <p>
                <span class="label">AMOUNT TENDERED</span>
                <span>${formatCurrency(transaction.amountTendered || 0)}</span>
              </p>
              <p>
                <span class="label">CHANGE</span>
                <span>${formatCurrency(Math.max(0, (transaction.amountTendered || 0) - totalPrice))}</span>
              </p>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `

      // Write content to the new window and print
      printWindow.document.open()
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
    }
  }

  const filteredTransactions =
    transactions?.filter((transaction) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          transaction.id.toLowerCase().includes(query) ||
          transaction.customerName.toLowerCase().includes(query) ||
          transaction.customerId.toLowerCase().includes(query) ||
          transaction.carModel.toLowerCase().includes(query) ||
          transaction.reservationDate.toLowerCase().includes(query) ||
          transaction.completionDate.toLowerCase().includes(query)
        )
      }
      return true
    }) || []

  // Sort the filtered transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    const modifier = sortOrder === "asc" ? 1 : -1

    if (sortField === "id") {
      return a.id.localeCompare(b.id) * modifier
    }

    if (sortField === "completionDate" || sortField === "reservationDate") {
      try {
        const dateA = new Date(a[sortField]).getTime()
        const dateB = new Date(b[sortField]).getTime()
        
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return (dateA - dateB) * modifier
        }
        
        // Handle invalid dates - move them to the end
        if (isNaN(dateA)) return 1 * modifier
        if (isNaN(dateB)) return -1 * modifier
        
        return 0
      } catch (error) {
        return 0
      }
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * modifier
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * modifier
    }

    return 0
  })

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const currentItems = sortedTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loading />
      </div>
    )
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm overflow-hidden", showPrintDialog && "opacity-50")}>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              {[
                { key: "id", label: "RESERVATION ID", width: "15%" },
                { key: "reservationDate", label: "RESERVATION DATE", width: "15%" },
                { key: "customerName", label: "CUSTOMER NAME", width: "15%" },
                { key: "customerId", label: "CUSTOMER ID", width: "15%" },
                { key: "carModel", label: "CAR MODEL", width: "15%" },
                { key: "completionDate", label: "COMPLETION DATE", width: "15%" },
                { key: "action", label: "ACTION", width: "10%" },
              ].map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.key !== "action" ? (
                    <button
                      className="flex items-center justify-center gap-1 hover:text-[#1A365D] mx-auto"
                      onClick={() => column.key !== "action" && handleSort(column.key as keyof Transaction)}
                    >
                      {column.label}
                      <div className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            "h-3 w-3",
                            sortField === column.key && sortOrder === "asc" ? "text-[#1A365D]" : "text-[#8B909A]",
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            "h-3 w-3",
                            sortField === column.key && sortOrder === "desc" ? "text-[#1A365D]" : "text-[#8B909A]",
                          )}
                        />
                      </div>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentItems.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <tr
                  className={cn(
                    "hover:bg-gray-50 h-[4.5rem]",
                    expandedRow && expandedRow !== transaction.id ? "opacity-50" : "",
                  )}
                >
                  <td className="px-3 py-4 text-sm text-[#1A365D] text-center uppercase" title={transaction.id}>
                    {transaction.id || "-----"}
                  </td>
                  {/* Improved date rendering */}
                  <td
                    className="px-3 py-4 text-sm text-[#1A365D] text-center uppercase"
                    title={transaction.reservationDate}
                  >
                    {renderDate(transaction.reservationDate)}
                  </td>
                  <td
                    className="px-3 py-4 text-sm text-[#1A365D] text-center uppercase"
                    title={transaction.customerName}
                  >
                    {transaction.customerName || "-----"}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] text-center uppercase" title={transaction.customerId}>
                    {transaction.customerId || "-----"}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] text-center uppercase" title={transaction.carModel}>
                    {transaction.carModel || "-----"}
                  </td>
                  <td
                    className="px-3 py-4 text-sm text-[#1A365D] text-center uppercase"
                    title={transaction.completionDate}
                  >
                    {renderDate(transaction.completionDate)}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setExpandedRow(expandedRow === transaction.id ? null : transaction.id)}
                        className="text-[#1A365D] hover:text-[#63B3ED]"
                      >
                        <Image
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector-SksAg0p4n0pZM3et1Y1lcrad0DGitc.svg"
                          alt="View details"
                          width={20}
                          height={20}
                          className={cn("transition-transform", expandedRow === transaction.id && "rotate-180")}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === transaction.id && editedTransactions[transaction.id]?.services && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        {/* Action buttons row */}
                        <div className="flex justify-end mb-4 space-x-2">
                          <Button
                            onClick={() => handleAddServiceItem(transaction.id)}
                            className="bg-[#2A69AC] hover:bg-[#1A365D] text-white text-sm font-medium px-4 py-2 rounded-md"
                          >
                            Add Service / Item
                          </Button>
                          <Button
                            onClick={() => saveTransactionChanges(transaction.id)}
                            className="bg-[#28C76F] hover:bg-[#1F9D57] text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1"
                            disabled={savingTransactionId === transaction.id}
                          >
                            {savingTransactionId === transaction.id ? (
                              "Saving..."
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <button
                            className="p-2 text-[#1A365D] hover:text-[#2a69ac] bg-transparent rounded-full hover:bg-[#EBF8FF]"
                            onClick={() => {
                              setSelectedTransactionId(transaction.id)
                              setShowPrintDialog(true)
                            }}
                          >
                            <Printer className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Table header */}
                        <div className="grid grid-cols-6 w-full">
                          <div className="text-xs font-medium text-[#8B909A] uppercase">SERVICE</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">MECHANIC</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase text-right">PRICE</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase text-center">QUANTITY</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase text-right">DISCOUNT</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase text-right">TOTAL</div>
                        </div>

                        {/* Service rows with editable fields */}
                        {editedTransactions[transaction.id]?.services.map((service, index) => (
                          <div key={index} className="grid grid-cols-6 w-full py-4 border-b border-gray-100">
                            <div className="text-sm text-[#1A365D] font-medium uppercase">
                              {service.service || "-----"}
                            </div>
                            <div className="text-sm text-[#1A365D] uppercase">{service.mechanic || "-----"}</div>

                            {/* Editable price field */}
                            <div className="text-sm text-[#1A365D] text-right">
                              <div className="flex justify-end">
                                <Input
                                  type="text"
                                  placeholder="₱0,000.00"
                                  value={priceInputs[transaction.id]?.[index] || ""}
                                  onChange={(e) => handlePriceInputChange(transaction.id, index, e.target.value)}
                                  onBlur={(e) => handlePriceInputBlur(transaction.id, index, e.target.value)}
                                  className="text-right h-8 px-2 text-[#1A365D] font-medium w-auto max-w-[140px]"
                                />
                              </div>
                            </div>

                            {/* Editable quantity field */}
                            <div className="text-sm text-[#1A365D] text-center">
                              <div className="flex justify-center">
                                <Input
                                  type="text"
                                  value={
                                    // Show formatted value or empty string if one
                                    service.quantity === 1 ? "" : formatQuantityWhileTyping(`x${service.quantity}`)
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value

                                    // If backspacing to empty or just the symbol, clear it
                                    if (value === "x" || value === "") {
                                      handleServiceChange(transaction.id, index, "quantity", "")
                                      return
                                    }

                                    // Otherwise pass the raw input value
                                    handleServiceChange(transaction.id, index, "quantity", value)
                                  }}
                                  className="text-center h-8 px-2 text-[#1A365D] font-medium w-auto max-w-[80px]"
                                  placeholder="x1"
                                />
                              </div>
                            </div>

                            {/* Editable discount field */}
                            <div className="text-sm text-[#EA5455] text-right">
                              <div className="flex justify-end">
                                <Input
                                  type="text"
                                  value={service.discount === 0 ? "" : `${service.discount}%`}
                                  onChange={(e) => {
                                    // Get the current value and new value
                                    const currentValue = service.discount === 0 ? "" : `${service.discount}%`
                                    const newValue = e.target.value

                                    // Check if backspace is being used (value is shorter than current value)
                                    const isBackspacing = newValue.length < currentValue.length

                                    // If backspacing and removing the % sign or emptying the field
                                    if (isBackspacing && (newValue === "" || !newValue.includes("%"))) {
                                      handleServiceChange(transaction.id, index, "discount", "")
                                      return
                                    }

                                    // Normal input handling
                                    let value = newValue

                                    // Remove suffix and non-numeric chars
                                    value = value.replace(/%$/, "").replace(/\D/g, "")

                                    // Format with % suffix
                                    const formattedValue = value ? `${value}%` : ""
                                    handleServiceChange(transaction.id, index, "discount", formattedValue)
                                  }}
                                  className="text-right h-8 px-2 text-[#EA5455] font-medium w-auto max-w-[80px]"
                                  placeholder="0%"
                                />
                              </div>
                            </div>

                            {/* Calculated total */}
                            <div className="text-sm text-[#1A365D] text-right">{formatCurrency(service.total)}</div>
                          </div>
                        ))}

                        {/* Summary section */}
                        <div className="grid grid-cols-2 gap-y-2 w-auto max-w-xs ml-auto text-right mt-4">
                          {/* Calculate subtotal, discount amount, and total */}
                          <div className="text-sm text-[#8B909A] uppercase">SUBTOTAL</div>
                          <div className="text-sm text-[#1A365D]">
                            {formatCurrency(
                              editedTransactions[transaction.id]?.services.reduce(
                                (total, service) => total + service.price * service.quantity,
                                0,
                              ) || 0,
                            )}
                          </div>

                          <div className="text-sm text-[#8B909A] uppercase">DISCOUNT</div>
                          <div className="text-sm text-[#EA5455]">
                            {formatCurrency(
                              editedTransactions[transaction.id]?.services.reduce((total, service) => {
                                // Calculate the discount amount for each service
                                const discountAmount = service.price * service.quantity * (service.discount / 100)
                                return total + discountAmount
                              }, 0) || 0,
                            )}
                          </div>

                          <div className="text-sm text-[#8B909A] uppercase">TOTAL</div>
                          <div className="text-sm text-[#1A365D] font-bold">
                            {formatCurrency(
                              // Subtract discount from subtotal to get the final total
                              (editedTransactions[transaction.id]?.services.reduce(
                                (total, service) => total + service.price * service.quantity,
                                0,
                              ) || 0) -
                                (editedTransactions[transaction.id]?.services.reduce((total, service) => {
                                  const discountAmount = service.price * service.quantity * (service.discount / 100)
                                  return total + discountAmount
                                }, 0) || 0),
                            )}
                          </div>

                          <div className="text-sm text-[#8B909A] uppercase">AMOUNT TENDERED</div>
                          <div className="text-sm text-[#1A365D]">
                            <div className="flex justify-end">
                              <Input
                                type="text"
                                placeholder="₱0,000.00"
                                value={amountTenderedInputs[transaction.id] || ""}
                                onChange={(e) => handleAmountTenderedInputChange(transaction.id, e.target.value)}
                                onBlur={(e) => handleAmountTenderedInputBlur(transaction.id, e.target.value)}
                                className="text-right h-8 px-2 text-[#1A365D] font-medium w-auto max-w-[150px]"
                              />
                            </div>
                          </div>

                          <div className="text-sm text-[#8B909A] uppercase">CHANGE</div>
                          <div className="text-sm text-[#1A365D]">
                            {formatCurrency(
                              Math.max(
                                0,
                                (editedTransactions[transaction.id]?.amountTendered || 0) -
                                  ((editedTransactions[transaction.id]?.services.reduce(
                                    (total, service) => total + service.price * service.quantity,
                                    0,
                                  ) || 0) -
                                    (editedTransactions[transaction.id]?.services.reduce((total, service) => {
                                      const discountAmount = service.price * service.quantity * (service.discount / 100)
                                      return total + discountAmount
                                    }, 0) || 0)),
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {currentItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  No completed reservations found. Complete a reservation to see it here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {currentItems.length > 0 && (
        <div className="flex justify-end px-3 py-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentPage(Math.max(1, currentPage - 1))
                setExpandedRow(null) // Reset expanded row when changing pages
              }}
              disabled={currentPage === 1}
              className={cn(
                "px-3 py-1 rounded-md text-sm",
                currentPage === 1 ? "text-[#8B909A] cursor-not-allowed" : "text-[#1A365D] hover:bg-[#EBF8FF]",
              )}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page)
                  setExpandedRow(null) // Reset expanded row when changing pages
                }}
                className={cn(
                  "px-3 py-1 rounded-md text-sm",
                  currentPage === page ? "bg-[#1A365D] text-white" : "text-[#1A365D] hover:bg-[#EBF8FF]",
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => {
                setCurrentPage(Math.min(totalPages, currentPage + 1))
                setExpandedRow(null) // Reset expanded row when changing pages
              }}
              disabled={currentPage === totalPages}
              className={cn(
                "px-3 py-1 rounded-md text-sm",
                currentPage === totalPages ? "text-[#8B909A] cursor-not-allowed" : "text-[#1A365D] hover:bg-[#EBF8FF]",
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Print this transaction?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => setShowPrintDialog(false)}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#EA5455]/10 border-0"
            >
              No, go back
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#28C76F]/10 border-0"
            >
              Yes, print
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TransactionsTable