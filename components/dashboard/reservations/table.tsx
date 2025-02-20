"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddServiceDialog } from "./add-service-dialog"
import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore"

interface Service {
  mechanic: string
  service: string
  status: string
}

interface Reservation {
  id: string
  reservationDate: string
  carModel: string
  completionDate: string
  status: "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED"
  services?: Service[]
}

export function ReservationsTable({ searchQuery }: { searchQuery: string }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof Reservation>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [serviceToDelete, setServiceToDelete] = useState<{ reservationId: string; serviceIndex: number } | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("reservationDate", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const booking = doc.data()
        return {
          id: doc.id,
          reservationDate: booking.reservationDate || "N/A",
          carModel: booking.carModel || "Unknown",
          completionDate: booking.completionDate || "Pending", // Default "Pending"
          status: booking.status || "CONFIRMED", // Default "CONFIRMED"
          services: booking.generalServices || [],
        } as Reservation
      })
      setReservations(data)
    })
    return () => unsubscribe()
  }, [])
  

  const handleSort = (field: keyof Reservation) => {
    setSortOrder(sortField === field && sortOrder === "asc" ? "desc" : "asc")
    setSortField(field)
  }

  const handleDeleteService = async () => {
    if (!serviceToDelete) return
    const { reservationId, serviceIndex } = serviceToDelete
    const reservationRef = doc(db, "bookings", reservationId)
    const updatedServices = reservations.find((res) => res.id === reservationId)?.services || []
    updatedServices.splice(serviceIndex, 1)
    await updateDoc(reservationRef, { services: updatedServices })
    setServiceToDelete(null)
  }

  const filteredAndSortedReservations = [...reservations]
    .filter((reservation) =>
      searchQuery
        ? ["id", "carModel", "reservationDate", "completionDate", "status"].some((key) =>
            reservation[key as keyof Reservation]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
          )
        : true
    )
    .sort((a, b) => {
      const aValue = a[sortField]?.toString().toLowerCase() || ""
      const bValue = b[sortField]?.toString().toLowerCase() || ""
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    })

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {["RESERVATION ID", "RESERVATION DATE", "CAR MODEL", "COMPLETION DATE", "STATUS", "ACTION"].map(
                (label, index) => (
                  <th key={index} className="px-6 py-3 text-left text-xs font-medium text-[#8B909A] uppercase">
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedReservations.map((reservation) => (
              <tr key={reservation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.id}</td>
                <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.reservationDate}</td>
                <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.carModel}</td>
                <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.completionDate}</td>
                <td className="px-6 py-4">
                  <span className={cn("inline-flex rounded-lg px-3 py-1 text-sm font-medium", getStatusStyle(reservation.status))}>
                    {reservation.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const getStatusStyle = (status?: string) => {
  if (!status) return "bg-gray-200 text-gray-600"

  switch (status.toLowerCase()) {
    case "confirmed": return "bg-[#63B3ED]/10 text-[#63B3ED]"
    case "repairing": return "bg-[#EFBF14]/10 text-[#EFBF14]"
    case "completed": return "bg-[#28C76F]/10 text-[#28C76F]"
    case "cancelled": return "bg-[#EA5455]/10 text-[#EA5455]"
    default: return "bg-[#8B909A]/10 text-[#8B909A]"
  }
}

