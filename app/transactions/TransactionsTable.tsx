"use client"

import React, { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
  transactions: Transaction[]
  searchQuery: string
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, searchQuery }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof Transaction>("completionDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [filteredAndSortedTransactions, setFilteredAndSortedTransactions] = useState<Transaction[]>(transactions)

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder(field === "completionDate" ? "desc" : "asc")
    }

    // Get the current page data before sorting
    const currentPageData = filteredAndSortedTransactions.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    )

    // Sort only the current page data
    const sortedPageData = [...currentPageData].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]
      const modifier = sortOrder === "asc" ? 1 : -1

      if (field === "completionDate") {
        return new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
      }

      if (aValue === undefined || bValue === undefined) {
        return 0
      }

      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0
    })

    // Create a new filtered transactions array with the sorted page
    const newFilteredTransactions = [...filteredAndSortedTransactions]
    for (let i = 0; i < sortedPageData.length; i++) {
      newFilteredTransactions[(currentPage - 1) * itemsPerPage + i] = sortedPageData[i]
    }

    // Update the state
    setFilteredAndSortedTransactions(newFilteredTransactions)
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const filteredTransactions = transactions.filter((transaction) => {
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
  })

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePrint = () => {
    const transaction = transactions.find((t) => t.id === selectedTransactionId)
    if (transaction) {
      setShowPrintDialog(false)
      window.print()
    }
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
                      className="flex items-center gap-1 hover:text-[#1A365D]"
                      onClick={() => column.key !== "action" && handleSort(column.key as keyof Transaction)}
                    >
                      {column.label}
                      {column.key !== "action" && (
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
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedTransactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <tr
                  className={cn(
                    "hover:bg-gray-50 h-[4.5rem]",
                    expandedRow && expandedRow !== transaction.id && "opacity-50",
                  )}
                >
                  <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={transaction.id}>
                    {transaction.id}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={transaction.reservationDate}>
                    {transaction.reservationDate}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={transaction.customerName}>
                    {transaction.customerName}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={transaction.customerId}>
                    {transaction.customerId}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={transaction.carModel}>
                    {transaction.carModel}
                  </td>
                  <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={transaction.completionDate}>
                    {transaction.completionDate}
                  </td>
                  <td className="px-6 py-4">
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
                        <div className="grid grid-cols-6 w-full items-center font-medium text-[#8B909A] mb-2 text-xs">
                          <div className="truncate">SERVICE</div>
                          <div className="truncate">MECHANIC</div>
                          <div className="text-right truncate">PRICE</div>
                          <div className="text-right truncate">QUANTITY</div>
                          <div className="text-right truncate">DISCOUNT</div>
                          <div className="text-right truncate">TOTAL</div>
                        </div>
                        {transaction.services.map((service, index) => (
                          <div key={index} className="grid grid-cols-[25%_20%_15%_10%_15%_15%] w-full items-center">
                            <div className="text-sm text-[#1A365D]">{service.service}</div>
                            <div className="text-sm text-[#1A365D]">{service.mechanic}</div>
                            <div className="text-sm text-[#1A365D]">{formatCurrency(service.price)}</div>
                            <div className="text-sm text-[#1A365D] text-center">x{service.quantity}</div>
                            <div className="text-sm text-[#EA5455]">{service.discount}%</div>
                            <div className="text-sm text-[#1A365D]">{formatCurrency(service.total)}</div>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex justify-end">
                            <div className="grid grid-cols-[1fr_1fr] gap-x-8 gap-y-3 text-sm w-[60%]">
                              <div className="text-[#8B909A] text-left">SUBTOTAL</div>
                              <div className="text-[#1A365D] text-right">{formatCurrency(transaction.totalPrice)}</div>
                              <div className="text-[#8B909A] text-left">DISCOUNT</div>
                              <div className="text-[#EA5455] text-right">{formatCurrency(0)}</div>
                              <div className="text-[#8B909A] text-left">TOTAL</div>
                              <div className="text-[#1A365D] font-semibold text-right">
                                {formatCurrency(transaction.totalPrice)}
                              </div>
                              <div className="text-[#8B909A] text-left">AMOUNT TENDERED</div>
                              <div className="text-[#1A365D] text-right">{formatCurrency(transaction.totalPrice)}</div>
                              <div className="text-[#8B909A] text-left">CHANGE</div>
                              <div className="text-[#1A365D] text-right">{formatCurrency(0)}</div>
                            </div>
                          </div>
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
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
              onClick={() => setCurrentPage(page)}
              className={cn(
                "px-3 py-1 rounded-md text-sm",
                currentPage === page ? "bg-[#1A365D] text-white" : "text-[#1A365D] hover:bg-[#EBF8FF]",
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
            <button
              onClick={() => setShowPrintDialog(false)}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#EA5455]/10"
            >
              No, go back
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#28C76F]/10"
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

