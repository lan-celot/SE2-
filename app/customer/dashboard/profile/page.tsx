"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Pencil, Save, X, Upload, User } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Create local component imports to resolve missing type declarations
// Instead of importing from "@/components/ui/dialog"
const Dialog = ({
  open,
  onOpenChange,
  children,
}: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">{children}</div>
}

const DialogContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return <div className={`bg-white rounded-lg p-6 max-w-md mx-auto ${className}`}>{children}</div>
}

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="mb-4">{children}</div>
}

const DialogTitle = ({ children }: { children: React.ReactNode }) => {
  return <h2 className="text-xl font-bold">{children}</h2>
}

const DialogDescription = ({ children }: { children: React.ReactNode }) => {
  return <p className="text-gray-500 mt-1">{children}</p>
}

// Create RadioGroup components
const RadioGroup = ({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}) => {
  return <div className={className}>{children}</div>
}

const RadioGroupItem = ({ value, id }: { value: string; id: string }) => {
  return <input type="radio" id={id} value={value} name="radioGroup" />
}

const Label = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => {
  return <label htmlFor={htmlFor}>{children}</label>
}

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    region: "",
    province: "",
    city: "",
    zipCode: "",
    streetAddress: "",
    photoURL: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [editingAddress, setEditingAddress] = useState(false)
  const [updatedProfile, setUpdatedProfile] = useState<Record<string, any>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // New state variables for enhanced personal information editing
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [ageError, setAgeError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const user = auth.currentUser
    if (!user) {
      console.log("User is not authenticated")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const profileRef = doc(db, "accounts", user.uid)
      const profileSnap = await getDoc(profileRef)

      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as Record<string, any>
        setProfile(profileData as any)
        setUpdatedProfile(profileData)
      } else {
        console.log("No profile found")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (section: string, field: string, value: string) => {
    setUpdatedProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Enhanced validation function for phone number
  const validatePhoneNumber = (phone: string): boolean => {
    // No validation needed for empty values (optional field)
    if (!phone || phone.trim() === "") return true

    // Validate 09 format (exactly 11 digits)
    if (phone.startsWith("09")) {
      return phone.length === 11 && /^09\d{9}$/.test(phone)
    }

    return false
  }

  const validateAge = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) return false

    const birthDate = new Date(dateOfBirth)
    const today = new Date()

    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()

    // Adjust age if birthday hasn't occurred this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age >= 18
  }

  const handlePhoneChange = (value: string) => {
    // Clear previous errors
    setPhoneError(null)

    // Only allow digits
    const formattedValue = value.replace(/[^\d]/g, "")

    // Apply the formatted value to updatedProfile
    handleInputChange("personal", "phoneNumber", formattedValue)

    // Limit to 11 characters
    const trimmedValue = formattedValue.slice(0, 11)
    handleInputChange("personal", "phoneNumber", trimmedValue)

    // Validate based on 09 format
    if (trimmedValue.length > 0 && !trimmedValue.startsWith("09")) {
      setPhoneError("Phone number must start with 09")
    } else if (trimmedValue.length === 11 && !validatePhoneNumber(trimmedValue)) {
      setPhoneError("Please enter a valid 09 number (09XXXXXXXXX)")
    }
  }

  const handleDateOfBirthChange = (value: string) => {
    // Clear previous age errors
    setAgeError(null)

    // Update the date of birth
    handleInputChange("personal", "dateOfBirth", value)

    // Validate and set error if needed
    if (value && !validateAge(value)) {
      setAgeError("You must be at least 18 years old to register")
    }
  }

  const saveAddressChanges = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const profileRef = doc(db, "accounts", user.uid)
      await updateDoc(profileRef, updatedProfile)
      setProfile((prev) => ({ ...prev, ...updatedProfile }))
      setEditingAddress(false)

      alert("Address updated successfully!")
    } catch (error) {
      console.error("Error updating address:", error)
      alert("Failed to update address. Please try again.")
    }
  }

  const savePersonalChanges = async () => {
    const user = auth.currentUser
    if (!user) return

    // Final validation checks
    if (updatedProfile.phoneNumber && updatedProfile.phoneNumber.trim() !== "") {
      if (!validatePhoneNumber(updatedProfile.phoneNumber)) {
        setPhoneError("Please enter a valid phone number")
        return
      }
    }

    if (updatedProfile.dateOfBirth && !validateAge(updatedProfile.dateOfBirth)) {
      setAgeError("You must be at least 18 years old")
      return
    }

    // If validation passed and confirmation dialog is not open, show it
    if (!isConfirmationOpen) {
      setIsConfirmationOpen(true)
      return
    }

    try {
      const profileRef = doc(db, "accounts", user.uid)
      await updateDoc(profileRef, updatedProfile)
      setProfile((prev) => ({ ...prev, ...updatedProfile }))
      setIsEditingPersonal(false)
      setIsConfirmationOpen(false)

      alert("Personal information updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    }
  }

  const cancelPersonalEdit = () => {
    // Reset to original profile data
    setUpdatedProfile(profile)
    setIsEditingPersonal(false)
    setIsConfirmationOpen(false)
    setPhoneError(null)
    setAgeError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const uploadProfileImage = async () => {
    if (!imageFile || !auth.currentUser) return

    setIsUploading(true)
    try {
      const fileExt = imageFile.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = fileName

      console.log("Attempting upload:", {
        bucket: "profile-pics",
        filePath,
        fileType: imageFile.type,
        fileSize: `${(imageFile.size / 1024).toFixed(2)} KB`,
      })

      const { data, error } = await supabase.storage.from("profile-pics").upload(filePath, imageFile, {
        upsert: true,
      })

      if (error) {
        console.error("Upload error details:", error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log("Upload successful:", data)

      const publicUrlResult = supabase.storage.from("profile-pics").getPublicUrl(filePath)

      const publicUrl = publicUrlResult.data.publicUrl

      const profileRef = doc(db, "accounts", auth.currentUser.uid)
      await updateDoc(profileRef, { photoURL: publicUrl })

      setProfile((prev) => ({ ...prev, photoURL: publicUrl }))
      setImageFile(null)
      alert("Profile picture uploaded successfully!")
    } catch (error) {
      console.error("Error uploading profile image:", error)
      alert(`Failed to upload profile picture: ${(error as Error).message || "Unknown error"}`)
    } finally {
      setIsUploading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-lg p-6 shadow-sm h-64"></div>
        <div className="bg-white rounded-lg p-6 shadow-sm h-64"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-0">
      {/* Profile Header with Photo */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-[#3579b8]/20">
              {profile.photoURL || imagePreview ? (
                <img src={imagePreview || profile.photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <label
              htmlFor="profile-upload"
              className="absolute bottom-0 right-0 bg-[#3579b8] text-white p-2 rounded-full cursor-pointer"
            >
              <Upload className="h-4 w-4" />
            </label>
            <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#1A365D]">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-[#3579b8]">@{profile.username}</p>

            {imagePreview && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={uploadProfileImage}
                  disabled={isUploading}
                  className="px-3 py-1 bg-[#3579b8] text-white text-sm rounded-md flex items-center gap-1"
                >
                  {isUploading ? "Uploading..." : "Save Photo"}
                </button>
                <button
                  onClick={() => {
                    setImagePreview(null)
                    setImageFile(null)
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-[#3579b8]">PERSONAL INFORMATION</h3>
          <button
            className="text-[#3579b8] hover:bg-blue-50 p-2 rounded-full"
            onClick={() => setIsEditingPersonal(true)}
          >
            <Pencil className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="text-[#3579b8] font-medium">{profile.username || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">First Name</p>
              <p className="text-[#3579b8] font-medium">{profile.firstName || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Name</p>
              <p className="text-[#3579b8] font-medium">{profile.lastName || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="text-[#3579b8] font-medium">{profile.gender || "Not set"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="text-[#3579b8] font-medium">
                {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-[#3579b8] font-medium">{profile.email || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="text-[#3579b8] font-medium">{profile.phoneNumber || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Personal Information Edit Dialog */}
        <Dialog open={isEditingPersonal} onOpenChange={cancelPersonalEdit}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Personal Information</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                savePersonalChanges()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm text-gray-500">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={updatedProfile.username || ""}
                    onChange={(e) => handleInputChange("personal", "username", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm text-gray-500">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={updatedProfile.email || ""}
                    onChange={(e) => handleInputChange("personal", "email", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm text-gray-500">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={updatedProfile.firstName || ""}
                    onChange={(e) => handleInputChange("personal", "firstName", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm text-gray-500">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={updatedProfile.lastName || ""}
                    onChange={(e) => handleInputChange("personal", "lastName", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="gender" className="text-sm text-gray-500">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={updatedProfile.gender || ""}
                    onChange={(e) => handleInputChange("personal", "gender", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHERS">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm text-gray-500">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phoneNumber"
                    value={updatedProfile.phoneNumber || ""}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="09XXXXXXXXX"
                    className={`w-full p-2 border rounded-md mt-1 ${phoneError ? "border-red-500" : "border-gray-300"}`}
                  />
                  {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="dateOfBirth" className="text-sm text-gray-500">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={updatedProfile.dateOfBirth || ""}
                    onChange={(e) => handleDateOfBirthChange(e.target.value)}
                    className={`w-full p-2 border rounded-md mt-1 ${ageError ? "border-red-500" : "border-gray-300"}`}
                  />
                  {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={cancelPersonalEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#3579b8] text-white rounded-md hover:bg-[#2A69AC]">
                  Save Changes
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Changes</DialogTitle>
              <DialogDescription>
                Are you sure you want to save these changes to your personal information?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelPersonalEdit}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
              >
                No, Cancel
              </button>
              <button
                onClick={savePersonalChanges}
                className="px-4 py-2 bg-[#1E4E8C] text-white rounded-md hover:bg-[#1A365D]"
              >
                Yes, Save Changes
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Address */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-[#3579b8]">ADDRESS</h3>
          {!editingAddress ? (
            <button
              className="text-[#3579b8] hover:bg-blue-50 p-2 rounded-full"
              onClick={() => setEditingAddress(true)}
            >
              <Pencil className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button className="text-green-600 hover:bg-green-50 p-2 rounded-full" onClick={saveAddressChanges}>
                <Save className="h-5 w-5" />
              </button>
              <button
                className="text-red-600 hover:bg-red-50 p-2 rounded-full"
                onClick={() => {
                  setEditingAddress(false)
                  setUpdatedProfile(profile)
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Region</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={updatedProfile.region || ""}
                  onChange={(e) => handleInputChange("address", "region", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                />
              ) : (
                <p className="text-[#3579b8] font-medium">{profile.region || "Not set"}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">Province</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={updatedProfile.province || ""}
                  onChange={(e) => handleInputChange("address", "province", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                />
              ) : (
                <p className="text-[#3579b8] font-medium">{profile.province || "Not set"}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">City/Municipality</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={updatedProfile.city || ""}
                  onChange={(e) => handleInputChange("address", "city", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                />
              ) : (
                <p className="text-[#3579b8] font-medium">{profile.city || "Not set"}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Zip Code</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={updatedProfile.zipCode || ""}
                  onChange={(e) => handleInputChange("address", "zipCode", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                />
              ) : (
                <p className="text-[#3579b8] font-medium">{profile.zipCode || "Not set"}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">Street Address</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={updatedProfile.streetAddress || ""}
                  onChange={(e) => handleInputChange("address", "streetAddress", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                />
              ) : (
                <p className="text-[#3579b8] font-medium">{profile.streetAddress || "Not set"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}