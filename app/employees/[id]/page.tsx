"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Copy, ChevronUp, ChevronDown } from "lucide-react"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import React from "react"
import useLocalStorage from "@/hooks/useLocalStorage" // Ensure this path is correct

interface Employee {
  id: string
  name: string
  username: string
  avatar: string
  role: string
  workingOn: string
  firstName?: string
  lastName?: string
  gender?: string
  phone?: string
  dateOfBirth?: string
  streetAddress?: string
  city?: string
  province?: string
  zipCode?: string
  dateAdded?: string
}

interface Reservation {
  id: string
  date: string
  customerName: string
  carModel: string
  status: "Completed" | "Repairing" | "Cancelled" | "Confirmed"
  services?: Service[]
}

interface Service {
  customerId: string
  service: string
  mechanic: string
  status: "Confirmed" | "Completed" | "Repairing"
}

const statusStyles = {
  Completed: "bg-[#E6FFF3] text-[#28C76F] h-7 w-[100px] text-sm font-medium rounded-lg",
  Repairing: "bg-[#FFF5E0] text-[#FFC600] h-7 w-[100px] text-sm font-medium rounded-lg",
  Cancelled: "bg-[#FFE5E5] text-[#EA5455] h-7 w-[100px] text-sm font-medium rounded-lg",
  Confirmed: "bg-[#EBF8FF] text-[#63B3ED] h-7 w-[100px] text-sm font-medium rounded-lg",
}

const initialEmployees: Employee[] = [
  {
    id: "#E00001",
    name: "Marcial Tamondong",
    username: "mar",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Administrator",
    workingOn: "#R00098",
    firstName: "Marcial",
    lastName: "Tamondong",
    gender: "Male",
    phone: "09171840615",
    dateOfBirth: "1985-06-15",
    streetAddress: "Block 1 Lot 20 Danarose Residences",
    city: "Bacoor",
    province: "Cavite",
    zipCode: "4102",
    dateAdded: "2011-11-09",
  },
  // Add other initial employees here
  {
    id: "#EMP001",
    name: "John Doe",
    username: "johndoe",
    avatar: "/placeholder.svg",
    role: "Software Engineer",
    workingOn: "Project X",
    firstName: "John",
    lastName: "Doe",
    gender: "Male",
    phone: "+1 555 123 4567",
    dateOfBirth: "1990-05-15",
    streetAddress: "123 Main St",
    city: "Anytown",
    province: "CA",
    zipCode: "12345",
  },
  // Add more employees as needed
]

