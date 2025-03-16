"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { AddServiceDialog } from "./add-service-dialog"
import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { db, auth } from "@/lib/firebase"
import { collection, query, onSnapshot, where, doc, updateDoc, getDoc } from "firebase/firestore"

interface Service {
  mechanic: string
  service: string
  status: string
  created?: string
  reservationDate?: string
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  
    // Query the global bookings collection directly with a filter on userId
    const bookingsCollectionRef = collection(db, "bookings");
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
          services: Array.isArray(booking.services) ? booking.services : [],
        } as Reservation;
      });
  
      // Filter out duplicates based on reservation ID
      const uniqueReservations = data.filter((reservation, index, self) =>
        index === self.findIndex((r) => r.id === reservation.id)
      );
  
      setReservations(uniqueReservations);
    });
  
    return () => unsubscribe();
  }, []);
  

  // Add event listener for status filter changes
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  
    // Query the user's subcollection directly
    const userBookingsCollectionRef = collection(db, `users/${user.uid}/bookings`);
  
    const unsubscribe = onSnapshot(userBookingsCollectionRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const booking = doc.data();
        return {
          id: doc.id,
          userId: booking.userId,
          reservationDate: booking.reservationDate || "N/A",
          carModel: booking.carModel || "Unknown",
          completionDate: booking.completionDate || "Pending",
          status: booking.status.toUpperCase() || "CONFIRMED",
          services: Array.isArray(booking.services) ? booking.services : [],
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
            // Convert to Philippines time
            const options = { timeZone: 'Asia/Manila' };
            const createdDate = new Date().toLocaleDateString('en-CA', options);
            
            const newServices: Service[] = selectedServices.map((service) => ({
              mechanic: "TO BE ASSIGNED",
              service: service.toUpperCase(),
              status: "Confirmed",
              created: createdDate,
              reservationDate: reservation.reservationDate,
            }));

            return {
              ...reservation,
              services: [...(Array.isArray(reservation.services) ? reservation.services : []), ...newServices],
            };
          }
          return reservation;
        })
      );

      // Only update in the global bookings collection
      const bookingDocRef = doc(db, "bookings", expandedRow);

      // Get the reservation to update
      const reservation = reservations.find(res => res.id === expandedRow);
      if (reservation) {
        // Convert to Philippines time
        const options = { timeZone: 'Asia/Manila' };
        const createdDate = new Date().toLocaleDateString('en-CA', options);
        
        const newServices = selectedServices.map((service) => ({
          mechanic: "TO BE ASSIGNED",
          service: service.toUpperCase(),
          status: "Confirmed",
          created: createdDate,
          reservationDate: reservation.reservationDate,
        }));
        
        const updatedServices = [...(Array.isArray(reservation.services) ? reservation.services : []), ...newServices];

        // Update in global collection
        await updateDoc(bookingDocRef, {
          services: updatedServices
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
            const services = [...(Array.isArray(reservation.services) ? reservation.services : [])];
            services.splice(serviceToDelete.serviceIndex, 1);
            return {
              ...reservation,
              services,
            };
          }
          return reservation;
        })
      );

      // Only update in the global bookings collection
      const bookingDocRef = doc(db, "bookings", serviceToDelete.reservationId);

      // Get the reservation to update
      const reservation = reservations.find(res => res.id === serviceToDelete.reservationId);
      if (reservation) {
        const updatedServices = [...(Array.isArray(reservation.services) ? reservation.services : [])];
        updatedServices.splice(serviceToDelete.serviceIndex, 1);

        // Update in global collection
        await updateDoc(bookingDocRef, {
          services: updatedServices
        });
      }

      setServiceToDelete(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("There was an error deleting the service. Please try again.");
    }
  };

  const filteredAndSortedReservations = reservations.filter((reservation) => {
    // First apply search query filter
    const matchesSearch = searchQuery
      ? ["id", "carModel", "reservationDate", "completionDate", "status"].some((key) =>
          reservation[key as keyof Reservation]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true;

    // Then apply status filter if it exists
    const matchesStatus = statusFilter
      ? reservation.status.toLowerCase() === statusFilter
      : true;

    return matchesSearch && matchesStatus;
  });

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
                        <Table>
                          <thead>
                            <tr>
                              <TableHead className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                                CREATED
                              </TableHead>
                              <TableHead className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                                RESERVATION DATE
                              </TableHead>
                              <TableHead className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                                SERVICE
                              </TableHead>
                              <TableHead className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                                MECHANIC
                              </TableHead>
                              <TableHead className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                                ACTION
                              </TableHead>
                              <TableHead className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                                {reservation.status.toLowerCase() !== "repairing" ? (
                                  <Button
                                    className="bg-[#2A69AC] hover:bg-[#1A365D] text-white text-sm font-medium px-4 py-2 rounded-md"
                                    onClick={() => setShowAddService(true)}
                                  >
                                    Add Service
                                  </Button>
                                ) : (
                                  <span className="text-sm text-gray-500">Cannot modify during repairs</span>
                                )}
                              </TableHead>
                            </tr>
                          </thead>
                          <TableBody>
                            {(Array.isArray(reservation.services) ? reservation.services : []).map((service, index) => (
                              <TableRow key={index}>
                                <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                  {service.created || "N/A"}
                                </TableCell>
                                <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                  {service.reservationDate || reservation.reservationDate}
                                </TableCell>
                                <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                  {service.service}
                                </TableCell>
                                <TableCell className="px-6 py-x4 text-sm text-[#1A365D] text-center">
                                  {service.mechanic}
                                </TableCell>
                                <TableCell className="px-6 py-4 flex justify-center">
                                  <div className="inline-flex items-center justify-center gap-2">
                                    {reservation.status.toLowerCase() !== "repairing" ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setServiceToDelete({
                                            reservationId: reservation.id,
                                            serviceIndex: index,
                                          });
                                          setShowDeleteDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-[#1A365D]" />
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-gray-500">Locked</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Service Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Are you sure to delete this service?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
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