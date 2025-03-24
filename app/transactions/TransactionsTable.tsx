"use client"

import React, { useState } from "react"
import { ChevronUp, ChevronDown, Printer } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Transaction {
  id: string
  reservationDate: string
  customerName: string
  customerId: string
  carModel: string
  completionDate: string
  totalPrice: number
  services?: {
    service: string
    mechanic: string
    price: number
    quantity: number
    discount: number
    total: number
  }[]
}

interface TransactionsTableProps {
  transactions?: Transaction[]
  searchQuery: string
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions = [], searchQuery }) => {
  const router = useRouter()
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof Transaction>("completionDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  // Remove this line:
  // const [filteredAndSortedTransactions, setFilteredAndSortedTransactions] = useState<Transaction[]>(transactions)

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

  const handleAddServiceItem = (reservationId: string) => {
    // Navigate to add service/item page with the specific reservation ID
    router.push(`/transactions/add-service?id=${reservationId}`)
  }

  const handlePrint = () => {
    const transaction = transactions.find((t) => t.id === selectedTransactionId)
    if (transaction) {
      setShowPrintDialog(false)

      // Create a new window for the invoice
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        const currentDate = new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
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
            <p><strong>Customer:</strong> ${transaction.customerName}</p>
            <p><strong>Customer ID:</strong> ${transaction.customerId}</p>
            <p><strong>Car Model:</strong> ${transaction.carModel}</p>
            <p><strong>Completion Date:</strong> ${transaction.completionDate}</p>
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
                  <td>${service.service}</td>
                  <td>${service.mechanic}</td>
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
              <span>${formatCurrency(transaction.totalPrice)}</span>
            </p>
            <p>
              <span class="label">DISCOUNT</span>
              <span>${formatCurrency(0)}</span>
            </p>
            <p>
              <span class="label">TOTAL</span>
              <span>${formatCurrency(transaction.totalPrice)}</span>
            </p>
            <p>
              <span class="label">AMOUNT TENDERED</span>
              <span>${formatCurrency(transaction.totalPrice)}</span>
            </p>
            <p>
              <span class="label">CHANGE</span>
              <span>${formatCurrency(0)}</span>
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
      return new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime() * modifier
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
                    expandedRow && expandedRow !== transaction.id && "opacity-50",
                  )}
                >
                  <td className="px-3 py-4 text-sm text-[#1A365D] text-center" title={transaction.id}>
                    {transaction.id}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] text-center" title={transaction.reservationDate}>
                    {transaction.reservationDate}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] text-center" title={transaction.customerName}>
                    {transaction.customerName}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] text-center" title={transaction.customerId}>
                    {transaction.customerId}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] text-center" title={transaction.carModel}>
                    {transaction.carModel}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] text-center" title={transaction.completionDate}>
                    {transaction.completionDate}
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
                {expandedRow === transaction.id && transaction.services && (
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

                        {/* Service rows */}
                        {transaction.services.map((service, index) => (
                          <div key={index} className="grid grid-cols-6 w-full py-4 border-b border-gray-100">
                            <div className="text-sm text-[#1A365D] font-medium">{service.service}</div>
                            <div className="text-sm text-[#1A365D]">{service.mechanic}</div>
                            <div className="text-sm text-[#1A365D] text-right">{formatCurrency(service.price)}</div>
                            <div className="text-sm text-[#1A365D] text-center">x{service.quantity}</div>
                            <div className="text-sm text-[#EA5455] text-right">{service.discount}%</div>
                            <div className="text-sm text-[#1A365D] text-right">{formatCurrency(service.total)}</div>
                          </div>
                        ))}

                        {/* Summary section */}
                        <div className="grid grid-cols-2 gap-y-2 w-1/3 ml-auto text-right mt-4">
                          <div className="text-sm text-[#8B909A] uppercase">SUBTOTAL</div>
                          <div className="text-sm text-[#1A365D]">{formatCurrency(transaction.totalPrice)}</div>

                          <div className="text-sm text-[#8B909A] uppercase">DISCOUNT</div>
                          <div className="text-sm text-[#EA5455]">{formatCurrency(0)}</div>

                          <div className="text-sm text-[#8B909A] uppercase">TOTAL</div>
                          <div className="text-sm text-[#1A365D] font-bold">
                            {formatCurrency(transaction.totalPrice)}
                          </div>

                          <div className="text-sm text-[#8B909A] uppercase">AMOUNT TENDERED</div>
                          <div className="text-sm text-[#1A365D]">{formatCurrency(transaction.totalPrice)}</div>

                          <div className="text-sm text-[#8B909A] uppercase">CHANGE</div>
                          <div className="text-sm text-[#1A365D]">{formatCurrency(0)}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

