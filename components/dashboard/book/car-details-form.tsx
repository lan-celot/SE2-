"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  carModel: z.string().min(1, "Car model is required"),
  yearModel: z.string().min(1, "Year model is required"),
  transmission: z.string().min(1, "Transmission is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  odometer: z.string().min(1, "Odometer reading is required"),
  generalServices: z.array(z.string()).min(1, "At least one service must be selected"),
  specificIssues: z.string().max(1000, "Description must not exceed 1000 characters"),
})

const carModels = ["Honda Civic", "Toyota Vios", "Honda BRV", "Ford Raptor", "Ford Everest"]
const transmissionTypes = ["Automatic", "Manual"]
const fuelTypes = ["Gas", "Diesel"]
const odometerRanges = ["0km - 50,000km", "50,000km - 150,000km", "150,000km - 250,000km"]
const services = [
  { id: "paint_jobs", label: "Paint Jobs" },
  { id: "brake_shoes_clean", label: "Brake Shoes Clean" },
  { id: "engine_overhaul", label: "Engine Overhaul" },
  { id: "suspension_systems", label: "Suspension Systems" },
  { id: "brake_shoes_replace", label: "Brake Shoes Replace" },
  { id: "brake_clean", label: "Brake Clean" },
  { id: "engine_tuning", label: "Engine Tuning" },
  { id: "air_conditioning", label: "Air Conditioning" },
  { id: "brake_replace", label: "Brake Replace" },
  { id: "oil_change", label: "Oil Change" },
]

interface CarDetailsFormProps {
  initialData: any
  onSubmit: (data: any) => void
  onBack: () => void
}

export function CarDetailsForm({ initialData, onSubmit, onBack }: CarDetailsFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carModel: initialData.carModel || "",
      yearModel: initialData.yearModel || "",
      transmission: initialData.transmission || "",
      fuelType: initialData.fuelType || "",
      odometer: initialData.odometer || "",
      generalServices: initialData.generalServices || [],
      specificIssues: initialData.specificIssues || "",
    },
  })

  const [characterCount, setCharacterCount] = React.useState(initialData.specificIssues?.length || 0)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="carModel"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Car Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {carModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="yearModel"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Year Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 25 }, (_, i) => 2024 - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Transmission" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transmissionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Fuel Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fuelTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="odometer"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Odometer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {odometerRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="generalServices"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <label className="text-sm font-medium">General Services</label>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <FormField
                    key={service.id}
                    control={form.control}
                    name="generalServices"
                    render={({ field }) => {
                      return (
                        <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(service.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, service.id])
                                  : field.onChange(field.value?.filter((value) => value !== service.id))
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {service.label}
                            </label>
                          </div>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specificIssues"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="For specific issue/s, kindly describe in detail..."
                    className="min-h-[100px] bg-white/50 resize-none"
                    maxLength={1000}
                    onChange={(e) => {
                      field.onChange(e)
                      setCharacterCount(e.target.value.length)
                    }}
                    {...field}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">{characterCount}/1000</div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="border-[#1e4e8c] text-[#1e4e8c]">
            Back
          </Button>
          <Button type="submit" className="bg-[#1e4e8c] text-white">
            Proceed
          </Button>
        </div>
      </form>
    </Form>
  )
}

