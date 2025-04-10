"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Copy, ChevronUp, ChevronDown, Pencil } from "lucide-react"
import { DashboardHeader } from "@/components/admin-components/header"
import { Sidebar } from "@/components/admin-components/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/admin-components/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/admin-components/dialog"
import { Input } from "@/components/admin-components/input"
import React from "react"
import { useResponsiveRows } from "@/hooks/use-responsive-rows"
import { formatDateTime, formatDateOnly } from "@/lib/date-utils"
import { getEmployeeById, updateEmployee, type Employee } from "@/lib/employee-utils"
import { collection, query, where, getDocs, orderBy, getFirestore } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Keep the Service and Reservation interfaces
interface Reservation {
  id: string
  date: string
  customerName: string
  carModel: string
  status: "Completed" | "Repairing" | "Cancelled" | "Confirmed"
  services?: Service[]
}

// Update the Service interface if it exists in this file
interface Service {
  customerId: string
  service: string
  mechanic: string
  status: "Confirmed" | "Completed" | "Repairing"
}

// Keep the statusStyles object
const statusStyles: Record<"Completed" | "Repairing" | "Cancelled" | "Confirmed", string> = {
  Completed: "bg-[#E6FFF3] text-[#28C76F] h-7 w-[100px] text-sm font-medium rounded-lg",
  Repairing: "bg-[#FFF5E0] text-[#FFC600] h-7 w-[100px] text-sm font-medium rounded-lg",
  Cancelled: "bg-[#FFE5E5] text-[#EA5455] h-7 w-[100px] text-sm font-medium rounded-lg",
  Confirmed: "bg-[#EBF8FF] text-[#63B3ED] h-7 w-[100px] text-sm font-medium rounded-lg",
}

// Keep the serviceStatusStyles object
const serviceStatusStyles = {
  Completed: "bg-[#E6FFF3] text-[#28C76F]",
  Confirmed: "bg-[#EBF8FF] text-[#63B3ED]",
  Repairing: "bg-[#FFF5E0] text-[#FFC600]",
}

// We'll keep this function since it might be used in the future
// but mark it with a comment to avoid the warning
// This function calculates years of service
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

