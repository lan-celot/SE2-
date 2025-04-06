"use client"

import { useState, useEffect } from "react"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "../../ui/dialog"
import { Input } from "../../ui/input"
import { PencilIcon, UserIcon } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { RadioGroup, RadioGroupItem } from "@/components/admin-components/radio-group"
import { Label } from "../../ui/label"

export function PersonalInformationPopup() {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [ageError, setAgeError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    memberSince: "",
    gender: "",
  })

  // Separate state to track edited values
  const [editedFormData, setEditedFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    gender: "",
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Fetch user data using Firebase Auth UID
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const updatedFormData = {
            username: userData.username || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            phoneNumber: userData.phoneNumber || "",
            email: userData.email || user.email || "",
            dateOfBirth: userData.dateOfBirth || "",
            memberSince: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "",
            gender: userData.gender || "",
          };

          setFormData(updatedFormData);
          // Initialize edited form data with current form data
          setEditedFormData({
            username: updatedFormData.username,
            firstName: updatedFormData.firstName,
            lastName: updatedFormData.lastName,
            phoneNumber: updatedFormData.phoneNumber,
            email: updatedFormData.email,
            dateOfBirth: updatedFormData.dateOfBirth,
            gender: updatedFormData.gender,
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Validate age (must be at least 16)
  const validateAge = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) return true; // Optional field

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 16;
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // No validation needed for empty values (optional field)
    if (!phone || phone.trim() === '') return true;
    
    // Validate +63 format (exactly 13 characters including +)
    if (phone.startsWith('+63')) {
      return phone.length === 13 && /^\+63\d{10}$/.test(phone);
    }

    // Validate 09 format (exactly 11 digits)
    if (phone.startsWith('09')) {
      return phone.length === 11 && /^09\d{9}$/.test(phone);
    }

    return false;
  }

  const handlePhoneChange = (value: string) => {
    // Clear previous errors
    setPhoneError(null);

    // Only allow + at the beginning, then only digits
    let formattedValue = value;
    if (value.startsWith('+')) {
      // For +63 format, keep the + and only allow digits after
      const plusSign = value.charAt(0);
      const digits = value.substring(1).replace(/[^\d]/g, '');
      formattedValue = plusSign + digits;
    } else {
      // For 09 format, only allow digits
      formattedValue = value.replace(/[^\d]/g, '');
    }

    // Update form data with formatted value
    setEditedFormData({ ...editedFormData, phoneNumber: formattedValue });

    // Determine input type and validate accordingly
    if (formattedValue.startsWith('+')) {
      // If user has entered a full number, validate it
      if (formattedValue.length >= 13) {
        if (!validatePhoneNumber(formattedValue)) {
          setPhoneError("Please enter a valid Philippine phone number (+63XXXXXXXXXX)");
        }
      }
    } else if (formattedValue.startsWith('0')) {
      // If user has entered a full number, validate it
      if (formattedValue.length >= 11) {
        if (!validatePhoneNumber(formattedValue)) {
          setPhoneError("Please enter a valid Philippine phone number (09XXXXXXXXX)");
        }
      }
    } else if (formattedValue.length > 0) {
      // If user has started typing but doesn't match expected format
      setPhoneError("Must start with 09 or +63");
    }
  }

  const handleDateOfBirthChange = (value: string) => {
    // Clear previous age errors
    setAgeError(null);

    // Update the date of birth
    setEditedFormData({ ...editedFormData, dateOfBirth: value });

    // Validate and set error if needed
    if (value && !validateAge(value)) {
      setAgeError("You must be at least 16 years old to register");
    }
  }

  const handleSubmit = async () => {
    // Validate before submission
    if (phoneError || ageError) {
      return;
    }

    if (!userId) return;

    // Prepare update data, preserving existing values if new ones are empty
    const updateData: Record<string, string> = {};
    
    // Only update values that have been changed
    Object.keys(editedFormData).forEach(key => {
      const typedKey = key as keyof typeof editedFormData;
      if (editedFormData[typedKey] !== "") {
        updateData[key] = editedFormData[typedKey];
      }
    });

    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, updateData, { merge: true });

      // Fetch the updated user data
      const updatedUserSnap = await getDoc(userRef);
      if (updatedUserSnap.exists()) {
        const updatedUserData = updatedUserSnap.data();

        // Update form data with the latest values
        const updatedFormData = {
          username: updatedUserData.username || formData.username,
          firstName: updatedUserData.firstName || formData.firstName,
          lastName: updatedUserData.lastName || formData.lastName,
          phoneNumber: updatedUserData.phoneNumber || formData.phoneNumber,
          email: updatedUserData.email || formData.email,
          dateOfBirth: updatedUserData.dateOfBirth || formData.dateOfBirth,
          memberSince: formData.memberSince, // Don't update memberSince from edited data
          gender: updatedUserData.gender || formData.gender,
        };

        setFormData(updatedFormData);
        setEditedFormData({
          username: updatedFormData.username,
          firstName: updatedFormData.firstName,
          lastName: updatedFormData.lastName,
          phoneNumber: updatedFormData.phoneNumber,
          email: updatedFormData.email,
          dateOfBirth: updatedFormData.dateOfBirth,
          gender: updatedFormData.gender,
        });
      }

      setIsEditing(false);
      setIsConfirmationOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleEditCancel = () => {
    // Reset edited data to original form data
    setEditedFormData({
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
    });
    setIsEditing(false);
    setIsConfirmationOpen(false);
    // Clear any errors
    setPhoneError(null);
    setAgeError(null);
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation before opening confirmation
    let hasErrors = false;

    if (editedFormData.phoneNumber && !validatePhoneNumber(editedFormData.phoneNumber)) {
      if (editedFormData.phoneNumber.startsWith('+')) {
        setPhoneError("Please enter a valid Philippine phone number (+63XXXXXXXXXX)");
      } else if (editedFormData.phoneNumber.startsWith('0')) {
        setPhoneError("Please enter a valid Philippine phone number (09XXXXXXXXX)");
      } else {
        setPhoneError("Must start with 09 or +63");
      }
      hasErrors = true;
    }

    if (editedFormData.dateOfBirth && !validateAge(editedFormData.dateOfBirth)) {
      setAgeError("You must be at least 16 years old to register");
      hasErrors = true;
    }

    if (!hasErrors) {
      setIsConfirmationOpen(true);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <UserIcon className="h-4 w-4" />
        Personal Info
      </Button>

      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2A69AC]">PERSONAL INFORMATION</DialogTitle>
          </DialogHeader>
          
          <div className="bg-white rounded-lg">
            <div className="mb-4 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="text-[#1A365D] hover:text-[#2A69AC] hover:bg-[#EBF8FF]"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <h4 className="text-sm text-[#8B909A] mb-1">Username</h4>
                  <p className="text-[#1A365D] font-medium">{formData.username || "Not set"}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm text-[#8B909A] mb-1">First Name</h4>
                  <p className="text-[#1A365D] font-medium">{formData.firstName || "Not set"}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm text-[#8B909A] mb-1">Last Name</h4>
                  <p className="text-[#1A365D] font-medium">{formData.lastName || "Not set"}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm text-[#8B909A] mb-1">Gender</h4>
                  <p className="text-[#1A365D] font-medium">{formData.gender || "Not set"}</p>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <h4 className="text-sm text-[#8B909A] mb-1">Phone Number</h4>
                  <p className="text-[#1A365D] font-medium">{formData.phoneNumber || "Not set"}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm text-[#8B909A] mb-1">Email</h4>
                  <p className="text-[#1A365D] font-medium">{formData.email || "Not set"}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm text-[#8B909A] mb-1">Date of Birth</h4>
                  <p className="text-[#1A365D] font-medium">
                    {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : "Not set"}
                  </p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm text-[#8B909A] mb-1">Member Since</h4>
                  <p className="text-[#1A365D] font-medium">{formData.memberSince || "Not set"}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={handleEditCancel}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <Input
                id="username"
                value={editedFormData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedFormData({ ...editedFormData, username: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
              <Input
                id="firstName"
                value={editedFormData.firstName}
                onChange={(e) => setEditedFormData({ ...editedFormData, firstName: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
              <Input
                id="lastName"
                value={editedFormData.lastName}
                onChange={(e) => setEditedFormData({ ...editedFormData, lastName: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</label>
              <Input
                id="phoneNumber"
                value={editedFormData.phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="09XXXXXXXXX or +63XXXXXXXXXX"
                className={`bg-white/50 ${phoneError ? 'border-red-500' : ''}`}
              />
              {phoneError && (
                <p className="text-red-500 text-sm mt-1">{phoneError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={editedFormData.email}
                onChange={(e) => setEditedFormData({ ...editedFormData, email: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</label>
              <Input
                id="dateOfBirth"
                type="date"
                value={editedFormData.dateOfBirth}
                onChange={(e) => handleDateOfBirthChange(e.target.value)}
                className={`bg-white/50 ${ageError ? 'border-red-500' : ''}`}
              />
              {ageError && (
                <p className="text-red-500 text-sm mt-1">{ageError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <RadioGroup
                value={editedFormData.gender}
                onValueChange={(value) => setEditedFormData({ ...editedFormData, gender: value })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleEditCancel}
                className="border-[#EA5455] text-[#EA5455] hover:bg-[#EA5455]/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]"
              >
                Save changes
              </Button>
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
            <Button
              variant="outline"
              onClick={handleEditCancel}
              className="border-[#EA5455] text-[#EA5455] hover:bg-[#EA5455]/10"
            >
              No, Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]"
            >
              Yes, Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}