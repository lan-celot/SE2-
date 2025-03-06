"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from '@/lib/firebase'; // Ensure this path is correct
import { collection, getDocs, addDoc } from 'firebase/firestore';

// Define types for services and reservations
interface Service {
  id: string;
  label: string;
}

interface Reservation {
  id: string;
  customer: string;
  car: string;
}

const services: Service[] = [
  { id: "PAINT JOBS", label: "PAINT JOBS" },
  { id: "BRAKE SHOES CLEAN", label: "BRAKE SHOES CLEAN" },
  { id: "ENGINE OVERHAUL", label: "ENGINE OVERHAUL" },
  { id: "SUSPENSION SYSTEMS", label: "SUSPENSION SYSTEMS" },
  { id: "BRAKE SHOES REPLACE", label: "BRAKE SHOES REPLACE" },
  { id: "BRAKE CLEAN", label: "BRAKE CLEAN" },
  { id: "ENGINE TUNING", label: "ENGINE TUNING" },
  { id: "AIR CONDITIONING", label: "AIR CONDITIONING" },
  { id: "BRAKE REPLACE", label: "BRAKE REPLACE" },
  { id: "OIL CHANGE", label: "OIL CHANGE" },
]

const mechanics = [
  "MARCIAL TAMONDONG",
  "NOR TAMONDONG",
  "DONOVAN MITCHELL",
  "ANTHONY EDWARDS",
  "LUKA DONCIC",
  "MANU GINOBILI",
  "TIM DUNCAN",
  "RAY ALLEN",
  "KOBE BRYANT",
  "STEPHEN CURRY",
]

export default function AddTransactionPage() {
  const router = useRouter()
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [formData, setFormData] = useState({
    reservationId: "",
    mechanic: "",
    price: "",
    quantity: "",
    discount: "",
  })
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    const fetchReservations = async () => {
      const querySnapshot = await getDocs(collection(db, 'bookings'));
      const reservationsData: Reservation[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.bookingId,
          customer: `${data.firstName} ${data.lastName}`,
          car: data.carModel,
        };
      });
      setReservations(reservationsData);
    };

    fetchReservations();
  }, []);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleConfirm = async () => {
    const reservation = reservations.find(res => res.id === formData.reservationId);
    if (!reservation) return;

    const transactionData = {
      id: formData.reservationId,
      reservationDate: new Date().toLocaleString(), // Replace with actual reservation date if available
      customerName: reservation.customer,
      customerId: formData.reservationId, // Assuming reservationId is the same as customerId
      carModel: reservation.car,
      completionDate: new Date().toLocaleString(), // Replace with actual completion date if available
      totalPrice: parseFloat(formData.price) * parseInt(formData.quantity),
      services: selectedServices.map(serviceId => {
        const service = services.find(s => s.id === serviceId);
        return {
          service: service?.label || "",
          mechanic: formData.mechanic,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          discount: parseInt(formData.discount),
          total: parseFloat(formData.price) * parseInt(formData.quantity),
        };
      }),
    };

    await addDoc(collection(db, 'transactions'), transactionData);
    router.push("/transactions");
  }

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader title="Add a Transaction" />
        </div>

        <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-2xl font-semibold text-[#1A365D]">Transaction Details</h2>

          <div className="grid gap-6">
            <div className="grid gap-4">
              <Select
                value={formData.reservationId}
                onValueChange={(value) => handleInputChange("reservationId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reservation ID" />
                </SelectTrigger>
                <SelectContent>
                  {reservations.map((reservation) => (
                    <SelectItem key={reservation.id} value={reservation.id}>
                      {`${reservation.id} - ${reservation.customer} (${reservation.car})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={formData.mechanic} onValueChange={(value) => handleInputChange("mechanic", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Mechanics" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic} value={mechanic}>
                      {mechanic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-4">
                <label className="text-sm text-gray-500">Services</label>
                <div className="grid grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <label
                        htmlFor={service.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {service.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Input
                type="text"
                placeholder="Price (₱0,000.00)"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-6">
                <Input
                  type="number"
                  placeholder="Quantity (x1)"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  min="1"
                />
                <Input
                  type="number"
                  placeholder="Discount (0%)"
                  value={formData.discount}
                  onChange={(e) => handleInputChange("discount", e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button
                onClick={() => router.push("/transactions")}
                variant="outline"
                className="bg-white hover:bg-gray-100"
              >
                Back
              </Button>
              <Button onClick={handleConfirm} className="bg-[#1A365D] hover:bg-[#1E4E8C]">
                Confirm Transaction
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
