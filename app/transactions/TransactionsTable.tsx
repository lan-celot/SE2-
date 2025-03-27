"use client"

import React, { useState, useEffect, useRef } from "react"
import { ChevronUp, ChevronDown, Printer, Save } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useResponsiveRows } from "@/hooks/use-responsive-rows"
import { db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"
import { toast } from "@/components/ui/use-toast"
// Import the date formatting utility at the top of the file
import { formatDateTime } from "@/lib/date-utils"

interface TransactionsTableProps {
  searchQuery: string
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
  createdAt: Date
  amountTendered?: number
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ searchQuery }) => {
  // Format price for display with commas and two decimal places
  const formatPriceForDisplay = (price: number): string => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format a raw input price string to a number
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
  const [sortField, setSortField] = useState<keyof Transaction>("completionDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [editedTransactions, setEditedTransactions] = useState<Record<string, Transaction>>({})
  const [savingTransactionId, setSavingTransactionId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const initializedRef = useRef(false)

  // Add state to track input values separately from the actual data
  const [priceInputs, setPriceInputs] = useState<Record<string, Record<number, string>>>({})
  const [amountTenderedInputs, setAmountTenderedInputs] = useState<Record<string, string>>({})

  // Replace fixed itemsPerPage with the custom hook
  const itemsPerPage = useResponsiveRows(180) // Adjust header height for search bar

  // Initialize editedTransactions with the original transactions - only once
  useEffect(() => {
    if (!initializedRef.current && transactions.length > 0) {
      const transactionsMap: Record<string, Transaction> = {}
      const initialPriceInputs: Record<string, Record<number, string>> = {}
      const initialAmountTenderedInputs: Record<string, string> = {}

      transactions.forEach((transaction) => {
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
    }
  }, [transactions])

  useEffect(() => {
    // Only run on the client side
    const storedTransactions = localStorage.getItem("transactions")
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions))
      } catch (error) {
        console.error("Error parsing transactions from localStorage:", error)
        setTransactions([])
      }
    }
  }, [])

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
    // Navigate to add service/item page with the specific transaction ID
    router.push(`/transactions/add-service?id=${transactionId}`)
  }

  // Calculate subtotal, discount amount, and total price
  const calculatePrices = (services: Transaction["services"]) => {
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

  // Handle price, quantity, and discount changes
  const handleServiceChange = (transactionId: string, serviceIndex: number, field: string, value: string) => {
    const transaction = editedTransactions[transactionId]
    if (!transaction) return

    const updatedServices = [...transaction.services]
    const service = { ...updatedServices[serviceIndex] }

    // Process the input value based on the field
    if (field === "price") {
      // Handle price input
      if (value === "₱" || value === "") {
        service.price = 0
      } else {
        service.price = parseInputPrice(value)
      }
    } else if (field === "quantity") {
      // Handle quantity input
      if (value === "x" || value === "") {
        service.quantity = 1
      } else {
        // Extract numeric part from the input value
        const numericValue = value.replace(/^x/, "").replace(/\D/g, "")
        service.quantity = numericValue ? Number.parseInt(numericValue) : 1
      }
    } else if (field === "discount") {
      // Handle discount input
      if (value === "%" || value === "") {
        service.discount = 0
      } else {
        const numericValue = value.replace(/%$/, "").replace(/\D/g, "")
        service.discount = numericValue ? Number.parseInt(numericValue) : 0
      }
    }

    // Recalculate the total for this service
    service.total = service.price * service.quantity * (1 - service.discount / 100)
    updatedServices[serviceIndex] = service

    // Recalculate the total price for the transaction
    const { totalPrice } = calculatePrices(updatedServices)

    // Update the edited transaction
    setEditedTransactions({
      ...editedTransactions,
      [transactionId]: {
        ...transaction,
        services: updatedServices,
        totalPrice,
      },
    })
  }

  // Handle amount tendered changes
  const handleAmountTenderedChange = (transactionId: string, value: string) => {
    const transaction = editedTransactions[transactionId]
    if (!transaction) return

    // Check if backspacing to empty or just the symbol
    if (value === "₱" || value === "") {
      setEditedTransactions({
        ...editedTransactions,
        [transactionId]: {
          ...transaction,
          amountTendered: 0,
        },
      })
      return
    }

    // Parse the input value to a number
    const amountTendered = parseInputPrice(value)

    // Update the transaction with the new amount tendered
    setEditedTransactions({
      ...editedTransactions,
      [transactionId]: {
        ...transaction,
        amountTendered,
      },
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

  // Save transaction changes to the database and localStorage
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
            amountTendered: transaction.amountTendered || 0,
          }
        }
        return t
      })

      // Save to localStorage
      setTransactions(updatedTransactions)
      localStorage.setItem("transactions", JSON.stringify(updatedTransactions))

      // Update the input state values to reflect the saved values
      const updatedPriceInputs = { ...priceInputs }
      if (!updatedPriceInputs[transactionId]) {
        updatedPriceInputs[transactionId] = {}
      }

      transaction.services.forEach((service, index) => {
        updatedPriceInputs[transactionId][index] =
          service.price > 0
            ? `₱${service.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : ""
      })
      setPriceInputs(updatedPriceInputs)

      // Update amount tendered input
      const updatedAmountTenderedInputs = { ...amountTenderedInputs }
      updatedAmountTenderedInputs[transactionId] =
        transaction.amountTendered && transaction.amountTendered > 0
          ? `₱${transaction.amountTendered.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : ""
      setAmountTenderedInputs(updatedAmountTenderedInputs)

      // Try to save to Firebase if available
      try {
        // Save to transactions collection if it doesn't exist yet
        const transactionsRef = collection(db, "transactions")
        await addDoc(transactionsRef, {
          reservationId: transaction.reservationId,
          customerName: transaction.customerName,
          customerId: transaction.customerId,
          carModel: transaction.carModel,
          reservationDate: transaction.reservationDate,
          completionDate: transaction.completionDate,
          subtotal: subtotal,
          discountAmount: discountAmount,
          totalPrice: totalPrice,
          amountTendered: transaction.amountTendered || 0,
          services: transaction.services,
          createdAt: new Date(),
        })
      } catch (error) {
        console.error("Error saving to Firebase:", error)
        // Continue since we already saved to localStorage
      }

      toast({
        title: "Transaction Saved",
        description: "The transaction has been successfully saved",
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
    const transaction = editedTransactions[selectedTransactionId || ""]
    if (transaction) {
      setShowPrintDialog(false)

      // Calculate totals for printing
      const { subtotal, discountAmount, totalPrice } = calculatePrices(transaction.services)

      // Create a new window for the invoice
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        // In the print function, update the date formatting:
        const currentDate = new Date().toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })

        printWindow.document.write(`
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
        </body>
      </html>
    `)
        printWindow.document.close()
        printWindow.print()
      }
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
      return (new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()) * modifier
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
                  {/* In the table rows where reservation dates and completion dates are displayed: */}
                  <td
                    className="px-3 py-4 text-sm text-[#1A365D] text-center uppercase"
                    title={formatDateTime(transaction.reservationDate)}
                  >
                    {formatDateTime(transaction.reservationDate) || "-----"}
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
                    title={formatDateTime(transaction.completionDate)}
                  >
                    {formatDateTime(transaction.completionDate) || "-----"}
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
                              <Input
                                type="text"
                                placeholder="₱0,000.00"
                                value={priceInputs[transaction.id]?.[index] || ""}
                                onChange={(e) => handlePriceInputChange(transaction.id, index, e.target.value)}
                                onBlur={(e) => handlePriceInputBlur(transaction.id, index, e.target.value)}
                                className="text-right h-8 px-2 text-[#1A365D] font-medium"
                              />
                            </div>

                            {/* Editable quantity field */}
                            <div className="text-sm text-[#1A365D] text-center">
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
                                className="text-center h-8 px-2 text-[#1A365D] font-medium"
                                placeholder="x1"
                              />
                            </div>

                            {/* Editable discount field */}
                            <div className="text-sm text-[#EA5455] text-right">
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
                                className="text-right h-8 px-2 text-[#EA5455] font-medium"
                                placeholder="0%"
                              />
                            </div>

                            {/* Calculated total */}
                            <div className="text-sm text-[#1A365D] text-right">{formatCurrency(service.total)}</div>
                          </div>
                        ))}

                        {/* Summary section */}
                        <div className="grid grid-cols-2 gap-y-2 w-1/3 ml-auto text-right mt-4">
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
                            <Input
                              type="text"
                              placeholder="₱0,000.00"
                              value={amountTenderedInputs[transaction.id] || ""}
                              onChange={(e) => handleAmountTenderedInputChange(transaction.id, e.target.value)}
                              onBlur={(e) => handleAmountTenderedInputBlur(transaction.id, e.target.value)}
                              className="text-right h-8 px-2 text-[#1A365D] font-medium"
                            />
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
            <Button
              onClick={() => setShowPrintDialog(false)}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#EA5455]/10 border-0"
            >
              No, go back
            </Button>
            <Button
              onClick={handlePrint}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#28C76F]/10 border-0"
            >
              Yes, print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TransactionsTable

