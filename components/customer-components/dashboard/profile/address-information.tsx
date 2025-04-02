"use client"

import { useState } from "react"
import { Button } from "@/components/customer-components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Input } from "@/components/customer-components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customer-components/ui/select"
import { PencilIcon } from "lucide-react"

const cities = ["Manila", "Caloocan", "Makati", "Taguig", "Pasay", "Pasig"]
const provinces = ["Metro Manila", "Cavite", "Laguna", "Rizal", "Bulacan"]

export function AddressInformation() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    street: "123 Apple Street",
    barangay: "Barangay 1",
    city: "Caloocan",
    province: "Metro Manila",
    zipCode: "1400",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically make an API call to update the user's address
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#2A69AC]">ADDRESS</h3>
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
            <dt className="text-sm text-[#8B909A]">Street</dt>
            <dd className="text-[#1A365D]">{formData.street}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Barangay</dt>
            <dd className="text-[#1A365D]">{formData.barangay}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">City</dt>
            <dd className="text-[#1A365D]">{formData.city}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Province</dt>
            <dd className="text-[#1A365D]">{formData.province}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Zip Code</dt>
            <dd className="text-[#1A365D]">{formData.zipCode}</dd>
          </div>
        </dl>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="street" className="text-sm font-medium">
                Street
              </label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="barangay" className="text-sm font-medium">
                Barangay
              </label>
              <Input
                id="barangay"
                value={formData.barangay}
                onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>
              <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="province" className="text-sm font-medium">
                Province
              </label>
              <Select
                value={formData.province}
                onValueChange={(value) => setFormData({ ...formData, province: value })}
              >
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="zipCode" className="text-sm font-medium">
                Zip Code
              </label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
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

