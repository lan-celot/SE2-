"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Copy, ChevronUp, ChevronDown } from "lucide-react"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import React from "react"
import { useResponsiveRows } from "@/hooks/use-responsive-rows"
import { formatDateTime, formatDateOnly } from "@/lib/date-utils"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"

interface Customer {
  id: string
  uid: string
  name: string
  firstName: string
  lastName: string
  username?: string
  email: string
  phone: string
  gender?: string
  dateOfBirth?: string
  memberSince?: string
  address?: {
    street?: string
    city?: string
    province?: string
    zipCode?: string
  }
  stats?: {
    completed: number
    ongoing: number
    confirmed: number
  }
}

interface Service {
  employeeId: string
  mechanic: string
  service: string
  status: "Confirmed" | "Completed"
}

interface Booking {
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

const tabs = ["All", "Confirmed", "Repairing", "Completed", "Cancelled"]

export default function CustomerDetailsPage() {
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [activeTab, setActiveTab] = useState("All")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [sortField, setSortField] = useState<keyof Omit<Booking, "services">>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const itemsPerPage = useResponsiveRows()

  useEffect(() => {
    async function fetchCustomerData() {
      try {
        setLoading(true)
        const customerId = params.id as string
        console.log("Fetching customer data for ID:", customerId)

        // Fetch customer data
        const usersRef = collection(db, "users")
        const usersQuery = query(usersRef, where("uid", "==", customerId))
        const usersSnapshot = await getDocs(usersQuery)

        if (usersSnapshot.empty) {
          console.log("No user found with ID:", customerId)
          setLoading(false)
          return
        }

        const userData = usersSnapshot.docs[0].data()
        console.log("Found user:", userData.firstName, userData.lastName)

        // Fetch customer's bookings
        const bookingsRef = collection(db, "bookings")
        const bookingsQuery = query(bookingsRef, where("customerId", "==", customerId), orderBy("date", "desc"))
        let bookingsSnapshot = await getDocs(bookingsQuery)

        // If no bookings found with customerId, try with userId
        if (bookingsSnapshot.empty) {
          console.log("No bookings found with customerId, trying userId")
          const bookingsQueryAlt = query(bookingsRef, where("userId", "==", customerId), orderBy("date", "desc"))
          bookingsSnapshot = await getDocs(bookingsQueryAlt)
        }

        console.log(`Found ${bookingsSnapshot.size} bookings for customer`)

        const customerBookings: Booking[] = []
        bookingsSnapshot.forEach((doc) => {
          const bookingData = doc.data()
          customerBookings.push({
            id: bookingData.id || `#B${doc.id.substring(0, 5)}`,
            date: bookingData.date,
            carModel: bookingData.carModel || "N/A",
            status: bookingData.status,
            completionDate: bookingData.completionDate,
            services: bookingData.services || [],
          })
        })

        // Calculate stats
        const stats = {
          completed: customerBookings.filter((r) => r.status === "Completed").length,
          ongoing: customerBookings.filter((r) => r.status === "Repairing").length,
          confirmed: customerBookings.filter((r) => r.status === "Confirmed").length,
        }

        // Create customer object
        const customerObj: Customer = {
          id: `#C${
            userData.id ||
            Math.floor(Math.random() * 100000)
              .toString()
              .padStart(5, "0")
          }`,
          uid: userData.uid,
          name: `${userData.firstName} ${userData.lastName}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          email: userData.email,
          phone: userData.phone || "N/A",
          gender: userData.gender,
          dateOfBirth: userData.dateOfBirth,
          memberSince: userData.createdAt || new Date().toISOString(),
          address: {
            street: userData.address?.street,
            city: userData.address?.city,
            province: userData.address?.province,
            zipCode: userData.address?.zipCode,
          },
          stats,
        }

        setCustomer(customerObj)
        setBookings(customerBookings)
      } catch (error) {
        console.error("Error fetching customer data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerData()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <DashboardHeader title="Customer Details" />
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2A69AC]"></div>
          </div>
        </main>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <DashboardHeader title="Customer Details" />
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
            <p className="text-[#8B909A] text-lg">No Customer Details Found</p>
          </div>
        </main>
      </div>
    )
  }

  const handleSort = (field: keyof Omit<Booking, "services">) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredBookings = bookings
    .filter((booking) => activeTab === "All" || booking.status === activeTab)
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const modifier = sortOrder === "asc" ? 1 : -1

      if (sortField === "id") {
        // Extract numeric part for sorting
        const aNum = a.id.match(/\d+/)?.[0] || "0"
        const bNum = b.id.match(/\d+/)?.[0] || "0"
        return (Number.parseInt(aNum) - Number.parseInt(bNum)) * modifier
      }

      if (sortField === "date" || sortField === "completionDate") {
        return (new Date(aValue as string).getTime() - new Date(bValue as string).getTime()) * modifier
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * modifier
      }

      return 0
    })

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)
  const currentItems = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
                  src={`https://i.pravatar.cc/80?u=${customer.username || customer.email}`}
                  alt={customer.name}
                  className="h-20 w-20 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-[#2A69AC] uppercase">{customer.name}</h2>
                      <div className="flex items-center gap-2">
                        <p className="text-[#8B909A] uppercase">{customer.username || customer.email}</p>
                        <span className="text-[#8B909A]">•</span>
                        <p className="text-[#8B909A] uppercase">{customer.id}</p>
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
                      <p className="text-[#1A365D]">{customer.gender || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Date of Birth</p>
                      <p className="text-[#1A365D]">
                        {customer.dateOfBirth ? formatDateOnly(customer.dateOfBirth) : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Member Since</p>
                      <p className="text-[#1A365D]">
                        {customer.memberSince ? formatDateOnly(customer.memberSince) : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-2xl font-semibold text-[#2A69AC]">Address</h3>
              {customer.address && (customer.address.street || customer.address.city) ? (
                <>
                  <p className="text-[#1A365D] uppercase">{customer.address.street || "No street address"}</p>
                  <p className="text-[#1A365D] uppercase">
                    {customer.address.city || "No city"}, {customer.address.province || "No province"}{" "}
                    {customer.address.zipCode || ""}
                  </p>
                </>
              ) : (
                <p className="text-[#8B909A]">No address information</p>
              )}

              <h3 className="mt-8 mb-4 text-2xl font-semibold text-[#2A69AC]">Bookings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{customer.stats?.completed || 0}</p>
                  <p className="text-sm text-[#8B909A]">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{customer.stats?.ongoing || 0}</p>
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

          {/* Bookings Table */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            {filteredBookings.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-[#8B909A] text-lg">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {[
                        { key: "id", label: "BOOKING ID", width: "15%" },
                        { key: "date", label: "BOOKING DATE", width: "20%" },
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
                              onClick={() => handleSort(column.key as keyof Omit<Booking, "services">)}
                            >
                              {column.label}
                              <div className="flex flex-col">
                                <ChevronUp
                                  className={cn(
                                    "h-3 w-3",
                                    sortField === column.key && sortOrder === "asc"
                                      ? "text-[#1A365D]"
                                      : "text-[#8B909A]",
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
                    {currentItems.map((booking) => (
                      <React.Fragment key={booking.id}>
                        <tr
                          className={cn(
                            "hover:bg-gray-50",
                            expandedRow && expandedRow !== booking.id && "opacity-50",
                            "transition-opacity duration-200",
                          )}
                        >
                          <td className="px-3 py-2 text-sm text-[#1A365D] text-center truncate uppercase">
                            {booking.id}
                          </td>
                          <td
                            className="px-3 py-2 text-sm text-[#1A365D] text-center truncate uppercase"
                            title={formatDateTime(booking.date)}
                          >
                            {formatDateTime(booking.date)}
                          </td>
                          <td
                            className="px-3 py-2 text-sm text-[#1A365D] text-center truncate uppercase"
                            title={booking.carModel}
                          >
                            {booking.carModel}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center h-7 w-[100px] text-sm font-medium rounded-lg",
                                statusStyles[booking.status],
                                booking.status === "Confirmed"
                                  ? "hover:bg-[#BEE3F8] hover:text-[#2B6CB0]"
                                  : booking.status === "Repairing"
                                    ? "hover:bg-[#FEEBC8] hover:text-[#D97706]"
                                    : booking.status === "Completed"
                                      ? "hover:bg-[#C6F6D5] hover:text-[#22A366]"
                                      : "hover:bg-[#FED7D7] hover:text-[#C53030]",
                              )}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td
                            className="px-3 py-2 text-sm text-[#1A365D] text-center truncate"
                            title={booking.completionDate ? formatDateTime(booking.completionDate) : "-"}
                          >
                            {booking.completionDate ? formatDateTime(booking.completionDate) : "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setExpandedRow(expandedRow === booking.id ? null : booking.id)}
                            >
                              <img
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector-SksAg0p4n0pZM3et1Y1lcrad0DGitc.svg"
                                alt="View details"
                                width={20}
                                height={20}
                                className={cn("transition-transform", expandedRow === booking.id && "rotate-180")}
                              />
                            </Button>
                          </td>
                        </tr>
                        {expandedRow === booking.id && booking.services && booking.services.length > 0 && (
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
                                    {booking.services.map((service, index) => (
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
            )}
            {/* Pagination */}
            {totalPages > 0 && (
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
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

