"use client"


import type React from "react"


import { useState, useEffect } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Pencil, Upload, User, X } from "lucide-react"
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


// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-md shadow-md py-3 px-4 flex items-center justify-between ${type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' : 'bg-red-100 border-l-4 border-red-500 text-red-700'}`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
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
    municipality: "",
    zipCode: "",
    streetAddress: "",
    photoURL: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [editingAddress, setEditingAddress] = useState(false)
  const [isPhotoConfirmationOpen, setIsPhotoConfirmationOpen] = useState(false)
  const [updatedProfile, setUpdatedProfile] = useState<Record<string, any>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [profileFetched, setProfileFetched] = useState(false) // New state to track if profile has been fetched


  // New state variables for enhanced personal information editing
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [ageError, setAgeError] = useState<string | null>(null)
  const [isAddressConfirmationOpen, setIsAddressConfirmationOpen] = useState(false)


  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean } | null>(null)


  const [regions, setRegions] = useState<string[]>([])
  const [provinces, setProvinces] = useState<Record<string, string[]>>({})
  const [cities, setCities] = useState<Record<string, string[]>>({})
  const [municipalities, setMunicipalities] = useState<Record<string, string[]>>({})
  const [zipCodes, setZipCodes] = useState<Record<string, string>>({})
  const [addressType, setAddressType] = useState<"city" | "municipality">("city")


  // Function to show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true })
   
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }


  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      // Check if auth is initialized
      if (!auth.currentUser) {
        // Wait for auth state to change
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            fetchProfile()
          } else {
            setIsLoading(false)
          }
          unsubscribe()
        })
      } else {
        fetchProfile()
      }
    }


    checkAuthAndFetchProfile()
  }, [])


  useEffect(() => {
    // This would typically come from an API or database
    // Simplified example data
    setRegions(["NCR", "CAR", "Region I", "Region II", "Region III", "Region IV-A", "Region IV-B"])


    setProvinces({
      NCR: ["Metro Manila"],
      CAR: ["Benguet", "Ifugao", "Mountain Province"],
      "Region I": ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
      "Region II": ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
      "Region III": ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"],
      "Region IV-A": ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"],
      "Region IV-B": ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"],
    })


    setCities({
      "Metro Manila": ["Manila", "Quezon City", "Makati", "Pasig", "Taguig"],
      Benguet: ["Baguio City"],
      Batangas: ["Batangas City", "Lipa City", "Tanauan"],
      Cavite: ["Bacoor", "Dasmariñas", "Imus", "Tagaytay"],
      Laguna: ["Calamba", "San Pablo", "Santa Rosa"],
      Rizal: ["Antipolo", "Cainta", "Taytay"],
      // Add more as needed
    })


    setMunicipalities({
      Benguet: ["La Trinidad", "Itogon", "Tublay"],
      Batangas: ["Bauan", "Calaca", "Nasugbu"],
      Cavite: ["Carmona", "Silang", "Tanza"],
      Laguna: ["Cabuyao", "Los Baños", "Pagsanjan"],
      Rizal: ["Angono", "Binangonan", "Rodriguez"],
      // Add more as needed
    })


    setZipCodes({
      Manila: "1000",
      "Quezon City": "1100",
      Makati: "1200",
      Pasig: "1600",
      Taguig: "1630",
      "Baguio City": "2600",
      "Batangas City": "4200",
      "Lipa City": "4217",
      Bacoor: "4102",
      Dasmariñas: "4114",
      Antipolo: "1870",
      "La Trinidad": "2601",
      Bauan: "4201",
      Carmona: "4116",
      Cabuyao: "4025",
      Angono: "1930",
      // Add more as needed
    })
  }, [])
  // Add this somewhere in your layout component that contains the header
  // This would typically be in a separate component that wraps your profile page
  const HeaderAvatar = () => {
    const [avatarUrl, setAvatarUrl] = useState("")


    useEffect(() => {
      const fetchAvatar = async () => {
        if (auth.currentUser) {
          try {
            const profileRef = doc(db, "accounts", auth.currentUser.uid)
            const profileSnap = await getDoc(profileRef)


            if (profileSnap.exists() && profileSnap.data().photoURL) {
              setAvatarUrl(profileSnap.data().photoURL)
            }
          } catch (error) {
            console.error("Error fetching avatar:", error)
          }
        }
      }


      fetchAvatar()


      // Set up a listener for real-time updates
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) fetchAvatar()
      })


      // Listen for profile photo updates
      const handleProfilePhotoUpdate = (event: CustomEvent) => {
        setAvatarUrl(event.detail.photoURL)
      }


      window.addEventListener("profilePhotoUpdated", handleProfilePhotoUpdate as EventListener)


      return () => {
        unsubscribe()
        window.removeEventListener("profilePhotoUpdated", handleProfilePhotoUpdate as EventListener)
      }
    }, [])


    return (
      <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-200">
        {avatarUrl ? (
          <img src={avatarUrl || "/placeholder.svg"} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-500" />
          </div>
        )}
      </div>
    )
  }


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
        setProfileFetched(true) // Mark profile as fetched
      } else {
        console.log("No profile found")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      showToast("Failed to load profile data", "error")
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


  const handleRegionChange = (region: string) => {
    handleInputChange("address", "region", region)
    handleInputChange("address", "province", "")
    handleInputChange("address", "city", "")
    handleInputChange("address", "municipality", "")
    handleInputChange("address", "zipCode", "")
    setAddressType("city")
  }


  const handleProvinceChange = (province: string) => {
    handleInputChange("address", "province", province)
    handleInputChange("address", "city", "")
    handleInputChange("address", "municipality", "")
    handleInputChange("address", "zipCode", "")


    // Determine if this province has cities or municipalities or both
    const hasCities = cities[province] && cities[province].length > 0
    const hasMunicipalities =
      municipalities[province] && municipalities[province] && municipalities[province].length > 0


    if (hasCities && !hasMunicipalities) {
      setAddressType("city")
    } else if (!hasCities && hasMunicipalities) {
      setAddressType("municipality")
    } else {
      // If both are available, default to city
      setAddressType("city")
    }
  }


  const handleCityMunicipalityChange = (value: string) => {
    if (addressType === "city") {
      handleInputChange("address", "city", value)
      handleInputChange("address", "municipality", "")
      // Auto-populate zip code based on city
      if (zipCodes[value]) {
        handleInputChange("address", "zipCode", zipCodes[value])
      }
    } else {
      handleInputChange("address", "municipality", value)
      handleInputChange("address", "city", "")
      // Auto-populate zip code based on municipality
      if (zipCodes[value]) {
        handleInputChange("address", "zipCode", zipCodes[value])
      }
    }
  }


  const clearAddressFields = () => {
    setUpdatedProfile((prev) => ({
      ...prev,
      region: "",
      province: "",
      city: "",
      municipality: "",
      zipCode: "",
      streetAddress: "",
    }))
    setAddressType("city")
  }


  const saveAddressChanges = async () => {
    const user = auth.currentUser
    if (!user) return


    try {
      const profileRef = doc(db, "accounts", user.uid)
      await updateDoc(profileRef, updatedProfile)
      setProfile((prev) => ({ ...prev, ...updatedProfile }))
      setEditingAddress(false)
      setIsAddressConfirmationOpen(false)


      showToast("Address updated successfully!", "success")
    } catch (error) {
      console.error("Error updating address:", error)
      showToast("Failed to update address. Please try again.", "error")
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


      showToast("Personal information updated successfully!", "success")
    } catch (error) {
      console.error("Error updating profile:", error)
      showToast("Failed to update profile. Please try again.", "error")
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


      // Add validation for file size and type
      const validTypes = ["image/jpeg", "image/png", "image/gif"]
      const maxSize = 5 * 1024 * 1024 // 5MB


      if (!validTypes.includes(file.type)) {
        showToast("Please select a valid image file (JPEG, PNG, or GIF)", "error")
        return
      }


      if (file.size > maxSize) {
        showToast("File size should be less than 5MB", "error")
        return
      }


      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }


  const uploadProfileImage = async () => {
    if (!imageFile || !auth.currentUser) return


    setIsUploading(true)
    try {
      const fileExt = imageFile.name.split(".").pop()
      const fileName = `${auth.currentUser.uid}_${Date.now()}.${fileExt}`
      const filePath = fileName


      // Upload to storage
      const { data, error } = await supabase.storage.from("profile-pics").upload(filePath, imageFile, {
        upsert: true,
        cacheControl: "3600",
      })


      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }


      // Get the public URL
      const publicUrlResult = supabase.storage.from("profile-pics").getPublicUrl(filePath)
      const publicUrl = publicUrlResult.data.publicUrl


      // Update Firestore document
      const profileRef = doc(db, "accounts", auth.currentUser.uid)
      await updateDoc(profileRef, { photoURL: publicUrl })


      // Update local state
      setProfile((prev) => ({ ...prev, photoURL: publicUrl }))


      // Dispatch a custom event to notify other components about the profile update
      const profileUpdateEvent = new CustomEvent("profilePhotoUpdated", {
        detail: { photoURL: publicUrl },
      })
      window.dispatchEvent(profileUpdateEvent)


      setImageFile(null)
      setImagePreview(null)


      // Show toast notification instead of alert
      showToast("Profile picture uploaded successfully!", "success")
    } catch (error) {
      console.error("Error uploading profile image:", error)
      showToast(`Failed to upload profile picture: ${(error as Error).message || "Unknown error"}`, "error")
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


  // If profile isn't fetched yet, show loading or "Not set" placeholders
  const displayValue = (value: string | undefined) => {
    return profileFetched ? value || "Not set" : "Not set"
  }


  return (
    <div className="space-y-6 px-0">
      {/* Toast Notification */}
      {toast && toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}


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
              {displayValue(profile.firstName)} {displayValue(profile.lastName)}
            </h2>
            <p className="text-[#3579b8]">@{displayValue(profile.username)}</p>


            {imagePreview && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setIsPhotoConfirmationOpen(true)}
                  className="px-3 py-1 bg-[#3579b8] text-white text-sm rounded-md flex items-center gap-1"
                >
                  Save Photo
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
              <p className="text-[#3579b8] font-medium">{displayValue(profile.username)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">First Name</p>
              <p className="text-[#3579b8] font-medium">{displayValue(profile.firstName)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Name</p>
              <p className="text-[#3579b8] font-medium">{displayValue(profile.lastName)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="text-[#3579b8] font-medium">{displayValue(profile.gender)}</p>
            </div>
          </div>


          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="text-[#3579b8] font-medium">
                {profile.dateOfBirth && profileFetched ? formatDate(profile.dateOfBirth) : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-[#3579b8] font-medium">{displayValue(profile.email)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="text-[#3579b8] font-medium">{displayValue(profile.phoneNumber)}</p>
            </div>
          </div>
        </div>
        <Dialog open={isPhotoConfirmationOpen} onOpenChange={setIsPhotoConfirmationOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Save Profile Photo</DialogTitle>
              <DialogDescription>Are you sure you want to save this as your profile photo?</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-center">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Profile Preview"
                className="h-32 w-32 rounded-full object-cover"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setIsPhotoConfirmationOpen(false)
                  setImagePreview(null)
                  setImageFile(null)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  uploadProfileImage()
                  setIsPhotoConfirmationOpen(false)
                }}
                className="px-4 py-2 bg-[#3579b8] text-white rounded-md hover:bg-[#2A69AC]"
              >
                Save Photo
              </button>
            </div>
          </DialogContent>
        </Dialog>


        {isUploading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-4 border-t-[#3579b8] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <p>Uploading photo...</p>
              </div>
            </div>
          </div>
        )}
        {/* Personal Information Edit Dialog */}
        <Dialog open={isEditingPersonal} onOpenChange={cancelPersonalEdit}>
          <DialogContent className="sm:max-w-[700px]">
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
              {/* First row - Name fields */}
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


              {/* Second row - Username and Email */}
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


              {/* Third row - Gender and Phone */}
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


              {/* Fourth row - Date of Birth */}
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
          <DialogContent className="sm:max-w-[600px]">
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
          <button className="text-[#3579b8] hover:bg-blue-50 p-2 rounded-full" onClick={() => setEditingAddress(true)}>
            <Pencil className="h-5 w-5" />
          </button>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Region</p>
              <p className="text-[#3579b8] font-medium">{displayValue(profile.region)}</p>
            </div>


            <div>
              <p className="text-sm text-gray-500">Province</p>
              <p className="text-[#3579b8] font-medium">{profile.province || "Not set"}</p>
            </div>


            <div>
              <p className="text-sm text-gray-500">City/Municipality</p>
              <p className="text-[#3579b8] font-medium">{profile.city || profile.municipality || "Not set"}</p>
            </div>
          </div>


          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Zip Code</p>
              <p className="text-[#3579b8] font-medium">{profile.zipCode || "Not set"}</p>
            </div>


            <div>
              <p className="text-sm text-gray-500">Street Address</p>
              <p className="text-[#3579b8] font-medium">{profile.streetAddress || "Not set"}</p>
            </div>
          </div>
        </div>


        {/* Address Edit Dialog */}
        <Dialog
          open={editingAddress}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAddress(false)
              setUpdatedProfile(profile)
            }
          }}
        >
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
              <DialogDescription>Update your address information.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setIsAddressConfirmationOpen(true)
              }}
              className="space-y-4"
            >
              {/* Region and Province - First Level */}
              <div className="space-y-4 p-3 border border-gray-100 rounded-md bg-gray-50">
                <h4 className="font-medium text-[#3579b8]">Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="region" className="text-sm text-gray-500">
                      Region
                    </label>
                    <select
                      id="region"
                      value={updatedProfile.region || ""}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Region</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>


                  <div className="space-y-2">
                    <label htmlFor="province" className="text-sm text-gray-500">
                      Province
                    </label>
                    <select
                      id="province"
                      value={updatedProfile.province || ""}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={!updatedProfile.region}
                    >
                      <option value="">Select Province</option>
                      {updatedProfile.region &&
                        provinces[updatedProfile.region]?.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>


              {/* City/Municipality and Zip Code - Second Level */}
              {updatedProfile.province && (
                <div className="space-y-4 p-3 border border-gray-100 rounded-md bg-gray-50">
                  <h4 className="font-medium text-[#3579b8]">City/Municipality</h4>
                  <div className="flex items-center space-x-4 mb-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="addressType"
                        value="city"
                        checked={addressType === "city"}
                        onChange={() => setAddressType("city")}
                      />
                      <span className="ml-2">City</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="addressType"
                        value="municipality"
                        checked={addressType === "municipality"}
                        onChange={() => setAddressType("municipality")}
                      />
                      <span className="ml-2">Municipality</span>
                    </label>
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="cityMunicipality" className="text-sm text-gray-500">
                        {addressType === "city" ? "City" : "Municipality"}
                      </label>
                      <select
                        id="cityMunicipality"
                        value={addressType === "city" ? updatedProfile.city || "" : updatedProfile.municipality || ""}
                        onChange={(e) => handleCityMunicipalityChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        disabled={!updatedProfile.province}
                      >
                        <option value="">Select {addressType === "city" ? "City" : "Municipality"}</option>
                        {updatedProfile.province &&
                          addressType === "city" &&
                          cities[updatedProfile.province]?.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        {updatedProfile.province &&
                          addressType === "municipality" &&
                          municipalities[updatedProfile.province]?.map((municipality) => (
                            <option key={municipality} value={municipality}>
                              {municipality}
                            </option>
                          ))}
                      </select>
                    </div>


                    <div className="space-y-2">
                      <label htmlFor="zipCode" className="text-sm text-gray-500">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        value={updatedProfile.zipCode || ""}
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}


              {/* Street Address - Third Level */}
              <div className="space-y-4 p-3 border border-gray-100 rounded-md bg-gray-50">
                <h4 className="font-medium text-[#3579b8]">Street Address</h4>
                <div className="space-y-2">
                  <label htmlFor="streetAddress" className="text-sm text-gray-500">
                    Complete Address
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    value={updatedProfile.streetAddress || ""}
                    onChange={(e) => handleInputChange("address", "streetAddress", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your complete street address, building name/number, unit/apartment number, etc.
                  </p>
                </div>
              </div>


              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(false)
                    setUpdatedProfile(profile)
                  }}
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


        {/* Address Confirmation Dialog */}
        <Dialog open={isAddressConfirmationOpen} onOpenChange={setIsAddressConfirmationOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Confirm Changes</DialogTitle>
              <DialogDescription>
                Are you sure you want to save these changes to your address information?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddressConfirmationOpen(false)}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
              >
                No, Cancel
              </button>
              <button
                onClick={() => {
                  saveAddressChanges()
                  setIsAddressConfirmationOpen(false)
                }}
                className="px-4 py-2 bg-[#1E4E8C] text-white rounded-md hover:bg-[#1A365D]"
              >
                Yes, Save Changes
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}








