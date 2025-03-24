"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Copy, ChevronUp, ChevronDown } from "lucide-react"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import React from "react" // Added import for React
import { useResponsiveRows } from "@/hooks/use-responsive-rows"

interface Customer {
  id: string
  name: string
  username: string
  avatar: string
  phone: string
  gender?: string
  dateOfBirth?: string
  memberSince?: string
  address?: {
    street: string
    city: string
    province: string
    zipCode: string
  }
  stats?: {
    completed: number
    ongoing: number
    confirmed?: number
  }
}

interface Service {
  employeeId: string
  mechanic: string
  service: string
  status: "Confirmed" | "Completed"
}

interface Reservation {
  id: string
  date: string
  carModel: string
  status: "Confirmed" | "Repairing" | "Completed" | "Cancelled"
  completionDate?: string
  services?: Service[]
}

const statusStyles = {
  Confirmed: "bg-[#EBF8FF] text-[#63B3ED]",
  Repairing: "bg-[#FFF5E0] text-[#FFC600]",
  Completed: "bg-[#E6FFF3] text-[#28C76F]",
  Cancelled: "bg-[#FFE5E5] text-[#EA5455]",
}

const andreaSalazar: Customer = {
  id: "#C00100",
  name: "Andrea Salazar",
  username: "andeng",
  avatar: "/placeholder.svg?height=40&width=40",
  phone: "09171234567",
  gender: "Female",
  dateOfBirth: "2001-01-12",
  memberSince: "2024-11-09",
  address: {
    street: "123 Apple Street, Barangay 1",
    city: "Caloocan",
    province: "Metro Manila",
    zipCode: "1400",
  },
  stats: {
    completed: 20,
    ongoing: 1,
    confirmed: 5, // Added confirmed stat
  },
}

const andreaSalazarReservations: Reservation[] = [
  {
    id: "#R00100",
    date: "11-11-24 12:00 PM",
    carModel: "HONDA CIVIC",
    status: "Confirmed",
    services: [
      {
        employeeId: "#E00001",
        mechanic: "MARCIAL TAMONDONG",
        service: "PAINT JOBS",
        status: "Confirmed",
      },
      {
        employeeId: "#E00007",
        mechanic: "STEPHEN CURRY",
        service: "OIL CHANGE",
        status: "Confirmed",
      },
    ],
  },
  {
    id: "#R00090",
    date: "11-10-24 12:00 PM",
    carModel: "HONDA BRV",
    status: "Repairing",
  },
  {
    id: "#R00049",
    date: "09-01-24 12:00 PM",
    carModel: "HONDA CIVIC",
    status: "Completed",
    completionDate: "09-02-24 12:00 PM",
  },
  {
    id: "#R00048",
    date: "08-08-24 12:00 PM",
    carModel: "HONDA CIVIC",
    status: "Completed",
    completionDate: "08-09-24 12:00 PM",
  },
  {
    id: "#R00047",
    date: "07-11-24 12:00 PM",
    carModel: "HONDA CIVIC",
    status: "Cancelled",
  },
  {
    id: "#R00046",
    date: "06-11-24 12:00 PM",
    carModel: "HONDA CIVIC",
    status: "Cancelled",
  },
]

const tabs = ["All", "Confirmed", "Repairing", "Completed", "Cancelled"]

