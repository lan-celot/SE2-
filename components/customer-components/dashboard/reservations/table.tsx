//customer 
import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/customer-components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/customer-components/ui/table";
import { AddServiceDialog } from "./add-service-dialog";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog";
import { db, auth } from "@/lib/firebase";
import { collection, query, onSnapshot, where, doc, updateDoc, arrayUnion } from "firebase/firestore";

// Update the Service interface (around line 15)
interface Service {
  mechanic: string;
  service: string;
  status: MechanicStatus; // Changed from string to MechanicStatus
  created?: string;
  createdTime?: string;
  reservationDate?: string;
  serviceId?: string;
}



// Add this type definition after the Service interface
type MechanicStatus = "PENDING" | "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED";

type Status = "PENDING" | "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED";

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
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState<string | null>(null);

  // Add this useEffect after your other useEffects:
useEffect(() => {
  const handleFilterStatus = (event: CustomEvent) => {
    setStatusFilter(event.detail);
  };

  window.addEventListener('filterStatus', handleFilterStatus as EventListener);
  
  return () => {
    window.removeEventListener('filterStatus', handleFilterStatus as EventListener);
  };
}, []);

// Now update your filteredAndSortedReservations function to use this filter, around line 463:
const filteredAndSortedReservations = reservations
  .filter((reservation) => {
    const matchesSearch = searchQuery
      ? ["id", "carModel", "reservationDate", "completionDate", "status"].some((key) => {
          const value = reservation[key as keyof Reservation];
          return value ? value.toString().toLowerCase().includes(searchQuery.toLowerCase()) : false;
        })
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

   // Helper function to determine initial mechanic status based on reservation status
// Replace the existing getInitialMechanicStatus function with this improved version
const getInitialMechanicStatus = (reservationStatus: string): MechanicStatus => {
  switch (reservationStatus.toUpperCase()) {
    case "PENDING": return "PENDING";
    case "CONFIRMED": return "CONFIRMED";
    case "REPAIRING": return "REPAIRING"; // Changed from PENDING to REPAIRING
    case "COMPLETED": return "COMPLETED";
    case "CANCELLED": return "CANCELLED";
    default: return "PENDING";
  }
};
  function isValidStatus(status: string): status is typeof status {
    return ["PENDING", "CONFIRMED", "REPAIRING", "COMPLETED", "CANCELLED"].includes(status as typeof status);
  }
  
  function isValidMechanicStatus(status: string): status is MechanicStatus {
    return ["PENDING", "CONFIRMED", "REPAIRING", "COMPLETED", "CANCELLED"].includes(status as MechanicStatus);
  }


// Valid status transitions
const validStatusTransitions: Record<Status, Status[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["REPAIRING", "CANCELLED"],
  REPAIRING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

// Valid mechanic status transitions based on reservation status
// Replace the validMechanicStatusTransitions object with this clearer version
const validMechanicStatusTransitions: Record<Status, MechanicStatus[]> = {
  PENDING: ["PENDING"], // When reservation is PENDING, services should be PENDING
  CONFIRMED: ["CONFIRMED"], // When reservation is CONFIRMED, services should be CONFIRMED
  REPAIRING: ["PENDING", "REPAIRING", "COMPLETED", "CANCELLED"], // During REPAIRING, all statuses are allowed
  COMPLETED: ["COMPLETED"], // When reservation is COMPLETED, all services should be COMPLETED
  CANCELLED: ["CANCELLED"] // When reservation is CANCELLED, all services should be CANCELLED
};  // Helper function to validate mechanic status changes
   // Similarly update isValidMechanicStatusChange function
const isValidMechanicStatusChange = (
  reservationStatus: string, 
  currentMechanicStatus: MechanicStatus, 
  newMechanicStatus: MechanicStatus
): boolean => {
  // Normalize the reservation status
  const normalizedStatus = reservationStatus.toUpperCase() as Status;
  
  // Check if the new status is allowed for the current reservation status
  return validMechanicStatusTransitions[normalizedStatus].includes(newMechanicStatus);
};
   // Helper function to check if all services are completed
   const areAllServicesCompleted = (services: Service[]): boolean => {
    return services.every(service => 
      service.status === "COMPLETED" || service.status === "CANCELLED"
    );
  };

  // Helper function to generate completion date when status is completed
  const generateCompletionDate = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
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
        
        // Determine completion date based on status
        let completionDate = "PENDING";
        
        // Safely handle status conversion
        const status = booking.status ? String(booking.status).toUpperCase() : "PENDING";

        if (booking.completionDate && booking.completionDate !== "PENDING") {
          completionDate = formatDateTime(booking.completionDate);
        } else if (status === "COMPLETED") {
          // If status is COMPLETED but no completion date, generate one
          const now = new Date();
          completionDate = generateCompletionDate();
          // Update Firestore with the new completion date in a later step
        }

        // If status is COMPLETED and completion date is still PENDING, generate a new completion date
        if (status === "COMPLETED" && completionDate === "PENDING") {
          completionDate = generateCompletionDate();
        }

// In the useEffect for data fetching, replace the services mapping section with:
const services = Array.isArray(booking.services)
  ? booking.services.map((service: any) => {
      // Map service status based on reservation status
      let serviceStatus: MechanicStatus;
      
      if (service.status && isValidMechanicStatus(service.status.toUpperCase())) {
        // If service has a valid status, use it
        serviceStatus = service.status.toUpperCase() as MechanicStatus;
      } else {
        // If not, derive from reservation status
        switch(status.toUpperCase()) {
          case "PENDING": serviceStatus = "PENDING"; break;
          case "CONFIRMED": serviceStatus = "CONFIRMED"; break;
          case "REPAIRING": serviceStatus = "REPAIRING"; break;
          case "COMPLETED": serviceStatus = "COMPLETED"; break;
          case "CANCELLED": serviceStatus = "CANCELLED"; break;
          default: serviceStatus = "PENDING";
        }
      }
      
      return {
        ...service,
        status: serviceStatus,
      };
    })
  : [];
        return {
          id: id,
          userId: booking.userId || user.uid,
          reservationDate: formattedReservationDate,
          carModel: booking.carModel ? `${booking.carModel}`.replace(/\s+/g, ' ') : "N/A",
          completionDate: completionDate,
          status: status,
          services: services,
          statusUpdatedAt: booking.statusUpdatedAt || null,
          createdAt: booking.createdAt ? formatDateTime(booking.createdAt) : "N/A"
        };
      });

      const uniqueReservations = reservationList.filter((reservation, index, self) =>
        index === self.findIndex((r) => r.id === reservation.id)
      );

      console.log("Fetched reservations:", uniqueReservations);
      setReservations(uniqueReservations);

      // Update Firestore if any reservations need completion date
     // In the same useEffect where you're setting reservations, around line 214:
// Make sure this code is there and working:

// Update Firestore if any reservations need completion date
for (const reservation of uniqueReservations) {
  if (reservation.status === "COMPLETED" && reservation.completionDate === "PENDING") {
    try {
      const bookingDocRef = doc(db, "bookings", reservation.id);
      await updateDoc(bookingDocRef, {
        completionDate: new Date().toISOString(),
        status: "COMPLETED"
      });
    } catch (error) {
      console.error("Error updating completion date:", error);
    }
  }

        // Status change notification logic
        const prevStatus = lastStatusUpdate[reservation.id];
        if (prevStatus && prevStatus !== reservation.status) {
          setShowStatusNotification({
            message: `Your booking status has been updated to ${reservation.status}`,
            type: reservation.status.toLowerCase()
          });
        }
        setLastStatusUpdate(prev => ({
          ...prev,
          [reservation.id]: reservation.status
        }));
      }

      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching reservations:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


// Replace the existing useEffect for service status synchronization
useEffect(() => {
  // Skip if no reservations
  if (!reservations.length) return;
  
  const updatedReservations = reservations.map(reservation => {
    // Skip if there are no services
    if (!reservation.services || !reservation.services.length) return reservation;
    
    // Determine how services should reflect reservation status
    const updatedServices = reservation.services.map(service => {
      let newStatus: MechanicStatus;
      
      // Map mechanic status based on reservation status
      switch (reservation.status.toUpperCase()) {
        case "PENDING":
          newStatus = "PENDING";
          break;
        case "CONFIRMED":
          newStatus = "CONFIRMED";
          break;
        case "REPAIRING":
          // If service is in PENDING or CONFIRMED state and reservation is REPAIRING,
          // update to REPAIRING. Otherwise, keep current status.
          if (service.status === "PENDING" || service.status === "CONFIRMED") {
            newStatus = "REPAIRING";
          } else {
            newStatus = service.status;
          }
          break;
        case "COMPLETED":
          newStatus = "COMPLETED";
          break;
        case "CANCELLED":
          newStatus = "CANCELLED";
          break;
        default:
          newStatus = service.status;
      }
      
      return { ...service, status: newStatus };
    });
    
    // Check for auto-completion condition
    const isReadyToComplete = 
      reservation.status === "REPAIRING" && 
      updatedServices.length > 0 && 
      updatedServices.every(service => 
        service.status === "COMPLETED" || service.status === "CANCELLED"
      ) && 
      updatedServices.some(service => service.status === "COMPLETED");
    
    if (isReadyToComplete && showCompleteConfirmation !== reservation.id) {
      setShowCompleteConfirmation(reservation.id);
    }
    
    return { ...reservation, services: updatedServices };
  });
  
  // Only update if there are actual changes
  const hasChanges = JSON.stringify(updatedReservations) !== JSON.stringify(reservations);
  if (hasChanges) {
    setReservations(updatedReservations);
  }
}, [reservations, showCompleteConfirmation]);


  useEffect(() => {
    if (showStatusNotification) {
      const timer = setTimeout(() => {
        setShowStatusNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showStatusNotification]);



  // Confirmation dialog for completing reservation
  const handleCompleteReservation = async (confirm: boolean) => {
    if (!showCompleteConfirmation) return;

    try {
      if (confirm) {
        const bookingDocRef = doc(db, "bookings", showCompleteConfirmation);
        await updateDoc(bookingDocRef, {
          status: "COMPLETED",
          completionDate: new Date().toISOString()
        });
      }
      
      setShowCompleteConfirmation(null);
    } catch (error) {
      console.error("Error completing reservation:", error);
      alert("There was an error completing the reservation. Please try again.");
    }
  };

  // Render complete confirmation dialog
  const renderCompleteConfirmationDialog = () => {
    return (
      <Dialog open={!!showCompleteConfirmation} onOpenChange={() => handleCompleteReservation(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Mark Booking as Complete?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handleCompleteReservation(false)}
              className="bg-[#FFE5E5] hover:bg-[#EA5455]/30 text-[#EA5455] hover:text-[#EA5455]"
            >
              No, keep open
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCompleteReservation(true)}
              className="bg-[#E6FFF3] hover:bg-[#28C76F]/30 text-[#28C76F] hover:text-[#28C76F]"
            >
              Yes, complete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const handleAddService = (reservationId: string) => {
    setExpandedRow(reservationId);
    setShowAddService(true);
  };

  // Update handleAddServices to implement initial mechanic status logic
  // Update handleAddServices function
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

      // Determine initial mechanic status based on reservation status
      const initialMechanicStatus = getInitialMechanicStatus(reservation.status);

      const newServices = selectedServices.map((service) => ({
        mechanic: "TO BE ASSIGNED",
        service: service ? service.toUpperCase() : "CUSTOM SERVICE",
        status: initialMechanicStatus,
        created: createdDate,
        createdTime: createdTime,
        reservationDate: reservation.reservationDate,
        serviceId: `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      }));

      const bookingDocRef = doc(db, "bookings", expandedRow);
      
      await updateDoc(bookingDocRef, {
        services: arrayUnion(...newServices),
        lastUpdated: now.toISOString()
      });
    }
  } catch (error) {
    console.error("Error adding services:", error);
    alert("There was an error adding services. Please try again.");
  }
};

const isStatusChangeValid = (currentStatus: Status, newStatus: Status): boolean => {
  return validStatusTransitions[currentStatus].includes(newStatus);
};

const handleDeleteService = async () => {
  if (serviceToDelete) {
    const reservation = reservations.find(res => res.id === serviceToDelete.reservationId);
    
    if (!reservation) return;

    // Prevent deletion for completed or cancelled reservations
    if (reservation.status === "COMPLETED" || reservation.status === "CANCELLED") {
      alert("Cannot delete services from a completed or cancelled reservation.");
      return;
    }

    try {
      const updatedServices = reservation.services.filter(
        (_, index) => index !== serviceToDelete.serviceIndex
      );

      const bookingDocRef = doc(db, "bookings", reservation.id);
      
      await updateDoc(bookingDocRef, { services: updatedServices });

      // Update local state
      setReservations(prevReservations => 
        prevReservations.map(res => 
          res.id === reservation.id ? { ...res, services: updatedServices } : res
        )
      );

      // Reset delete state
      setServiceToDelete(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("There was an error deleting the service. Please try again.");
    }
  }
};

  const canAddServices = (status: string) => {
    // Safely handle undefined status
    if (!status) return true;
    const lowerStatus = status.toLowerCase();
    return lowerStatus !== "repairing" && lowerStatus !== "completed" && lowerStatus !== "cancelled";
  };



  const handleStatusUpdate = async (reservationId: string, newStatus: Status) => {
    try {
      const reservation = reservations.find(res => res.id === reservationId);
      if (!reservation) return;
  
      // Validate status change
      const currentStatus = reservation.status as Status;
      if (!isValidStatus(currentStatus) || !validStatusTransitions[currentStatus].includes(newStatus)) {
        console.error("Invalid status transition");
        return;
      }
  
      const bookingDocRef = doc(db, "bookings", reservationId);
      const updateData: any = { status: newStatus.toUpperCase() };
  
      // Update service statuses based on new reservation status
      const updatedServices = reservation.services.map(service => ({
        ...service,
        status: (() => {
          switch(newStatus) {
            case "PENDING": return "PENDING";
            case "CONFIRMED": return "CONFIRMED";
            case "REPAIRING": return "PENDING";
            case "COMPLETED": return "COMPLETED";
            case "CANCELLED": return "CANCELLED";
            default: return service.status;
          }
        })()
      }));
  
      updateData.services = updatedServices;
  
      // If status is changed to COMPLETED, add completion date
      if (newStatus === "COMPLETED") {
        updateData.completionDate = new Date().toISOString();
      }
  
      await updateDoc(bookingDocRef, updateData);
  
      // Update local state
      setReservations(prevReservations => 
        prevReservations.map(res => 
          res.id === reservationId 
            ? { 
                ...res, 
                status: newStatus, 
                services: updatedServices,
                ...(newStatus === "COMPLETED" ? { completionDate: new Date().toISOString() } : {}) 
              } 
            : res
        )
      );
  
    } catch (error) {
      console.error("Error updating status:", error);
      alert("There was an error updating the status. Please try again.");
    }
  };
const handleMechanicStatusChange = async (reservationId: string, serviceIndex: number, newStatus: MechanicStatus) => {
  try {
    const reservation = reservations.find(res => res.id === reservationId);
    
    if (!reservation || !reservation.userId || !reservation.services) {
      throw new Error("Reservation or service not found");
    }
    
    // Validate status change based on current reservation status
    if (!isValidStatus(reservation.status)) {
      console.error("Invalid reservation status");
      return;
    }
    const allowedStatuses = validMechanicStatusTransitions[reservation.status as Status];
    if (!allowedStatuses.includes(newStatus)) {
      console.error("Invalid mechanic status transition");
      return;
    }

    const updatedServices = [...reservation.services];
    updatedServices[serviceIndex] = {
      ...updatedServices[serviceIndex],
      status: newStatus
    };
    
    const bookingDocRef = doc(db, "bookings", reservationId);
    
    await updateDoc(bookingDocRef, { services: updatedServices });

    // Update local state
    setReservations(prevReservations => 
      prevReservations.map(res => 
        res.id === reservationId ? { ...res, services: updatedServices } : res
      )
    );

    // Check if all services are completed when reservation is REPAIRING
    if (
      reservation.status === "REPAIRING" && 
      updatedServices.every(service => 
        service.status === "COMPLETED" || service.status === "CANCELLED"
      ) && 
      updatedServices.some(service => service.status === "COMPLETED")
    ) {
      // Automatically complete the reservation
      await updateDoc(bookingDocRef, { 
        status: "COMPLETED",
        completionDate: new Date().toISOString()
      });

      // Update local state to reflect completion
      setReservations(prevReservations => 
        prevReservations.map(res => 
          res.id === reservationId 
            ? { ...res, status: "COMPLETED", completionDate: new Date().toISOString() } 
            : res
        )
      );
    }

  } catch (error) {
    console.error("Error updating mechanic status:", error);
    alert("There was an error updating the service status. Please try again.");
  }
};
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "N/A";
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
      return dateStr || "N/A";
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      if (!dateStr) return "N/A";
      if (dateStr === "PENDING") return dateStr;

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
      return dateStr || "N/A";
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
                          {reservation.status && reservation.status.toLowerCase() === "completed" && (
                            <div className="bg-[#28C76F]/10 text-[#28C76F] p-3 rounded-md text-center font-medium">
                              Your Booking is Complete
                            </div>
                          )}
                          {reservation.status && reservation.status.toLowerCase() === "cancelled" && (
                            <div className="bg-[#EA5455]/10 text-[#EA5455] p-3 rounded-md text-center font-medium">
                              Booking is Cancelled
                            </div>
                          )}
                          {reservation.status && reservation.status.toLowerCase() === "repairing" && (
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
      MECHANIC STATUS
    </TableHead>
    <TableHead className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
      ACTION
    </TableHead>
                                <TableHead className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                                  {canAddServices(reservation.status) ? (
                                    <Button
                                      className="bg-[#2A69AC] hover:bg-[#1A365D] text-white text-sm font-medium px-4 py-2 rounded-md"
                                      onClick={() => handleAddService(reservation.id)}
                                    >
                                      Add Service
                                    </Button>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      {reservation.status && reservation.status.toLowerCase() === "repairing"
                                        ? "Cannot modify during repairs"
                                        : reservation.status && reservation.status.toLowerCase() === "completed"
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
        {service.service || "N/A"}
      </TableCell>
      <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
        {service.mechanic || "TO BE ASSIGNED"}
      </TableCell>
 {/* Replace the TableCell for mechanic status with this improved version */}
<TableCell className="px-6 py-4 text-center">
  <span className={cn(
    "inline-flex rounded-lg px-3 py-1 text-sm font-medium",
    getMechanicStatusStyle(service.status)
  )}>
    {service.status ? service.status.toUpperCase() : "PENDING"}
  </span>
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

      <AddServiceDialog 
        open={showAddService} 
        onOpenChange={setShowAddService} 
        onConfirm={handleAddServices} 
        existingServices={
          expandedRow 
            ? (reservations.find(res => res.id === expandedRow)?.services || [])
                .map(s => s?.service ? s.service.toUpperCase() : '')
                .filter(Boolean)
            : []
        }
      />

{renderCompleteConfirmationDialog()}
    </div>
  );
}

const getStatusStyle = (status?: string) => {
  if (!status) return "bg-gray-200 text-gray-600";

  switch (status.toUpperCase()) {
    case "PENDING": return "bg-[#FF9F43]/10 text-[#FF9F43]";
    case "CONFIRMED": return "bg-[#63B3ED]/10 text-[#63B3ED]";
    case "REPAIRING": return "bg-[#EFBF14]/10 text-[#EFBF14]";
    case "COMPLETED": return "bg-[#28C76F]/10 text-[#28C76F]";
    case "CANCELLED": return "bg-[#EA5455]/10 text-[#EA5455]";
    default: return "bg-[#8B909A]/10 text-[#8B909A]";
  }
};

// Add this function below the getStatusStyle function (around line 400)
const getMechanicStatusStyle = (status?: string) => {
  if (!status) return "bg-gray-200 text-gray-600";

  switch (status.toUpperCase()) {
    case "PENDING": return "bg-[#FF9F43]/10 text-[#FF9F43]";
    case "CONFIRMED": return "bg-[#63B3ED]/10 text-[#63B3ED]";
    case "REPAIRING": return "bg-[#EFBF14]/10 text-[#EFBF14]";
    case "COMPLETED": return "bg-[#28C76F]/10 text-[#28C76F]";
    case "CANCELLED": return "bg-[#EA5455]/10 text-[#EA5455]";
    default: return "bg-[#8B909A]/10 text-[#8B909A]";
  }
};