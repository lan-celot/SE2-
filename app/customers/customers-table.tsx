"use client"
import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useResponsiveRows } from "@/hooks/use-responsive-rows"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { formatDateOnly } from "@/lib/date-utils"

interface Customer {
  id: string
  uid: string
  name: string
  firstName: string
  lastName: string
  username?: string
  email: string
  phone: string
  carModel?: string
  lastVisit?: string
  avatar?: string
  gender?: string
  dateOfBirth?: string
}

interface Booking {
  id: string
  customerId: string
  customerName?: string
  carModel?: string
  date: string
  status: string
  userId?: string // Some bookings might use userId instead of customerId
}

interface CustomersTableProps {
  searchQuery: string
}

export function CustomersTable({ searchQuery }: CustomersTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<keyof Customer>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = useResponsiveRows(180)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCustomersWithConfirmedBookings() {
      try {
        setLoading(true)
        console.log("Fetching customers with confirmed bookings...")

        // First, get all bookings with status "Confirmed"
        const bookingsRef = collection(db, "bookings")
        const bookingsQuery = query(bookingsRef, where("status", "==", "Confirmed"))

        const bookingsSnapshot = await getDocs(bookingsQuery)
        console.log(`Found ${bookingsSnapshot.size} confirmed bookings`)

        // Extract unique customer IDs from confirmed bookings
        const customerIds = new Set<string>()
        const customerLastVisits = new Map<string, string>()
        const customerCarModels = new Map<string, string>()

        bookingsSnapshot.forEach((doc) => {
          const booking = doc.data() as Booking
          // Check for customerId or userId (different field names might be used)
          const customerId = booking.customerId || booking.userId

          if (customerId) {
            customerIds.add(customerId)

            // Track the latest visit date for each customer
            const currentLastVisit = customerLastVisits.get(customerId)
            if (!currentLastVisit || new Date(booking.date) > new Date(currentLastVisit)) {
              customerLastVisits.set(customerId, booking.date)
            }

            // Track car model
            if (booking.carModel) {
              customerCarModels.set(customerId, booking.carModel)
            }
          }
        })

        console.log(`Found ${customerIds.size} unique customers with confirmed bookings`)

        if (customerIds.size === 0) {
          setCustomers([])
          setLoading(false)
          return
        }

        // Now fetch the customer details for these IDs
        const customersRef = collection(db, "users")
        const customersSnapshot = await getDocs(customersRef)
        console.log(`Fetched ${customersSnapshot.size} total users`)

        const fetchedCustomers: Customer[] = []

        customersSnapshot.forEach((doc) => {
          const userData = doc.data()

          // Only include customers who have confirmed bookings
          if (customerIds.has(userData.uid)) {
            fetchedCustomers.push({
              id: `#C${fetchedCustomers.length.toString().padStart(5, "0")}`,
              uid: userData.uid,
              name: `${userData.firstName} ${userData.lastName}`,
              firstName: userData.firstName,
              lastName: userData.lastName,
              username: userData.username,
              email: userData.email,
              phone: userData.phone || "N/A",
              carModel: customerCarModels.get(userData.uid) || "N/A",
              lastVisit: customerLastVisits.get(userData.uid) || "N/A",
              gender: userData.gender,
              dateOfBirth: userData.dateOfBirth,
            })
          }
        })

        console.log(`Displaying ${fetchedCustomers.length} customers with confirmed bookings`)
        setCustomers(fetchedCustomers)
      } catch (error) {
        console.error("Error fetching customers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomersWithConfirmedBookings()
  }, [])

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredCustomers = customers
    .filter((customer) => {
      if (!searchQuery) return true
      const searchLower = searchQuery.toLowerCase()
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.username?.toLowerCase().includes(searchLower) ||
        false ||
        customer.phone.includes(searchQuery) ||
        customer.id.toLowerCase().includes(searchLower) ||
        customer.carModel?.toLowerCase().includes(searchLower) ||
        false
      )
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const modifier = sortOrder === "asc" ? 1 : -1

      if (sortField === "id") {
        return (Number.parseInt(a.id.slice(2)) - Number.parseInt(b.id.slice(2))) * modifier
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * modifier
      }

      return 0
    })

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const currentItems = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const columns = [
    { key: "id", label: "CUSTOMER ID", width: "15%" },
    { key: "name", label: "NAME", width: "25%" },
    { key: "phone", label: "PHONE", width: "15%" },
    { key: "carModel", label: "CAR MODEL", width: "20%" },
    { key: "lastVisit", label: "LAST VISIT", width: "15%" },
    { key: "action", label: "ACTION", width: "10%" },
  ]

  const handleViewDetails = (customer: Customer) => {
    router.push(`/customers/${customer.uid}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2A69AC]"></div>
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-[#8B909A] text-lg">No customers with confirmed bookings found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-left"
                  style={{ width: column.width }}
                >
                  <button
                    className="flex items-center gap-1 hover:text-[#1A365D]"
                    onClick={() => handleSort(column.key as keyof Customer)}
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
            {currentItems.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50 h-[4.5rem]">
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={customer.id}>
                  {customer.id}
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center">
                    <img
                      src={customer.avatar || `https://i.pravatar.cc/40?u=${customer.username || customer.email}`}
                      alt={customer.name}
                      className="h-8 w-8 rounded-full mr-2 flex-shrink-0 cursor-pointer"
                      onClick={() => handleViewDetails(customer)}
                    />
                    <span
                      className="text-sm text-[#1A365D] truncate cursor-pointer hover:text-[#2A69AC] uppercase"
                      title={customer.name}
                      onClick={() => handleViewDetails(customer)}
                    >
                      {customer.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={customer.phone}>
                  {customer.phone}
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={customer.carModel}>
                  {customer.carModel}
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={customer.lastVisit}>
                  {customer.lastVisit !== "N/A" ? formatDateOnly(customer.lastVisit) : "N/A"}
                </td>
                <td className="px-3 py-4">
                  <div className="flex justify-center">
                    <Button
                      className="bg-[#2A69AC] hover:bg-[#1A365D] text-white text-xs px-3 py-1 h-8 rounded-md"
                      onClick={() => {
                        // This will be implemented later
                        console.log(`Send message to ${customer.name}`)
                      }}
                    >
                      Send Message
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 0 && (
        <div className="flex justify-end mt-4">
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
    </div>
  )
}

