"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import { Search, ChevronDown, Trash2, User, ChevronUp } from "lucide-react";
import { DashboardHeader } from "@/components/admin-components/header";
import { Button } from "@/components/admin-components/button";
import { Input } from "@/components/admin-components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/admin-components/table";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin-components/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/admin-components/radio-group";
import { Checkbox } from "@/components/admin-components/checkbox";
import { AddServiceDialog } from "./add-service-dialog";
import { ReservationsTabs } from "./reservations-tabs";
import { Sidebar } from "@/components/admin-components/sidebar";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin-components/select";
import Loading from "@/components/admin-components/loading";
import { PasswordVerificationDialog } from "@/components/admin-components/password-verification-dialog";
import { Badge } from "@/components/admin-components/badge";
import { useResponsiveRows } from "@/hooks/use-responsive-rows";
import { formatDateTime } from "@/lib/date-utils";
import { getActiveEmployees, type Employee } from "@/lib/employee-utils";
import { createClient } from '@supabase/supabase-js';

type Status = "PENDING" | "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED"
type MechanicStatus = "PENDING" | "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED"

// Add type guard function
function isValidStatus(status: string): status is Status {
  return ["PENDING", "CONFIRMED", "REPAIRING", "COMPLETED", "CANCELLED"].includes(status as Status)
}

function isValidMechanicStatus(status: string): status is MechanicStatus {
  return ["PENDING", "REPAIRING", "COMPLETED", "CANCELLED"].includes(status as MechanicStatus)
}

interface Service {
  created: string
  reservationDate: string
  service: string
  mechanic: string
  status: MechanicStatus // Updated to use MechanicStatus type
}

interface UploadedFile {
  fileUrl: string;
  fileName: string;
}

interface Reservation {
  uploadedFiles: UploadedFile[];
  id: string;
  lastName: string;
  firstName: string;
  reservationDate: string;
  customerName: string;
  userId: string;
  carModel: string;
  plateNo?: string;
  status: Status;
  services?: Service[];
  specificIssues?: string;
  yearModel?: string;
  transmission?: string;
  fuelType?: string;
  odometer?: string;
  generalServices?: string[];
}

interface SelectedService {
  reservationId: string;
  serviceIndex: number;
}

interface CarDetails {
  carModel: string;
  yearModel: string;
  transmission: string;
  fuelType: string;
  odometer: string;
  specificIssues: string;
  generalServices: string[];
  reservationDate: string;
  customerName: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);


const statusStyles: Record<
  Status | MechanicStatus,
  {
    bg: string;
    text: string;
    display: string;
    hoverBg: string;
    hoverText: string;
    disabled?: boolean;
    borderColor: string;
  }
> = {
  PENDING: {
    bg: "bg-[#FFF5E0]",
    text: "text-[#FF9F43]",
    display: "Pending",
    hoverBg: "hover:bg-[#FEEBC8]",
    hoverText: "hover:text-[#E67E22]",
    borderColor: "border-[#FF9F43]",
  },
  CONFIRMED: {
    bg: "bg-[#EBF8FF]",
    text: "text-[#63B3ED]",
    display: "Confirmed",
    hoverBg: "hover:bg-[#BEE3F8]",
    hoverText: "hover:text-[#2B6CB0]",
    borderColor: "border-[#63B3ED]",
  },
  REPAIRING: {
    bg: "bg-[#FFF5E0]",
    text: "text-[#FFC600]",
    display: "Repairing",
    hoverBg: "hover:bg-[#FEEBC8]",
    hoverText: "hover:text-[#D97706]",
    borderColor: "border-[#FFC600]",
  },
  COMPLETED: {
    bg: "bg-[#E6FFF3]",
    text: "text-[#28C76F]",
    display: "Completed",
    hoverBg: "hover:bg-[#C6F6D5]",
    hoverText: "hover:text-[#22A366]",
    disabled: true,
    borderColor: "border-[#28C76F]",
  },
  CANCELLED: {
    bg: "bg-[#FFE5E5]",
    text: "text-[#EA5455]",
    display: "Cancelled",
    hoverBg: "hover:bg-[#FED7D7]",
    hoverText: "hover:text-[#C53030]",
    disabled: true,
    borderColor: "border-[#EA5455]",
  },
};

// Valid status transitions
// BACKEND DEV: Update these status transitions according to your business rules
const validStatusTransitions: Record<Status, Status[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["REPAIRING", "CANCELLED"], // Can only move forward to REPAIRING or be CANCELLED
  REPAIRING: ["COMPLETED", "CANCELLED"], // Can only move forward to COMPLETED or be CANCELLED
  COMPLETED: [], // Terminal state - cannot be changed
  CANCELLED: [], // Terminal state - cannot be changed
}

// Valid mechanic status transitions based on reservation status
const validMechanicStatusTransitions: Record<Status, Record<MechanicStatus, MechanicStatus[]>> = {
  PENDING: {
    PENDING: [],
    REPAIRING: [],
    COMPLETED: [],
    CANCELLED: [],
    CONFIRMED: []
  },
  CONFIRMED: {
    PENDING: [],
    REPAIRING: [],
    COMPLETED: [],
    CANCELLED: [],
    CONFIRMED: []
  },
  REPAIRING: {
    PENDING: ["REPAIRING"],
    REPAIRING: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
    CONFIRMED: []
  },
  COMPLETED: {
    PENDING: [],
    REPAIRING: [],
    COMPLETED: [],
    CANCELLED: [],
    CONFIRMED: []
  },
  CANCELLED: {
    PENDING: [],
    REPAIRING: [],
    COMPLETED: [],
    CANCELLED: [],
    CONFIRMED: []
  }
}

