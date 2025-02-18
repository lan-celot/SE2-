"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, ChevronUp, ChevronDown, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { parseISO, compareDesc } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

const initialEmployees: Employee[] = [
  {
    id: "#E00010",
    name: "Donovan Mitchell",
    username: "spida",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Helper Mechanic",
    workingOn: "#R00109",
    dateAdded: "2024-03-15T10:00:00Z",
  },
  {
    id: "#E00009",
    name: "Anthony Edwards",
    username: "ant",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Helper Mechanic",
    workingOn: "#R00108",
    dateAdded: "2024-03-14T12:00:00Z",
  },
  {
    id: "#E00008",
    name: "Luka Doncic",
    username: "luka",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Assistant Mechanic",
    workingOn: "#R00107",
    dateAdded: "2024-03-13T14:00:00Z",
  },
  {
    id: "#E00007",
    name: "Stephen Curry",
    username: "steph",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Assistant Mechanic",
    workingOn: "#R00106",
    dateAdded: "2024-03-12T16:00:00Z",
  },
  {
    id: "#E00006",
    name: "Manu Ginobili",
    username: "manu",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Assistant Mechanic",
    workingOn: "#R00105",
    dateAdded: "2024-03-11T18:00:00Z",
  },
  {
    id: "#E00005",
    name: "Tim Duncan",
    username: "timmy",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Lead Mechanic",
    workingOn: "#R00104",
    dateAdded: "2024-03-10T20:00:00Z",
  },
  {
    id: "#E00004",
    name: "Ray Allen",
    username: "ray",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Lead Mechanic",
    workingOn: "#R00103",
    dateAdded: "2024-03-09T22:00:00Z",
  },
  {
    id: "#E00003",
    name: "Kobe Bryant",
    username: "kobeeee",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Lead Mechanic",
    workingOn: "#R00102",
    dateAdded: "2024-03-08T00:00:00Z",
  },
  {
    id: "#E00002",
    name: "Nor Tamondong",
    username: "nor",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Administrator",
    workingOn: "#R00101",
    dateAdded: "2024-03-07T02:00:00Z",
  },
  {
    id: "#E00001",
    name: "Marcial Tamondong",
    username: "mar",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Administrator",
    workingOn: "#R00098",
    dateAdded: "2024-03-06T04:00:00Z",
  },
]

interface EmployeesTableProps {
  searchQuery: string
}

