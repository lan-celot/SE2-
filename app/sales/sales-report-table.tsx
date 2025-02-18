"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SalesReport {
  referenceNo: string
  customerId: string
  reservationId: string
  carModel: string
  datePaid: string
  paymentMethod: string
  totalPrice: number
}

const initialReports: SalesReport[] = [
  {
    referenceNo: "#REF00092",
    customerId: "#C00091",
    reservationId: "#R00092",
    carModel: "TOYOTA HILUX",
    datePaid: "11-08-24 12:00 PM",
    paymentMethod: "CASH",
    totalPrice: 20000.0,
  },
  {
    referenceNo: "#REF00091",
    customerId: "#C00092",
    reservationId: "#R00091",
    carModel: "TOYOTA RAIZE",
    datePaid: "11-07-24 8:00 PM",
    paymentMethod: "CASH",
    totalPrice: 5000.0,
  },
  {
    referenceNo: "#REF00090",
    customerId: "#C00090",
    reservationId: "#R00090",
    carModel: "MITSUBISHI XPANDER",
    datePaid: "11-06-24 7:00 PM",
    paymentMethod: "CASH",
    totalPrice: 3500.0,
  },
  {
    referenceNo: "#REF00089",
    customerId: "#C00089",
    reservationId: "#R00089",
    carModel: "TOYOTA VIOS",
    datePaid: "11-05-24 3:00 PM",
    paymentMethod: "CASH",
    totalPrice: 10500.0,
  },
  {
    referenceNo: "#REF00088",
    customerId: "#C00088",
    reservationId: "#R00088",
    carModel: "HYUNDAI ACCENT",
    datePaid: "11-05-24 2:00 PM",
    paymentMethod: "GCASH",
    totalPrice: 9700.0,
  },
  {
    referenceNo: "#REF00087",
    customerId: "#C00087",
    reservationId: "#R00087",
    carModel: "TOYOTA HILUX",
    datePaid: "10-31-24 3:00 PM",
    paymentMethod: "CARD",
    totalPrice: 9500.0,
  },
  {
    referenceNo: "#REF00086",
    customerId: "#C00086",
    reservationId: "#R00086",
    carModel: "TOYOTA RUSH",
    datePaid: "10-31-24 8:00 AM",
    paymentMethod: "GCASH",
    totalPrice: 1500.0,
  },
  {
    referenceNo: "#REF00085",
    customerId: "#C00085",
    reservationId: "#R00085",
    carModel: "HONDA CITY",
    datePaid: "10-30-24 5:00 PM",
    paymentMethod: "GCASH",
    totalPrice: 8300.0,
  },
  {
    referenceNo: "#REF00084",
    customerId: "#C00084",
    reservationId: "#R00084",
    carModel: "NISSAN NAVARA",
    datePaid: "10-30-24 5:00 PM",
    paymentMethod: "CARD",
    totalPrice: 3300.0,
  },
  {
    referenceNo: "#REF00083",
    customerId: "#C00083",
    reservationId: "#R00083",
    carModel: "TOYOTA RAIZE",
    datePaid: "10-30-24 5:00 PM",
    paymentMethod: "CARD",
    totalPrice: 23300.0,
  },
]

type SortField = keyof SalesReport
type SortOrder = "asc" | "desc"

export function SalesReportTable() {
  const [sortField, setSortField] = useState<SortField>("datePaid")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleSort = (field: SortField) => {
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

  const sortedReports = [...initialReports].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    const modifier = sortOrder === "asc" ? 1 : -1

    if (sortField === "datePaid") {
      return new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime()
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * modifier
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * modifier
    }

    return 0
  })

  const totalPages = Math.ceil(sortedReports.length / itemsPerPage)
  const currentItems = sortedReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sales Report</title>
            <style>
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <table>
              ${document.querySelector(".rounded-lg.border.bg-white table")?.outerHTML}
            </table>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-[#2A69AC] text-white rounded-md hover:bg-[#1A365D] transition-colors text-sm font-medium"
        >
          Print
        </button>
      </div>
      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {[
                  { key: "referenceNo", label: "REFERENCE NO." },
                  { key: "customerId", label: "CUSTOMER ID" },
                  { key: "reservationId", label: "RESERVATION ID" },
                  { key: "carModel", label: "CAR MODEL" },
                  { key: "datePaid", label: "DATE PAID" },
                  { key: "paymentMethod", label: "PAYMENT METHOD" },
                  { key: "totalPrice", label: "TOTAL PRICE" },
                ].map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-6 py-3 text-xs font-medium text-[#8B909A] uppercase tracking-wider",
                      column.key === "action" ? "text-center" : "text-left",
                    )}
                  >
                    <button
                      className="flex items-center gap-1 hover:text-[#1A365D]"
                      onClick={() => handleSort(column.key as SortField)}
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
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((report) => (
                <tr key={report.referenceNo} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{report.referenceNo}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{report.customerId}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{report.reservationId}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{report.carModel}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{report.datePaid}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{report.paymentMethod}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{formatCurrency(report.totalPrice)}</td>
                </tr>
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
      </div>
    </>
  )
}

