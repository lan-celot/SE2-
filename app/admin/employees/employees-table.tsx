"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/admin-components/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/admin-components/dialog"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin-components/select"
import { toast } from "@/hooks/use-toast"
import Loading from "@/components/admin-components/loading"
import { PasswordVerificationDialog } from "@/components/admin-components/password-verification-dialog"
import { useResponsiveRows } from "@/hooks/use-responsive-rows"
import { type Employee, getAllEmployees, updateEmployee, deleteEmployee } from "@/lib/employee-utils"
import { collection, query, where, orderBy, limit, getDocs, getFirestore } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Adjust the import path to your Firebase config

// Add this function near your existing utility functions
interface ReservationData {
  id: string;
  statusChangedAt: { seconds: number; nanoseconds: number } | null;
  lastUpdated: string | number;
  status: string;
  mechanics: string[];
  [key: string]: any;
}

const getCurrentReservation = async (employeeName: string): Promise<string | null> => {
  try {
    console.log(`[DEBUG] Starting reservation search for mechanic: ${employeeName}`);

    const db = getFirestore();
    const reservationsRef = collection(db, 'bookings');

    // Query all reservations
    const q = query(reservationsRef);

    const querySnapshot = await getDocs(q);

    console.log(`[DEBUG] Total reservations found: ${querySnapshot.size}`);

    if (!querySnapshot.empty) {
      // Detailed logging for each reservation
      const recentReservations = querySnapshot.docs
        .map(doc => {
          const data = doc.data() as Omit<ReservationData, 'id'>;
          
          console.log(`[DEBUG] Reservation Details:`, {
            id: doc.id,
            status: data.status,
            services: data.services?.map((service: { service: any; mechanic: any; status: any }) => ({
              service: service.service,
              mechanic: service.mechanic,
              status: service.status
            })),
            lastUpdated: data.lastUpdated
          });

          return {
            id: doc.id,
            statusChangedAt: data.statusChangedAt,
            lastUpdated: data.lastUpdated,
            status: data.status,
            mechanics: data.mechanics,
            ...data,
          } as ReservationData;
        })
        .filter((reservation: ReservationData) => {
          // Additional filtering and logging
          const isRepairing = reservation.status === 'REPAIRING';
          const hasMechanicAssigned = Array.isArray(reservation.services) && 
            reservation.services.some((service: { mechanic: string }) => 
              service.mechanic && 
              service.mechanic.toUpperCase() === employeeName.toUpperCase()
            );

          console.log(`[DEBUG] Reservation Filtering:`, {
            reservationId: reservation.id,
            isRepairing,
            hasMechanicAssigned,
            mechanics: reservation.services?.map((s: { mechanic: any }) => s.mechanic)
          });

          return isRepairing && hasMechanicAssigned;
        })
        .sort((a, b) => {
          // Sort by last updated timestamp
          const lastUpdatedA = new Date(a.lastUpdated || 0).getTime();
          const lastUpdatedB = new Date(b.lastUpdated || 0).getTime();
          return lastUpdatedB - lastUpdatedA;
        });

      console.log(`[DEBUG] Filtered Reservations:`, recentReservations.map(r => r.id));

      // Return the ID of the most recent reservation
      return recentReservations.length > 0 ? recentReservations[0].id : null;
    }

    console.log(`[DEBUG] No reservations found for mechanic: ${employeeName}`);
    return null;
  } catch (error) {
    console.error(`[ERROR] Fetching current reservation for ${employeeName}:`, error);
    return null;
  }
};


const statusStyles: Record<string, { bg: string; text: string; borderColor: string }> = {
  Active: {
    bg: "bg-[#E6FFF3]",
    text: "text-[#28C76F]",
    borderColor: "border-[#28C76F]",
  },
  Inactive: {
    bg: "bg-[#EBF8FF]",
    text: "text-[#63B3ED]",
    borderColor: "border-[#63B3ED]",
  },
  Terminated: {
    bg: "bg-[#FFE5E5]",
    text: "text-[#EA5455]",
    borderColor: "border-[#EA5455]",
  },
  default: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    borderColor: "border-gray-400",
  },
}

// Replace the initialEmployees array with an empty array since we'll fetch from Firebase
const initialEmployees: Employee[] = []

// Update the EmployeesTableProps interface to include activeTab
interface EmployeesTableProps {
  searchQuery: string
  activeTab: string
}