export function EmployeesTable({ searchQuery }: EmployeesTableProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [sortField, setSortField] = useState<keyof Employee>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [wrongPassword, setWrongPassword] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const savedEmployees = localStorage.getItem("employees")
    const parsedEmployees = savedEmployees ? JSON.parse(savedEmployees) : []
    return [...parsedEmployees, ...initialEmployees].sort((a, b) =>
      compareDesc(parseISO(a.dateAdded || "1970-01-01"), parseISO(b.dateAdded || "1970-01-01")),
    )
  })
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newRole, setNewRole] = useState("")

  const handleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setEmployees((prevEmployees) => {
      return [...prevEmployees].sort((a, b) => {
        if (field === "dateAdded") {
          return sortOrder === "asc"
            ? compareDesc(parseISO(b.dateAdded || "1970-01-01"), parseISO(a.dateAdded || "1970-01-01"))
            : compareDesc(parseISO(a.dateAdded || "1970-01-01"), parseISO(b.dateAdded || "1970-01-01"))
        }
        if (field === "id") {
          return sortOrder === "asc"
            ? Number.parseInt(a.id.slice(1)) - Number.parseInt(b.id.slice(1))
            : Number.parseInt(b.id.slice(1)) - Number.parseInt(a.id.slice(1))
        }
        if (a[field] < b[field]) return sortOrder === "asc" ? -1 : 1
        if (a[field] > b[field]) return sortOrder === "asc" ? 1 : -1
        return 0
      })
    })
  }

  const filteredEmployees = employees
    .filter((employee) => {
      if (!searchQuery) return true
      const searchLower = searchQuery.toLowerCase()
      return (
        employee.name.toLowerCase().includes(searchLower) ||
        employee.username.toLowerCase().includes(searchLower) ||
        employee.role.toLowerCase().includes(searchLower) ||
        employee.id.toLowerCase().includes(searchLower) ||
        employee.workingOn.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortOrder === "asc" ? -1 : 1
      if (a[sortField] > b[sortField]) return sortOrder === "asc" ? 1 : -1
      return 0
    })

  const handleDelete = () => {
    if (password === "password123") {
      if (selectedEmployee) {
        setEmployees(employees.filter((emp) => emp.id !== selectedEmployee.id))
        setShowDeleteDialog(false)
        setSelectedEmployee(null)
        setPassword("")
        setWrongPassword(false)
        // Show success message
        setShowSuccessMessage(true)
        // Hide success message after 2 seconds
        setTimeout(() => {
          setShowSuccessMessage(false)
        }, 2000)
      }
    } else {
      setWrongPassword(true)
    }
  }

  const handleViewDetails = (employeeId: string) => {
    const formattedId = employeeId.replace("#", "").toLowerCase()
    router.push(`/employees/${formattedId}`)
  }

  const handleRoleChange = () => {
    if (password === "password123" && editingEmployee) {
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => (emp.id === editingEmployee.id ? { ...emp, role: newRole } : emp)),
      )
      setShowEditDialog(false)
      setEditingEmployee(null)
      setNewRole("")
      setPassword("")
      setWrongPassword(false)
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 2000)
    } else {
      setWrongPassword(true)
    }
  }

  return (
    <>
      {showSuccessMessage && (
        <div className="fixed inset-x-0 top-0 z-50 bg-[#E6FFF3] p-4 text-center text-[#28C76F]">
          Role edited successfully
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {[
                { key: "name", label: "NAME" },
                { key: "role", label: "ROLE" },
                { key: "id", label: "EMPLOYEE ID" },
                { key: "workingOn", label: "WORKING ON" },
                { key: "action", label: "ACTION" },
              ].map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-6 py-3 text-xs font-medium text-[#8B909A] uppercase tracking-wider",
                    column.key === "action" ? "text-center" : "text-left",
                  )}
                >
                  {column.key !== "action" ? (
                    <button
                      className="flex items-center gap-1 hover:text-[#1A365D]"
                      onClick={() => handleSort(column.key as keyof Employee)}
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
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleViewDetails(employee.id)}
                      className="rounded-full overflow-hidden hover:ring-2 hover:ring-[#1A365D] transition-all"
                    >
                      <Image
                        src={`https://i.pravatar.cc/40?u=${employee.username}`}
                        alt={employee.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-cover"
                      />
                    </button>
                    <div className="ml-4">
                      <button
                        onClick={() => handleViewDetails(employee.id)}
                        className="text-sm font-medium text-[#1A365D] hover:text-[#2a69ac]"
                      >
                        {employee.name}
                      </button>
                      <button
                        onClick={() => handleViewDetails(employee.id)}
                        className="text-sm text-[#8B909A] hover:text-[#1A365D] block"
                      >
                        {employee.username}
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#1A365D]">{employee.role}</td>
                <td className="px-6 py-4 text-sm text-[#1A365D]">{employee.id}</td>
                <td className="px-6 py-4 text-sm text-[#1A365D]">{employee.workingOn}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingEmployee(employee)
                        setNewRole(employee.role)
                        setShowEditDialog(true)
                      }}
                    >
                      <Pencil className="h-4 w-4 text-[#1A365D]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedEmployee(employee)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-[#1A365D]" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Are you sure to delete <span className="text-[#2A69AC]">{selectedEmployee?.name}</span>?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {wrongPassword && <div className="mb-4 text-center text-[#EA5455]">Wrong password</div>}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setWrongPassword(false)
                }}
                className={cn(
                  "w-full bg-[#F1F5F9] border-0 pr-10",
                  wrongPassword && "border-[#EA5455] focus-visible:ring-[#EA5455]",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setShowDeleteDialog(false)
                setPassword("")
                setWrongPassword(false)
              }}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#EA5455]/10"
            >
              No, go back
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#28C76F]/10"
            >
              Yes, delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Change role for <span className="text-[#2A69AC]">{editingEmployee?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrator">Administrator</SelectItem>
                <SelectItem value="Lead Mechanic">Lead Mechanic</SelectItem>
                <SelectItem value="Assistant Mechanic">Assistant Mechanic</SelectItem>
                <SelectItem value="Helper Mechanic">Helper Mechanic</SelectItem>
              </SelectContent>
            </Select>
            {wrongPassword && <div className="mt-4 text-center text-[#EA5455]">Wrong password</div>}
            <div className="relative mt-4">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setWrongPassword(false)
                }}
                className={cn(
                  "w-full bg-[#F1F5F9] border-0 pr-10",
                  wrongPassword && "border-[#EA5455] focus-visible:ring-[#EA5455]",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setShowEditDialog(false)
                setPassword("")
                setWrongPassword(false)
              }}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#EA5455]/10"
            >
              Cancel
            </button>
            <button
              onClick={handleRoleChange}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#28C76F]/10"
            >
              Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

