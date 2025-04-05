"use client";

import { MetricCard } from "@/components/customer-components/dashboard/metric-card"
import { ReservationCalendar } from "@/components/customer-components/dashboard/reservation-calendar"
import { RepairStatus } from "@/components/customer-components/dashboard/repair-status"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <MetricCard 
          title="Lifetime Completed Reservations" 
          type="completed" 
        />
        <MetricCard 
          title="Total Repairing Reservations" 
          type="repairing" 
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ReservationCalendar />
        <RepairStatus />
      </div>
    </div>
  )
}