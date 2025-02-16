"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddServiceDialog } from "./add-service-dialog"
import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

const initialReservations: Reservation[] = [
  {
    id: "#R00100",
    reservationDate: "11-15-24 3:00 PM",
    carModel: "HONDA BRV",
    completionDate: "CONFIRMED",
    status: "CONFIRMED",
    services: [
      {
        mechanic: "TO BE ASSIGNED",
        service: "ENGINE TUNING",
        status: "Confirmed",
      },
      {
        mechanic: "TO BE ASSIGNED",
        service: "OIL CHANGE",
        status: "Confirmed",
      },
      {
        mechanic: "TO BE ASSIGNED",
        service: "BRAKE CLEAN",
        status: "Confirmed",
      },
    ],
  },
  {
    id: "#R00074",
    reservationDate: "11-12-24 3:00 PM",
    carModel: "HONDA CIVIC",
    completionDate: "REPAIRING",
    status: "REPAIRING",
  },
  {
    id: "#R00090",
    reservationDate: "CANCELLED",
    carModel: "HONDA CIVIC",
    completionDate: "CANCELLED",
    status: "CANCELLED",
  },
  {
    id: "#R00052",
    reservationDate: "10-12-24 1:00 PM",
    carModel: "HONDA CIVIC",
    completionDate: "10-12-24 6:00 PM",
    status: "COMPLETED",
  },
]

// Double the reservations data
const reservations = [
  ...initialReservations,
  ...initialReservations.map((r) => ({
    ...r,
    id: r.id.replace("R", "S"),
  })),
]

type SortField = "id" | "reservationDate" | "carModel" | "completionDate" | "status"
type SortOrder = "asc" | "desc"

interface ReservationsTableProps {
  searchQuery: string
}

export function ReservationsTable({ searchQuery }: ReservationsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("id")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showAddService, setShowAddService] = useState(false)
  const [reservationsData, setReservationsData] = useState(reservations)
  const [serviceToDelete, setServiceToDelete] = useState<{ reservationId: string; serviceIndex: number } | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    const handleFilterStatus = (event: CustomEvent<string | null>) => {
      setStatusFilter(event.detail)
      setCurrentPage(1)
    }

    window.addEventListener("filterStatus", handleFilterStatus as EventListener)
    return () => {
      window.removeEventListener("filterStatus", handleFilterStatus as EventListener)
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const handleAddServices = (selectedServices: string[]) => {
    if (!expandedRow) return

    setReservationsData((prev) =>
      prev.map((reservation) => {
        if (reservation.id === expandedRow) {
          const newServices: Service[] = selectedServices.map((service) => ({
            mechanic: "TO BE ASSIGNED",
            service: service.toUpperCase(),
            status: "Confirmed",
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

  const handleDeleteService = () => {
    if (!serviceToDelete) return

    setReservationsData((prev) =>
      prev.map((reservation) => {
        if (reservation.id === serviceToDelete.reservationId) {
          const services = [...(reservation.services || [])]
          services.splice(serviceToDelete.serviceIndex, 1)
          return {
            ...reservation,
            services,
          }
        }
        return reservation
      }),
    )
    setServiceToDelete(null)
  }

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-[#63B3ED]/10 text-[#63B3ED]"
      case "repairing":
        return "bg-[#EFBF14]/10 text-[#EFBF14]"
      case "completed":
        return "bg-[#28C76F]/10 text-[#28C76F]"
      case "cancelled":
        return "bg-[#EA5455]/10 text-[#EA5455]"
      default:
        return "bg-[#8B909A]/10 text-[#8B909A]"
    }
  }

  const filteredAndSortedReservations = [...reservationsData]
    .filter((reservation) => {
      if (statusFilter && reservation.status !== statusFilter) {
        return false
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          reservation.id.toLowerCase().includes(query) ||
          reservation.carModel.toLowerCase().includes(query) ||
          reservation.reservationDate.toLowerCase().includes(query) ||
          reservation.completionDate.toLowerCase().includes(query) ||
          reservation.status.toLowerCase().includes(query)
        )
      }

      return true
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const modifier = sortOrder === "asc" ? 1 : -1
      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0
    })

  const totalPages = Math.ceil(filteredAndSortedReservations.length / itemsPerPage)
  const currentItems = filteredAndSortedReservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {[
                { key: "id", label: "RESERVATION ID" },
                { key: "reservationDate", label: "RESERVATION DATE" },
                { key: "carModel", label: "CAR MODEL" },
                { key: "completionDate", label: "COMPLETION DATE" },
                { key: "status", label: "STATUS" },
                { key: "action", label: "ACTION" },
              ].map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-[#8B909A] uppercase tracking-wider"
                >
                  {column.key !== "action" ? (
                    <button
                      className="flex items-center gap-1 hover:text-[#1A365D]"
                      onClick={() => column.key !== "action" && handleSort(column.key as SortField)}
                    >
                      {column.label}
                      {column.key !== "action" && (
                        <div className="flex flex-col">
                          <ChevronUp
                            className={cn(
                              "h-3 w-3",
                              sortField === column.key && sortOrder === "asc" ? "text-[#1A365D]" : "text-[#8B909A]",
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              "h-3 w-3",
                              sortField === column.key && sortOrder === "desc" ? "text-[#1A365D]" : "text-[#8B909A]",
                            )}
                          />
                        </div>
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentItems.map((reservation) => (
              <React.Fragment key={reservation.id}>
                <tr className={cn("hover:bg-gray-50", expandedRow && expandedRow !== reservation.id && "opacity-50")}>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.id}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.reservationDate}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.carModel}</td>
                  <td className="px-6 py-4 text-sm text-[#1A365D]">{reservation.completionDate}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-lg px-3 py-1 text-sm font-medium",
                        getStatusStyle(reservation.status),
                      )}
                    >
                      {reservation.status.charAt(0) + reservation.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                </tr>
                {expandedRow === reservation.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div className="grid grid-cols-[25%_25%_25%_25%] w-full items-center">
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Mechanic</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Service</div>
                          <div className="text-xs font-medium text-[#8B909A] uppercase">Status</div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs font-medium text-[#8B909A] uppercase">Action</div>
                            <Button
                              onClick={() => setShowAddService(true)}
                              className="bg-[#1A365D] hover:bg-[#1A365D]/90 text-white whitespace-nowrap"
                            >
                              Add service
                            </Button>
                          </div>
                        </div>
                        {reservation.services?.map((service, index) => (
                          <div key={index} className="grid grid-cols-[25%_25%_25%_25%] w-full items-center">
                            <div className="text-sm text-[#1A365D]">{service.mechanic}</div>
                            <div className="text-sm text-[#1A365D]">{service.service}</div>
                            <div>
                              <span className="inline-flex rounded-lg px-3 py-1 text-sm font-medium bg-[#63B3ED]/10 text-[#63B3ED]">
                                {service.status}
                              </span>
                            </div>
                            <div>
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
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={cn(
              "px-3 py-1 rounded-md text-sm",
              currentPage === 1 ? "text-[#8B909A] cursor-not-allowed" : "text-[#1A365D] hover:bg-[#EBF8FF]",
            )}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                "px-3 py-1 rounded-md text-sm",
                currentPage === page ? "bg-[#1A365D] text-white" : "text-[#1A365D] hover:bg-[#EBF8FF]",
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              "px-3 py-1 rounded-md text-sm",
              currentPage === totalPages ? "text-[#8B909A] cursor-not-allowed" : "text-[#1A365D] hover:bg-[#EBF8FF]",
            )}
          >
            Next
          </button>
        </div>
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