// Update the function signature to accept activeTab
export function EmployeesTable({ searchQuery, activeTab }: EmployeesTableProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [sortedEmployees, setSortedEmployees] = useState<Employee[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeletePasswordDialog, setShowDeletePasswordDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [sortField, setSortField] = useState<keyof Employee>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showEditPasswordDialog, setShowEditPasswordDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newRole, setNewRole] = useState("")
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showStatusPasswordDialog, setShowStatusPasswordDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<Employee["status"]>("Active")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  // Replace fixed itemsPerPage with the custom hook
  const itemsPerPage = useResponsiveRows(180) // Adjust header height for tabs and search
  // Remove the selectedRows state and handleRowSelect function
  // Update the table header to remove the checkbox column
  // Update the table row to remove the checkbox cell

  // Helper function to sort employees by ID
  const sortEmployeesById = (employeesToSort: Employee[], order: "asc" | "desc" = "desc") => {
    return [...employeesToSort].sort((a, b) => {
      // Extract numeric part of ID for sorting (e.g., "EMP_001" -> 1)
      const aNum = Number.parseInt(a.id.split("_")[1])
      const bNum = Number.parseInt(b.id.split("_")[1])
      return order === "desc" ? bNum - aNum : aNum - bNum
    })
  }

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        console.log(`[DEBUG] Starting employee reservation fetch`);
        setIsLoading(true)
        const fetchedEmployees = await getAllEmployees()
  
        console.log(`[DEBUG] Fetched Employees:`, fetchedEmployees.map(e => `${e.firstName} ${e.lastName}`));
  
        // Enrich employees with their current reservation
        const enrichedEmployees = await Promise.all(
          fetchedEmployees.map(async (employee) => {
            // Construct full name
            const fullNameUpper = `${employee.firstName} ${employee.lastName}`.toUpperCase();
            
            console.log(`[DEBUG] Searching reservation for employee: ${fullNameUpper}`);
  
            // Try to find a current reservation
            const currentReservation = await getCurrentReservation(fullNameUpper);
  
            console.log(`[DEBUG] Employee ${fullNameUpper} Current Reservation:`, currentReservation);
  
            return {
              ...employee,
              currentReservation
            }
          })
        )
  
        console.log(`[DEBUG] Enriched Employees:`, enrichedEmployees.map(e => ({
          name: `${e.firstName} ${e.lastName}`,
          currentReservation: e.currentReservation
        })));
  
        setEmployees(enrichedEmployees)
  
        // Sort and set other states as before
        const sorted = sortEmployeesById(enrichedEmployees, "desc")
        setSortedEmployees(sorted)
        setIsLoading(false)
      } catch (error) {
        console.error("[ERROR] Fetching employees:", error)
        toast({
          title: "Error",
          description: "Failed to fetch employees",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }
  
    fetchEmployees()
  }, [])

  const handleSort = (field: keyof Employee) => {
    // Toggle sort order if clicking the same field
    const newSortOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc"

    setSortField(field)
    setSortOrder(newSortOrder)

    // Sort the entire dataset, not just the current page
    let sorted = [...employees]

    if (field === "id") {
      // Use our helper function for ID sorting
      sorted = sortEmployeesById(employees, newSortOrder)
    } else {
      // General sorting for other fields
      sorted = [...employees].sort((a, b) => {
        const valueA = (a[field] || "").toString().toLowerCase()
        const valueB = (b[field] || "").toString().toLowerCase()

        if (valueA < valueB) return newSortOrder === "asc" ? -1 : 1
        if (valueA > valueB) return newSortOrder === "asc" ? 1 : -1
        return 0
      })
    }

    setSortedEmployees(sorted)
  }

  // Update the filteredEmployees function to filter by activeTab
  const filteredEmployees = sortedEmployees.filter((employee) => {
    // First filter by tab
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && employee.status === "Active") ||
      (activeTab === "inactive" && employee.status === "Inactive") ||
      (activeTab === "terminated" && employee.status === "Terminated")

    if (!matchesTab) return false

    // Then filter by search query
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.username.toLowerCase().includes(searchLower) ||
      employee.role.toLowerCase().includes(searchLower) ||
      employee.id.toLowerCase().includes(searchLower) ||
      employee.phone.toLowerCase().includes(searchLower) ||
      employee.status.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Update the handleDelete function to use Firebase and maintain sorting
  const handleDelete = async () => {
    if (selectedEmployee) {
      try {
        await deleteEmployee(selectedEmployee.id)

        // Update local state
        const updatedEmployees = employees.filter((emp) => emp.id !== selectedEmployee.id)
        setEmployees(updatedEmployees)

        // Re-sort the employees to maintain the current sort order
        let newSortedEmployees
        if (sortField === "id") {
          newSortedEmployees = sortEmployeesById(updatedEmployees, sortOrder)
        } else {
          // Re-apply the current sort
          newSortedEmployees = [...updatedEmployees].sort((a, b) => {
            const valueA = (a[sortField] || "").toString().toLowerCase()
            const valueB = (b[sortField] || "").toString().toLowerCase()

            if (valueA < valueB) return sortOrder === "asc" ? -1 : 1
            if (valueA > valueB) return sortOrder === "asc" ? 1 : -1
            return 0
          })
        }

        setSortedEmployees(newSortedEmployees)

        // Show success toast
        toast({
          title: "Employee Deleted",
          description: `${selectedEmployee.firstName} ${selectedEmployee.lastName} has been removed from the employee list.`,
          variant: "default",
        })

        // Reset dialogs and state
        setShowDeleteDialog(false)
        setSelectedEmployee(null)
      } catch (error) {
        console.error("Error deleting employee:", error)
        toast({
          title: "Error",
          description: "Failed to delete employee",
          variant: "destructive",
        })
      }
    }
  }

  // Update the handleViewDetails function
  const handleViewDetails = (employeeId: string) => {
    router.push(`/admin/employees/${employeeId}`)
  }

  // Update the handleRoleChange function to use Firebase and maintain sorting
  const handleRoleChange = async () => {
    if (editingEmployee) {
      try {
        await updateEmployee(editingEmployee.id, { role: newRole as Employee["role"] })

        // Update local state
        const updatedEmployees = employees.map((emp) =>
          emp.id === editingEmployee.id ? { ...emp, role: newRole as Employee["role"] } : emp,
        )

        setEmployees(updatedEmployees)

        // Re-sort the employees to maintain the current sort order
        let newSortedEmployees
        if (sortField === "id") {
          newSortedEmployees = sortEmployeesById(updatedEmployees, sortOrder)
        } else {
          // Re-apply the current sort
          newSortedEmployees = [...updatedEmployees].sort((a, b) => {
            const valueA = (a[sortField] || "").toString().toLowerCase()
            const valueB = (b[sortField] || "").toString().toLowerCase()

            if (valueA < valueB) return sortOrder === "asc" ? -1 : 1
            if (valueA > valueB) return sortOrder === "asc" ? 1 : -1
            return 0
          })
        }

        setSortedEmployees(newSortedEmployees)

        // Show success toast
        toast({
          title: "Role Updated",
          description: `${editingEmployee.firstName} ${editingEmployee.lastName}'s role has been changed to ${newRole}.`,
          variant: "default",
        })

        // Reset dialogs and state
        setShowEditDialog(false)
        setEditingEmployee(null)
        setNewRole("")
      } catch (error) {
        console.error("Error updating employee role:", error)
        toast({
          title: "Error",
          description: "Failed to update employee role",
          variant: "destructive",
        })
      }
    }
  }

  // Update the handleStatusChange function to use Firebase and maintain sorting
  const handleStatusChange = async () => {
    if (editingEmployee) {
      try {
        await updateEmployee(editingEmployee.id, { status: newStatus as Employee["status"] })

        // Update local state
        const updatedEmployees = employees.map((emp) =>
          emp.id === editingEmployee.id ? { ...emp, status: newStatus } : emp,
        )

        setEmployees(updatedEmployees)

        // Re-sort the employees to maintain the current sort order
        const newSortedEmployees = [...updatedEmployees].sort((a, b) => {
          const valueA = (a[sortField] || "").toString().toLowerCase()
          const valueB = (b[sortField] || "").toString().toLowerCase()

          if (valueA < valueB) return sortOrder === "asc" ? -1 : 1
          if (valueA > valueB) return sortOrder === "asc" ? 1 : -1
          return 0
        })

        setSortedEmployees(newSortedEmployees)

        // Show success toast
        toast({
          title: "Status Updated",
          description: `${editingEmployee.firstName} ${editingEmployee.lastName}'s status has been changed to ${newStatus}.`,
          variant: "default",
        })

        // Reset dialogs and state
        setShowStatusDialog(false)
        setEditingEmployee(null)
        setNewStatus("Active")
      } catch (error) {
        console.error("Error updating employee status:", error)
        toast({
          title: "Error",
          description: "Failed to update employee status",
          variant: "destructive",
        })
      }
    }
  }

  // Prevent hydration errors by rendering only after component is mounted
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (isLoading) {
    return <Loading />
  }

  // Update the getStatusStyle function to default to 'Active' status
  const getStatusStyle = (status: string | undefined) => {
    // If status is undefined or null, treat as 'Active'
    if (!status) {
      return statusStyles.Active
    }

    // Normalize the status to handle case sensitivity
    const normalizedStatus = status.trim()
    return statusStyles[normalizedStatus] || statusStyles.Active // Default to Active instead of default
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
                  {column.key !== "action" && column.key !== "status" ? (
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
                      alt={`${employee.firstName} ${employee.lastName}`}
                      className="h-8 w-8 rounded-full mr-2 flex-shrink-0 cursor-pointer"
                      onClick={() => handleViewDetails(employee.id)}
                    />
                    <span
                      className="text-sm text-[#1A365D] truncate cursor-pointer hover:text-[#2A69AC] uppercase"
                      title={`${employee.firstName} ${employee.lastName}`}
                      onClick={() => handleViewDetails(employee.id)}
                    >
                      {`${employee.firstName} ${employee.lastName}`}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={employee.role}>
                  {employee.role}
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={employee.id}>
                  {employee.id}
                </td>
                <td className="px-3 py-4 text-sm text-[#1A365D] truncate uppercase" title={employee.currentReservation || ''}>
  {employee.currentReservation || "Not assigned"}
</td>
                <td className="px-3 py-4">
                  <div className="relative inline-block">
                    <Select
                      value={employee.status}
                      onValueChange={(value) => {
                        // Instead of immediately changing the status, store the employee and new status
                        // and show the password verification dialog
                        setEditingEmployee(employee)
                        setNewStatus(value as Employee["status"])
                        setShowStatusPasswordDialog(true)
                      }}
                    >
                      {/* Also update the Select component to ensure it shows 'Active' when status is undefined */}
                      <SelectTrigger
                        className={cn(
                          "w-[140px] h-8 px-3 py-1 text-sm font-medium rounded-md",
                          getStatusStyle(employee.status).bg,
                          getStatusStyle(employee.status).text,
                          "border-transparent", // Default transparent border
                          "focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0",
                          "data-[state=open]:border-2", // Only show border when open
                          {
                            "data-[state=open]:border-[#28C76F]": employee.status === "Active" || !employee.status,
                            "data-[state=open]:border-[#63B3ED]": employee.status === "Inactive",
                            "data-[state=open]:border-[#EA5455]": employee.status === "Terminated",
                            [`data-[state=open]:${getStatusStyle(employee.status).borderColor}`]: true,
                          },
                        )}
                      >
                        <SelectValue>{employee.status || "Active"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="Active"
                          className="bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C6F6D5] hover:text-[#22A366] py-1.5"
                        >
                          Active
                        </SelectItem>
                        <SelectItem
                          value="Inactive"
                          className="bg-[#EBF8FF] text-[#63B3ED] hover:bg-[#BEE3F8] hover:text-[#2B6CB0] py-1.5"
                        >
                          Inactive
                        </SelectItem>
                        <SelectItem
                          value="Terminated"
                          className="bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FED7D7] hover:text-[#C53030] py-1.5"
                        >
                          Terminated
                        </SelectItem>
                      </SelectContent>
                    </Select>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Are you sure to delete{" "}
              <span className="text-[#2A69AC]">
                {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </span>
              ?
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 py-4">
            <Button
              onClick={() => setShowDeleteDialog(false)}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
            >
              No, go back
            </Button>
            <Button
              onClick={() => {
                setShowDeleteDialog(false)
                setShowDeletePasswordDialog(true)
              }}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
            >
              Yes, continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Password Verification Dialog */}
      <PasswordVerificationDialog
        open={showDeletePasswordDialog}
        onOpenChange={setShowDeletePasswordDialog}
        title="Verify Authorization"
        description="Verifying your password confirms the deletion of this employee."
        onVerified={handleDelete}
        cancelButtonText="Cancel"
        confirmButtonText="Delete"
      />

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Change role for{" "}
              <span className="text-[#2A69AC]">
                {editingEmployee?.firstName} {editingEmployee?.lastName}
              </span>
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
          </div>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setShowEditDialog(false)}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowEditDialog(false)
                setShowEditPasswordDialog(true)
              }}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Password Verification Dialog */}
      <PasswordVerificationDialog
        open={showEditPasswordDialog}
        onOpenChange={setShowEditPasswordDialog}
        title="Verify Authorization"
        description="Verifying your password confirms the role change."
        onVerified={handleRoleChange}
        cancelButtonText="Cancel"
        confirmButtonText="Update Role"
      />

      {/* Edit Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Change status for{" "}
              <span className="text-[#2A69AC]">
                {editingEmployee?.firstName} {editingEmployee?.lastName}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Employee["status"])}>
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
                <SelectItem value="Terminated" className={cn(statusStyles.Terminated.bg, statusStyles.Terminated.text)}>
                  Terminated
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowStatusDialog(false)}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowStatusDialog(false)
                setShowStatusPasswordDialog(true)
              }}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
            >
              Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Status Password Verification Dialog */}
      <PasswordVerificationDialog
        open={showStatusPasswordDialog}
        onOpenChange={setShowStatusPasswordDialog}
        title="Verify Authorization"
        description="Verifying your password confirms the status change."
        onVerified={handleStatusChange}
        cancelButtonText="Cancel"
        confirmButtonText="Update Status"
      />
    </>
  )
}

