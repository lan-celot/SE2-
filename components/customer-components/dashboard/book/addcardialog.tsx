"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/customer-components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/customer-components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/customer-components/ui/form"
import { Input } from "@/components/customer-components/ui/input"

// Get current year for validation
const currentYear = new Date().getFullYear()

// Create different schemas based on the type with strict year validation
const addBrandSchema = z.object({
  brandName: z.string().min(1, "Brand name is required").min(2, "Brand name must be at least 2 characters"),
  modelName: z.string().min(1, "Model name is required").min(2, "Model name must be at least 2 characters"),
  yearStart: z
    .string()
    .min(4, "Year must be 4 digits")
    .max(4, "Year must be 4 digits")
    .refine((val) => /^\d{4}$/.test(val), {
      message: "Year must be exactly 4 digits",
    })
    .refine(
      (val) => {
        const year = Number(val)
        return year >= 1900 && year <= currentYear
      },
      {
        message: `Year must be between 1900 and ${currentYear}`,
      },
    ),
})

const addModelSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  modelName: z.string().min(1, "Model name is required").min(2, "Model name must be at least 2 characters"),
  yearStart: z
    .string()
    .min(4, "Year must be 4 digits")
    .max(4, "Year must be 4 digits")
    .refine((val) => /^\d{4}$/.test(val), {
      message: "Year must be exactly 4 digits",
    })
    .refine(
      (val) => {
        const year = Number(val)
        return year >= 1900 && year <= currentYear
      },
      {
        message: `Year must be between 1900 and ${currentYear}`,
      },
    ),
})

const addYearSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  modelName: z.string().min(1, "Model name is required"),
  yearStart: z
    .string()
    .min(4, "Year must be 4 digits")
    .max(4, "Year must be 4 digits")
    .refine((val) => /^\d{4}$/.test(val), {
      message: "Year must be exactly 4 digits",
    })
    .refine(
      (val) => {
        const year = Number(val)
        return year >= 1900 && year <= currentYear
      },
      {
        message: `Year must be between 1900 and ${currentYear}`,
      },
    ),
})

type AddCarFormValues = z.infer<typeof addBrandSchema>

interface AddCarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "brand" | "model" | "year"
  brandName?: string
  modelName?: string
  onSuccess: (data: any) => void
}

export function AddCarDialog({ open, onOpenChange, type, brandName, modelName, onSuccess }: AddCarDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Choose the appropriate schema based on type
  const getSchema = () => {
    switch (type) {
      case "brand":
        return addBrandSchema
      case "model":
        return addModelSchema
      case "year":
        return addYearSchema
      default:
        return addBrandSchema
    }
  }

  const form = useForm<AddCarFormValues>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      brandName: brandName || "",
      modelName: modelName || "",
      yearStart: currentYear.toString(),
    },
  })

  // Reset form when dialog opens/closes or props change
  useEffect(() => {
    if (open) {
      form.reset({
        brandName: brandName || "",
        modelName: modelName || "",
        yearStart: currentYear.toString(),
      })
    }
  }, [open, brandName, modelName, form])

  const onSubmit = async (data: AddCarFormValues) => {
    setIsSubmitting(true)
    try {
      // Create the car data object
      const carData = {
        brandName: data.brandName,
        modelName: data.modelName,
        yearStart: Number.parseInt(data.yearStart),
      }

      console.log(`Adding new car ${type} to session:`, carData)

      // Simulate a brief delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Close dialog and reset form
      onOpenChange(false)
      form.reset()

      // Call the success callback with the new data
      onSuccess(carData)
    } catch (error) {
      console.error(`Failed to add car ${type}:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case "brand":
        return "Add New Car Brand"
      case "model":
        return `Add New Model${brandName ? ` for ${brandName}` : ""}`
      case "year":
        return `Add New Year${brandName && modelName ? ` for ${brandName} ${modelName}` : ""}`
      default:
        return "Add New Car Data"
    }
  }

  const getDescription = () => {
    switch (type) {
      case "brand":
        return "Add a new car brand with its first model and year for this session."
      case "model":
        return `Add a new model${brandName ? ` for ${brandName}` : ""} for this session.`
      case "year":
        return `Add a new year${brandName && modelName ? ` for ${brandName} ${modelName}` : ""} for this session.`
      default:
        return "Add new car data for this session."
    }
  }

  // Handle year input to only allow 4 digits
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
    return value
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Brand Name Field - Show for brand type or when not pre-filled */}
            {(type === "brand" || !brandName) && (
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter brand name (e.g., Toyota, Honda)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show brand name as read-only when pre-filled */}
            {type !== "brand" && brandName && (
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-gray-50" />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Model Name Field - Show for brand and model types, or when not pre-filled */}
            {(type === "brand" || type === "model" || !modelName) && (
              <FormField
                control={form.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter model name (e.g., Camry, Civic)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show model name as read-only when pre-filled for year type */}
            {type === "year" && modelName && (
              <FormField
                control={form.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-gray-50" />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Year Field - Always show with strict validation */}
            <FormField
              control={form.control}
              name="yearStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type === "year" ? "Year *" : "Starting Year *"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`Enter ${type === "year" ? "year" : "starting year"} (e.g., ${currentYear})`}
                      type="text"
                      maxLength={4}
                      {...field}
                      onChange={(e) => {
                        const value = handleYearChange(e)
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {type !== "year" && (
                    <p className="text-xs text-gray-500 mt-1">
                      This will be the first year this model was available. Must be between 1900 and {currentYear}.
                    </p>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-800 hover:bg-blue-900 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add for Session"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
