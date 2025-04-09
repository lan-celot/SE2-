"use client"
import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useResponsiveRows } from "@/hooks/use-responsive-rows"
import { formatDateTime } from "@/lib/date-utils"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import Loading from "@/components/admin-components/loading"

interface SalesReport {
  referenceNo: string
  customerName: string
  carModel: string
  datePaid: string
  paymentMethod: string
  totalPrice: number
}

type SortField = keyof SalesReport
type SortOrder = "asc" | "desc"

export function SalesReportTable() {
  const [sortField, setSortField] = useState<SortField>("datePaid")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = useResponsiveRows(180) // Adjust header height for the print button

  const [reports, setReports] = useState<SalesReport[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch transactions from Firestore
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const transactionsRef = collection(db, "transactions")
        const q = query(transactionsRef, orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(q)
        
        const fetchedReports: SalesReport[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          // Generate a reference number if it doesn't exist
          const refNo = data.referenceNo || `#REF${doc.id.substring(0, 5)}`
          
          // Format the date - handle different date formats from Firestore
          let datePaid = "N/A"
          if (data.createdAt) {
            if (data.createdAt.toDate) {
              // Handle Firestore timestamp
              datePaid = data.createdAt.toDate().toISOString()
            } else if (typeof data.createdAt === 'string') {
              datePaid = data.createdAt
            } else if (data.createdAt instanceof Date) {
              datePaid = data.createdAt.toISOString()
            }
          }
          
          // Get customer name - either from customerName field or by combining firstName and lastName
          let customerName = data.customerName || "N/A"
          if (!customerName || customerName === "N/A") {
            const firstName = data.firstName || ""
            const lastName = data.lastName || ""
            if (firstName || lastName) {
              customerName = `${firstName} ${lastName}`.trim()
            }
          }
          
          // Create a report object from the transaction data
          fetchedReports.push({
            referenceNo: refNo,
            customerName: customerName,
            carModel: data.carModel || "N/A",
            datePaid: datePaid,
            paymentMethod: data.paymentMethod || "CASH", // Default to CASH if not specified
            totalPrice: data.totalPrice || 0,
          })
        })
        
        setReports(fetchedReports)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Sort the reports based on the current sort field and order
  const sortedReports = [...reports].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    const modifier = sortOrder === "asc" ? 1 : -1

    if (sortField === "datePaid") {
      return (new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime()) * modifier
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * modifier
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * modifier
    }

    return 0
  })

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
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; color: #1A365D; margin-bottom: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f2f2f2; color: #666; font-weight: bold; }
              .total { font-weight: bold; }
              .date { font-size: 14px; text-align: right; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="date">Generated on: ${new Date().toLocaleString()}</div>
            <h1>Mar & Nor Auto Repair - Sales Report</h1>
            <table>
              <thead>
                <tr>
                  <th>REFERENCE NO.</th>
                  <th>CUSTOMER NAME</th>
                  <th>CAR MODEL</th>
                  <th>DATE PAID</th>
                  <th>PAYMENT METHOD</th>
                  <th>TOTAL PRICE</th>
                </tr>
              </thead>
              <tbody>
                ${sortedReports.map(report => `
                  <tr>
                    <td>${report.referenceNo}</td>
                    <td>${report.customerName}</td>
                    <td>${report.carModel}</td>
                    <td>${formatDateTime(report.datePaid)}</td>
                    <td>${report.paymentMethod}</td>
                    <td>${formatCurrency(report.totalPrice)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="total">TOTAL SALES</td>
                  <td class="total">${formatCurrency(sortedReports.reduce((sum, report) => sum + report.totalPrice, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <>
      <div className="flex justify-between mb-6">
        <div className="text-sm text-[#8B909A]">
          Total Sales: <span className="font-semibold text-[#1A365D]">{formatCurrency(sortedReports.reduce((sum, report) => sum + report.totalPrice, 0))}</span>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-[#2A69AC] text-white rounded-md hover:bg-[#1A365D] transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print Report
        </button>
      </div>
      <div className="rounded-lg border bg-white overflow-x-auto">
        {sortedReports.length === 0 ? (
          <div className="p-8 text-center text-[#8B909A]">
            No transactions found in the database.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-gray-200">
                    {[
                      { key: "referenceNo", label: "REFERENCE NO.", width: "15%" },
                      { key: "customerName", label: "CUSTOMER NAME", width: "22%" },
                      { key: "carModel", label: "CAR MODEL", width: "18%" },
                      { key: "datePaid", label: "DATE PAID", width: "15%" },
                      { key: "paymentMethod", label: "PAYMENT METHOD", width: "15%" },
                      { key: "totalPrice", label: "TOTAL PRICE", width: "15%" },
                    ].map((column) => (
                      <th
                        key={column.key}
                        className={cn(
                          "px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider",
                          column.key === "action" ? "text-center" : "text-left",
                        )}
                        style={{ width: column.width }}
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
                  {currentItems.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50 h-[4.5rem]">
                      <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={report.referenceNo}>
                        {report.referenceNo}
                      </td>
                      <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={report.customerName}>
                        {report.customerName}
                      </td>
                      <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={report.carModel}>
                        {report.carModel}
                      </td>
                      <td
                        className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase"
                        title={formatDateTime(report.datePaid)}
                      >
                        {formatDateTime(report.datePaid)}
                      </td>
                      <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={report.paymentMethod}>
                        {report.paymentMethod}
                      </td>
                      <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={formatCurrency(report.totalPrice)}>
                        {formatCurrency(report.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-end px-3 py-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage(Math.max(1, currentPage - 1))
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
          </>
        )}
      </div>
    </>
  )
}