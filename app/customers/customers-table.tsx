"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Customer {
  id: string
  name: string
  username: string
  phone: string
}

const initialCustomers: Customer[] = [
  {
    id: "#C00100",
    name: "Andrea Salazar",
    username: "andeng",
    phone: "09757840449",
  },
  {
    id: "#C00099",
    name: "Blaine Ramos",
    username: "blainey",
    phone: "09380605349",
  },
  {
    id: "#C00098",
    name: "Leo Macaya",
    username: "oel",
    phone: "09283429109",
  },
  {
    id: "#C00097",
    name: "Russ De Guzman",
    username: "roired",
    phone: "09489539463",
  },
  {
    id: "#C00096",
    name: "Averill Buenvenida",
    username: "ave",
    phone: "09409450648",
  },
  {
    id: "#C00095",
    name: "Han Bascao",
    username: "hanning",
    phone: "09982603116",
  },
  {
    id: "#C00094",
    name: "Jude Flores",
    username: "judeing",
    phone: "09469926599",
  },
  {
    id: "#C00093",
    name: "Joulet Casquejo",
    username: "julet",
    phone: "09129343090",
  },
  {
    id: "#C00092",
    name: "Vince Delos Santos",
    username: "vi",
    phone: "09284267778",
  },
  {
    id: "#C00091",
    name: "Joanne Joaquin",
    username: "jowan",
    phone: "09953094872",
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
  const itemsPerPage = 10

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredCustomers = initialCustomers
    .filter((customer) => {
      if (!searchQuery) return true
      const searchLower = searchQuery.toLowerCase()
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.username.toLowerCase().includes(searchLower) ||
        customer.phone.includes(searchQuery) ||
        customer.id.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const modifier = sortOrder === "asc" ? 1 : -1
      if (sortField === "id") {
        return Number.parseInt(b.id.slice(1)) - Number.parseInt(a.id.slice(1))
      }
      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0
    })

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const currentItems = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const columns = [
    { key: "name", label: "NAME" },
    { key: "phone", label: "PHONE NUMBER" },
    { key: "id", label: "CUSTOMER ID" },
  ]

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-left"
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
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => router.push(`/customers/${customer.id.replace("#", "").toLowerCase()}`)}
                      className="rounded-full overflow-hidden hover:ring-2 hover:ring-[#1A365D] transition-all"
                    >
                      <Image
                        src={`https://i.pravatar.cc/40?u=${customer.username}`}
                        alt={customer.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-cover rounded-full"
                      />
                    </button>
                    <div className="ml-4">
                      <div>
                        <button
                          onClick={() => router.push(`/customers/${customer.id.replace("#", "").toLowerCase()}`)}
                          className="text-sm font-medium text-[#1A365D] hover:text-[#2a69ac] block"
                        >
                          {customer.name}
                        </button>
                      </div>
                      <div>
                        <button
                          onClick={() => router.push(`/customers/${customer.id.replace("#", "").toLowerCase()}`)}
                          className="text-sm text-[#8B909A] hover:text-[#1A365D] block"
                        >
                          {customer.username}
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#1A365D]">{customer.phone}</td>
                <td className="px-6 py-4 text-sm text-[#1A365D]">{customer.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-start gap-2 mt-4">
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
  )
}

