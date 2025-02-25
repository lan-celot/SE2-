"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddServiceDialog } from "./add-service-dialog"
import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { db, auth } from "@/lib/firebase"
import { collection, query, onSnapshot,  where, orderBy, doc, updateDoc } from "firebase/firestore"

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
  status: string
  services: string[]
}

export function ReservationsTable({ searchQuery }: { searchQuery: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([])

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid)
    const bookingsCollectionRef = collection(userDocRef, "bookings")
    const q = query(bookingsCollectionRef, where("userId", "==", user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const booking = doc.data();
        return {
          id: doc.id,
          reservationDate: booking.reservationDate || "N/A",
          carModel: booking.carModel || "Unknown",
          completionDate: booking.completionDate || "Pending",
          status: booking.status || "CONFIRMED",
          services: booking.services || [],
        } as Reservation;
      });
      setReservations(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredAndSortedReservations = reservations.filter((reservation) =>
    searchQuery
      ? ["id", "carModel", "reservationDate", "completionDate", "status"].some((key) =>
          reservation[key as keyof Reservation]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true
  )
    
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

