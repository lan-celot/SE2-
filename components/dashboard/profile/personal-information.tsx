"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PencilIcon } from "lucide-react"

export function PersonalInformation() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    contactNumber: "09171234567",
    gender: "Female",
    dateOfBirth: "2001-01-12",
    memberSince: "November 9, 2024",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically make an API call to update the user's information
    setIsEditing(false)
  }

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
            <dt className="text-sm text-[#8B909A]">Contact Number</dt>
            <dd className="text-[#1A365D]">{formData.contactNumber}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Gender</dt>
            <dd className="text-[#1A365D]">{formData.gender}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Date of Birth</dt>
            <dd className="text-[#1A365D]">{new Date(formData.dateOfBirth).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Member Since</dt>
            <dd className="text-[#1A365D]">{formData.memberSince}</dd>
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
              <label htmlFor="contactNumber" className="text-sm font-medium">
                Contact Number
              </label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium">
                Gender
              </label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="text-sm font-medium">
                Date of Birth
              </label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-[#EA5455] text-[#EA5455] hover:bg-[#EA5455]/10"
              >
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

