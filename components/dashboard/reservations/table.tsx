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
import { collection, query, onSnapshot, where, orderBy, doc, updateDoc } from "firebase/firestore"

interface Service {
  mechanic: string
  service: string
  status: string
}

interface Reservation {
  id: string;
  userId: string;
  reservationDate: string;
  carModel: string;
  completionDate: string;
  status: string;
  services: Service[];
}

export function ReservationsTable({ searchQuery }: { searchQuery: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showAddService, setShowAddService] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<{ reservationId: string; serviceIndex: number } | null>(null)

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  
    const userDocRef = doc(db, "users", user.uid);
    const bookingsCollectionRef = collection(userDocRef, "bookings");
    const q = query(bookingsCollectionRef, where("userId", "==", user.uid));
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const booking = doc.data();
        return {
          id: doc.id,
          userId: booking.userId,
          reservationDate: booking.reservationDate || "N/A",
          carModel: booking.carModel || "Unknown",
          completionDate: booking.completionDate || "Pending",
          status: booking.status.toUpperCase() || "CONFIRMED",
          services: booking.services || [],
        } as Reservation;
      });
      setReservations(data);
    });
  
    return () => unsubscribe();
  }, []);

  const handleAddServices = async (selectedServices: string[]) => {
    if (!expandedRow) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Update the reservations state with new services
      setReservations((prev) =>
        prev.map((reservation) => {
          if (reservation.id === expandedRow) {
            const newServices: Service[] = selectedServices.map((service) => ({
              mechanic: "TO BE ASSIGNED",
              service: service.toUpperCase(),
              status: "Confirmed",
            }));

            return {
              ...reservation,
              services: [...(reservation.services || []), ...newServices],
            };
          }
          return reservation;
        })
      );

      // Update Firestore
      const userDocRef = doc(db, "users", user.uid);
      const bookingDocRef = doc(userDocRef, "bookings", expandedRow);
      
      // Get the reservation to update
      const reservation = reservations.find(res => res.id === expandedRow);
      if (reservation) {
        const newServices = selectedServices.map((service) => ({
          mechanic: "TO BE ASSIGNED",
          service: service.toUpperCase(),
          status: "Confirmed",
        }));
        
        await updateDoc(bookingDocRef, {
          services: [...(reservation.services || []), ...newServices]
        });
      }
    } catch (error) {
      console.error("Error adding services:", error);
      alert("There was an error adding services. Please try again.");
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Update state
      setReservations((prev) =>
        prev.map((reservation) => {
          if (reservation.id === serviceToDelete.reservationId) {
            const services = [...(reservation.services || [])];
            services.splice(serviceToDelete.serviceIndex, 1);
            return {
              ...reservation,
              services,
            };
          }
          return reservation;
        })
      );

      // Update Firestore
      const userDocRef = doc(db, "users", user.uid);
      const bookingDocRef = doc(userDocRef, "bookings", serviceToDelete.reservationId);
      
      // Get the reservation to update
      const reservation = reservations.find(res => res.id === serviceToDelete.reservationId);
      if (reservation) {
        const updatedServices = [...reservation.services];
        updatedServices.splice(serviceToDelete.serviceIndex, 1);
        
        await updateDoc(bookingDocRef, {
          services: updatedServices
        });
      }
      
      setServiceToDelete(null);
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("There was an error deleting the service. Please try again.");
    }
  };

  const filteredAndSortedReservations = reservations.filter((reservation) =>
    searchQuery
      ? ["id", "carModel", "reservationDate", "completionDate", "status"].some((key) =>
          reservation[key as keyof Reservation]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true
  );
    
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
              <React.Fragment key={reservation.id}>
                <tr className={cn("hover:bg-gray-50", expandedRow && expandedRow !== reservation.id && "opacity-50")}>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.id}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.reservationDate}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.carModel}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.completionDate}</td>
                  <td className="px-6 py-4">
                    <span className={cn("inline-flex rounded-lg px-3 py-1 text-sm font-medium", getStatusStyle(reservation.status))}>
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setExpandedRow(expandedRow === reservation.id ? null : reservation.id)}
                        className="text-[#1A365D] hover:text-[#63B3ED]"
                      >
                        <Image
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector-SksAg0p4n0pZM3et1Y1lcrad0DGitc.svg"
                          alt="View details"
                          width={20}
                          height={20}
                          className={cn("transition-transform", expandedRow === reservation.id && "rotate-180")}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === reservation.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="grid grid-cols-4 flex-1 gap-4">
                            <div className="text-xs font-medium text-[#8B909A] uppercase text-center">Mechanic</div>
                            <div className="text-xs font-medium text-[#8B909A] uppercase text-center">Service</div>
                            <div className="text-xs font-medium text-[#8B909A] uppercase text-center">Status</div>
                            <div className="text-xs font-medium text-[#8B909A] uppercase text-center">Action</div>
                          </div>
                          <Button
                            onClick={() => setShowAddService(true)}
                            className="bg-[#1A365D] hover:bg-[#1A365D]/90 text-white whitespace-nowrap ml-4"
                          >
                            Add service
                          </Button>
                        </div>
                        {reservation.services?.map((service, index) => (
                          <div key={index} className="grid grid-cols-4 gap-4">
                            <div className="text-sm text-[#1A365D] text-center">{service.mechanic}</div>
                            <div className="text-sm text-[#1A365D] text-center">{service.service}</div>
                            <div className="flex justify-center">
                              <span className="inline-flex rounded-lg px-3 py-1 text-sm font-medium bg-[#63B3ED]/10 text-[#63B3ED]">
                                {service.status}
                              </span>
                            </div>
                            <div className="flex justify-center">
                              <button
                                onClick={() =>
                                  setServiceToDelete({ reservationId: reservation.id, serviceIndex: index })
                                }
                                className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-[#1A365D] text-[#1A365D] hover:text-[#63B3ED] hover:border-[#63B3ED]"
                              >
                                <span className="text-lg font-semibold">-</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Are you sure to delete this service?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setServiceToDelete(null)}
              className="bg-[#FFE5E5] hover:bg-[#EA5455]/30 text-[#EA5455] hover:text-[#EA5455]"
            >
              No, go back
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteService}
              className="bg-[#E6FFF3] hover:bg-[#28C76F]/30 text-[#28C76F] hover:text-[#28C76F]"
            >
              Yes, delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AddServiceDialog open={showAddService} onOpenChange={setShowAddService} onConfirm={handleAddServices} />
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