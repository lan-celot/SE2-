"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/admin-components/header"
import { Sidebar } from "@/components/admin-components/sidebar"
import { Button } from "@/components/admin-components/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/admin-components/dialog"
import { Input } from "@/components/admin-components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin-components/select"
import { PasswordVerificationDialog } from "@/components/admin-components/password-verification-dialog"
import { toast } from "@/hooks/use-toast"
import { addEmployee, type Employee } from "@/lib/employee-utils"

export default function AddEmployeePage() {
  const router = useRouter()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    gender: "",
    phone: "",
    dateOfBirth: "",
    role: "",
    streetAddress1: "",
    streetAddress2: "",
    barangay: "",
    city: "",
    province: "",
    zipCode: "",
    workingSince: new Date().toISOString().split("T")[0], // Default to today
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleProceed = () => {
    // Validate required fields
    const requiredFields: (keyof typeof formData)[] = ["firstName", "lastName", "username", "gender", "phone", "role"]
    const missingFields = requiredFields.filter((field) => !formData[field])

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in the following fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setShowConfirmDialog(true)
  }

  const handleConfirm = () => {
    setShowConfirmDialog(false)
    setShowPasswordDialog(true)
  }

  const handleAddEmployee = async () => {
    try {
      setIsSubmitting(true)

      // Prepare employee data
      const employeeData: Omit<Employee, "id"> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        gender: formData.gender as "Male" | "Female" | "Other",
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        role: formData.role as "Administrator" | "Lead Mechanic" | "Assistant Mechanic" | "Helper Mechanic",
        streetAddress1: formData.streetAddress1,
        streetAddress2: formData.streetAddress2,
        barangay: formData.barangay,
        city: formData.city,
        province: formData.province,
        zipCode: formData.zipCode,
        workingSince: formData.workingSince,
        status: "Active", // Default status for new employees
        email: `${formData.username}@marnor.com`, // Generate email based on username
        avatar: "/placeholder.svg?height=40&width=40", // Default avatar
      }

      const employeeId = await addEmployee(employeeData)

      toast({
        title: "Employee Added",
        description: `${formData.firstName} ${formData.lastName} has been added with ID ${employeeId}`,
        variant: "default",
      })

      setShowSuccessMessage(true)
      setTimeout(() => {
        router.push("/admin/employees")
      }, 2000)
    } catch (error) {
      console.error("Error adding employee:", error)
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Add Employee" />
        </div>

        {showSuccessMessage && (
          <div className="fixed inset-x-0 top-0 z-50 bg-[#E6FFF3] p-4 text-center text-[#28C76F]">
            Employee added successfully
          </div>
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
              <Input
                placeholder="Username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Input
                placeholder="Phone Number (09171234567)"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
              <Input
                type="date"
                placeholder="Date of Birth"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
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
              <Input
                type="date"
                placeholder="Working Since"
                value={formData.workingSince}
                onChange={(e) => handleInputChange("workingSince", e.target.value)}
              />
            </div>

            <h2 className="mt-4 mb-4 text-2xl font-semibold text-[#1A365D]">Address Information</h2>

            <Input
              placeholder="Street Address 1"
              value={formData.streetAddress1}
              onChange={(e) => handleInputChange("streetAddress1", e.target.value)}
            />

            <Input
              placeholder="Street Address 2 (Optional)"
              value={formData.streetAddress2}
              onChange={(e) => handleInputChange("streetAddress2", e.target.value)}
            />

            <Input
              placeholder="Barangay"
              value={formData.barangay}
              onChange={(e) => handleInputChange("barangay", e.target.value)}
            />

            <div className="grid grid-cols-3 gap-6">
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
              <Input
                placeholder="Province"
                value={formData.province}
                onChange={(e) => handleInputChange("province", e.target.value)}
              />
              <Input
                placeholder="Zip Code"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              className="bg-[#2A69AC] hover:bg-[#1A365D] text-white"
              onClick={handleProceed}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Proceed"}
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
                className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
              >
                No, go back
              </Button>
              <Button
                onClick={handleConfirm}
                className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
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

