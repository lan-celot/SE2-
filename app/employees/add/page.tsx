"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useLocalStorage from "@/hooks/useLocalStorage" // Ensure this path is correct
import { PasswordVerificationDialog } from "@/components/password-verification-dialog"

// Update the EmployeeData interface to include status
interface EmployeeData {
  id: string
  name: string
  username: string
  avatar: string
  role: string
  workingOn: string
  status: "Active" | "Inactive" | "Working" | "Terminated"
  firstName: string
  lastName: string
  gender: string
  phone: string
  dateOfBirth: string
  streetAddress: string
  city: string
  province: string
  zipCode: string
  dateAdded: string
}

export default function AddEmployeePage() {
  const router = useRouter()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    dateOfBirth: "",
    role: "",
    streetAddress: "",
    city: "",
    province: "",
    zipCode: "",
  })

  const [employees, setEmployees] = useLocalStorage<EmployeeData[]>("employees", [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleProceed = () => {
    setShowConfirmDialog(true)
  }

  const generateEmployeeId = () => {
    const lastId = employees.length > 0 ? employees[employees.length - 1].id : "E00000"
    const numericPart = Number.parseInt(lastId.slice(1))
    const newNumericId = numericPart + 1
    const newId = `E${newNumericId.toString().padStart(5, "0")}`
    return newId
  }

  const handleConfirm = () => {
    setShowConfirmDialog(false)
    setShowPasswordDialog(true)
  }

  const handleAddEmployee = () => {
    const newEmployee: EmployeeData = {
      id: generateEmployeeId(),
      name: `${formData.firstName} ${formData.lastName}`,
      username: formData.firstName.toLowerCase(),
      avatar: "/placeholder.svg?height=40&width=40",
      workingOn: "Not assigned",
      status: "Active", // Set default status to Active
      dateAdded: new Date().toISOString(),
      ...formData,
    }

    setEmployees([...employees, newEmployee])

    setShowSuccessMessage(true)
    setTimeout(() => {
      router.push("/employees")
    }, 2000)
  }

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Add Employee" />
        </div>

        {showSuccessMessage && (
          <div className="fixed inset-x-0 top-0 z-50 bg-[#E6FFF3] p-4 text-center text-[#28C76F]">Employee added</div>
        )}

        <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-2xl font-semibold text-[#1A365D]">Personal Details</h2>

          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-6">
              <Input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Phone Number (09171234567)"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Input
                type="date"
                placeholder="Date of Birth (mm-dd-yyyy)"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              />

              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Lead Mechanic">Lead Mechanic</SelectItem>
                  <SelectItem value="Assistant Mechanic">Assistant Mechanic</SelectItem>
                  <SelectItem value="Helper Mechanic">Helper Mechanic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Street Address"
              value={formData.streetAddress}
              onChange={(e) => handleInputChange("streetAddress", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-6">
              <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bacoor">Bacoor</SelectItem>
                  <SelectItem value="Imus">Imus</SelectItem>
                  <SelectItem value="Dasmariñas">Dasmariñas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={formData.province} onValueChange={(value) => handleInputChange("province", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cavite">Cavite</SelectItem>
                  <SelectItem value="Laguna">Laguna</SelectItem>
                  <SelectItem value="Batangas">Batangas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Zip Code"
              value={formData.zipCode}
              onChange={(e) => handleInputChange("zipCode", e.target.value)}
            />
          </div>

          <div className="mt-8 flex justify-end">
            <Button className="bg-[#1A365D] hover:bg-[#1E4E8C]" onClick={handleProceed}>
              Proceed
            </Button>
          </div>
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Are you sure to add this employee?</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center gap-4 py-4">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#EA5455]/10 border-0"
              >
                No, go back
              </Button>
              <Button
                onClick={handleConfirm}
                className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#28C76F]/10 border-0"
              >
                Yes, continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Verification Dialog */}
        <PasswordVerificationDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          title="Verify Authorization"
          description="Verifying your password confirms adding this employee."
          onVerified={handleAddEmployee}
          cancelButtonText="Cancel"
          confirmButtonText="Add Employee"
        />
      </main>
    </div>
  )
}

