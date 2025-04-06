"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/customer-components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Input } from "@/components/customer-components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/customer-components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/customer-components/ui/alert-dialog"
import { PencilIcon } from "lucide-react"

const regions = ["NCR", "Region I", "Region II", "Region III", "Region IV-A", "Region IV-B"]
const provinces = ["Metro Manila", "Cavite", "Laguna", "Rizal", "Bulacan"]
const cities = ["Manila", "Makati", "Pasay", "Pasig"]
const municipalities = ["Caloocan", "Taguig", "Pateros", "Marikina"]
const barangays = ["Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5"]

export function AddressInformation() {
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setFormData] = useState({
    street: "123 Apple Street",
    barangay: "Barangay 1",
    city: "Manila",
    municipality: "Caloocan",
    province: "Metro Manila",
    region: "NCR",
    zipCode: "1400",
  })

  const [tempFormData, setTempFormData] = useState({ ...formData })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirmation(true)
  }

  const confirmSave = () => {
    // Here you would typically make an API call to update the user's address
    setFormData({ ...tempFormData })
    setShowConfirmation(false)
    setIsEditing(false)
  }

  const clearForm = () => {
    setTempFormData({
      street: "",
      barangay: "",
      city: "",
      municipality: "",
      province: "",
      region: "",
      zipCode: "",
    })
  }

  const openEditDialog = () => {
    setTempFormData({ ...formData })
    setIsEditing(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#2A69AC]">ADDRESS</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={openEditDialog}
            className="text-[#1A365D] hover:text-[#2A69AC] hover:bg-[#EBF8FF]"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>

        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-[#8B909A]">Region</dt>
            <dd className="text-[#1A365D]">{formData.region}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Province</dt>
            <dd className="text-[#1A365D]">{formData.province}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">City</dt>
            <dd className="text-[#1A365D]">{formData.city}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Municipality</dt>
            <dd className="text-[#1A365D]">{formData.municipality}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Barangay</dt>
            <dd className="text-[#1A365D]">{formData.barangay}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Street</dt>
            <dd className="text-[#1A365D]">{formData.street}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Zip Code</dt>
            <dd className="text-[#1A365D]">{formData.zipCode}</dd>
          </div>
        </dl>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="region" className="text-sm font-medium">
                Region
              </label>
              <Select
                value={tempFormData.region}
                onValueChange={(value) => setTempFormData({ ...tempFormData, region: value })}
              >
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
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
                value={tempFormData.province}
                onValueChange={(value) => setTempFormData({ ...tempFormData, province: value })}
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
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>
              <Select
                value={tempFormData.city}
                onValueChange={(value) => setTempFormData({ ...tempFormData, city: value })}
              >
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
              <label htmlFor="municipality" className="text-sm font-medium">
                Municipality
              </label>
              <Select
                value={tempFormData.municipality}
                onValueChange={(value) => setTempFormData({ ...tempFormData, municipality: value })}
              >
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select municipality" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality} value={municipality}>
                      {municipality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="barangay" className="text-sm font-medium">
                Barangay
              </label>
              <Select
                value={tempFormData.barangay}
                onValueChange={(value) => setTempFormData({ ...tempFormData, barangay: value })}
              >
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent>
                  {barangays.map((barangay) => (
                    <SelectItem key={barangay} value={barangay}>
                      {barangay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="street" className="text-sm font-medium">
                Street
              </label>
              <Input
                id="street"
                value={tempFormData.street}
                onChange={(e) => setTempFormData({ ...tempFormData, street: e.target.value })}
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="zipCode" className="text-sm font-medium">
                Zip Code
              </label>
              <Select
                value={tempFormData.zipCode}
                onValueChange={(value) => setTempFormData({ ...tempFormData, zipCode: value })}
              >
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select zip code" />
                </SelectTrigger>
                <SelectContent>
                  {["1400", "1401", "1402", "1403", "1404", "1405"].map((zipCode) => (
                    <SelectItem key={zipCode} value={zipCode}>
                      {zipCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearForm}
                className="border-[#EA5455] text-[#EA5455] hover:bg-[#EA5455]/10"
              >
                Clear
              </Button>
              <Button type="submit" className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]">
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update your address information. Please confirm your changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>I will check again</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>I am sure</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

