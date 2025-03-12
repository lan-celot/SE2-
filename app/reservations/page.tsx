"use client"
import { useEffect, useState } from "react";
import * as React from "react"
import { Search, ChevronDown, Trash2, User, ChevronUp } from "lucide-react"
import { DashboardHeader } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AddServiceDialog } from "./add-service-dialog"
import { ReservationsTabs } from "./reservations-tabs"
import { Sidebar } from "@/components/sidebar"
import { collection, getDocs, onSnapshot, orderBy, query, doc, updateDoc, getDoc, writeBatch, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
// Add this to your imports
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Status = "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED"

interface Reservation {
  id: string;
  lastName: string;
  firstName: string;
  reservationDate: string;
  customerName: string;
  userId: string;
  carModel: string;
  status: Status;
  services?: {
    created: string;
    reservationDate: string;
    service: string;
    mechanic: string;
  }[];
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "bg-[#EBF8FF]", text: "text-[#63B3ED]" },
  REPAIRING: { bg: "bg-[#FFF5E0]", text: "text-[#EFBF14]" },
  COMPLETED: { bg: "bg-[#E6FFF3]", text: "text-[#28C76F]" },
  CANCELLED: { bg: "bg-[#FFE5E5]", text: "text-[#EA5455]" }
};

const reservations: Reservation[] = [];

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
];

export default function ReservationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reservationData, setReservationData] = useState(reservations);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [showMechanicDialog, setShowMechanicDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<{
    reservationId: string;
    serviceIndex: number;
  } | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState("");
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortField, setSortField] = useState<keyof Omit<Reservation, "services" | "status"> | null>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  // Add these state variables to your component
const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
const [pendingStatusChange, setPendingStatusChange] = useState<{reservationId: string; userId: string; newStatus: Status} | null>(null);

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("reservationDate", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const bookingData = doc.data();
        return {
          id: doc.id,
          lastName: bookingData.lastName || "",
          firstName: bookingData.firstName || "",
          reservationDate: bookingData.reservationDate || "",
          customerName: bookingData.customerName || "",
          userId: bookingData.userId || "",
          carModel: bookingData.carModel || "",
          status: (bookingData.status?.toUpperCase() as Status) || "CONFIRMED",
          services: Array.isArray(bookingData.services) ? bookingData.services : [],
        } satisfies Reservation;
      });

      console.log("Fetched Reservations:", data);
      setReservationData(data);
    }, (error) => {
      console.error("Error fetching reservations:", error.message);
    });

    return () => unsubscribe();
  }, []);

// Replace the handleStatusChange function with this
const handleStatusChange = async (reservationId: string, userId: string, newStatus: Status) => {
  try {
    const normalizedStatus = newStatus.toUpperCase() as Status;
    
    // For debugging
    console.log(`Updating status for reservation ID: ${reservationId}, Customer ID: ${userId}, New Status: ${normalizedStatus}`);
    
    if (!reservationId || !userId || !normalizedStatus) {
      throw new Error("Missing required data for status update");
    }
    
    // References to both locations in Firestore
    const globalDocRef = doc(db, "bookings", reservationId);
    const userDocRef = doc(db, "users", userId, "bookings", reservationId);
    
    // Use Firestore batch to update both documents atomically
    const batch = writeBatch(db);
    batch.update(globalDocRef, { status: normalizedStatus });
    batch.update(userDocRef, { status: normalizedStatus });
    
    await batch.commit(); // Apply both updates together
    
    console.log("Status updated successfully in both Firestore locations");
    
    // Update state to reflect changes immediately
    setReservationData((prevData) =>
      prevData.map((reservation) =>
        reservation.id === reservationId ? { ...reservation, status: normalizedStatus } : reservation
      )
    );
    
  } catch (error) {
    console.error("Error updating status:", error instanceof Error ? error.message : "Unknown error");
  }
};

// Add this function to handle status change attempts
// Corrected function to handle status change attempts
const handleStatusChangeAttempt = (reservationId: string, userId: string, newStatus: Status) => {
  const reservation = reservationData.find(res => res.id === reservationId);
  
  if (!reservation) return;
  
  const currentStatus = reservation.status;
  
  // Check if changing from a non-changeable status (COMPLETED or CANCELLED)
  if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
    // Status cannot be changed
    alert("This status cannot be changed.");
    return;
  }
  
  // If changing to a restricted status, show confirmation dialog
  if (newStatus === "COMPLETED" || newStatus === "REPAIRING" || newStatus === "CANCELLED") {
    setPendingStatusChange({ reservationId, userId, newStatus });
    setShowStatusConfirmDialog(true);
  } else {
    // For other statuses, just update directly
    handleStatusChange(reservationId, userId, newStatus);
  }
};

