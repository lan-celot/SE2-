"use client"
import useLocalStorage from "@/hooks/useLocalStorage"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, ChevronUp, ChevronDown, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { parseISO, compareDesc } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface Employee {
  id: string
  name: string
  username: string
  avatar: string
  role: string
  workingOn: string
  status: "Active" | "Inactive" | "Working" | "Terminated"
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

const statusStyles = {
  Active: { bg: "bg-[#E6FFF3]", text: "text-[#28C76F]" },
  Inactive: { bg: "bg-[#EBF8FF]", text: "text-[#63B3ED]" },
  Working: { bg: "bg-[#FFF5E0]", text: "text-[#FFC600]" },
  Terminated: { bg: "bg-[#FFE5E5]", text: "text-[#EA5455]" },
}

const initialEmployees: Employee[] = [
  {
    id: "#E00010",
    name: "Donovan Mitchell",
    username: "spida",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Helper Mechanic",
    workingOn: "#R00109",
    status: "Active",
    dateAdded: "2024-03-15T10:00:00Z",
  },
  {
    id: "#E00009",
    name: "Anthony Edwards",
    username: "ant",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Helper Mechanic",
    workingOn: "#R00108",
    status: "Working",
    dateAdded: "2024-03-14T12:00:00Z",
  },
  {
    id: "#E00008",
    name: "Luka Doncic",
    username: "luka",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Assistant Mechanic",
    workingOn: "#R00107",
    status: "Active",
    dateAdded: "2024-03-13T14:00:00Z",
  },
  {
    id: "#E00007",
    name: "Stephen Curry",
    username: "steph",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Assistant Mechanic",
    workingOn: "#R00106",
    status: "Inactive",
    dateAdded: "2024-03-12T16:00:00Z",
  },
  {
    id: "#E00006",
    name: "Manu Ginobili",
    username: "manu",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Assistant Mechanic",
    workingOn: "#R00105",
    status: "Working",
    dateAdded: "2024-03-11T18:00:00Z",
  },
  {
    id: "#E00005",
    name: "Tim Duncan",
    username: "timmy",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Lead Mechanic",
    workingOn: "#R00104",
    status: "Active",
    dateAdded: "2024-03-10T20:00:00Z",
  },
  {
    id: "#E00004",
    name: "Ray Allen",
    username: "ray",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Lead Mechanic",
    workingOn: "#R00103",
    status: "Inactive",
    dateAdded: "2024-03-09T22:00:00Z",
  },
  {
    id: "#E00003",
    name: "Kobe Bryant",
    username: "kobeeee",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Lead Mechanic",
    workingOn: "#R00102",
    status: "Terminated",
    dateAdded: "2024-03-08T00:00:00Z",
  },
  {
    id: "#E00002",
    name: "Nor Tamondong",
    username: "nor",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Administrator",
    workingOn: "#R00101",
    status: "Active",
    dateAdded: "2024-03-07T02:00:00Z",
  },
  {
    id: "#E00001",
    name: "Marcial Tamondong",
    username: "mar",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Administrator",
    workingOn: "#R00098",
    status: "Active",
    dateAdded: "2024-03-06T04:00:00Z",
  },
]

interface EmployeesTableProps {
  searchQuery: string
}

export function EmployeesTable({ searchQuery }: EmployeesTableProps) {
  const router = useRouter()
  const [employees, setEmployees] = useLocalStorage<Employee[]>("employees", initialEmployees)
  const [sortedEmployees, setSortedEmployees] = useState<Employee[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [sortField, setSortField] = useState<keyof Employee>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [wrongPassword, setWrongPassword] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newRole, setNewRole] = useState("")
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<Employee["status"]>("Active")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Sort employees when they change
  useEffect(() => {
    const sorted = [...employees].sort((a, b) =>
      compareDesc(parseISO(a.dateAdded || "1970-01-01"), parseISO(b.dateAdded || "1970-01-01")),
    )

    setSortedEmployees(sorted)
  }, [employees])

  const handleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }

    // Get the current page data before sorting
    const currentPageData = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // Sort only the current page data
    const sortedPageData = [...currentPageData].sort((a, b) => {
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
      const valueA = a[field] ?? ""
      const valueB = b[field] ?? ""
      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    // Replace only the current page in the sorted employees
    const newSortedEmployees = [...sortedEmployees]
    for (let i = 0; i < sortedPageData.length; i++) {
      newSortedEmployees[(currentPage - 1) * itemsPerPage + i] = sortedPageData[i]
    }

    setSortedEmployees(newSortedEmployees)
  }

  const filteredEmployees = sortedEmployees.filter((employee) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      employee.name.toLowerCase().includes(searchLower) ||
      employee.username.toLowerCase().includes(searchLower) ||
      employee.role.toLowerCase().includes(searchLower) ||
      employee.id.toLowerCase().includes(searchLower) ||
      employee.workingOn.toLowerCase().includes(searchLower) ||
      employee.status.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleDelete = () => {
    if (password === "password123") {
      if (selectedEmployee) {
        const updatedEmployees = employees.filter((emp) => emp.id !== selectedEmployee.id)
        setEmployees(updatedEmployees)

        // Show success toast
        toast({
          title: "Employee Deleted",
          description: `${selectedEmployee.name} has been removed from the employee list.`,
          variant: "default",
        })

        // Reset dialogs and state
        setShowDeleteDialog(false)
        setSelectedEmployee(null)
        setPassword("")
        setWrongPassword(false)
      }
    } else {
      setWrongPassword(true)
      toast({
        title: "Incorrect Password",
        description: "The password you entered is incorrect.",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (employeeId: string) => {
    const formattedId = employeeId.replace("#", "").toLowerCase()
    router.push(`/employees/${formattedId}`)
  }

  const handleRoleChange = () => {
    if (password === "password123" && editingEmployee) {
      const updatedEmployees = employees.map((emp) => (emp.id === editingEmployee.id ? { ...emp, role: newRole } : emp))

      setEmployees(updatedEmployees)

      // Show success toast
      toast({
        title: "Role Updated",
        description: `${editingEmployee.name}'s role has been changed to ${newRole}.`,
        variant: "default",
      })

      // Reset dialogs and state
      setShowEditDialog(false)
      setEditingEmployee(null)
      setNewRole("")
      setPassword("")
      setWrongPassword(false)
    } else {
      setWrongPassword(true)
      toast({
        title: "Incorrect Password",
        description: "The password you entered is incorrect.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = () => {
    if (password === "password123" && editingEmployee) {
      const updatedEmployees = employees.map((emp) =>
        emp.id === editingEmployee.id ? { ...emp, status: newStatus } : emp,
      )

      setEmployees(updatedEmployees)

      // Show success toast
      toast({
        title: "Status Updated",
        description: `${editingEmployee.name}'s status has been changed to ${newStatus}.`,
        variant: "default",
      })

      // Reset dialogs and state
      setShowStatusDialog(false)
      setEditingEmployee(null)
      setNewStatus("Active")
      setPassword("")
      setWrongPassword(false)
    } else {
      setWrongPassword(true)
      toast({
        title: "Incorrect Password",
        description: "The password you entered is incorrect.",
        variant: "destructive",
      })
    }
  }

  // Prevent hydration errors by rendering only after component is mounted
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              {[
                { key: "name", label: "NAME", width: "20%" },
                { key: "role", label: "ROLE", width: "15%" },
                { key: "id", label: "EMPLOYEE ID", width: "12%" },
                { key: "workingOn", label: "WORKING ON", width: "15%" },
                { key: "status", label: "STATUS", width: "15%" },
                { key: "action", label: "ACTION", width: "10%" },
              ].map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-2 text-xs font-medium text-[#8B909A] uppercase tracking-wider text-left"
                  style={{ width: column.width }}
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
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50 h-[4.5rem]">
                <td className="px-3 py-4">
                  <div className="flex items-center">
                    <img
                      src={employee.avatar || `https://i.pravatar.cc/40?u=${employee.username}`}
                      alt={employee.name}
                      className="h-8 w-8 rounded-full mr-2 flex-shrink-0 cursor-pointer"
                      onClick={() => handleViewDetails(employee.id)}
                    />
                    <span
                      className="text-sm text-[#1A365D] truncate cursor-pointer hover:text-[#2A69AC]"
                      title={employee.name}
                      onClick={() => handleViewDetails(employee.id)}
                    >
                      {employee.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={employee.role}>
                  {employee.role}
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={employee.id}>
                  {employee.id}
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate" title={employee.workingOn}>
                  {employee.workingOn}
                </td>
                <td className="px-3 py-4">
                  <div className="relative inline-block">
                    <select
                      value={employee.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as Employee["status"]
                        const updatedEmployees = employees.map((emp) =>
                          emp.id === employee.id ? { ...emp, status: newStatus } : emp,
                        )
                        setEmployees(updatedEmployees)
                      }}
                      className={cn(
                        "appearance-none h-8 w-[140px] px-3 pr-8 py-0 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 truncate",
                        employee.status && statusStyles[employee.status]
                          ? statusStyles[employee.status].bg
                          : "bg-gray-100",
                        employee.status && statusStyles[employee.status]
                          ? statusStyles[employee.status].text
                          : "text-gray-500",
                      )}
                    >
                      <option
                        value="Active"
                        className="bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C6F6D5] hover:text-[#22A366] py-1"
                      >
                        Active
                      </option>
                      <option
                        value="Inactive"
                        className="bg-[#EBF8FF] text-[#63B3ED] hover:bg-[#BEE3F8] hover:text-[#2B6CB0] py-1"
                      >
                        Inactive
                      </option>
                      <option
                        value="Working"
                        className="bg-[#FFF5E0] text-[#FFC600] hover:bg-[#FEEBC8] hover:text-[#D97706] py-1"
                      >
                        Working
                      </option>
                      <option
                        value="Terminated"
                        className="bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FED7D7] hover:text-[#C53030] py-1"
                      >
                        Terminated
                      </option>
                    </select>
                    <ChevronDown
                      className={cn(
                        "absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none h-3 w-3",
                        employee.status === "Active"
                          ? "text-[#28C76F]"
                          : employee.status === "Inactive"
                            ? "text-[#63B3ED]"
                            : employee.status === "Working"
                              ? "text-[#FFC600]"
                              : employee.status === "Terminated"
                                ? "text-[#EA5455]"
                                : "text-gray-500",
                      )}
                    />
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center space-x-2">
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

      {/* Pagination */}
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

      {/* Delete Confirmation Dialog */}
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

      {/* Edit Role Dialog */}
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

      {/* Edit Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Change status for <span className="text-[#2A69AC]">{editingEmployee?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus as any}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active" className={cn(statusStyles.Active.bg, statusStyles.Active.text)}>
                  Active
                </SelectItem>
                <SelectItem value="Inactive" className={cn(statusStyles.Inactive.bg, statusStyles.Inactive.text)}>
                  Inactive
                </SelectItem>
                <SelectItem value="Working" className={cn(statusStyles.Working.bg, statusStyles.Working.text)}>
                  Working
                </SelectItem>
                <SelectItem value="Terminated" className={cn(statusStyles.Terminated.bg, statusStyles.Terminated.text)}>
                  Terminated
                </SelectItem>
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
                setShowStatusDialog(false)
                setPassword("")
                setWrongPassword(false)
              }}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#EA5455]/10"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusChange}
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