export default function ReservationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reservationData, setReservationData] = useState<Reservation[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [showMechanicDialog, setShowMechanicDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeletePasswordDialog, setShowDeletePasswordDialog] =
    useState(false);
  const [showMechanicPasswordDialog, setShowMechanicPasswordDialog] =
    useState(false);
  const [selectedService, setSelectedService] =
    useState<SelectedService | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState("");
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortField, setSortField] = useState<
    keyof Omit<Reservation, "services" | "status"> | null
  >("reservationDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");       // what the admin types
  const [adminPin, setAdminPin] = useState("");           // loaded from Firestore
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    reservationId: string | "bulk";
    userId: string;
    newStatus: Status;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<Status | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = useResponsiveRows(200); // Adjust header height for tabs, search bar, and bulk actions
  // Add a new state for success message near the other state declarations
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(
    null
  );
  // Add a new state for the mechanic password verification dialog
  // Add this state variable after the other state declarations:
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);

  // Add a new state for the car details dialog
  const [showCarDetailsDialog, setShowCarDetailsDialog] = useState(false)
  const [selectedCarDetails, setSelectedCarDetails] = useState<CarDetails | null>(null)

  // Add new states for mechanic status
  const [showMechanicStatusDialog, setShowMechanicStatusDialog] = useState(false)
  const [showMechanicStatusPasswordDialog, setShowMechanicStatusPasswordDialog] = useState(false)
  const [pendingMechanicStatusChange, setPendingMechanicStatusChange] = useState<{
    reservationId: string
    serviceIndex: number
    newStatus: MechanicStatus
  } | null>(null)
  const [showCompleteReservationDialog, setShowCompleteReservationDialog] = useState(false)
  const [pendingReservationToComplete, setPendingReservationToComplete] = useState<string | null>(null)

  // Define columns for the table
  const columns = [
    { key: "select", label: "", sortable: false },
    { key: "id", label: "RESERVATION ID" },
    { key: "reservationDate", label: "RESERVATION DATE" },
    { key: "customerName", label: "CUSTOMER NAME" },
    { key: "userId", label: "CUSTOMER ID" },
    { key: "carModel", label: "CAR MODEL" },
    { key: "plateNo", label: "PLATE NO." }, // Added plateNo field
    { key: "status", label: "STATUS", sortable: false },
  ];

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    import("firebase/auth").then(({ getAuth }) => {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const ref = doc(db, "accounts", uid);
      getDoc(ref).then(snap => {
        if (snap.exists() && snap.data().pin) {
          setAdminPin(snap.data().pin as string);
        }
      });
    });
  }, []);

  useEffect(() => {
    // BACKEND DEV: Modify this query to include any additional filters or sorting needed
    const q = query(
      collection(db, "bookings"),
      orderBy("reservationDate", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const bookingData = doc.data();
          // Normalize the status to uppercase to ensure consistent comparison
          const status = bookingData.status ? (bookingData.status.toUpperCase() as Status) : "CONFIRMED"

          // Ensure services have the proper status field
          const services = Array.isArray(bookingData.services) 
            ? bookingData.services.map(service => ({
                ...service,
                status: (service.status && isValidMechanicStatus(service.status.toUpperCase())) 
                  ? service.status.toUpperCase() 
                  : "PENDING"
              }))
            : []

          return {
            id: doc.id,
            lastName: bookingData.lastName || "",
            firstName: bookingData.firstName || "",
            reservationDate: bookingData.reservationDate || "",
            customerName: bookingData.customerName || "",
            userId: bookingData.userId || "",
            carModel: bookingData.carModel || "",
            plateNo: bookingData.plateNo || "", // Added plateNo field
            status: status,
            services: services,
            specificIssues: bookingData.specificIssues || "",
            yearModel: bookingData.yearModel || "",
            transmission: bookingData.transmission || "",
            fuelType: bookingData.fuelType || "",
            odometer: bookingData.odometer || "",
            generalServices: Array.isArray(bookingData.generalServices)
              ? bookingData.generalServices
              : [],
            uploadedFiles: []
          } satisfies Reservation;
        });

        // Sort by reservation date (newest first)
        const sortedData = [...data].sort((a, b) => {
          return (
            new Date(b.reservationDate).getTime() -
            new Date(a.reservationDate).getTime()
          );
        });

        setReservationData(sortedData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching reservations:", error.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Add this useEffect to fetch active employees when the component mounts
  // Add this after the other useEffect hooks:
  useEffect(() => {
    const fetchActiveEmployees = async () => {
      try {
        const employees = await getActiveEmployees();
        setActiveEmployees(employees);
      } catch (error) {
        console.error("Error fetching active employees:", error);
        toast({
          title: "Error",
          description: "Failed to fetch active employees",
          variant: "destructive",
        });
      }
    };

    fetchActiveEmployees()
  }, [])

  // Add this function if it doesn't exist, or modify an existing one around line 600-700
const formatDateOnly = (dateStr: string) => {
  try {
    if (!dateStr) return "N/A";
    
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


  useEffect(() => {
    // Sync mechanic statuses with reservation status
    const updatedReservationData = reservationData.map(reservation => {
      // Skip if there are no services
      if (!reservation.services || reservation.services.length === 0) return reservation;
  
      // Define how services status should be updated based on reservation status
      let updatedServices = [...reservation.services];
      
      // Handle terminal states first - they override everything
      if (reservation.status === "CANCELLED") {
        // If reservation is CANCELLED, ALL services must be CANCELLED regardless of current status
        updatedServices = updatedServices.map(service => {
          return { ...service, status: "CANCELLED" as MechanicStatus };
        });
      } else if (reservation.status === "COMPLETED") {
        // If reservation is COMPLETED, ALL services must be COMPLETED regardless of current status
        updatedServices = updatedServices.map(service => {
          return { ...service, status: "COMPLETED" as MechanicStatus };
        });
      } else if (reservation.status === "CONFIRMED") {
        // When CONFIRMED, set all services to CONFIRMED
        updatedServices = updatedServices.map(service => {
          return { ...service, status: "CONFIRMED" as MechanicStatus };
        });
      } else if (reservation.status === "REPAIRING") {
        // When REPAIRING, update PENDING/CONFIRMED services to REPAIRING
        // but preserve COMPLETED/CANCELLED services
        updatedServices = updatedServices.map(service => {
          if (service.status === "PENDING" || service.status === "CONFIRMED") {
            return { ...service, status: "REPAIRING" as MechanicStatus };
          }
          return service;
        });
      }
      
      // Check if all services are COMPLETED and reservation is REPAIRING
      if (reservation.status === "REPAIRING" && 
          updatedServices.length > 0 && 
          updatedServices.every(service => 
            service.status === "COMPLETED" || service.status === "CANCELLED") &&
          updatedServices.some(service => service.status === "COMPLETED")) {
        
        // Set pending reservation to complete
        if (pendingReservationToComplete !== reservation.id) {
          setPendingReservationToComplete(reservation.id);
          setShowCompleteReservationDialog(true);
        }
      }
  
      return {
        ...reservation,
        services: updatedServices
      };
    });
  
    // Only update if there are actual changes
    if (JSON.stringify(updatedReservationData) !== JSON.stringify(reservationData)) {
      setReservationData(updatedReservationData);
    }
  }, [reservationData, pendingReservationToComplete]);

  const handleStatusChangeAttempt = (
    reservationId: string,
    userId: string,
    newStatus: Status
  ) => {
    const reservation = reservationData.find((res) => res.id === reservationId);

    if (!reservation) return;

    // Check if the status transition is valid
    if (!validStatusTransitions[reservation.status].includes(newStatus)) {
      // Provide more specific error message based on the attempted transition
      let errorMessage = `Cannot change status from ${
        statusStyles[reservation.status].display
      } to ${statusStyles[newStatus].display}.`;

      if (
        reservation.status === "COMPLETED" ||
        reservation.status === "CANCELLED"
      ) {
        errorMessage = `${
          statusStyles[reservation.status].display
        } reservations cannot be modified.`;
      } else if (
        (newStatus as Status) === "PENDING" &&
        (["CONFIRMED", "REPAIRING", "COMPLETED"] as Status[]).includes(
          reservation.status
        )
      ) {
        errorMessage = `Cannot revert from ${
          statusStyles[reservation.status].display
        } back to Pending.`;
      } else if (
        newStatus === "CONFIRMED" &&
        (["REPAIRING", "COMPLETED"] as Status[]).includes(reservation.status)
      ) {
        errorMessage = `Cannot revert from ${
          statusStyles[reservation.status].display
        } back to Confirmed.`;
      } else if (
        newStatus === "REPAIRING" &&
        (reservation.status as Status) === "COMPLETED"
      ) {
        errorMessage = `Cannot revert from Completed back to Repairing.`;
      }

      toast({
        title: "Invalid Status Change",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Always show confirmation dialog first
    setPendingStatusChange({ reservationId, userId, newStatus });
    setShowStatusConfirmDialog(true);
  };

  const handleBulkStatusChangeAttempt = () => {
    if (bulkStatus && selectedRows.length > 0) {
      // Check if all selected rows already have the chosen status
      const allRowsHaveStatus = selectedRows.every(
        (rowId) =>
          reservationData.find((r) => r.id === rowId)?.status === bulkStatus
      );

      if (allRowsHaveStatus) {
        toast({
          title: "Status Already Applied",
          description: `All selected reservations already have the status "${statusStyles[bulkStatus].display}".`,
          variant: "default",
        });
        return;
      }

      // Check if all selected rows can transition to the new status
      const invalidTransitions = selectedRows.filter((rowId) => {
        const reservation = reservationData.find((r) => r.id === rowId);
        if (!reservation) return false;
        return !validStatusTransitions[reservation.status].includes(bulkStatus);
      });

      if (invalidTransitions.length > 0) {
        // Get the first invalid reservation to provide a more specific error example
        const exampleReservation = reservationData.find((r) =>
          invalidTransitions.includes(r.id)
        );

        let errorMessage = `${invalidTransitions.length} reservation(s) cannot be changed to ${statusStyles[bulkStatus].display}.`;

        if (exampleReservation) {
          errorMessage += ` For example, you cannot change from ${
            statusStyles[exampleReservation.status].display
          } to ${statusStyles[bulkStatus].display}.`;
        }

        toast({
          title: "Invalid Status Changes",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Always show confirmation dialog first
      setPendingStatusChange({
        reservationId: "bulk",
        userId: "",
        newStatus: bulkStatus,
      });
      setShowStatusConfirmDialog(true);
    }
  };

  const getAuthUidFromFirestore = async (userId: string): Promise<string> => {
    try {
      // First check if we already have this user's authUid in memory (could add caching here)
      const userDocRef = doc(db, "accounts", userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.authUid) {
          console.log(`Found authUid for user ${userId}: ${userData.authUid}`);
          return userData.authUid;
        }
      }
      
      // If we couldn't find authUid, return the original userId
      return userId;
    } catch (error) {
      console.error(`Error getting authUid for user ${userId}:`, error);
      return userId; // Fall back to the original userId
    }
  };
  
  const sendNotification = async (status: string, userCar: string, userId: string) => {
    try {
      console.log("Preparing to send status update notification:", {
        status: status,
        userCar: userCar,
        userId: userId
      });
      
      // Get the user's authUid if possible
      const authUid = await getAuthUidFromFirestore(userId);
      
      console.log(`Sending notification to user with authUid: ${authUid}`);
      
      const res = await fetch("/api/admin-approve-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: `${userCar} is ${status}`,
          userId: authUid // Use the authUid we found (or the original userId as fallback)
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Notification API Error:", errorData);
        throw new Error(`Notification failed: ${errorData.error || 'Unknown error'}`);
      }
      
      console.log("Status notification sent successfully to user:", authUid);
      return true;
    } catch (error) {
      console.error("Failed to send notification:", error);
      return false;
    }
  };
  
  const handleStatusChange = async (reservationId: string, userId: string, newStatus: Status) => {
    try {
      const normalizedStatus = newStatus.toUpperCase() as Status;
    
      if (!reservationId || !userId || !normalizedStatus) {
        throw new Error("Missing required data for status update");
      }
    
      // Get the reservation to update service statuses as needed
      const reservation = reservationData.find(res => res.id === reservationId);
      
      if (!reservation) {
        throw new Error("Reservation not found");
      }
      
      // Update service statuses based on reservation status
      let updatedServices = reservation.services || [];
      
      if (normalizedStatus === "REPAIRING") {
        // When changing to REPAIRING, update all PENDING mechanic statuses to REPAIRING
        updatedServices = updatedServices.map(service => {
          if (service.status === "PENDING") {
            return { ...service, status: "REPAIRING" as MechanicStatus };
          }
          return service;
        });
      } else if (normalizedStatus === "CANCELLED") {
        // When changing to CANCELLED, set ALL service statuses to CANCELLED
        updatedServices = updatedServices.map(service => {
          return { ...service, status: "CANCELLED" as MechanicStatus };
        });
      } else if (normalizedStatus === "COMPLETED") {
        // When changing to COMPLETED, set all service statuses to COMPLETED
        updatedServices = updatedServices.map(service => {
          return { ...service, status: "COMPLETED" as MechanicStatus };
        });
      }
    
      // References to both locations in Firestore
      const globalDocRef = doc(db, "bookings", reservationId);
      const userDocRef = doc(db, "users", userId, "bookings", reservationId);
    
      // Use setDoc with merge option
      await Promise.all([
        setDoc(globalDocRef, { 
          status: normalizedStatus,
          services: updatedServices
        }, { merge: true }),
        setDoc(userDocRef, { 
          status: normalizedStatus,
          services: updatedServices
        }, { merge: true }),
      ]);
    
      // Update state to reflect changes immediately
      setReservationData((prevData) =>
        prevData.map((reservation) =>
          reservation.id === reservationId ? 
          { 
            ...reservation, 
            status: normalizedStatus,
            services: updatedServices
          } : reservation,
        ),
      );
    
      // Get car model and status message for notification
      const userCar = reservation.carModel || "Vehicle";
      const statusMessage = statusStyles[normalizedStatus].display;
      
      // Send notification to customer with their correct authUid
      const notificationSent = await sendNotification(statusMessage, userCar, userId);
    
      // Show success message
      setShowSuccessMessage(`Status changed to ${statusStyles[normalizedStatus].display}`);
      setTimeout(() => setShowSuccessMessage(null), 3000);
    
      toast({
        title: "Status Updated",
        description: `Reservation status has been changed to ${statusMessage}.${
          notificationSent ? "" : " (Customer notification failed)"
        }`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating status:", error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Error",
        description: "Failed to update reservation status.",
        variant: "destructive",
      });
    }
  };
  
  // Also update the bulk status change function to use the right user ID
  const handleBulkStatusChange = async (newStatus: Status) => {
    try {
      // Create an array of promises for all updates
      const updatePromises = selectedRows.map((reservationId) => {
        const reservation = reservationData.find((r) => r.id === reservationId);
        if (!reservation || !reservation.userId) return Promise.resolve();
    
        // Skip if the transition is not valid
        if (!validStatusTransitions[reservation.status].includes(newStatus)) {
          return Promise.resolve();
        }
    
        // Update service statuses based on reservation status
        let updatedServices = reservation.services || [];
        
        if (newStatus === "REPAIRING") {
          updatedServices = updatedServices.map(service => {
            if (service.status === "PENDING") {
              return { ...service, status: "REPAIRING" as MechanicStatus };
            }
            return service;
          });
        } else if (newStatus === "CANCELLED") {
          // When cancelling, ALL services should be cancelled regardless of mechanic assignment
          updatedServices = updatedServices.map(service => {
            return { ...service, status: "CANCELLED" as MechanicStatus };
          });
        } else if (newStatus === "COMPLETED") {
          // When completing, all services should be marked as completed
          updatedServices = updatedServices.map(service => {
            return { ...service, status: "COMPLETED" as MechanicStatus };
          });
        }
    
        const globalDocRef = doc(db, "bookings", reservationId);
        const userDocRef = doc(db, "users", reservation.userId, "bookings", reservationId);
    
        return Promise.all([
          setDoc(globalDocRef, { 
            status: newStatus,
            services: updatedServices
          }, { merge: true }),
          setDoc(userDocRef, { 
            status: newStatus,
            services: updatedServices 
          }, { merge: true }),
        ]);
      });
    
      // Execute all updates
      await Promise.all(updatePromises);
    
      // Send notifications for all updated reservations with specific user IDs
      const notificationPromises = selectedRows.map(async (reservationId) => {
        const reservation = reservationData.find((r) => r.id === reservationId);
        if (!reservation || !reservation.userId || !validStatusTransitions[reservation.status].includes(newStatus)) {
          return Promise.resolve(false);
        }
        
        const userCar = reservation.carModel || "Vehicle";
        const statusMessage = statusStyles[newStatus].display;
        
        // Send notification to the specific user with their authUid
        return sendNotification(statusMessage, userCar, reservation.userId);
      });
      
      await Promise.all(notificationPromises);
    
      // Update local state
      setReservationData((prevData) =>
        prevData.map((reservation) => {
          if (selectedRows.includes(reservation.id) && validStatusTransitions[reservation.status].includes(newStatus)) {
            // Update service statuses based on new reservation status
            let updatedServices = reservation.services || [];
            
            if (newStatus === "REPAIRING") {
              updatedServices = updatedServices.map(service => {
                if (service.status === "PENDING") {
                  return { ...service, status: "REPAIRING" as MechanicStatus };
                }
                return service;
              });
            } else if (newStatus === "CANCELLED") {
              // When cancelling, ALL services should be cancelled
              updatedServices = updatedServices.map(service => {
                return { ...service, status: "CANCELLED" as MechanicStatus };
              });
            } else if (newStatus === "COMPLETED") {
              // When completing, all services should be marked as completed
              updatedServices = updatedServices.map(service => {
                return { ...service, status: "COMPLETED" as MechanicStatus };
              });
            }
            
            return { 
              ...reservation, 
              status: newStatus,
              services: updatedServices
            };
          }
          return reservation;
        }),
      );
    
      // Show success message
      setShowSuccessMessage(`Status changed for ${selectedRows.length} reservation(s)`);
      setTimeout(() => setShowSuccessMessage(null), 3000);
    
      toast({
        title: "Status Updated",
        description: `${selectedRows.length} reservation(s) updated to ${statusStyles[newStatus].display}.`,
        variant: "default",
      });
    
      // Clear selection
      setSelectedRows([]);
      setBulkStatus("");
    } catch (error) {
      console.error("Error updating multiple statuses:", error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Error",
        description: "Failed to update reservation statuses.",
        variant: "destructive",
      });
    }
  };


  // Add handler for mechanic status change
  const handleMechanicStatusVerified = () => {
    if (pendingMechanicStatusChange) {
      handleMechanicStatusChange(
        pendingMechanicStatusChange.reservationId,
        pendingMechanicStatusChange.serviceIndex,
        pendingMechanicStatusChange.newStatus
      )
    }
    setShowMechanicStatusPasswordDialog(false)
    setPendingMechanicStatusChange(null)
  }
  
  // Helper function to check if all services in a reservation are completed or cancelled
  const areAllServicesCompletedOrCancelled = (reservation: Reservation): boolean => {
    if (!reservation.services || reservation.services.length === 0) return false
    
    return reservation.services.every(service => 
      service.status === "COMPLETED" || service.status === "CANCELLED"
    ) && reservation.services.some(service => service.status === "COMPLETED")
  }
  
  // Add handler for mechanic status change
  const handleMechanicStatusChangeAttempt = (reservationId: string, serviceIndex: number, newStatus: MechanicStatus) => {
    const reservation = reservationData.find((res) => res.id === reservationId)
  
    if (!reservation) return
  
    // Check if the mechanic status transition is valid based on reservation status
    if (!validMechanicStatusTransitions[reservation.status][reservation.services?.[serviceIndex]?.status || "PENDING"].includes(newStatus)) {
      // Provide specific error message
      let errorMessage = `Cannot change mechanic status to ${statusStyles[newStatus].display} when reservation is ${statusStyles[reservation.status].display}.`
  
      if (reservation.status === "COMPLETED" || reservation.status === "CANCELLED") {
        errorMessage = `Cannot modify services for ${statusStyles[reservation.status].display} reservations.`
      }
  
      toast({
        title: "Invalid Status Change",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }
  
    // Show confirmation dialog
    setPendingMechanicStatusChange({ reservationId, serviceIndex, newStatus })
    setShowMechanicStatusDialog(true)
  }
  
  const handleMechanicStatusChange = async (reservationId: string, serviceIndex: number, newStatus: MechanicStatus) => {
    try {
      const reservation = reservationData.find(res => res.id === reservationId)
      
      if (!reservation || !reservation.userId || !reservation.services) {
        throw new Error("Reservation or service not found")
      }
      
      const updatedServices = [...reservation.services]
      updatedServices[serviceIndex] = {
        ...updatedServices[serviceIndex],
        status: newStatus
      }
      
      // References to both locations in Firestore
      const globalDocRef = doc(db, "bookings", reservationId)
      const userDocRef = doc(db, "users", reservation.userId, "bookings", reservationId)
  
      // Use setDoc with merge option
      await Promise.all([
        setDoc(globalDocRef, { services: updatedServices }, { merge: true }),
        setDoc(userDocRef, { services: updatedServices }, { merge: true }),
      ])
  
      // Update local state
      setReservationData(prevData =>
        prevData.map(res =>
          res.id === reservationId ? { ...res, services: updatedServices } : res
        )
      )
  
      // Check if all services are now completed
      const allServicesCompleted = updatedServices.every(
        service => service.status === "COMPLETED" || service.status === "CANCELLED"
      ) && updatedServices.some(service => service.status === "COMPLETED")
  
      // If reservation status is REPAIRING and all services are marked as COMPLETED,
      // prompt to change reservation status to COMPLETED
      if (reservation.status === "REPAIRING" && allServicesCompleted) {
        setPendingReservationToComplete(reservationId)
        setShowCompleteReservationDialog(true)
      }
  
      toast({
        title: "Status Updated",
        description: `Service status has been changed to ${statusStyles[newStatus].display}.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating mechanic status:", error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Error",
        description: "Failed to update service status.",
        variant: "destructive",
      })
    }
  }
  
  const confirmMechanicStatusChange = () => {
    setShowMechanicStatusDialog(false)
    if (pendingMechanicStatusChange) {
      setShowMechanicStatusPasswordDialog(true)
    }
  }
  
  const handleCompleteReservation = async () => {
    if (!pendingReservationToComplete) return
    
    const reservation = reservationData.find(res => res.id === pendingReservationToComplete)
    
    if (!reservation || !reservation.userId) {
      toast({
        title: "Error",
        description: "Reservation not found.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // References to both locations in Firestore
      const globalDocRef = doc(db, "bookings", pendingReservationToComplete)
      const userDocRef = doc(db, "users", reservation.userId, "bookings", pendingReservationToComplete)
  
      // Change reservation status to COMPLETED
      await Promise.all([
        setDoc(globalDocRef, { status: "COMPLETED" }, { merge: true }),
        setDoc(userDocRef, { status: "COMPLETED" }, { merge: true }),
      ])
  
      // Update local state
      setReservationData(prevData =>
        prevData.map(res =>
          res.id === pendingReservationToComplete ? { ...res, status: "COMPLETED" } : res
        )
      )
  
      toast({
        title: "Reservation Completed",
        description: "Reservation has been marked as completed.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error completing reservation:", error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Error",
        description: "Failed to complete reservation.",
        variant: "destructive",
      })
    } finally {
      setShowCompleteReservationDialog(false)
      setPendingReservationToComplete(null)
    }
  };

  const confirmStatusChange = () => {
    setShowStatusConfirmDialog(false);
    if (pendingStatusChange) {
      setShowPinDialog(true);
    }
  };

  const handleStatusVerified = () => {
    if (pendingStatusChange) {
      if (pendingStatusChange.reservationId === "bulk") {
        // Handle bulk update
        handleBulkStatusChange(pendingStatusChange.newStatus);
      } else {
        // Handle single reservation update
        handleStatusChange(
          pendingStatusChange.reservationId,
          pendingStatusChange.userId,
          pendingStatusChange.newStatus
        );
      }
    }
  };

  const handleSort = (
    field: keyof Omit<Reservation, "services" | "status">
  ) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }

    // Force re-sort of the data when sort parameters change
    const sortedData = [...reservationData].sort((a, b) => {
      const modifier = sortOrder === "asc" ? 1 : -1;

      if (field === "id") {
        // Extract numeric part for proper numeric sorting
        const aNum = Number.parseInt(a.id.replace(/\D/g, ""));
        const bNum = Number.parseInt(b.id.replace(/\D/g, ""));
        return (aNum - bNum) * modifier;
      }

      if (field === "reservationDate") {
        // Parse dates for proper date sorting
        return (
          (new Date(a.reservationDate).getTime() -
            new Date(b.reservationDate).getTime()) *
          modifier
        );
      }

      if (field === "customerName") {
        // Special handling for customer name
        const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
        const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
        return aName.localeCompare(bName) * modifier;
      }

      if (field === "plateNo") {
        // Special handling for plate number
        const aPlate = a.plateNo || "";
        const bPlate = b.plateNo || "";
        return aPlate.localeCompare(bPlate) * modifier;
      }

      // Default string comparison
      const aValue = a[field] as string;
      const bValue = b[field] as string;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * modifier;
      }

      return 0;
    });

    // Update the filtered data based on the new sort
    setReservationData(sortedData);
  };

  const handleRowSelect = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const selectableReservations = filteredReservations.filter(
      (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED"
    );

    if (selectedRows.length === selectableReservations.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(selectableReservations.map((r) => r.id));
    }
  };

  const updateMechanicAssignment = async (
    reservationId: string,
    serviceIndex: number,
    mechanicName: string,
    userId: string
  ) => {
    try {
      // Get the reservation to determine appropriate status
      const reservation = reservationData.find(res => res.id === reservationId);
      if (!reservation) {
        throw new Error("Reservation not found");
      }
  
      // Determine the mechanic status based on reservation status
      let newMechanicStatus: MechanicStatus = "PENDING";
      
      if (reservation.status === "CONFIRMED") {
        newMechanicStatus = "CONFIRMED";
      } else if (reservation.status === "REPAIRING") {
        newMechanicStatus = "REPAIRING";
      }
  
      const bookingRef = doc(db, "bookings", reservationId);
      const userBookingRef = doc(db, `users/${userId}/bookings`, reservationId);
  
      // Get the main booking data
      const bookingSnap = await getDoc(bookingRef);
      if (!bookingSnap.exists()) {
        throw new Error("Main booking document not found");
      }
  
      const bookingData = bookingSnap.data();
      const updatedServices = [...(bookingData.services || [])];
      updatedServices[serviceIndex] = {
        ...updatedServices[serviceIndex],
        mechanic: mechanicName,
        status: newMechanicStatus
      };
  
      // Use setDoc with merge option to create or update both documents
      await Promise.all([
        setDoc(bookingRef, { services: updatedServices }, { merge: true }),
        setDoc(userBookingRef, { services: updatedServices }, { merge: true }),
      ]);
  
      console.log("Mechanic assignment updated successfully");
    } catch (error) {
      console.error("Error in updateMechanicAssignment:", error);
      throw error;
    }
  };
  // First, let's update the handleMechanicChange function to check for completed/cancelled status
  // Find the handleMechanicChange function and replace it with:

  const handleMechanicChange = async () => {
    if (selectedService && selectedMechanic) {
      const reservationId = selectedService.reservationId;
      const reservation = reservationData.find((res) => res.id === reservationId);
  
      if (!reservation) {
        console.error("Reservation not found");
        return;
      }
  
      // Check if reservation is completed or cancelled
      if (
        reservation.status === "COMPLETED" ||
        reservation.status === "CANCELLED"
      ) {
        toast({
          title: "Cannot Modify Reservation",
          description: `Cannot modify a ${statusStyles[
            reservation.status
          ].display.toLowerCase()} reservation.`,
          variant: "destructive",
        });
        setShowMechanicDialog(false);
        setSelectedService(null);
        setSelectedMechanic("");
        return;
      }
  
      const userId = reservation.userId;
  
      if (!userId) {
        console.error("User ID not found");
        return;
      }
  
      try {
        // Determine new mechanic status based on reservation status
        let newMechanicStatus: MechanicStatus = "PENDING";
        
        if (reservation.status === "CONFIRMED") {
          newMechanicStatus = "CONFIRMED";
        } else if (reservation.status === "REPAIRING") {
          newMechanicStatus = "REPAIRING";
        }
  
        // First update local state for immediate feedback
        setReservationData((prevData) =>
          prevData.map((res) => {
            if (res.id === reservationId && res.services) {
              const updatedServices = [...res.services];
              updatedServices[selectedService.serviceIndex] = {
                ...updatedServices[selectedService.serviceIndex],
                mechanic: selectedMechanic,
                // Update status based on reservation status when assigning mechanic
                status: newMechanicStatus
              };
              return { ...res, services: updatedServices };
            }
            return res;
          }),
        );
  
        // Then update in Firestore
        // Get the main booking data
        const bookingRef = doc(db, "bookings", reservationId);
        const userBookingRef = doc(db, `users/${userId}/bookings`, reservationId);
  
        // Get the main booking data
        const bookingSnap = await getDoc(bookingRef);
        if (!bookingSnap.exists()) {
          throw new Error("Main booking document not found");
        }
  
        const bookingData = bookingSnap.data();
        const updatedServices = [...(bookingData.services || [])];
        updatedServices[selectedService.serviceIndex] = {
          ...updatedServices[selectedService.serviceIndex],
          mechanic: selectedMechanic,
          status: newMechanicStatus
        };
  
        // Use setDoc with merge option to create or update both documents
        await Promise.all([
          setDoc(bookingRef, { services: updatedServices }, { merge: true }),
          setDoc(userBookingRef, { services: updatedServices }, { merge: true }),
        ]);
  
        toast({
          title: "Mechanic Assigned",
          description: "Mechanic assignment has been updated successfully.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating mechanic assignment:", error);
        toast({
          title: "Error",
          description: "Failed to update mechanic assignment.",
          variant: "destructive",
        });
      } finally {
        setShowMechanicDialog(false);
        setSelectedService(null);
        setSelectedMechanic("");
      }
    }
  };

  // Now update the handleMechanicVerified function with the same check
  const handleMechanicVerified = async () => {
    if (selectedService && selectedMechanic) {
      const reservationId = selectedService.reservationId;
      const reservation = reservationData.find((res) => res.id === reservationId);
  
      if (!reservation) {
        console.error("Reservation not found");
        return;
      }
  
      // Check if reservation is completed or cancelled
      if (
        reservation.status === "COMPLETED" ||
        reservation.status === "CANCELLED"
      ) {
        toast({
          title: "Cannot Modify Reservation",
          description: `Cannot modify a ${statusStyles[
            reservation.status
          ].display.toLowerCase()} reservation.`,
          variant: "destructive",
        });
        return;
      }
  
      const userId = reservation.userId;
  
      if (!userId) {
        console.error("User ID not found");
        return;
      }
  
      try {
        // Determine new mechanic status based on reservation status
        let newMechanicStatus: MechanicStatus = "PENDING";
        
        if (reservation.status === "CONFIRMED") {
          newMechanicStatus = "CONFIRMED";
        } else if (reservation.status === "REPAIRING") {
          newMechanicStatus = "REPAIRING";
        }
  
        // First update local state for immediate feedback
        setReservationData((prevData) =>
          prevData.map((res) => {
            if (res.id === reservationId && res.services) {
              const updatedServices = [...res.services];
              updatedServices[selectedService.serviceIndex] = {
                ...updatedServices[selectedService.serviceIndex],
                mechanic: selectedMechanic,
                // Update status based on reservation status when assigning mechanic
                status: newMechanicStatus
              };
              return { ...res, services: updatedServices };
            }
            return res;
          }),
        );
  
        // Then update in Firestore
        const bookingRef = doc(db, "bookings", reservationId);
        const userBookingRef = doc(db, `users/${userId}/bookings`, reservationId);
  
        // Get the main booking data
        const bookingSnap = await getDoc(bookingRef);
        if (!bookingSnap.exists()) {
          throw new Error("Main booking document not found");
        }
  
        const bookingData = bookingSnap.data();
        const updatedServices = [...(bookingData.services || [])];
        updatedServices[selectedService.serviceIndex] = {
          ...updatedServices[selectedService.serviceIndex],
          mechanic: selectedMechanic,
          status: newMechanicStatus
        };
  
        // Use setDoc with merge option to create or update both documents
        await Promise.all([
          setDoc(bookingRef, { services: updatedServices }, { merge: true }),
          setDoc(userBookingRef, { services: updatedServices }, { merge: true }),
        ]);
  
        toast({
          title: "Mechanic Assigned",
          description: "Mechanic assignment has been updated successfully.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating mechanic assignment:", error);
        toast({
          title: "Error",
          description: "Failed to update mechanic assignment.",
          variant: "destructive",
        });
      } finally {
        setShowMechanicDialog(false);
        setSelectedService(null);
        setSelectedMechanic("");
      }
    }
  };

  // Now update the handleDeleteService function to check for completed/cancelled status
  const handleDeleteService = async () => {
    if (selectedService) {
      const reservation = reservationData.find(
        (res) => res.id === selectedService.reservationId
      );
      if (reservation) {
        // Check if reservation status allows deleting services
        if (
          reservation.status === "COMPLETED" ||
          reservation.status === "CANCELLED"
        ) {
          toast({
            title: "Cannot Delete Service",
            description: `Cannot delete services from a ${statusStyles[
              reservation.status
            ].display.toLowerCase()} reservation.`,
            variant: "destructive",
          });
          setShowDeleteDialog(false);
          setSelectedService(null);
          return;
        }

        const updatedServices = (reservation.services || []).filter(
          (_, index) => index !== selectedService.serviceIndex
        );

        const globalDocRef = doc(db, "bookings", reservation.id);
        const userDocRef = doc(
          db,
          "accounts",
          reservation.userId,
          "bookings",
          reservation.id
        );

        try {
          await Promise.all([
            setDoc(
              globalDocRef,
              { services: updatedServices },
              { merge: true }
            ),
            setDoc(userDocRef, { services: updatedServices }, { merge: true }),
          ]);

          setReservationData((prevData) =>
            prevData.map((res) =>
              res.id === reservation.id
                ? {
                    ...res,
                    services: updatedServices.map((service) => ({
                      ...service,
                      status: service.status as "PENDING" | "COMPLETED",
                    })),
                  }
                : res
            )
          );

          toast({
            title: "Service Deleted",
            description: "The service has been removed from the reservation.",
            variant: "default",
          });

          setShowDeleteDialog(false);
          setSelectedService(null);
        } catch (error) {
          console.error("Error deleting service:", error);
          toast({
            title: "Error",
            description: "Failed to delete the service.",
            variant: "destructive",
          });
        }
      }
    }
  };

 // Update the handleAddServices function to ensure proper initial status
const handleAddServices = async (selectedServices: any[]) => {
  if (expandedRowId) {
    const reservation = reservationData.find((res) => res.id === expandedRowId);
    if (reservation) {
      // Check if reservation status allows adding services
      if (reservation.status === "COMPLETED" || reservation.status === "CANCELLED") {
        toast({
          title: "Cannot Add Services",
          description: `Cannot add services to a ${statusStyles[reservation.status].display.toLowerCase()} reservation.`,
          variant: "destructive",
        });
        return;
      }

      const now = new Date();
      const formattedNow = now
        .toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", "")
        .toLowerCase()
        .replace(/\//g, "-");

      // Initial status is always PENDING for unassigned mechanics
      const initialMechanicStatus: MechanicStatus = "PENDING";

      const newServices = selectedServices.map((service) => ({
        created: formattedNow,
        reservationDate: reservation.reservationDate.toLowerCase(),
        service: service,
        mechanic: "TO BE ASSIGNED",
        status: initialMechanicStatus,
      }));

      const updatedServices = [...(reservation.services || []), ...newServices];

      const globalDocRef = doc(db, "bookings", reservation.id);
      const userDocRef = doc(db, "users", reservation.userId, "bookings", reservation.id);

      try {
        await Promise.all([
          setDoc(globalDocRef, { services: updatedServices }, { merge: true }),
          setDoc(userDocRef, { services: updatedServices }, { merge: true }),
        ]);

        setReservationData((prevData) =>
          prevData.map((res) =>
            res.id === reservation.id
              ? {
                  ...res,
                  services: updatedServices,
                }
              : res,
          ),
        );

        toast({
          title: "Services Added",
          description: "New services have been added to the reservation.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error adding services:", error);
        toast({
          title: "Error",
          description: "Failed to add services to the reservation.",
          variant: "destructive",
        });
      }
    }
  }
};

  const filteredReservations = reservationData.filter((reservation) => {
    // For status filtering, compare lowercase status with activeTab
    const matchesStatus =
      activeTab === "all" ||
      reservation.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = Object.values(reservation)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectableReservations = filteredReservations.filter(
    (r) => r.status !== "COMPLETED" && r.status !== "CANCELLED"
  );

  // Function to show car details dialog
  const showCarDetails = async (reservation: Reservation) => {
    setSelectedCarDetails({
      carModel: reservation.carModel || "",
      yearModel: reservation.yearModel || "",
      transmission: reservation.transmission || "",
      fuelType: reservation.fuelType || "",
      odometer: reservation.odometer || "",
      specificIssues: reservation.specificIssues || "",
      generalServices: reservation.generalServices || [],
      reservationDate: reservation.reservationDate || "",
      customerName: `${reservation.firstName} ${reservation.lastName}`.trim() || reservation.customerName || "",
        });
      
         // ————— NEW: list whatever’s in the `car-images/` folder —————
         try {
            const { data: files, error: listError } = 
             await supabase
                .storage
                .from("car-uploads")
                .list("car-images");
      
            if (listError) {
              console.error("Error listing car-images:", listError);
            } else if (files && files.length > 0) {
              // pick the first file, turn it into a public URL
              const publicUrlResult = supabase
                .storage
                .from("car-uploads")
                .getPublicUrl(`car-images/${files[0].name}`);
      
              setSelectedCarDetails(prev => ({
                ...prev!,
                imageUrl: publicUrlResult.data.publicUrl,
              }));
            }
          } catch (err) {
            console.error("Unexpected error fetching car image:", err);
          }
  
    setShowCarDetailsDialog(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#EBF8FF]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <Loading />
        </main>
      </div>
    );
  }

  // Add the success message component right after the <Sidebar /> component
  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      {showSuccessMessage && (
        <div
          className={`fixed inset-x-0 top-0 z-50 p-4 text-center ${
            showSuccessMessage ? "opacity-100" : "opacity-0"
          } ${
            showSuccessMessage
              ? "bg-[#E6FFF3] text-[#28C76F]"
              : "bg-[#FFE6E6] text-[#EA5455]"
          }`}
          style={{
            transform: "translateY(0)",
            animation: showSuccessMessage
              ? "slideInFromTop 0.3s ease-out forwards"
              : "none",
            minWidth: "200px",
            textAlign: "center",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          {showSuccessMessage}
        </div>
      )}
      <main className="ml-64 flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-4">
          <DashboardHeader title="Reservation Management" />
        </div>

        <div className="mb-4">
          <ReservationsTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              // Reset to first page when changing tabs
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="relative w-full sm:w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={bulkStatus}
                onValueChange={(value) => setBulkStatus(value as Status)}
              >
                <SelectTrigger className="w-full sm:w-[160px] bg-white border-0 text-sm text-center whitespace-nowrap focus:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#2A69AC]">
                  <SelectValue
                    placeholder="Change status"
                    className="text-center mx-auto"
                  />
                </SelectTrigger>
                <SelectContent>
                  {/* Only show statuses that are valid for at least one selected reservation */}
                  {selectedRows.some((rowId) => {
                    const reservation = reservationData.find(
                      (r) => r.id === rowId
                    );
                    return (
                      reservation &&
                      validStatusTransitions[reservation.status].includes(
                        "CONFIRMED"
                      )
                    );
                  }) && (
                    <SelectItem
                      key="CONFIRMED"
                      value="CONFIRMED"
                      className="bg-[#EBF8FF] text-[#63B3ED] hover:bg-[#BEE3F8] hover:text-[#2B6CB0] py-1.5"
                    >
                      Confirmed
                    </SelectItem>
                  )}
                  {selectedRows.some((rowId) => {
                    const reservation = reservationData.find(
                      (r) => r.id === rowId
                    );
                    return (
                      reservation &&
                      validStatusTransitions[reservation.status].includes(
                        "REPAIRING"
                      )
                    );
                  }) && (
                    <SelectItem
                      key="REPAIRING"
                      value="REPAIRING"
                      className="bg-[#FFF5E0] text-[#FFC600] hover:bg-[#FEEBC8] hover:text-[#D97706] py-1.5"
                    >
                      Repairing
                    </SelectItem>
                  )}
                  {selectedRows.some((rowId) => {
                    const reservation = reservationData.find(
                      (r) => r.id === rowId
                    );
                    return (
                      reservation &&
                      validStatusTransitions[reservation.status].includes(
                        "COMPLETED"
                      )
                    );
                  }) && (
                    <SelectItem
                      key="COMPLETED"
                      value="COMPLETED"
                      className="bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C6F6D5] hover:text-[#22A366] py-1.5"
                    >
                      Completed
                    </SelectItem>
                  )}
                  {selectedRows.some((rowId) => {
                    const reservation = reservationData.find(
                      (r) => r.id === rowId
                    );
                    return (
                      reservation &&
                      validStatusTransitions[reservation.status].includes(
                        "CANCELLED"
                      )
                    );
                  }) && (
                    <SelectItem
                      key="CANCELLED"
                      value="CANCELLED"
                      className="bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FED7D7] hover:text-[#C53030] py-1.5"
                    >
                      Cancelled
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Button
                onClick={handleBulkStatusChangeAttempt}
                disabled={bulkStatus === ""}
                className="bg-[#2A69AC] hover:bg-[#1A365D] whitespace-nowrap text-sm"
              >
                Apply ({selectedRows.length})
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white overflow-x-auto">
          <div className="min-w-full">
            <Table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200 h-12">
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={
                        selectedRows.length > 0 &&
                        selectedRows.length === selectableReservations.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all reservations"
                      className={cn(
                        "border-[#2A69AC] data-[state=checked]:bg-[#2A69AC] data-[state=checked]:text-white"
                      )}
                    />
                  </TableHead>
                  {columns
                    .filter((col) => col.key !== "select")
                    .map((column) => (
                      <TableHead
                        key={column.key}
                        className="px-2 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider w-[13%]"
                      >
                        {column.sortable !== false ? (
                          <button
                            className="flex items-center justify-center gap-1 hover:text-[#1A365D] mx-auto"
                            onClick={() =>
                              handleSort(
                                column.key as keyof Omit<
                                  Reservation,
                                  "services" | "status"
                                >
                              )
                            }
                          >
                            {column.label}
                            <div className="flex flex-col">
                              <ChevronUp
                                className={cn(
                                  "h-3 w-3",
                                  sortField === column.key &&
                                    sortOrder === "asc"
                                    ? "text-[#1A365D]"
                                    : "text-[#8B909A]"
                                )}
                              />
                              <ChevronDown
                                className={cn(
                                  "h-3 w-3",
                                  sortField === column.key &&
                                    sortOrder === "desc"
                                    ? "text-[#1A365D]"
                                    : "text-[#8B909A]"
                                )}
                              />
                            </div>
                          </button>
                        ) : (
                          column.label
                        )}
                      </TableHead>
                    ))}
                  <TableHead className="px-2 py-3 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider w-[8%]">
                    ACTION
                  </TableHead>
                </tr>
              </thead>
              <TableBody>
                {paginatedReservations.length > 0 ? (
                  paginatedReservations.map((reservation) => (
                    <React.Fragment key={reservation.id}>
                      <TableRow
                        className={cn(
                          expandedRowId && expandedRowId !== reservation.id
                            ? "opacity-50"
                            : "",
                          "transition-opacity duration-200 h-[4.5rem]"
                        )}
                      >
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedRows.includes(reservation.id)}
                            onCheckedChange={() =>
                              handleRowSelect(reservation.id)
                            }
                            aria-label={`Select reservation ${reservation.id}`}
                            className={cn(
                              "border-[#2A69AC] data-[state=checked]:bg-[#2A69AC] data-[state=checked]:text-white"
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-[#1A365D] text-center truncate px-2 py-4">
                          <span
                            className="block truncate uppercase"
                            title={reservation.id}
                          >
                            {reservation.id}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#1A365D] text-center truncate px-2 py-4">
  <span
    className="block truncate uppercase"
    title={formatDateOnly(reservation.reservationDate)}
  >
    {formatDateOnly(reservation.reservationDate)}
  </span>
</TableCell>
                        <TableCell className="text-[#1A365D] text-center truncate px-2 py-4">
                          <span className="block truncate uppercase">
                            {reservation.firstName + " " + reservation.lastName}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#1A365D] text-center truncate px-2 py-4">
                          <span
                            className="block truncate uppercase"
                            title={reservation.userId}
                          >
                            {reservation.userId}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#1A365D] text-center truncate px-2 py-4">
                          <span className="block truncate uppercase">
                            {reservation.carModel}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#1A365D] text-center truncate px-2 py-4">
                          <span className="block truncate uppercase">
                            {reservation.plateNo || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-4 flex justify-center">
                          <div className="relative inline-block w-[140px]">
                            {reservation.status === "COMPLETED" ||
                            reservation.status === "CANCELLED" ? (
                              // For Completed or Cancelled, render a static badge instead of a dropdown
                              <div
                                className={cn(
                                  "w-[140px] h-8 px-2 py-1 text-sm font-medium flex items-center justify-center rounded-lg",
                                  statusStyles[reservation.status].bg,
                                  statusStyles[reservation.status].text
                                )}
                              >
                                {statusStyles[reservation.status].display}
                              </div>
                            ) : (
                              // For other statuses, keep the dropdown functionality
                              <Select
                                value={reservation.status}
                                onValueChange={(value) => {
                                  if (reservation.id && reservation.userId) {
                                    handleStatusChangeAttempt(
                                      reservation.id,
                                      reservation.userId,
                                      value as Status
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger
                                  className={cn(
                                    "w-[140px] h-8 px-2 py-1 text-sm font-medium",
                                    statusStyles[reservation.status].bg,
                                    statusStyles[reservation.status].text,
                                    "border-transparent", // Default transparent border
                                    "focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0",
                                    "data-[state=open]:border-2", // Only show border when open
                                    {
                                      "data-[state=open]:border-[#63B3ED]":
                                        reservation.status === "CONFIRMED",
                                      "data-[state=open]:border-[#FFC600]":
                                        reservation.status === "REPAIRING",
                                      "data-[state=open]:border-[#FF9F43]":
                                        reservation.status === "PENDING",
                                    }
                                  )}
                                >
                                  <SelectValue>
                                    {statusStyles[reservation.status].display}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Only show valid status transitions */}
                                  {validStatusTransitions[
                                    reservation.status
                                  ].includes("PENDING") && (
                                    <SelectItem
                                      key="PENDING"
                                      value="PENDING"
                                      className="bg-[#FFF5E0] text-[#FF9F43] hover:bg-[#FEEBC8] hover:text-[#E67E22] py-1.5"
                                    >
                                      Pending
                                    </SelectItem>
                                  )}
                                  {validStatusTransitions[
                                    reservation.status
                                  ].includes("CONFIRMED") && (
                                    <SelectItem
                                      key="CONFIRMED"
                                      value="CONFIRMED"
                                      className="bg-[#EBF8FF] text-[#63B3ED] hover:bg-[#BEE3F8] hover:text-[#2B6CB0] py-1.5"
                                    >
                                      Confirmed
                                    </SelectItem>
                                  )}
                                  {validStatusTransitions[
                                    reservation.status
                                  ].includes("REPAIRING") && (
                                    <SelectItem
                                      key="REPAIRING"
                                      value="REPAIRING"
                                      className="bg-[#FFF5E0] text-[#FFC600] hover:bg-[#FEEBC8] hover:text-[#D97706] py-1.5"
                                    >
                                      Repairing
                                    </SelectItem>
                                  )}
                                  {validStatusTransitions[
                                    reservation.status
                                  ].includes("COMPLETED") && (
                                    <SelectItem
                                      key="COMPLETED"
                                      value="COMPLETED"
                                      className="bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C6F6D5] hover:text-[#22A366] py-1.5"
                                    >
                                      Completed
                                    </SelectItem>
                                  )}
                                  {validStatusTransitions[
                                    reservation.status
                                  ].includes("CANCELLED") && (
                                    <SelectItem
                                      key="CANCELLED"
                                      value="CANCELLED"
                                      className="bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FED7D7] hover:text-[#C53030] py-1.5"
                                    >
                                      Cancelled
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedRowId(
                                  expandedRowId === reservation.id
                                    ? null
                                    : reservation.id
                                )
                              }
                              className="h-8 w-8 p-0"
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
    <TableCell colSpan={9} className="bg-gray-50 p-0">
      <div className="px-2 py-2 overflow-x-auto">
        <div className="w-full">
          <Table>
            <thead>
              <tr className="h-12">
                <TableHead className="px-2 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                  Created
                </TableHead>
                <TableHead className="px-2 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                  Reservation Date
                </TableHead>
                <TableHead className="px-2 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                  Service
                </TableHead>
                <TableHead className="px-2 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                  Mechanic
                </TableHead>
                <TableHead className="px-2 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                  Mechanic Status
                </TableHead>
                <TableHead className="px-2 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
                  Action
                </TableHead>
                <TableHead className="px-2 py-2 text-center text-xs font-medium text-[#8B909A] uppercase tracking-wider">
  <div className="flex justify-center space-x-2">
    <Button
      className="bg-[#2A69AC] hover:bg-[#1A365D] text-white px-4 py-2 text-sm font-medium whitespace-nowrap"
      onClick={() => setShowAddServiceDialog(true)}
      disabled={
        reservation.status === "COMPLETED" || reservation.status === "CANCELLED"
      }
    >
      Add Service
    </Button>
    <Button
      className="bg-[#2A69AC] hover:bg-[#1A365D] text-white px-4 py-2 text-sm font-medium whitespace-nowrap"
      onClick={() => showCarDetails(reservation)}
    >
      See Details
    </Button>
  </div>
</TableHead>
              </tr>
            </thead>
            <TableBody>
              {(Array.isArray(reservation.services) ? reservation.services : []).map(
                (service, index) => (
                  <TableRow key={index} className="h-[4.5rem]">
                    <TableCell className="px-2 py-4 text-sm text-[#1A365D] text-center uppercase">
                      {service.created}
                    </TableCell>
                    <TableCell className="px-2 py-4 text-sm text-[#1A365D] text-center uppercase">
                      {formatDateTime(service.reservationDate)}
                    </TableCell>
                    <TableCell className="px-2 py-4 text-sm text-[#1A365D] text-center uppercase">
                      {service.service}
                    </TableCell>
                    <TableCell className="px-2 py-4 text-sm text-[#1A365D] text-center uppercase">
                      {service.mechanic}
                    </TableCell>
                    <TableCell className="px-2 py-4 text-center">
  <div className="inline-block w-[140px] mx-auto">
    {/* Simplified conditional rendering for mechanic status */}
    {reservation.status === "REPAIRING" && 
     service.status !== "COMPLETED" && 
     service.status !== "CANCELLED" ? (
      // Show dropdown only when reservation is REPAIRING and service is not in terminal state
      <Select
        value={service.status}
        onValueChange={(value) => {
          if (isValidMechanicStatus(value)) {
            handleMechanicStatusChangeAttempt(reservation.id, index, value)
          }
        }}
      >
        <SelectTrigger
          className={cn(
            "w-[140px] h-8 px-2 py-1 text-sm font-medium",
            statusStyles[service.status].bg,
            statusStyles[service.status].text,
            "border-transparent", // Default transparent border
            "focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0",
            "data-[state=open]:border-2", // Only show border when open
            {
              "data-[state=open]:border-[#FFC600]": service.status === "REPAIRING",
              "data-[state=open]:border-[#FF9F43]": service.status === "PENDING",
            },
          )}
        >
          <SelectValue>{statusStyles[service.status].display}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Show valid status transitions based on current mechanic status */}
          {service.status === "PENDING" && (
            <SelectItem
              key="REPAIRING"
              value="REPAIRING"
              className="bg-[#FFF5E0] text-[#FFC600] hover:bg-[#FEEBC8] hover:text-[#D97706] py-1.5"
            >
              Repairing
            </SelectItem>
          )}
          {service.status === "REPAIRING" && (
            <>
              <SelectItem
                key="COMPLETED"
                value="COMPLETED"
                className="bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C6F6D5] hover:text-[#22A366] py-1.5"
              >
                Completed
              </SelectItem>
              <SelectItem
                key="CANCELLED"
                value="CANCELLED"
                className="bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FED7D7] hover:text-[#C53030] py-1.5"
              >
                Cancelled
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    ) : (
      // Show static badge in all other cases
      <div
        className={cn(
          "w-[140px] h-8 px-2 py-1 text-sm font-medium flex items-center justify-center rounded-lg",
          statusStyles[service.status].bg,
          statusStyles[service.status].text,
        )}
      >
        {statusStyles[service.status].display}
      </div>
    )}
  </div>
</TableCell>
                    <TableCell className="px-2 py-4 flex justify-center">
                      <div className="inline-flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedService({
                              reservationId: reservation.id,
                              serviceIndex: index,
                            })
                            setSelectedMechanic(service.mechanic)
                            setShowMechanicDialog(true)
                          }}
                          disabled={
                            reservation.status === "COMPLETED" ||
                            reservation.status === "CANCELLED"
                          }
                        >
                          <User
                            className={cn(
                              "h-4 w-4",
                              reservation.status === "COMPLETED" ||
                                reservation.status === "CANCELLED"
                                ? "text-gray-400"
                                : "text-[#1A365D]",
                            )}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedService({
                              reservationId: reservation.id,
                              serviceIndex: index,
                            })
                            setShowDeleteDialog(true)
                          }}
                          disabled={
                            reservation.status === "COMPLETED" ||
                            reservation.status === "CANCELLED"
                          }
                        >
                          <Trash2
                            className={cn(
                              "h-4 w-4",
                              reservation.status === "COMPLETED" ||
                                reservation.status === "CANCELLED"
                                ? "text-gray-400"
                                : "text-[#1A365D]",
                            )}
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TableCell>
  </TableRow>
)}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-[#8B909A]"
                    >
                      No reservations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end px-3 py-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage(Math.max(1, currentPage - 1));
                  setExpandedRowId(null); // Reset expanded row when changing pages
                }}
                disabled={currentPage === 1}
                className={cn(
                  "px-3 py-1 rounded-md text-sm",
                  currentPage === 1
                    ? "text-[#8B909A] cursor-not-allowed"
                    : "text-[#1A365D] hover:bg-[#EBF8FF]"
                )}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      setExpandedRowId(null); // Reset expanded row when changing pages
                    }}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm",
                      currentPage === page
                        ? "bg-[#1A365D] text-white"
                        : "text-[#1A365D] hover:bg-[#EBF8FF]"
                    )}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => {
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                  setExpandedRowId(null); // Reset expanded row when changing pages
                }}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-3 py-1 rounded-md text-sm",
                  currentPage === totalPages
                    ? "text-[#8B909A] cursor-not-allowed"
                    : "text-[#1A365D] hover:bg-[#EBF8FF]"
                )}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

{/* Mechanic Status Change Dialog */}
<Dialog open={showMechanicStatusDialog} onOpenChange={setShowMechanicStatusDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-center text-xl">Change Mechanic Status</DialogTitle>
    </DialogHeader>
    <div className="py-4">
      <p className="text-center text-[#8B909A] mb-2">
        {pendingMechanicStatusChange?.newStatus && 
          `Changing mechanic status to ${statusStyles[pendingMechanicStatusChange.newStatus].display}.`}
      </p>
      <p className="text-center text-[#EA5455] font-medium">
        {pendingMechanicStatusChange?.newStatus === "CANCELLED"
          ? "Warning: Cancelled status cannot be reverted."
          : pendingMechanicStatusChange?.newStatus === "COMPLETED"
            ? "Warning: Completed status cannot be reverted."
            : "Warning: Status changes cannot be reverted to previous states."}
      </p>
    </div>
    <div className="flex justify-center gap-4">
      <Button
        onClick={() => setShowMechanicStatusDialog(false)}
        className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
      >
        No, go back
      </Button>
      <Button
        onClick={confirmMechanicStatusChange}
        className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
      >
        Yes, continue
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* Mechanic Status Password Verification Dialog */}
<Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Enter 4-digit PIN to confirm</DialogTitle>
    </DialogHeader>
    <Input
      type="password"
      maxLength={4}
      value={enteredPin}
      onChange={(e) => setEnteredPin(e.target.value)}
      placeholder="••••"
      className="text-center tracking-wide"
    />
    <DialogFooter className="space-x-2">
      <Button
        variant="outline"
        onClick={() => {
          setShowPinDialog(false);
          setEnteredPin("");
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={() => {
          if (enteredPin === adminPin) {
            handleStatusVerified();
            setShowPinDialog(false);
            setEnteredPin("");
          } else {
            toast({
              title: "Invalid PIN",
              description: "The PIN you entered is incorrect.",
              variant: "destructive",
            });
            setEnteredPin("");
          }
        }}
      >
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Complete Reservation Dialog */}
<Dialog open={showCompleteReservationDialog} onOpenChange={setShowCompleteReservationDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-center text-xl">Mark as Complete?</DialogTitle>
    </DialogHeader>
    <div className="py-4">
      <p className="text-center text-[#8B909A] mb-2">
        All services for this reservation are either completed or cancelled.
      </p>
      <p className="text-center font-medium text-[#28C76F]">
        Would you like to mark the entire reservation as completed?
      </p>
    </div>
    <div className="flex justify-center gap-4">
      <Button
        onClick={() => {
          setShowCompleteReservationDialog(false)
          setPendingReservationToComplete(null)
        }}
        className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
      >
        No, keep as is
      </Button>
      <Button
        onClick={handleCompleteReservation}
        className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
      >
        Yes, complete
      </Button>
    </div>
  </DialogContent>
</Dialog>

      {/* Mechanic Dialog */}
      <Dialog open={showMechanicDialog} onOpenChange={setShowMechanicDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Which mechanic to do this service?
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {/* Now update the Mechanic Dialog to use activeEmployees instead of the static mechanics array */}
              {/* Find the RadioGroup in the Mechanic Dialog and replace it with: */}
              <RadioGroup
                value={selectedMechanic}
                onValueChange={setSelectedMechanic}
                className="contents"
              >
                {activeEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={`${employee.firstName} ${employee.lastName}`.toUpperCase()}
                      id={employee.id}
                    />
                    <label htmlFor={employee.id} className="text-sm">
                      {`${employee.firstName} ${employee.lastName}`.toUpperCase()}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setShowMechanicDialog(false)}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
            >
              Back
            </Button>
            <Button
              onClick={() => {
                setShowMechanicDialog(false);
                setShowMechanicPasswordDialog(true);
              }}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Are you sure to delete this service?
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 py-4">
            <Button
              onClick={() => setShowDeleteDialog(false)}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
            >
              No, go back
            </Button>
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                setShowDeletePasswordDialog(true);
              }}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
            >
              Yes, delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Service Password Verification Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Enter 4-digit PIN to confirm</DialogTitle>
    </DialogHeader>
    <Input
      type="password"
      maxLength={4}
      value={enteredPin}
      onChange={(e) => setEnteredPin(e.target.value)}
      placeholder="••••"
      className="text-center tracking-wide"
    />
    <DialogFooter className="space-x-2">
      <Button
        variant="outline"
        onClick={() => {
          setShowPinDialog(false);
          setEnteredPin("");
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={() => {
          if (enteredPin === adminPin) {
            handleStatusVerified();
            setShowPinDialog(false);
            setEnteredPin("");
          } else {
            toast({
              title: "Invalid PIN",
              description: "The PIN you entered is incorrect.",
              variant: "destructive",
            });
            setEnteredPin("");
          }
        }}
      >
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Status Confirmation Dialog */}
      <Dialog
        open={showStatusConfirmDialog}
        onOpenChange={setShowStatusConfirmDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Are you sure?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-[#8B909A] mb-2">
              {pendingStatusChange?.reservationId === "bulk"
                ? `Changing ${selectedRows.length} reservations to ${
                    pendingStatusChange?.newStatus
                      ? statusStyles[pendingStatusChange.newStatus].display
                      : ""
                  }.`
                : `Changing this reservation to ${
                    pendingStatusChange?.newStatus
                      ? statusStyles[pendingStatusChange.newStatus].display
                      : ""
                  }.`}
            </p>
            <p className="text-center text-[#EA5455] font-medium">
              {pendingStatusChange?.newStatus === "CANCELLED"
                ? "Warning: Cancelled status cannot be reverted."
                : pendingStatusChange?.newStatus === "COMPLETED"
                ? "Warning: Completed status cannot be reverted."
                : "Warning: Status changes cannot be reverted to previous states."}
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setShowStatusConfirmDialog(false)}
              className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
            >
              No, go back
            </Button>
            <Button
              onClick={confirmStatusChange}
              className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
            >
              Yes, continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Password Verification Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Enter 4-digit PIN to confirm</DialogTitle>
    </DialogHeader>
    <Input
      type="password"
      maxLength={4}
      value={enteredPin}
      onChange={(e) => setEnteredPin(e.target.value)}
      placeholder="••••"
      className="text-center tracking-wide"
    />
    <DialogFooter className="space-x-2">
      <Button
        variant="outline"
        onClick={() => {
          setShowPinDialog(false);
          setEnteredPin("");
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={() => {
          if (enteredPin === adminPin) {
            handleStatusVerified();
            setShowPinDialog(false);
            setEnteredPin("");
          } else {
            toast({
              title: "Invalid PIN",
              description: "The PIN you entered is incorrect.",
              variant: "destructive",
            });
            setEnteredPin("");
          }
        }}
      >
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Add Service Dialog */}
      <AddServiceDialog
        open={showAddServiceDialog}
        onOpenChange={setShowAddServiceDialog}
        onConfirm={handleAddServices}
        existingServices={
          expandedRowId
            ? reservationData
                .find((r) => r.id === expandedRowId)
                ?.services?.map((s) => s.service) || []
            : []
        }
      />

      {/* Mechanic Password Verification Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Enter 4-digit PIN to confirm</DialogTitle>
    </DialogHeader>
    <Input
      type="password"
      maxLength={4}
      value={enteredPin}
      onChange={(e) => setEnteredPin(e.target.value)}
      placeholder="••••"
      className="text-center tracking-wide"
    />
    <DialogFooter className="space-x-2">
      <Button
        variant="outline"
        onClick={() => {
          setShowPinDialog(false);
          setEnteredPin("");
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={() => {
          if (enteredPin === adminPin) {
            handleStatusVerified();
            setShowPinDialog(false);
            setEnteredPin("");
          } else {
            toast({
              title: "Invalid PIN",
              description: "The PIN you entered is incorrect.",
              variant: "destructive",
            });
            setEnteredPin("");
          }
        }}
      >
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog open={showCarDetailsDialog} onOpenChange={setShowCarDetailsDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-center text-xl">Vehicle Details</DialogTitle>
    </DialogHeader>
    <div className="py-4 max-h-[60vh] overflow-y-auto">
      <div className="space-y-4">
        {selectedCarDetails?.imageUrl && (
          <div className="flex justify-center mb-4">
            <img src={selectedCarDetails.imageUrl} alt="Car" className="max-w-full h-auto rounded-lg" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium text-gray-500">Name:</div>
          <div className="text-sm text-[#1A365D]">{selectedCarDetails?.customerName || "—"}</div>
          <div className="text-sm font-medium text-gray-500">Car:</div>
          <div className="text-sm text-[#1A365D]">{selectedCarDetails?.carModel || "—"}</div>
          <div className="text-sm font-medium text-gray-500">Year Model:</div>
          <div className="text-sm text-[#1A365D]">{selectedCarDetails?.yearModel || "—"}</div>
          <div className="text-sm font-medium text-gray-500">Transmission:</div>
          <div className="text-sm text-[#1A365D]">{selectedCarDetails?.transmission || "—"}</div>
          <div className="text-sm font-medium text-gray-500">Fuel Type:</div>
          <div className="text-sm text-[#1A365D]">{selectedCarDetails?.fuelType || "—"}</div>
          <div className="text-sm font-medium text-gray-500">Odometer:</div>
          <div className="text-sm text-[#1A365D]">{selectedCarDetails?.odometer || "—"}</div>
          <div className="text-sm font-medium text-gray-500">Reservation Date:</div>
          <div className="text-sm text-[#1A365D]">{formatDateTime(selectedCarDetails?.reservationDate || "")}</div>
        </div>
        {selectedCarDetails?.generalServices && selectedCarDetails.generalServices.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-500 mb-2">General Services:</div>
            <div className="flex flex-wrap gap-2">
              {selectedCarDetails.generalServices.map((service, index) => (
                <Badge key={index} className="bg-[#EBF8FF] text-[#2A69AC] hover:bg-[#EBF8FF]">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-500 mb-2">Specific Issues:</div>
          <p className={`whitespace-pre-wrap ${selectedCarDetails?.specificIssues ? "text-[#1A365D]" : "text-gray-500 opacity-75"}`}>
            {selectedCarDetails?.specificIssues ? selectedCarDetails.specificIssues : "The customer did not specify any issues with their vehicle."}
          </p>
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button onClick={() => setShowCarDetailsDialog(false)} className="w-full bg-[#2A69AC] hover:bg-[#1A365D] text-white">
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}

interface CarDetails {
  carModel: string;
  yearModel: string;
  transmission: string;
  fuelType: string;
  odometer: string;
  specificIssues: string;
  generalServices: string[];
  reservationDate: string;
  customerName: string;
  imageUrl?: string; // Add this line
}
