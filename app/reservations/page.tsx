"use client"
import { useEffect } from "react";
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
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { collection, getDocs, onSnapshot, orderBy, query, doc, updateDoc  } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Status = "Confirmed" | "Repairing" | "Completed" | "Cancelled"

interface Reservation {
  lastName: string;
  firstName: string;
  id: string
  reservationDate: string
  customerName: string
  customerId: string
  carModel: string
  status: Status
  services?: {
    created: string
    reservationDate: string
    service: string
    mechanic: string
  }[]
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  Confirmed: { bg: "bg-[#EBF8FF]", text: "text-[#63B3ED]" },
  Repairing: { bg: "bg-[#FFF5E0]", text: "text-[#EFBF14]" },
  Completed: { bg: "bg-[#E6FFF3]", text: "text-[#28C76F]" },
  Cancelled: { bg: "bg-[#FFE5E5]", text: "text-[#EA5455]" }
};

const reservations: Reservation[] = [

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

export default function ReservationsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [reservationData, setReservationData] = React.useState(reservations)
  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null)
  const [showMechanicDialog, setShowMechanicDialog] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [selectedService, setSelectedService] = React.useState<{
    reservationId: string
    serviceIndex: number
  } | null>(null)
  const [selectedMechanic, setSelectedMechanic] = React.useState("")
  const [showAddServiceDialog, setShowAddServiceDialog] = React.useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [sortField, setSortField] = useState<keyof Omit<Reservation, "services" | "status"> | null>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("reservationDate", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Reservation))
      setReservationData(data)
    })
    return () => unsubscribe()
  }, [])

  
const handleStatusChange = async (reservationId: string, customerId: string, newStatus: string) => {
  try {
    const normalizedStatus = newStatus.toUpperCase() as Status;

    console.log(`reservationId: ${reservationId}`);
    console.log(`customerId: ${customerId}`);
    console.log(`normalizedStatus: ${normalizedStatus}`);

    if (!reservationId) throw new Error("reservationId is undefined");
    if (!customerId) throw new Error("customerId is undefined");
    if (!normalizedStatus) throw new Error("normalizedStatus is undefined");

    setReservationData((prevData) => 
      prevData.map((reservation) =>
        reservation.id === reservationId ? { ...reservation, status: normalizedStatus } : reservation
      )
    );

    const globalDocRef = doc(db, "bookings", reservationId);
    await updateDoc(globalDocRef, { status: normalizedStatus });

    const userDocRef = doc(db, "users", customerId, "bookings", reservationId);
    await updateDoc(userDocRef, { status: normalizedStatus });

    console.log(`Status updated successfully for reservation ${reservationId}`);
  } catch (error) {
    console.error("Error updating status:", error);
  }
};
  const handleMechanicChange = () => {
    if (selectedService && selectedMechanic) {
      setReservationData((prevData) =>
        prevData.map((reservation) => {
          if (reservation.id === selectedService.reservationId && reservation.services) {
            const updatedServices = [...reservation.services]
            updatedServices[selectedService.serviceIndex] = {
              ...updatedServices[selectedService.serviceIndex],
              mechanic: selectedMechanic,
            }
            return { ...reservation, services: updatedServices }
          }
          return reservation
        }),
      )
      setShowMechanicDialog(false)
      setSelectedService(null)
      setSelectedMechanic("")
    }
  }

  const handleDeleteService = () => {
    if (selectedService) {
      setReservationData((prevData) =>
        prevData.map((reservation) => {
          if (reservation.id === selectedService.reservationId && reservation.services) {
            const updatedServices = reservation.services.filter((_, index) => index !== selectedService.serviceIndex)
            return { ...reservation, services: updatedServices }
          }
          return reservation
        }),
      )
      setShowDeleteDialog(false)
      setSelectedService(null)
    }
  }

  const handleAddServices = (selectedServices: string[]) => {
    if (expandedRowId) {
      setReservationData((prevData) =>
        prevData.map((reservation) => {
          if (reservation.id === expandedRowId) {
            const now = new Date()
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
              .replace(/\//g, "-")

            const newServices = selectedServices.map((service) => ({
              created: formattedNow,
              reservationDate: reservation.reservationDate.toLowerCase(),
              service: service,
              mechanic: "TO BE ASSIGNED",
            }))
            return {
              ...reservation,
              services: [...(reservation.services || []), ...newServices],
            }
          }
          return reservation
        }),
      )
    }
  }

  const handleSort = (field: keyof Omit<Reservation, "services" | "status">) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

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

console.log("Filtered Reservations:", filteredReservations); // Debug log
  const columns = [
    { key: "id", label: "RESERVATION ID" },
    { key: "date", label: "RESERVATION DATE" },
    { key: "customerName", label: "CUSTOMER NAME" },
    { key: "customerId", label: "CUSTOMER ID" },
    { key: "carModel", label: "CAR MODEL" },
    { key: "status", label: "STATUS", sortable: false },
  ]

  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-4">
          <DashboardHeader title="Reservation Management" />
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <ReservationsTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="h-px bg-gray-200 mt-0" />
        </div>

        {/* Search */}
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

        {/* Table */}
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
          <TableCell className="text-[#1A365D] text-center">{reservation.customerId}</TableCell>
          <TableCell className="text-[#1A365D] text-center">{reservation.carModel}</TableCell>
          <TableCell className="px-6 py-4 flex justify-center">
  <div className="relative inline-block">
  <select
  value={reservation.status}
  onChange={(e) => handleStatusChange(reservation.id, reservation.customerId, e.target.value as Status)}
  className={cn(
    "appearance-none h-8 px-3 py-1 rounded-md pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium",
    (statusStyles[reservation.status]?.bg ?? statusStyles['Confirmed'].bg), // Fallback to "Confirmed" style
    (statusStyles[reservation.status]?.text ?? statusStyles['Confirmed'].text) // Fallback to "Confirmed" style
  )}
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
    (statusStyles[reservation.status]?.text ?? statusStyles['Confirmed'].text) // Fallback to "Confirmed" style
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
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector%20up-NiMLet me continue from the exact cut off point:

https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector%20up-NiM43WWAQiX3qnLM68fj74mUJgJUCp.svg"
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
        {expandedRowId === reservation.id && reservation.services && (
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
                        >
                          Add Service
                        </Button>
                      </TableHead>
                    </tr>
                  </thead>
                  <TableBody>
                    {reservation.services.map((service, index) => (
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
                            >
                              <User className="h-4 w-4 text-[#1A365D]" />
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
                            >
                              <Trash2 className="h-4 w-4 text-[#1A365D]" />
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

          {/* Pagination */}
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
      <AddServiceDialog
        open={showAddServiceDialog}
        onOpenChange={setShowAddServiceDialog}
        onConfirm={handleAddServices}
      />
    </div>
  )
}

