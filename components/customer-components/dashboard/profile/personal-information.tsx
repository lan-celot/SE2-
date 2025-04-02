"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/customer-components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Input } from "@/components/customer-components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customer-components/ui/select"
import { PencilIcon } from "lucide-react"
import { auth, db } from "@/lib/firebase" // Ensure Firebase is configured
import { doc, getDoc, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

export function PersonalInformation() {
  const [isEditing, setIsEditing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    gender: "",
    dateOfBirth: "",
    memberSince: "",
    customUid: "", // Added to store custom UID
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
          setFormData({
            fullName: `${userData.firstName} ${userData.lastName}` || "",
            contactNumber: userData.phoneNumber || "",
            gender: userData.gender || "",
            dateOfBirth: userData.dateOfBirth || "",
            memberSince: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "",
            customUid: userData.customUid || "",
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);
  
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      const [firstName, ...lastNameParts] = formData.fullName.split(" ");
      const lastName = lastNameParts.join(" ");

      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        firstName,
        lastName,
        phoneNumber: formData.contactNumber,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        customUid: formData.customUid, // Preserve custom UID
      }, { merge: true });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#2A69AC]">PERSONAL INFORMATION</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="text-[#1A365D] hover:text-[#2A69AC] hover:bg-[#EBF8FF]"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>

        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-[#8B909A]">Full Name</dt>
            <dd className="text-[#1A365D]">{formData.fullName}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Contact Number</dt>
            <dd className="text-[#1A365D]">{formData.contactNumber}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Gender</dt>
            <dd className="text-[#1A365D]">{formData.gender}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Date of Birth</dt>
            <dd className="text-[#1A365D]">
  {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : "N/A"}
</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Member Since</dt>
            <dd className="text-[#1A365D]">
  {formData.memberSince ? formData.memberSince : "N/A"}
</dd>
          </div>
        </dl>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="contactNumber" className="text-sm font-medium">Contact Number</label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium">Gender</label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="border-[#EA5455] text-[#EA5455] hover:bg-[#EA5455]/10">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]">
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

