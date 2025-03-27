"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { AddServiceDialog } from "./add-service-dialog";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, auth } from "@/lib/firebase";
import { collection, query, onSnapshot, where, doc, updateDoc, arrayUnion } from "firebase/firestore";

interface Service {
  mechanic: string;
  service: string;
  status: string;
  created?: string;
  createdTime?: string;
  reservationDate?: string;
  serviceId?: string;
}

interface Reservation {
  id: string;
  userId: string;
  reservationDate: string;
  carModel: string;
  completionDate: string;
  status: string;
  services: Service[];
  statusUpdatedAt?: string;
  createdAt?: string;
}

export function ReservationsTable({ searchQuery }: { searchQuery: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{ reservationId: string; serviceIndex: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusNotification, setShowStatusNotification] = useState<{ message: string; type: string } | null>(null);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  

  useEffect(() => {
    // Add event listener for status filtering
    const handleStatusFilter = (event: CustomEvent) => {
      setStatusFilter(event.detail);
    };

    // Cast to any to work around TypeScript's event typing
    window.addEventListener('filterStatus', handleStatusFilter as EventListener);

    // Cleanup listener
    return () => {
      window.removeEventListener('filterStatus', handleStatusFilter as EventListener);
    };
  }, []);

  useEffect(() => {
    
    const user = auth.currentUser;
    if (!user) {
      console.log("User is not authenticated");
      setIsLoading(false);
      return;
    }

    console.log("User is authenticated, fetching reservations...");
    setIsLoading(true);
    const bookingsCollectionRef = collection(db, "bookings");
    const q = query(bookingsCollectionRef, where("userId", "==", user.uid));


    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        console.log("No reservations found");
        setReservations([]);
        setIsLoading(false);
        return;
      }

      const reservationList: Reservation[] = snapshot.docs.map((doc) => {
        const booking = doc.data();
        const id = doc.id;
        const reservationDate = booking.reservationDate || "";
        const formattedReservationDate = reservationDate ? formatDate(reservationDate) : "N/A";
        const completionDate = booking.completionDate && booking.completionDate !== "Pending"
          ? formatDateTime(booking.completionDate)
          : "Pending";
        const createdDateTime = booking.createdAt ? formatDateTime(booking.createdAt) : "N/A";

        return {
          id: id,
          userId: booking.userId,
          reservationDate: formattedReservationDate,
          carModel: `${booking.carModel}`.replace(/\s+/g, ' '),
          completionDate: completionDate,
          status: (booking.status || "PENDING").toUpperCase(),
          services: Array.isArray(booking.services)
            ? booking.services.map((service: any) => ({
                ...service,
                created: service.created || "N/A",
                reservationDate: service.reservationDate || formattedReservationDate
              }))
            : [],
          statusUpdatedAt: booking.statusUpdatedAt || null,
          createdAt: createdDateTime
        };
      });

      const uniqueReservations = reservationList.filter((reservation, index, self) =>
        index === self.findIndex((r) => r.id === reservation.id)
      );

      console.log("Fetched reservations:", uniqueReservations);
      setReservations(uniqueReservations);

      uniqueReservations.forEach(newReservation => {
        const prevStatus = lastStatusUpdate[newReservation.id];
        if (prevStatus && prevStatus !== newReservation.status) {
          setShowStatusNotification({
            message: `Your booking status has been updated to ${newReservation.status}`,
            type: newReservation.status.toLowerCase()
          });
        }
        setLastStatusUpdate(prev => ({
          ...prev,
          [newReservation.id]: newReservation.status
        }));
      });

      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching reservations:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showStatusNotification) {
      const timer = setTimeout(() => {
        setShowStatusNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showStatusNotification]);

  const handleAddServices = async (selectedServices: string[]) => {
    if (!expandedRow) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      const reservation = reservations.find(res => res.id === expandedRow);
      if (reservation) {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Manila' };
        const createdDate = now.toLocaleDateString('en-CA', options);
        const createdTime = now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Manila',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

        const newServices = selectedServices.map((service) => ({
          mechanic: "TO BE ASSIGNED",
          service: service.toUpperCase(),
          status: "Confirmed",
          created: createdDate,
          createdTime: createdTime,
          reservationDate: reservation.reservationDate,
          serviceId: `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        }));

        const updateTimestamp = now.toISOString();
        const bookingDocRef = doc(db, "bookings", expandedRow);
        await updateDoc(bookingDocRef, {
          services: arrayUnion(...newServices),
          lastUpdated: updateTimestamp
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
      const reservation = reservations.find(res => res.id === serviceToDelete.reservationId);
      if (reservation) {
        const updatedServices = [...(Array.isArray(reservation.services) ? reservation.services : [])];
        updatedServices.splice(serviceToDelete.serviceIndex, 1);

        const bookingDocRef = doc(db, "bookings", serviceToDelete.reservationId);
        await updateDoc(bookingDocRef, {
          services: updatedServices,
          lastUpdated: new Date().toISOString()
        });
      }

      setServiceToDelete(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("There was an error deleting the service. Please try again.");
    }
  };

  const canAddServices = (status: string) => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus !== "repairing" && lowerStatus !== "completed" && lowerStatus !== "cancelled";
  };

  const filteredAndSortedReservations = reservations
  .filter((reservation) => {
    const matchesSearch = searchQuery
      ? ["id", "carModel", "reservationDate", "completionDate", "status"].some((key) =>
          reservation[key as keyof Reservation]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true;

    const matchesStatus = statusFilter
      ? reservation.status.toLowerCase() === statusFilter.toLowerCase()
      : true;

    return matchesSearch && matchesStatus;
  })
  .sort((a, b) => {
    const dateA = new Date(a.reservationDate);
    const dateB = new Date(b.reservationDate);

    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateB.getTime() - dateA.getTime();
    }

    return a.reservationDate.localeCompare(b.reservationDate);
  });

  const formatDate = (dateStr: string) => {
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleDateString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      if (dateStr === "Pending") return dateStr;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-gray-500">Loading reservations...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden relative">
      {showStatusNotification && (
        <div className={cn(
          "absolute top-0 left-0 right-0 p-3 text-center text-white font-medium transition-all",
          showStatusNotification.type === "completed" ? "bg-[#28C76F]" :
          showStatusNotification.type === "cancelled" ? "bg-[#EA5455]" :
          showStatusNotification.type === "repairing" ? "bg-[#EFBF14]" :
          "bg-[#63B3ED]"
        )}>
          {showStatusNotification.message}
        </div>
      )}

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
            {filteredAndSortedReservations.length > 0 ? (
              filteredAndSortedReservations.map((reservation) => (
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
                          {reservation.status.toLowerCase() === "completed" && (
                            <div className="bg-[#28C76F]/10 text-[#28C76F] p-3 rounded-md text-center font-medium">
                              Your Booking is Complete
                            </div>
                          )}
                          {reservation.status.toLowerCase() === "cancelled" && (
                            <div className="bg-[#EA5455]/10 text-[#EA5455] p-3 rounded-md text-center font-medium">
                              Booking is Cancelled
                            </div>
                          )}
                          {reservation.status.toLowerCase() === "repairing" && (
                            <div className="bg-[#EFBF14]/10 text-[#EFBF14] p-3 rounded-md text-center font-medium">
                              Your vehicle is now being repaired
                            </div>
                          )}

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
                                  {canAddServices(reservation.status) ? (
                                    <Button
                                      className="bg-[#2A69AC] hover:bg-[#1A365D] text-white text-sm font-medium px-4 py-2 rounded-md"
                                      onClick={() => setShowAddService(true)}
                                    >
                                      Add Service
                                    </Button>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      {reservation.status.toLowerCase() === "repairing"
                                        ? "Cannot modify during repairs"
                                        : reservation.status.toLowerCase() === "completed"
                                          ? "Your booking is complete"
                                          : "Booking is cancelled"}
                                    </span>
                                  )}
                                </TableHead>
                              </tr>
                            </thead>
                            <TableBody>
                              {(Array.isArray(reservation.services) && reservation.services.length > 0) ? (
                                reservation.services.map((service, index) => (
                                  <TableRow key={`${reservation.id}-service-${service.serviceId || index}`}>
                                    <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                      {service.created || "N/A"}
                                      {service.createdTime && <span className="ml-1">{service.createdTime}</span>}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                      {formatDate(service.reservationDate || reservation.reservationDate)}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                      {service.service}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                      {service.mechanic}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 flex justify-center">
                                      <div className="inline-flex items-center justify-center gap-2">
                                        {canAddServices(reservation.status) ? (
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
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No services added yet
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery || statusFilter ? "No matching reservations found" : "No reservations found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
  );
}

const getStatusStyle = (status?: string) => {
  if (!status) return "bg-gray-200 text-gray-600";

  switch (status.toLowerCase()) {
    case "pending": return "bg-[#FF9F43]/10 text-[#FF9F43]"; // New style for PENDING status
    case "confirmed": return "bg-[#63B3ED]/10 text-[#63B3ED]";
    case "repairing": return "bg-[#EFBF14]/10 text-[#EFBF14]";
    case "completed": return "bg-[#28C76F]/10 text-[#28C76F]";
    case "cancelled": return "bg-[#EA5455]/10 text-[#EA5455]";
    default: return "bg-[#8B909A]/10 text-[#8B909A]";
  }
};