// Add this function to confirm status change
const confirmStatusChange = () => {
  if (pendingStatusChange) {
    const { reservationId, userId, newStatus } = pendingStatusChange;
    handleStatusChange(reservationId, userId, newStatus);
    setPendingStatusChange(null);
    setShowStatusConfirmDialog(false);
  }
};
  const updateMechanicAssignment = async (reservationId: string, serviceIndex: number, mechanicName: string, userId: string) => {
    try {
      console.log(`Updating mechanic for reservation ID: ${reservationId}, Service Index: ${serviceIndex}, Mechanic: ${mechanicName}`);

      const bookingRef = doc(db, "bookings", reservationId);

      await updateDoc(bookingRef, {
        [`services.${serviceIndex}.mechanic`]: mechanicName,
      });

      const userBookingRef = doc(db, `users/${userId}/bookings`, reservationId);

      await updateDoc(userBookingRef, {
        [`services.${serviceIndex}.mechanic`]: mechanicName,
      });

      console.log("Mechanic assignment updated successfully");
    } catch (error) {
      console.error("Error updating mechanic assignment: ", error);
    }
  };

  const handleMechanicChange = async () => {
    if (selectedService && selectedMechanic) {
      const reservationId = selectedService.reservationId;
      const serviceIndex = selectedService.serviceIndex;
      const userId = reservationData.find(res => res.id === reservationId)?.userId || "";

      try {
        setReservationData((prevData) =>
          prevData.map((reservation) => {
            if (reservation.id === reservationId && reservation.services) {
              const updatedServices = [...reservation.services];
              updatedServices[serviceIndex] = {
                ...updatedServices[serviceIndex],
                mechanic: selectedMechanic,
              };
              return { ...reservation, services: updatedServices };
            }
            return reservation;
          })
        );

        await runTransaction(db, async (transaction) => {
          const bookingRef = doc(db, "bookings", reservationId);
          const userBookingRef = doc(db, `users/${userId}/bookings`, reservationId);

          const bookingDoc = await transaction.get(bookingRef);
          const userBookingDoc = await transaction.get(userBookingRef);

          if (!bookingDoc.exists() || !userBookingDoc.exists()) {
            throw new Error("Document does not exist!");
          }

          const bookingData = bookingDoc.data();
          const userBookingData = userBookingDoc.data();

          if (!Array.isArray(bookingData.services) || !Array.isArray(userBookingData.services)) {
            throw new Error("Services field is not an array!");
          }

          bookingData.services[serviceIndex].mechanic = selectedMechanic;
          userBookingData.services[serviceIndex].mechanic = selectedMechanic;

          transaction.update(bookingRef, { services: bookingData.services });
          transaction.update(userBookingRef, { services: userBookingData.services });
        });

        console.log("Mechanic assignment updated successfully");

      } catch (error) {
        console.error("Error updating mechanic assignment: ", error);
      } finally {
        setShowMechanicDialog(false);
        setSelectedService(null);
        setSelectedMechanic("");
      }
    }
  };

  const handleAddServices = async (selectedServices: any[]) => {
    if (expandedRowId) {
      const reservation = reservationData.find((res) => res.id === expandedRowId);
      if (reservation) {
         // Check if status is restricted
      if (
        reservation.status === "COMPLETED" || 
        reservation.status === "CANCELLED" || 
        reservation.status === "REPAIRING"
      ) {
        alert("Cannot add services: reservation status is " + reservation.status);
        return;
      }
        const now = new Date();
        const formattedNow = now.toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).replace(",", "").toLowerCase().replace(/\//g, "-");

        const newServices = selectedServices.map((service) => ({
          created: formattedNow,
          reservationDate: reservation.reservationDate.toLowerCase(),
          service: service,
          mechanic: "TO BE ASSIGNED",
        }));

        const updatedServices = [...(reservation.services || []), ...newServices];

        const globalDocRef = doc(db, "bookings", reservation.id);
        const userDocRef = doc(db, "users", reservation.userId, "bookings", reservation.id);

        const batch = writeBatch(db);
        batch.update(globalDocRef, { services: updatedServices });
        batch.update(userDocRef, { services: updatedServices });

        await batch.commit();

        setReservationData((prevData) =>
          prevData.map((res) =>
            res.id === reservation.id ? { ...res, services: updatedServices } : res
          )
        );
      }
    }
  };

  const handleDeleteService = async () => {
    if (selectedService) {
      const reservation = reservationData.find((res) => res.id === selectedService.reservationId);
      if (reservation) {
        const updatedServices = (reservation.services || []).filter(
          (_, index) => index !== selectedService.serviceIndex
        );

        const globalDocRef = doc(db, "bookings", reservation.id);
        const userDocRef = doc(db, "users", reservation.userId, "bookings", reservation.id);

        const batch = writeBatch(db);
        batch.update(globalDocRef, { services: updatedServices });
        batch.update(userDocRef, { services: updatedServices });

        await batch.commit();

        setReservationData((prevData) =>
          prevData.map((res) =>
            res.id === reservation.id ? { ...res, services: updatedServices } : res
          )
        );

        setShowDeleteDialog(false);
        setSelectedService(null);
      }
    }
  };

  const handleSort = (field: keyof Omit<Reservation, "services" | "status">) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredReservations = reservationData
    .filter((reservation) => {
      const matchesStatus = activeTab === "all" || reservation.status.toLowerCase() === activeTab;
      const matchesSearch = Object.values(reservation).join(" ").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortField) {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const modifier = sortOrder === "asc" ? 1 : -1;
        if (sortField === "id") {
          return (Number.parseInt(a.id.slice(1)) - Number.parseInt(b.id.slice(1))) * modifier;
        }
        return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0;
      }
      return 0;
    });

  console.log("Filtered Reservations:", filteredReservations);

  const columns = [
    { key: "id", label: "RESERVATION ID" },
    { key: "date", label: "RESERVATION DATE" },
    { key: "customerName", label: "CUSTOMER NAME" },
    { key: "userId", label: "CUSTOMER ID" },
    { key: "carModel", label: "CAR MODEL" },
    { key: "status", label: "STATUS", sortable: false },
  ];

  const handleConfirmation = async () => {
    if (selectedStatus && selectedService) {
      const reservationId = selectedService.reservationId;
      const userId = reservationData.find(res => res.id === reservationId)?.userId || "";
  
      try {
        console.log("Starting status update process...");
  
        // Prepare the batch update for Firestore
        const globalDocRef = doc(db, "bookings", reservationId);
        const userDocRef = doc(db, "users", userId, "bookings", reservationId);
  
        const batch = writeBatch(db);
        batch.update(globalDocRef, { status: selectedStatus });
        batch.update(userDocRef, { status: selectedStatus });
  
        // Commit the batch to update the database
        await batch.commit();
        console.log("Database update successful for reservation ID:", reservationId);
  
        // Update local state to reflect the change only after successful database update
        setReservationData(prevData => {
          console.log("Updating local state...");
          return prevData.map(reservation =>
            reservation.id === reservationId ? { ...reservation, status: selectedStatus } : reservation
          );
        });
  
        console.log("Status updated successfully in the database and locally");
  
        // Close the dialog after the status has been successfully updated
        setShowConfirmationDialog(false);
        setSelectedStatus(null);
  
      } catch (error) {
        console.error("Error updating status:", error instanceof Error ? error.message : "Unknown error");
        // Optionally, handle the error (e.g., show an error message to the user)
      }
    }
  };
  
  
  
  
  

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-4">
          <DashboardHeader title="Reservation Management" />
        </div>

        <div className="mb-4">
          <ReservationsTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="h-px bg-gray-200 mt-0" />
        </div>

        <div className="mb-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by ID, name, car model, date..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white">
          <Table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider"
                  >
                    {column.sortable !== false ? (
                      <button
                        className="flex items-center justify-center gap-1 hover:text-[#1A365D] mx-auto"
                        onClick={() => handleSort(column.key as keyof Omit<Reservation, "services" | "status">)}
                      >
                        {column.label}
                        <div className="flex flex-col">
                          <ChevronUp
                            className={cn(
                              "h-3 w-3",
                              sortField === column.key && sortOrder === "asc" ? "text-[#1A365D]" : "text-[#8B909A]",
                              column.key === "id" && "rotate-180",
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              "h-3 w-3",
                              sortField === column.key && sortOrder === "desc" ? "text-[#1A365D]" : "text-[#8B909A]",
                              column.key === "id" && "rotate-180",
                            )}
                          />
                        </div>
                      </button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
                <TableHead className="px-6 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                  ACTION
                </TableHead>
              </tr>
            </thead>
            <TableBody>
              {filteredReservations.length > 0 ? (
                filteredReservations.map((reservation) => (
                  <React.Fragment key={reservation.id}>
                    <TableRow
                      className={cn(
                        expandedRowId && expandedRowId !== reservation.id ? "opacity-50" : "",
                        "transition-opacity duration-200",
                      )}
                    >
                      <TableCell className="font-medium text-[#1A365D] text-center">{reservation.id}</TableCell>
                      <TableCell className="text-[#1A365D] text-center">{reservation.reservationDate}</TableCell>
                      <TableCell className="text-[#1A365D] text-center">{reservation.firstName + ' ' + reservation.lastName}</TableCell>
                      <TableCell className="text-[#1A365D] text-center">{reservation.userId}</TableCell>
                      <TableCell className="text-[#1A365D] text-center">{reservation.carModel}</TableCell>
                      <TableCell className="px-6 py-4 flex justify-center">
                        <div className="relative inline-block">
                        // Update the disabled condition on the status dropdown
<select
  value={reservation.status}
  onChange={(e) => {
    const newStatus = e.target.value as Status;
    
    // Ensure the selected status is valid
    if (!["CONFIRMED", "REPAIRING", "COMPLETED", "CANCELLED"].includes(newStatus)) {
      console.error("Invalid status selected:", newStatus);
      return;
    }
    
    // Ensure reservation ID and user ID are defined
    if (!reservation.id || !reservation.userId) {
      console.error("Missing reservation ID or user ID:", reservation);
      return;
    }
    
    console.log("Attempting to change status for Reservation ID:", reservation.id);
    console.log("User ID:", reservation.userId);
    console.log("New Status:", newStatus);
    
    handleStatusChangeAttempt(reservation.id, reservation.userId, newStatus);
  }}
  className={cn(
    "appearance-none h-8 px-3 py-1 rounded-md pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium",
    (statusStyles[reservation.status]?.bg ?? statusStyles['CONFIRMED'].bg),
    (statusStyles[reservation.status]?.text ?? statusStyles['CONFIRMED'].text)
  )}
  disabled={
    reservation.status === "COMPLETED" || 
    reservation.status === "CANCELLED"
  }
>
                            {Object.keys(statusStyles).map((status) => (
                              <option
                                key={status}
                                value={status}
                                className={cn(
                                  statusStyles[status]?.bg || statusStyles.default.bg,
                                  statusStyles[status]?.text || statusStyles.default.text,
                                  "py-1",
                                )}
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className={cn(
                              "absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none h-4 w-4",
                              (statusStyles[reservation.status]?.text ?? statusStyles['CONFIRMED'].text)
                            )}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedRowId(expandedRowId === reservation.id ? null : reservation.id)}
                          >
                            {expandedRowId === reservation.id ? (
                              <img
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector%20up-NiM43WWAQiX3qnLM68fj74mUJgJUCp.svg"
                                alt="Collapse"
                                width={20}
                                height={20}
                              />
                            ) : (
                              <img
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector-pICkRVClrhBZjNdGniLgpirPIMvT6U.svg"
                                alt="Expand"
                                width={20}
                                height={20}
                              />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRowId === reservation.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-gray-50">
                          <div className="px-4 py-2">
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
                                  <Button
  className="bg-[#2A69AC] hover:bg-[#1A365D] text-white text-sm font-medium px-4 py-2 rounded-md"
  onClick={() => setShowAddServiceDialog(true)}
  disabled={
    reservation.status === "COMPLETED" || 
    reservation.status === "CANCELLED" || 
    reservation.status === "REPAIRING"
  }
>
  Add Service
</Button>
                                  </TableHead>
                                </tr>
                              </thead>
                              <TableBody>
                                {(Array.isArray(reservation.services) ? reservation.services : []).map((service, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                      {service.created}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                      {service.reservationDate}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                      {service.service}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-sm text-[#1A365D] text-center">
                                      {service.mechanic}
                                    </TableCell>
                                    <TableCell className="px-6 py-4 flex justify-center">
                                      <div className="inline-flex items-center justify-center gap-2">
                                      <Button
  variant="ghost"
  size="icon"
  onClick={() => {
    setSelectedService({
      reservationId: reservation.id,
      serviceIndex: index,
    });
    setSelectedMechanic(service.mechanic);
    setShowMechanicDialog(true);
  }}
  disabled={
    reservation.status === "COMPLETED" || 
    reservation.status === "CANCELLED" || 
    reservation.status === "REPAIRING"
  }
>
  <User className={cn(
    "h-4 w-4", 
    (reservation.status === "COMPLETED" || 
     reservation.status === "CANCELLED" || 
     reservation.status === "REPAIRING") 
    ? "text-gray-400" : "text-[#1A365D]"
  )} />
</Button>
<Button
  variant="ghost"
  size="icon"
  onClick={() => {
    setSelectedService({
      reservationId: reservation.id,
      serviceIndex: index,
    });
    setShowDeleteDialog(true);
  }}
  disabled={
    reservation.status === "COMPLETED" || 
    reservation.status === "CANCELLED" || 
    reservation.status === "REPAIRING"
  }
>
  <Trash2 className={cn(
    "h-4 w-4", 
    (reservation.status === "COMPLETED" || 
     reservation.status === "CANCELLED" || 
     reservation.status === "REPAIRING") 
    ? "text-gray-400" : "text-[#1A365D]"
  )} />
</Button>
                                      </div>
                                    </TableCell>
                                    <TableCell></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[#8B909A]">
                    No reservations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center gap-2 p-4">
            <span className="text-[#8B909A] cursor-not-allowed px-3 py-1 rounded-md text-sm">Previous</span>
            <span className="bg-[#1A365D] text-white px-3 py-1 rounded-md text-sm">1</span>
            <span className="text-[#1A365D] hover:text-[#2a69ac] cursor-pointer px-3 py-1 rounded-md text-sm">
              Next
            </span>
          </div>
        </div>
      </main>

      <Dialog open={showMechanicDialog} onOpenChange={setShowMechanicDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Which mechanic to do this service?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <RadioGroup value={selectedMechanic} onValueChange={setSelectedMechanic} className="contents">
                {mechanics.map((mechanic) => (
                  <div key={mechanic} className="flex items-center space-x-2">
                    <RadioGroupItem value={mechanic} id={mechanic} />
                    <label htmlFor={mechanic} className="text-sm">
                      {mechanic}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="bg-[#FFE5E5] hover:bg-[#EA5455]/30 text-[#EA5455] hover:text-[#EA5455]"
              onClick={() => setShowMechanicDialog(false)}
            >
              Back
            </Button>
            <Button
              className="bg-[#E6FFF3] hover:bg-[#28C76F]/30 text-[#28C76F] hover:text-[#28C76F]"
              onClick={handleMechanicChange}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Are you sure to delete this service?</DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="bg-[#FFE5E5] hover:bg-[#EA5455]/30 text-[#EA5455] hover:text-[#EA5455]"
              onClick={() => setShowDeleteDialog(false)}
            >
              No, go back
            </Button>
            <Button
              className="bg-[#E6FFF3] hover:bg-[#28C76F]/30 text-[#28C76F] hover:text-[#28C76F]"
              onClick={handleDeleteService}
            >
              Yes, delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Are you sure?</DialogTitle>
            <p className="text-center" id="confirmation-dialog-description">
        This action cannot be undone.
      </p>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="bg-[#FFE5E5] hover:bg-[#EA5455]/30 text-[#EA5455] hover:text-[#EA5455]"
              onClick={() => setShowConfirmationDialog(false)}
            >
              No, go back
            </Button>
            <Button
              className="bg-[#E6FFF3] hover:bg-[#28C76F]/30 text-[#28C76F] hover:text-[#28C76F]"
              onClick={handleConfirmation}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
{/* Status Confirmation Dialog */}
<AlertDialog open={showStatusConfirmDialog} onOpenChange={setShowStatusConfirmDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        Changing to this status will restrict modifications to this reservation.
        {pendingStatusChange?.newStatus === "REPAIRING" && (
          " You'll only be able to change this to COMPLETED later."
        )}
        {(pendingStatusChange?.newStatus === "COMPLETED" || 
          pendingStatusChange?.newStatus === "CANCELLED") && (
          " This status change cannot be reversed."
        )}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>No</AlertDialogCancel>
      <AlertDialogAction onClick={confirmStatusChange}>Yes</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

      <AddServiceDialog
        open={showAddServiceDialog}
        onOpenChange={setShowAddServiceDialog}
        onConfirm={handleAddServices}
      />
    </div>
  );
}