export default function CustomerDetailsPage() {
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [activeTab, setActiveTab] = useState("All")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [sortField, setSortField] = useState<keyof Omit<Reservation, "services">>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc") // Update 1: Initial sort order is "desc"
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = useResponsiveRows()

  useEffect(() => {
    const customerId = `#${params.id}`.toUpperCase()
    if (customerId === "#C00100") {
      setCustomer(andreaSalazar)
      setReservations(andreaSalazarReservations)
    }
  }, [params.id])

  if (!customer) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <DashboardHeader title="Customer Details" />
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
            <p className="text-[#8B909A] text-lg">No Customer Details</p>
          </div>
        </main>
      </div>
    )
  }

  const handleSort = (field: keyof Omit<Reservation, "services">) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredReservations = reservations
    .filter((reservation) => activeTab === "All" || reservation.status === activeTab)
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const modifier = sortOrder === "asc" ? 1 : -1
      if (sortField === "id") {
        return Number.parseInt(b.id.slice(1)) - Number.parseInt(a.id.slice(1)) // Update 3: Custom sorting for 'id' field
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * modifier
      }
      return 0
    })

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage)
  const currentItems = filteredReservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Customer Details" />
        </div>

        <div className="grid gap-8">
          {/* Customer Profile */}
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <img
                  src={`https://i.pravatar.cc/80?u=${customer.username}`}
                  alt={customer.name}
                  className="h-20 w-20 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-[#2A69AC]">{customer.name}</h2>
                      <div className="flex items-center gap-2">
                        <p className="text-[#8B909A]">{customer.username}</p>
                        <span className="text-[#8B909A]">•</span>
                        <p className="text-[#8B909A]">{customer.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-4">
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Contact Number</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[#1A365D]">{customer.phone}</p>
                        <Button variant="ghost" size="icon" className="h-4 w-4">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Gender</p>
                      <p className="text-[#1A365D]">{customer.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Date of Birth</p>
                      <p className="text-[#1A365D]">
                        {customer.dateOfBirth &&
                          new Date(customer.dateOfBirth).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Member Since</p>
                      <p className="text-[#1A365D]">
                        {customer.memberSince &&
                          new Date(customer.memberSince).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-2xl font-semibold text-[#2A69AC]">Address</h3>
              <p className="text-[#1A365D]">{customer.address?.street}</p>
              <p className="text-[#1A365D]">
                {customer.address?.city}, {customer.address?.province} {customer.address?.zipCode}
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold text-[#2A69AC]">Reservations</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{customer.stats?.completed}</p>
                  <p className="text-sm text-[#8B909A]">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{customer.stats?.ongoing}</p>
                  <p className="text-sm text-[#8B909A]">On-going</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{customer.stats?.confirmed || 0}</p>
                  <p className="text-sm text-[#8B909A]">Confirmed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <nav className="flex space-x-8 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                    activeTab === tab
                      ? "border-[#2a69ac] text-[#2a69ac]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Reservations Table */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-gray-200">
                    {[
                      { key: "id", label: "RESERVATION ID", width: "15%" },
                      { key: "date", label: "RESERVATION DATE", width: "20%" },
                      { key: "carModel", label: "CAR MODEL", width: "20%" },
                      { key: "status", label: "STATUS", width: "15%" },
                      { key: "completionDate", label: "COMPLETION DATE", width: "20%" },
                      { key: "action", label: "ACTION", width: "10%" },
                    ].map((column) => (
                      <th
                        key={column.key}
                        className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                        style={{ width: column.width }}
                      >
                        {column.key !== "action" && column.key !== "status" ? (
                          <button
                            className="flex items-center justify-center gap-1 hover:text-[#1A365D] mx-auto"
                            onClick={() => handleSort(column.key as keyof Omit<Reservation, "services">)}
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
                                  sortField === column.key && sortOrder === "desc"
                                    ? "text-[#1A365D]"
                                    : "text-[#8B909A]",
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
                  {currentItems.map((reservation) => (
                    <React.Fragment key={reservation.id}>
                      <tr
                        className={cn(
                          "hover:bg-gray-50",
                          expandedRow && expandedRow !== reservation.id && "opacity-50",
                          "transition-opacity duration-200",
                        )}
                      >
                        <td className="px-3 py-2 text-sm text-[#1A365D] text-center truncate" title={reservation.id}>
                          {reservation.id}
                        </td>
                        <td className="px-3 py-2 text-sm text-[#1A365D] text-center truncate" title={reservation.date}>
                          {reservation.date}
                        </td>
                        <td
                          className="px-3 py-2 text-sm text-[#1A365D] text-center truncate"
                          title={reservation.carModel}
                        >
                          {reservation.carModel}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center h-7 w-[100px] text-sm font-medium rounded-lg",
                              statusStyles[reservation.status],
                              reservation.status === "Confirmed"
                                ? "hover:bg-[#BEE3F8] hover:text-[#2B6CB0]"
                                : reservation.status === "Repairing"
                                  ? "hover:bg-[#FEEBC8] hover:text-[#D97706]"
                                  : reservation.status === "Completed"
                                    ? "hover:bg-[#C6F6D5] hover:text-[#22A366]"
                                    : "hover:bg-[#FED7D7] hover:text-[#C53030]",
                            )}
                          >
                            {reservation.status}
                          </span>
                        </td>
                        <td
                          className="px-3 py-2 text-sm text-[#1A365D] text-center truncate"
                          title={reservation.completionDate || "-"}
                        >
                          {reservation.completionDate || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedRow(expandedRow === reservation.id ? null : reservation.id)}
                          >
                            <img
                              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector-SksAg0p4n0pZM3et1Y1lcrad0DGitc.svg"
                              alt="View details"
                              width={20}
                              height={20}
                              className={cn("transition-transform", expandedRow === reservation.id && "rotate-180")}
                            />
                          </Button>
                        </td>
                      </tr>
                      {expandedRow === reservation.id && reservation.services && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50">
                            <div className="px-4 py-2">
                              <table className="w-full table-fixed">
                                <thead>
                                  <tr>
                                    <th
                                      className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                                      style={{ width: "25%" }}
                                    >
                                      Employee ID
                                    </th>
                                    <th
                                      className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                                      style={{ width: "25%" }}
                                    >
                                      Mechanic
                                    </th>
                                    <th
                                      className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                                      style={{ width: "25%" }}
                                    >
                                      Service
                                    </th>
                                    <th
                                      className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-center"
                                      style={{ width: "25%" }}
                                    >
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reservation.services.map((service, index) => (
                                    <tr key={index}>
                                      <td className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                        {service.employeeId}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                        {service.mechanic}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                        {service.service}
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        <span
                                          className={cn(
                                            "inline-flex items-center justify-center h-7 w-[100px] text-sm font-medium rounded-lg",
                                            statusStyles[service.status === "Confirmed" ? "Confirmed" : "Completed"],
                                            service.status === "Confirmed"
                                              ? "hover:bg-[#BEE3F8] hover:text-[#2B6CB0]"
                                              : "hover:bg-[#C6F6D5] hover:text-[#22A366]",
                                          )}
                                        >
                                          {service.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
            <div className="flex justify-end px-2 py-3 mt-4">
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
                    currentPage === totalPages
                      ? "text-[#8B909A] cursor-not-allowed"
                      : "text-[#1A365D] hover:bg-[#EBF8FF]",
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

