"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"
import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Service {
  service: string
  mechanic: string
  price: number
  quantity: number
  discount: number
  total: number
}

interface Transaction {
  id: string
  reservationDate: string
  customerName: string
  customerId: string
  carModel: string
  completionDate: string
  totalPrice: number
  services?: Service[]
}

const initialTransactions: Transaction[] = [
  {
    id: "#R00092",
    reservationDate: "11-07-24 12:00 PM",
    customerName: "JOANNE JOAQUIN",
    customerId: "#C00091",
    carModel: "TOYOTA HILUX",
    completionDate: "11-08-24 12:00 PM",
    totalPrice: 8000.0,
    services: [
      {
        service: "BRAKE CLEAN",
        mechanic: "MARCIAL TAMONDONG",
        price: 1000.0,
        quantity: 1,
        discount: 0,
        total: 1000.0,
      },
      {
        service: "OIL CHANGE",
        mechanic: "KOBE BRYANT",
        price: 1000.0,
        quantity: 1,
        discount: 0,
        total: 1000.0,
      },
      {
        service: "BRAKE SHOES REPLACE",
        mechanic: "TIM DUNCAN",
        price: 3000.0,
        quantity: 2,
        discount: 0,
        total: 6000.0,
      },
    ],
  },
  {
    id: "#R00091",
    reservationDate: "11-06-24 8:00 PM",
    customerName: "VINCE DELOS SANTOS",
    customerId: "#C00092",
    carModel: "TOYOTA RAIZE",
    completionDate: "11-07-24 8:00 PM",
    totalPrice: 5000.0,
  },
  {
    id: "#R00090",
    reservationDate: "11-05-24 7:00 PM",
    customerName: "REINIER DRIS",
    customerId: "#C00090",
    carModel: "MITSUBISHI XPANDER",
    completionDate: "11-06-24 7:00 PM",
    totalPrice: 2000.0,
  },
  {
    id: "#R00089",
    reservationDate: "11-04-24 3:00 PM",
    customerName: "JOULET CASQUEJO",
    customerId: "#C00089",
    carModel: "TOYOTA VIOS",
    completionDate: "11-05-24 3:00 PM",
    totalPrice: 3000.0,
  },
  {
    id: "#R00088",
    reservationDate: "11-04-24 2:00 PM",
    customerName: "RAVEN BAYABORDA",
    customerId: "#C00088",
    carModel: "HYUNDAI ACCENT",
    completionDate: "11-05-24 2:00 PM",
    totalPrice: 4000.0,
  },
  {
    id: "#R00087",
    reservationDate: "10-30-24 3:00 PM",
    customerName: "RK SARDENIA",
    customerId: "#C00087",
    carModel: "TOYOTA HILUX",
    completionDate: "10-31-24 3:00 PM",
    totalPrice: 6000.0,
  },
  {
    id: "#R00086",
    reservationDate: "10-30-24 8:00 AM",
    customerName: "SHELDON COOPER",
    customerId: "#C00086",
    carModel: "TOYOTA RUSH",
    completionDate: "10-31-24 8:00 AM",
    totalPrice: 7000.0,
  },
  {
    id: "#R00085",
    reservationDate: "10-29-24 5:00 PM",
    customerName: "LEBRON JAMES",
    customerId: "#C00085",
    carModel: "HONDA CITY",
    completionDate: "10-30-24 5:00 PM",
    totalPrice: 3500.0,
  },
  {
    id: "#R00083",
    reservationDate: "10-29-24 3:00 PM",
    customerName: "MICHAEL JORDAN",
    customerId: "#C00084",
    carModel: "NISSAN NAVARA",
    completionDate: "10-30-24 5:00 PM",
    totalPrice: 4500.0,
  },
  {
    id: "#R00082",
    reservationDate: "10-29-24 1:00 PM",
    customerName: "ROSS GELLER",
    customerId: "#C00083",
    carModel: "TOYOTA RAIZE",
    completionDate: "10-30-24 5:00 PM",
    totalPrice: 2500.0,
  },
]

type SortField = "id" | "reservationDate" | "customerName" | "customerId" | "carModel" | "completionDate"
type SortOrder = "asc" | "desc"

interface TransactionsTableProps {
  searchQuery: string
}

export default function TransactionsTable({ searchQuery }: TransactionsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("completionDate")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsData] = useState(initialTransactions)
  const itemsPerPage = 10
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder(field === "completionDate" ? "desc" : "asc")
    }
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const filteredAndSortedTransactions = [...transactionsData]
    .filter((transaction) => {
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
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const modifier = sortOrder === "asc" ? 1 : -1
      if (sortField === "completionDate") {
        return new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
      }
      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0
    })

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  const currentItems = filteredAndSortedTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePrint = () => {
    const transaction = transactionsData.find((t) => t.id === selectedTransactionId)
    if (transaction) {
      setShowPrintDialog(false)
      window.print()
    }
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm overflow-hidden", showPrintDialog && "opacity-50")}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {[
                { key: "id", label: "RESERVATION ID" },
                { key: "reservationDate", label: "RESERVATION DATE" },
                { key: "customerName", label: "CUSTOMER NAME" },
                { key: "customerId", label: "CUSTOMER ID" },
                { key: "carModel", label: "CAR MODEL" },
                { key: "completionDate", label: "COMPLETION DATE" },
                { key: "action", label: "ACTION" },
              ].map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider"
                >
                  {column.key !== "action" ? (
                    <button
                      className="flex items-center gap-1 hover:text-[#1A365D]"
                      onClick={() => column.key !== "action" && handleSort(column.key as SortField)}
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
            {currentItems.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <tr className={cn("hover:bg-gray-50", expandedRow && expandedRow !== transaction.id && "opacity-50")}>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.id}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.reservationDate}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.customerName}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.customerId}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.carModel}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{transaction.completionDate}</td>
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
                        <div className="grid grid-cols-[25%_20%_15%_10%_15%_15%] w-full items-center">
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Service</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Mechanic</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Price</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase text-center">Qty</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Disc.</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase flex items-center gap-2">
                            TOTAL
                            <button
                              className="text-[#1A365D] hover:text-[#2a69ac]"
                              onClick={() => {
                                setSelectedTransactionId(transaction.id)
                                setShowPrintDialog(true)
                              }}
                            >
                              <img
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/printer-fcLJJjrSByMy5CPloAbqge500DXopa.svg"
                                alt="Print"
                                width={20}
                                height={20}
                              />
                            </button>
                          </div>
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
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
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

