import { MetricCard } from "@/components/customer-components/dashboard/metric-card"
import { ReservationCalendar } from "@/components/customer-components/dashboard/reservation-calendar"
import { RepairStatus } from "@/components/customer-components/dashboard/repair-status"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <MetricCard title="Lifetime Completed Reservations" value="20" />
        <MetricCard title="Total On-going Reservations" value="1" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ReservationCalendar />
        <RepairStatus />
      </div>
    </div>
  )
}

