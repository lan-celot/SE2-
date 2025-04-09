"use client"
import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown, Search, UserCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/admin-components/button"
import { useResponsiveRows } from "@/hooks/use-responsive-rows"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Input } from "@/components/admin-components/input"

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  uid: string;
}

interface CustomersTableProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CustomersTable({ searchQuery, onSearchChange }: CustomersTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<keyof Customer>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true)
        
        // Fetch customers from Firestore
        const customersRef = collection(db, "users")
        const customersSnapshot = await getDocs(customersRef)
        
        const fetchedCustomers: Customer[] = []
        
        customersSnapshot.forEach((doc) => {
          const userData = doc.data()
          
          // Create customer object from user data
          fetchedCustomers.push({
            id: `#C${fetchedCustomers.length.toString().padStart(5, "0")}`,
            uid: userData.uid || doc.id,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            username: userData.username || "",
            email: userData.email || "",
            phone: userData.phone || "N/A"
          })
        })
        
        setCustomers(fetchedCustomers)
      } catch (error) {
        console.error("Error fetching customers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const handleViewDetails = (customer: Customer) => {
    router.push(`/admin/customers/${customer.uid}`)
  }

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchLower) ||
      customer.username.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchQuery) ||
      customer.id.toLowerCase().includes(searchLower)
    )
  })

  // Sort filtered customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
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

  // Calculate pagination
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage)
  const currentItems = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  )

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
        <p className="text-[#8B909A] text-lg">No customers found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#1A365D]">Customer List</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-[#8B909A] uppercase tracking-wider w-1/3">
                <button
                  className="flex items-center gap-1 hover:text-[#1A365D]"
                  onClick={() => handleSort("firstName")}
                >
                  Name
                  <div className="flex flex-col">
                    <ChevronUp
                      className={cn(
                        "h-3 w-3",
                        sortField === "firstName" && sortOrder === "asc" ? "text-[#1A365D]" : "text-[#8B909A]",
                      )}
                    />
                    <ChevronDown
                      className={cn(
                        "h-3 w-3",
                        sortField === "firstName" && sortOrder === "desc" ? "text-[#1A365D]" : "text-[#8B909A]",
                      )}
                    />
                  </div>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#8B909A] uppercase tracking-wider w-1/3">
                <button
                  className="flex items-center gap-1 hover:text-[#1A365D]"
                  onClick={() => handleSort("phone")}
                >
                  Phone Number
                  <div className="flex flex-col">
                    <ChevronUp
                      className={cn(
                        "h-3 w-3",
                        sortField === "phone" && sortOrder === "asc" ? "text-[#1A365D]" : "text-[#8B909A]",
                      )}
                    />
                    <ChevronDown
                      className={cn(
                        "h-3 w-3",
                        sortField === "phone" && sortOrder === "desc" ? "text-[#1A365D]" : "text-[#8B909A]",
                      )}
                    />
                  </div>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#8B909A] uppercase tracking-wider w-1/4">
                <button
                  className="flex items-center gap-1 hover:text-[#1A365D]"
                  onClick={() => handleSort("id")}
                >
                  Customer ID
                  <div className="flex flex-col">
                    <ChevronUp
                      className={cn(
                        "h-3 w-3",
                        sortField === "id" && sortOrder === "asc" ? "text-[#1A365D]" : "text-[#8B909A]",
                      )}
                    />
                    <ChevronDown
                      className={cn(
                        "h-3 w-3",
                        sortField === "id" && sortOrder === "desc" ? "text-[#1A365D]" : "text-[#8B909A]",
                      )}
                    />
                  </div>
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider w-1/12">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {currentItems.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                      {customer.firstName && customer.lastName ? (
                        <span className="text-sm font-medium text-gray-700">
                          {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                        </span>
                      ) : (
                        <UserCircle2 className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{customer.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">{customer.phone}</td>
                <td className="px-4 py-4 text-sm text-gray-900">{customer.id}</td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => handleViewDetails(customer)}
                    className="text-gray-600 hover:text-[#2A69AC]"
                    title="View customer details"
                  >
                    <UserCircle2 className="h-5 w-5 inline" />
                  </button>
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
      )}
    </div>
  )
}