const marcialReservations: Reservation[] = [
  {
    id: "#R00099",
    date: "11-20-24 12:00 PM",
    customerName: "ROSIE TORRES",
    carModel: "HONDA CIVIC",
    status: "Confirmed" as const,
    services: [
      {
        customerId: "#C00034",
        service: "PAINT JOBS",
        mechanic: "MARCIAL TAMONDONG",
        status: "Confirmed",
      },
      {
        customerId: "#C00034",
        service: "OIL CHANGE",
        mechanic: "STEPHEN CURRY",
        status: "Confirmed",
      },
    ],
  },
  {
    id: "#R00098",
    date: "11-19-24 12:00 PM",
    customerName: "ISABELLA MERCADO",
    carModel: "TOYOTA VIOS",
    status: "Repairing" as const,
    services: [
      {
        customerId: "#C00033",
        service: "ENGINE TUNING",
        mechanic: "MARCIAL TAMONDONG",
        status: "Confirmed",
      },
    ],
  },
  {
    id: "#R00097",
    date: "11-18-24 12:00 PM",
    customerName: "SAVANNAH OCAMPO",
    carModel: "HONDA CRV",
    status: "Completed" as const,
    services: [
      {
        customerId: "#C00032",
        service: "BRAKE SHOES REPLACE",
        mechanic: "MARCIAL TAMONDONG",
        status: "Completed",
      },
    ],
  },
  {
    id: "#R00096",
    date: "11-17-24 12:00 PM",
    customerName: "PEARL CARREON",
    carModel: "HONDA BRV",
    status: "Completed" as const,
    services: [
      {
        customerId: "#C00031",
        service: "TIRE ROTATION",
        mechanic: "MARCIAL TAMONDONG",
        status: "Completed",
      },
    ],
  },
  {
    id: "#R00095",
    date: "11-16-24 12:00 PM",
    customerName: "AUDREY MANGAHAS",
    carModel: "MITSUBISHI MIRAGE",
    status: "Completed" as const,
    services: [
      {
        customerId: "#C00030",
        service: "BATTERY REPLACE",
        mechanic: "MARCIAL TAMONDONG",
        status: "Completed",
      },
    ],
  },
  {
    id: "#R00094",
    date: "11-15-24 12:00 PM",
    customerName: "MELISSA PATERNO",
    carModel: "SUZUKI JIMNY",
    status: "Completed" as const,
    services: [
      {
        customerId: "#C00029",
        service: "OIL CHANGE",
        mechanic: "MARCIAL TAMONDONG",
        status: "Completed",
      },
    ],
  },
  {
    id: "#R00093",
    date: "11-14-24 12:00 PM",
    customerName: "SAMUEL GASPAR",
    carModel: "TOYOTA HILUX",
    status: "Completed" as const,
    services: [
      {
        customerId: "#C00028",
        service: "BRAKE PAD REPLACE",
        mechanic: "MARCIAL TAMONDONG",
        status: "Completed",
      },
    ],
  },
  {
    id: "#R00092",
    date: "11-13-24 12:00 PM",
    customerName: "MARCOS MANUEL",
    carModel: "TOYOTA FORTUNER",
    status: "Completed" as const,
    services: [
      {
        customerId: "#C00027",
        service: "WHEEL ALIGNMENT",
        mechanic: "MARCIAL TAMONDONG",
        status: "Completed",
      },
    ],
  },
  {
    id: "#R00091",
    date: "11-12-24 12:00 PM",
    customerName: "PATRICIO DE LEON",
    carModel: "TOYOTA FORTUNER",
    status: "Completed" as const,
    services: [
      {
        customerId: "#C00026",
        service: "ENGINE DIAGNOSTIC",
        mechanic: "MARCIAL TAMONDONG",
        status: "Completed",
      },
    ],
  },
  {
    id: "#R00090",
    date: "11-11-24 12:00 PM",
    customerName: "KEVIN DIAZ",
    carModel: "TOYOTA FORTUNER",
    status: "Completed" as const,
    services: [
      {
        customerId: "#C00025",
        service: "AIR FILTER REPLACE",
        mechanic: "MARCIAL TAMONDONG",
        status: "Completed",
      },
    ],
  },
]

// Update the status styles to include Repairing
const serviceStatusStyles = {
  Completed: "bg-[#E6FFF3] text-[#28C76F]",
  Confirmed: "bg-[#EBF8FF] text-[#63B3ED]",
  Repairing: "bg-[#FFF5E0] text-[#FFC600]",
}

