"use client"
import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface Customer {
  id: string
  name: string
  username: string
  phone: string
  carModel: string
  lastVisit: string
  avatar?: string
}

const initialCustomers: Customer[] = [
  {
    id: "#C00100",
    name: "Andrea Salazar",
    username: "andeng",
    phone: "09757840449",
    carModel: "Toyota Hilux",
    lastVisit: "2023-12-25",
    avatar: "https://i.pravatar.cc/40?u=andeng",
  },
  {
    id: "#C00099",
    name: "Blaine Ramos",
    username: "blainey",
    phone: "09380605349",
    carModel: "Honda Civic",
    lastVisit: "2024-01-15",
    avatar: "https://i.pravatar.cc/40?u=blainey",
  },
  {
    id: "#C00098",
    name: "Leo Macaya",
    username: "oel",
    phone: "09283429109",
    carModel: "Ford Ranger",
    lastVisit: "2024-02-01",
    avatar: "https://i.pravatar.cc/40?u=oel",
  },
  {
    id: "#C00097",
    name: "Russ De Guzman",
    username: "roired",
    phone: "09489539463",
    carModel: "Mitsubishi Montero",
    lastVisit: "2024-02-15",
    avatar: "https://i.pravatar.cc/40?u=roired",
  },
  {
    id: "#C00096",
    name: "Averill Buenvenida",
    username: "ave",
    phone: "09409450648",
    carModel: "Nissan Navara",
    lastVisit: "2024-03-01",
    avatar: "https://i.pravatar.cc/40?u=ave",
  },
  {
    id: "#C00095",
    name: "Han Bascao",
    username: "hanning",
    phone: "09982603116",
    carModel: "Isuzu D-Max",
    lastVisit: "2024-03-15",
    avatar: "https://i.pravatar.cc/40?u=hanning",
  },
  {
    id: "#C00094",
    name: "Jude Flores",
    username: "judeing",
    phone: "09469926599",
    carModel: "Hyundai Accent",
    lastVisit: "2024-04-01",
    avatar: "https://i.pravatar.cc/40?u=judeing",
  },
  {
    id: "#C00093",
    name: "Joulet Casquejo",
    username: "julet",
    phone: "09129343090",
    carModel: "Kia Sportage",
    lastVisit: "2024-04-15",
    avatar: "https://i.pravatar.cc/40?u=julet",
  },
  {
    id: "#C00092",
    name: "Vince Delos Santos",
    username: "vi",
    phone: "09284267778",
    carModel: "Mazda CX-5",
    lastVisit: "2024-05-01",
    avatar: "https://i.pravatar.cc/40?u=vi",
  },
  {
    id: "#C00091",
    name: "Joanne Joaquin",
    username: "jowan",
    phone: "09953094872",
    carModel: "Subaru Forester",
    lastVisit: "2024-05-15",
    avatar: "https://i.pravatar.cc/40?u=jowan",
  },
]

interface CustomersTableProps {
  searchQuery: string
}

export function CustomersTable({ searchQuery }: CustomersTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<keyof Customer>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [filteredCustomers, setFilteredCustomers] = useState(initialCustomers)

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }

    // Get the current page data before sorting
    const currentPageData = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // Sort only the current page data
    const sortedPageData = [...currentPageData].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]
      const modifier = sortOrder === "asc" ? 1 : -1

      if (field === "id") {
        return Number.parseInt(b.id.slice(1)) - Number.parseInt(a.id.slice(1))
      }

      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0
    })

    // Create a new filtered customers array with the sorted page
    const newFilteredCustomers = [...filteredCustomers]
    for (let i = 0; i < sortedPageData.length; i++) {
      newFilteredCustomers[(currentPage - 1) * itemsPerPage + i] = sortedPageData[i]
    }

    // Update the state with the new sorted data
    setFilteredCustomers(newFilteredCustomers)
  }

  const filteredCustomersSearch = initialCustomers.filter((customer) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.username.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchQuery) ||
      customer.id.toLowerCase().includes(searchLower) ||
      customer.carModel.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredCustomersSearch.length / itemsPerPage)
  const currentItems = filteredCustomersSearch.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const columns = [
    { key: "id", label: "CUSTOMER ID", width: "15%" },
    { key: "name", label: "NAME", width: "25%" },
    { key: "phone", label: "PHONE", width: "15%" },
    { key: "carModel", label: "CAR MODEL", width: "20%" },
    { key: "lastVisit", label: "LAST VISIT", width: "15%" },
    { key: "action", label: "ACTION", width: "10%" },
  ]

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
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={customer.id}>
                  {customer.id}
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center">
                    <img
                      src={customer.avatar || `https://i.pravatar.cc/40?u=${customer.username}`}
                      alt={customer.name}
                      className="h-8 w-8 rounded-full mr-2 flex-shrink-0 cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id.replace("#", "").toLowerCase()}`)}
                    />
                    <span
                      className="text-sm text-[#1A365D] truncate cursor-pointer hover:text-[#2A69AC]"
                      title={customer.name}
                      onClick={() => router.push(`/customers/${customer.id.replace("#", "").toLowerCase()}`)}
                    >
                      {customer.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={customer.phone}>
                  {customer.phone}
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={customer.carModel}>
                  {customer.carModel}
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={customer.lastVisit}>
                  {customer.lastVisit}
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
      <div className="flex justify-end mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentPage(Math.max(1, currentPage - 1))
              // If there's an expanded row state, reset it here
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
                // If there's an expanded row state, reset it here
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
              // If there's an expanded row state, reset it here
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
    </div>
  )
}