export default function EmployeeDetailsPage() {
  const params = useParams()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState("All")
  const [reservations, setReservations] = useState<any[]>([])
  const [sortField, setSortField] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const itemsPerPage = useResponsiveRows()

  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)
  const [updatedAddress, setUpdatedAddress] = useState({
    streetAddress1: "",
    streetAddress2: "",
    barangay: "",
    city: "",
    province: "",
    zipCode: "",
  })
  const [updatedPhone, setUpdatedPhone] = useState("")

  const statusStyles: Record<string, string> = {
    Completed: "bg-[#E6FFF3] text-[#28C76F] h-7 w-[100px] text-sm font-medium rounded-lg",
    COMPLETED: "bg-[#E6FFF3] text-[#28C76F] h-7 w-[100px] text-sm font-medium rounded-lg",
    Repairing: "bg-[#FFF5E0] text-[#FFC600] h-7 w-[100px] text-sm font-medium rounded-lg",
    REPAIRING: "bg-[#FFF5E0] text-[#FFC600] h-7 w-[100px] text-sm font-medium rounded-lg",
    Cancelled: "bg-[#FFE5E5] text-[#EA5455] h-7 w-[100px] text-sm font-medium rounded-lg",
    CANCELLED: "bg-[#FFE5E5] text-[#EA5455] h-7 w-[100px] text-sm font-medium rounded-lg",
    Confirmed: "bg-[#EBF8FF] text-[#63B3ED] h-7 w-[100px] text-sm font-medium rounded-lg",
    CONFIRMED: "bg-[#EBF8FF] text-[#63B3ED] h-7 w-[100px] text-sm font-medium rounded-lg",
    Pending: "bg-[#FFF5E0] text-[#FF9F43] h-7 w-[100px] text-sm font-medium rounded-lg",
    PENDING: "bg-[#FFF5E0] text-[#FF9F43] h-7 w-[100px] text-sm font-medium rounded-lg",
  }

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true)
        const employeeId = params.id as string
  
        // Fetch employee data from Firebase
        const employeeData = await getEmployeeById(employeeId)
  
        if (!employeeData) {
          console.log("No employee found with ID:", employeeId)
          setLoading(false)
          return
        }
  
        setEmployee(employeeData)
  
        // Construct full name variations
        const fullNameUpper = `${employeeData.firstName} ${employeeData.lastName}`.toUpperCase();
        const lastNameFirstUpper = `${employeeData.lastName} ${employeeData.firstName}`.toUpperCase();
  
        // Fetch employee's reservations/assignments
        const bookingsRef = collection(db, "bookings")
        
        try {
          // Fetch all bookings (remove specific filtering to avoid index issues)
          const bookingsSnapshot = await getDocs(bookingsRef)
  
          const employeeReservations: any[] = []
          bookingsSnapshot.forEach((doc) => {
            const bookingData = doc.data()
  
            // Check services for mechanic assignment using multiple name variations
            const employeeServices = (bookingData.services || []).filter(
              (service: any) => 
                service.mechanic === fullNameUpper || 
                service.mechanic === lastNameFirstUpper
            )
  
            if (employeeServices.length > 0) {
              employeeReservations.push({
                id: bookingData.id || doc.id,
                customerName:
                  bookingData.customerName || `${bookingData.firstName || ""} ${bookingData.lastName || ""}`.trim(),
                carModel: bookingData.carModel || "N/A",
                date: bookingData.reservationDate || new Date().toISOString(),
                status: bookingData.status || "CONFIRMED",
                services: employeeServices,
              })
            }
          })
  
          console.log("Employee Reservations:", employeeReservations);
  
          setReservations(employeeReservations)
        } catch (error) {
          console.error("Error fetching employee reservations:", error)
          // Continue with empty reservations
          setReservations([])
        }
  
        setLoading(false)
      } catch (error) {
        console.error("Error fetching employee data:", error)
        setLoading(false)
      }
    }
  
    fetchEmployeeData()
  }, [params.id])

  useEffect(() => {
    if (employee) {
      setUpdatedAddress({
        streetAddress1: employee.streetAddress1 || "",
        streetAddress2: employee.streetAddress2 || "",
        barangay: employee.barangay || "",
        city: employee.city || "",
        province: employee.province || "",
        zipCode: employee.zipCode || "",
      })
      setUpdatedPhone(employee.phone || "")
    }
  }, [employee])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // Add handler for service status change
  const handleServiceStatusChange = (reservationId: string, serviceIndex: number, newStatus: Service["status"]) => {
    setReservations((prevData) =>
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

  interface BookingData {
    id: string;
    services?: Array<{
      mechanic: string;
      [key: string]: any;
    }>;
    lastUpdated?: string;
    [key: string]: any;
  }

  const getCurrentReservation = async (employeeName: string): Promise<string | null> => {
    try {
      const db = getFirestore();
      const reservationsRef = collection(db, 'bookings');
  
      // Query bookings where the employee is assigned in any service
      const q = query(
        reservationsRef,
        where('services', 'array-contains-any', [
          { mechanic: employeeName.toUpperCase() }
        ])
      );
  
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        // Find reservations where the employee is assigned in any service
        const employeeReservations = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as BookingData))
          .filter(reservation => 
            Array.isArray(reservation.services) && 
            reservation.services.some(service => 
              service.mechanic && 
              service.mechanic.toUpperCase() === employeeName.toUpperCase()
            )
          )
          .sort((a, b) => {
            // Sort by last updated timestamp
            const lastUpdatedA = new Date(a.lastUpdated || 0).getTime();
            const lastUpdatedB = new Date(b.lastUpdated || 0).getTime();
            return lastUpdatedB - lastUpdatedA;
          });
  
        // Return the ID of the most recent reservation
        return employeeReservations.length > 0 ? employeeReservations[0].id : null;
      }
  
      return null;
    } catch (error) {
      console.error("Error fetching current reservation for " + employeeName, error);
      return null;
    }
  };

  const handleUpdateAddress = async () => {
    if (!employee) return

    try {
      const updatedEmployee = {
        ...employee,
        ...updatedAddress,
      }

      await updateEmployee(employee.id, updatedEmployee)
      setEmployee(updatedEmployee)
      setAddressDialogOpen(false)
    } catch (error) {
      console.error("Error updating employee address:", error)
    }
  }

  const handleUpdatePhone = async () => {
    if (!employee) return

    try {
      const updatedEmployee = {
        ...employee,
        phone: updatedPhone,
      }

      await updateEmployee(employee.id, updatedEmployee)
      setEmployee(updatedEmployee)
      setPhoneDialogOpen(false)
    } catch (error) {
      console.error("Error updating employee phone:", error)
    }
  }

  const filteredReservations = reservations
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
          {/* Customer Profile */}
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <img
                  src={employee?.avatar || `https://i.pravatar.cc/80?u=${employee?.username}`}
                  alt={`${employee?.firstName} ${employee?.lastName}`}
                  className="h-20 w-20 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-[#2A69AC]">{`${employee?.firstName} ${employee?.lastName}`}</h2>
                      <div className="flex items-center gap-2">
                        <p className="text-[#8B909A]">{employee?.username}</p>
                        <span className="text-[#8B909A]">•</span>
                        <p className="text-[#8B909A]">{employee?.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-4">
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Contact Number</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[#1A365D]">{employee?.phone || "Not provided"}</p>
                        {employee?.phone && (
                          <Button variant="ghost" size="icon" className="h-4 w-4">
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1"
                          onClick={() => setPhoneDialogOpen(true)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#2A69AC]" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Gender</p>
                      <p className="text-[#1A365D]">{employee?.gender || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Date of Birth</p>
                      <p className="text-[#1A365D]">
                        {employee?.dateOfBirth ? formatDateOnly(employee.dateOfBirth as unknown as string) : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#8B909A]">Working Since</p>
                      <p className="text-[#1A365D]">
                        {employee?.workingSince ? formatDateOnly(employee.workingSince as unknown as string) : "Date not available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-[#2A69AC]">Address</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setAddressDialogOpen(true)}>
                  <Pencil className="h-4 w-4 text-[#2A69AC]" />
                </Button>
              </div>
              <p className="text-[#1A365D]">{employee?.streetAddress1 || "Not provided"}</p>
              {employee?.streetAddress2 && <p className="text-[#1A365D]">{employee.streetAddress2}</p>}
              <p className="text-[#1A365D]">
                {employee?.barangay && `${employee.barangay}, `}
                {employee?.city && `${employee.city}, `}
                {employee?.province && `${employee.province}, `}
                {employee?.zipCode}
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold text-[#2A69AC]">Reservations</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">
                    {reservations.filter((r) => r.status === "Completed").length}
                  </p>
                  <p className="text-sm text-[#8B909A]">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">
                    {reservations.filter((r) => r.status === "Repairing").length}
                  </p>
                  <p className="text-sm text-[#8B909A]">Repairing</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#1A365D]">
                    {reservations.filter((r) => r.status === "Confirmed").length}
                  </p>
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
            {reservations.length > 0 ? (
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
                              onClick={() => handleSort(column.key)}
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
                    {currentItems.map((reservation: any) => (
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
                            {formatDateTime(reservation.date)}
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
      "inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium",
      statusStyles[reservation.status as keyof typeof statusStyles] || "bg-gray-100 text-gray-600"
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
                       {/* Expanded Row Services - Updated Section */}
{/* Expanded Row Services - Updated Section */}
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
            {reservation.services.map((service: any, index: number) => (
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
                  <span
                    className={cn(
                      "inline-flex items-center justify-center px-3 py-1 h-7 w-[120px] rounded-lg text-sm font-medium",
                      service.status === "Completed" || service.status === "COMPLETED" 
                        ? "bg-[#E6FFF3] text-[#28C76F]" 
                        : service.status === "Repairing" || service.status === "REPAIRING" 
                          ? "bg-[#FFF5E0] text-[#FFC600]" 
                          : service.status === "Confirmed" || service.status === "CONFIRMED" 
                            ? "bg-[#EBF8FF] text-[#63B3ED]" 
                            : service.status === "Cancelled" || service.status === "CANCELLED" 
                              ? "bg-[#FFE5E5] text-[#EA5455]"
                              : "bg-gray-100 text-gray-600"
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
            ) : (
              <div className="text-center py-8 text-[#8B909A]">No reservations found for this employee</div>
            )}
          </div>
        </div>
        {/* Address Edit Dialog */}
        <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#2A69AC]">Address Information</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  id="streetAddress1"
                  placeholder="Street Address 1"
                  value={updatedAddress.streetAddress1}
                  onChange={(e) => setUpdatedAddress({ ...updatedAddress, streetAddress1: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  id="streetAddress2"
                  placeholder="Street Address 2 (Optional)"
                  value={updatedAddress.streetAddress2}
                  onChange={(e) => setUpdatedAddress({ ...updatedAddress, streetAddress2: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  id="barangay"
                  placeholder="Barangay"
                  value={updatedAddress.barangay}
                  onChange={(e) => setUpdatedAddress({ ...updatedAddress, barangay: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  id="city"
                  placeholder="City"
                  value={updatedAddress.city}
                  onChange={(e) => setUpdatedAddress({ ...updatedAddress, city: e.target.value })}
                />
                <Input
                  id="province"
                  placeholder="Province"
                  value={updatedAddress.province}
                  onChange={(e) => setUpdatedAddress({ ...updatedAddress, province: e.target.value })}
                />
                <Input
                  id="zipCode"
                  placeholder="Zip Code"
                  value={updatedAddress.zipCode}
                  onChange={(e) => setUpdatedAddress({ ...updatedAddress, zipCode: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddressDialogOpen(false)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={handleUpdateAddress} className="bg-[#2A69AC] hover:bg-[#1A4B7C]">
                Proceed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Phone Edit Dialog */}
        <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#2A69AC]">Update Phone Number</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  id="phone"
                  placeholder="Phone Number"
                  value={updatedPhone}
                  onChange={(e) => setUpdatedPhone(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPhoneDialogOpen(false)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={handleUpdatePhone} className="bg-[#2A69AC] hover:bg-[#1A4B7C]">
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