export default function EmployeeDetailsPage() {
  const params = useParams()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState("All")
  const [sortField, setSortField] = useState<keyof (typeof marcialReservations)[0]>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const itemsPerPage = 5
  // Add new state for managing services
  const [reservationsData, setReservationsData] = useLocalStorage<Reservation[]>("reservations", marcialReservations)

  useEffect(() => {
    const fullId = `#${params.id}`.toUpperCase()

    const savedEmployees = JSON.parse(localStorage.getItem("employees") || "[]")
    let foundEmployee = savedEmployees.find((emp: Employee) => emp.id === fullId)

    if (!foundEmployee) {
      foundEmployee = initialEmployees.find((emp) => emp.id === fullId) || null
    }

    setEmployee(foundEmployee)
  }, [params.id])

  if (!employee) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <DashboardHeader title="Employee Details" />
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
            <p className="text-[#8B909A] text-lg">No Employee Details</p>
          </div>
        </main>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const calculateWorkingYears = (dateString: string) => {
    const startDate = new Date(dateString)
    const today = new Date()
    const yearDiff = today.getFullYear() - startDate.getFullYear()
    const monthDiff = today.getMonth() - startDate.getMonth()
    const dayDiff = today.getDate() - startDate.getDate()

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      return yearDiff - 1
    }

    return yearDiff
  }

  const handleSort = (field: keyof (typeof marcialReservations)[0]) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // Add handler for service status change
  const handleServiceStatusChange = (reservationId: string, serviceIndex: number, newStatus: Service["status"]) => {
    setReservationsData((prevData) =>
      prevData.map((reservation) => {
        if (reservation.id === reservationId && reservation.services) {
          const updatedServices = [...reservation.services]
          updatedServices[serviceIndex] = {
            ...updatedServices[serviceIndex],
            status: newStatus,
          }
          return {
            ...reservation,
            services: updatedServices,
          }
        }
        return reservation
      }),
    )
  }

  const filteredReservations = reservationsData
    .filter((reservation) => {
      if (activeTab === "All") return true
      return reservation.status === activeTab
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const modifier = sortOrder === "asc" ? 1 : -1

      if (sortField === "id") {
        return (Number(b.id.slice(3)) - Number(a.id.slice(3))) * modifier
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
          <DashboardHeader title="Employee Details" />
        </div>

        <div className="grid gap-8">
          {/* Employee Profile */}
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <img
                  src={`https://i.pravatar.cc/80?u=${employee.username}`}
                  alt={employee.name}
                  className="h-20 w-20 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-[#2A69AC]">{employee.name}</h2>
                      <div className="flex items-center gap-2">
                        <p className="text-[#8B909A]">{employee.username}</p>
                        <span className="text-[#8B909A]">•</span>
                        <p className="text-[#8B909A]">{employee.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-4">
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Contact Number</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[#1A365D]">{employee.phone || "Not provided"}</p>
                        {employee.phone && (
                          <Button variant="ghost" size="icon" className="h-4 w-4">
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Gender</p>
                      <p className="text-[#1A365D]">{employee.gender || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Date of Birth</p>
                      <p className="text-[#1A365D]">
                        {employee.dateOfBirth ? formatDate(employee.dateOfBirth) : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Working Since</p>
                      <p className="text-[#1A365D]">
                        {employee.id === "#E00001"
                          ? "November 9, 2011"
                          : employee.dateAdded
                            ? formatDate(employee.dateAdded)
                            : "Date not available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-2xl font-semibold text-[#2A69AC]">Address</h3>
              <p className="text-[#1A365D]">{employee.streetAddress || "Not provided"}</p>
              <p className="text-[#1A365D]">
                {employee.city && employee.province && employee.zipCode
                  ? `${employee.city}, ${employee.province}, ${employee.zipCode}`
                  : ""}
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold text-[#2A69AC]">Reservations</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{employee.id === "#E00001" ? "8" : "0"}</p>
                  <p className="text-sm text-[#8B909A]">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{employee.id === "#E00001" ? "1" : "0"}</p>
                  <p className="text-sm text-[#8B909A]">Repairing</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">{employee.id === "#E00001" ? "1" : "0"}</p>
                  <p className="text-sm text-[#8B909A]">Confirmed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <nav className="flex space-x-8 border-b border-gray-200">
              {["All", "Confirmed", "Repairing", "Completed"].map((tab) => (
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
            {employee.id === "#E00001" ? (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {[
                        { key: "id", label: "RESERVATION ID", width: "15%" },
                        { key: "date", label: "RESERVATION DATE", width: "20%" },
                        { key: "customerName", label: "CUSTOMER NAME", width: "20%" },
                        { key: "carModel", label: "CAR MODEL", width: "20%" },
                        { key: "status", label: "STATUS", width: "15%" },
                        { key: "action", label: "ACTION", width: "10%" },
                      ].map((column) => (
                        <th
                          key={column.key}
                          className="px-3 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider"
                          style={{ width: column.width }}
                        >
                          {column.key !== "action" && column.key !== "status" ? (
                            <button
                              className="flex items-center justify-center gap-1 hover:text-[#1A365D] mx-auto"
                              onClick={() => handleSort(column.key as keyof (typeof marcialReservations)[0])}
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
                  <tbody>
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
                          <td
                            className="px-3 py-2 text-sm text-[#1A365D] text-center truncate"
                            title={reservation.date}
                          >
                            {reservation.date}
                          </td>
                          <td
                            className="px-3 py-2 text-sm text-[#1A365D] text-center truncate"
                            title={reservation.customerName}
                          >
                            {reservation.customerName}
                          </td>
                          <td
                            className="px-3 py-2 text-sm text-[#1A365D] text-center truncate"
                            title={reservation.carModel}
                          >
                            {reservation.carModel}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center",
                                statusStyles[reservation.status],
                              )}
                            >
                              {reservation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setExpandedRow(expandedRow === reservation.id ? null : reservation.id)}
                            >
                              {expandedRow === reservation.id ? (
                                <img
                                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector%20up-NiM43WWAQiX3qnLM68fj74mUJgJUCp.svg"
                                  alt="Collapse"
                                  width={20}
                                  height={20}
                                />
                              ) : (
                                <img
                                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector-SksAg0p4n0pZM3et1Y1lcrad0DGitc.svg"
                                  alt="Expand"
                                  width={20}
                                  height={20}
                                />
                              )}
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
                                        className="px-3 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider"
                                        style={{ width: "25%" }}
                                      >
                                        Customer ID
                                      </th>
                                      <th
                                        className="px-3 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider"
                                        style={{ width: "25%" }}
                                      >
                                        Service
                                      </th>
                                      <th
                                        className="px-3 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider"
                                        style={{ width: "25%" }}
                                      >
                                        Mechanic
                                      </th>
                                      <th
                                        className="px-3 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider"
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
                                          {service.customerId}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                          {service.service}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                          {service.mechanic}
                                        </td>
                                        <td className="px-6 py-4 flex justify-center">
                                          <div className="relative inline-block">
                                            <select
                                              value={service.status}
                                              onChange={(e) => {
                                                handleServiceStatusChange(
                                                  reservation.id,
                                                  index,
                                                  e.target.value as Service["status"],
                                                )
                                              }}
                                              className={cn(
                                                "appearance-none h-7 w-[120px] px-3 pr-8 py-0 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
                                                serviceStatusStyles[service.status],
                                              )}
                                            >
                                              <option
                                                value="Confirmed"
                                                className="bg-[#EBF8FF] text-[#63B3ED] hover:bg-[#BEE3F8] hover:text-[#2B6CB0] py-1"
                                              >
                                                Confirmed
                                              </option>
                                              <option
                                                value="Repairing"
                                                className="bg-[#FFF5E0] text-[#FFC600] hover:bg-[#FEEBC8] hover:text-[#D97706] py-1"
                                              >
                                                Repairing
                                              </option>
                                              <option
                                                value="Completed"
                                                className="bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C6F6D5] hover:text-[#22A366] py-1"
                                              >
                                                Completed
                                              </option>
                                            </select>
                                            <ChevronDown
                                              className={cn(
                                                "absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none h-3 w-3",
                                                service.status === "Completed"
                                                  ? "text-[#28C76F]"
                                                  : service.status === "Repairing"
                                                    ? "text-[#FFC600]"
                                                    : "text-[#63B3ED]",
                                              )}
                                            />
                                          </div>
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

                {/* Pagination */}
                <div className="flex justify-end px-2 py-3 mt-4">
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
            ) : (
              <div className="text-center py-8 text-[#8B909A]">No reservations found for this employee</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

