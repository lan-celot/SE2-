"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardHeader } from "@/components/header"
import { ReservationCalendar } from "@/components/reservation-calendar"
import { Sidebar } from "@/components/sidebar"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#EBF8FF]">
      <Sidebar />
      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <DashboardHeader />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Calendar */}
          <ReservationCalendar />

          {/* Pending Reservations */}
          <div className="rounded-xl bg-white p-8 shadow-sm flex flex-col">
            <h3 className="text-2xl font-semibold text-[#2a69ac] mb-6">Pending Reservations</h3>
            <div className="flex items-center justify-start h-[calc(100%-3rem)]">
              <span className="text-[100px] leading-none font-bold text-[#1A365D] text-left">5</span>
            </div>
          </div>

          {/* Logs */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[#2A69AC]">Logs</h2>
            <div className="space-y-2">
              <div className="text-sm text-[#8B909A]">Nor logged in at 11-9-24 2:32 PM</div>
              <div className="text-sm text-[#8B909A]">Mar logged out at 11-9-24 2:00 PM</div>
            </div>
          </div>

          {/* Clients */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[#2A69AC]">Clients</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#8B909A]">New This Month</h3>
                <p className="text-6xl font-bold text-[#1A365D]">10</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#8B909A]">Returning This Month</h3>
                <p className="text-6xl font-bold text-[#1A365D]">8</p>
              </div>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[#2A69AC]">Today</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#8B909A]">Completed</h3>
                <p className="text-6xl font-bold text-[#1A365D]">1</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#8B909A]">Repairing</h3>
                <p className="text-6xl font-bold text-[#1A365D]">2</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-[#8B909A]">Confirmed</h3>
                <p className="text-6xl font-bold text-[#1A365D]">6</p>
              </div>
            </div>
          </div>

          {/* Arriving Today */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[#2A69AC]">Arriving Today</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#8B909A]">Reservation ID</TableHead>
                  <TableHead className="text-[#8B909A]">Customer</TableHead>
                  <TableHead className="text-[#8B909A]">Car Model</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-[#1A365D]">#R00100</TableCell>
                  <TableCell className="text-[#1A365D]">ANDREA SALAZAR</TableCell>
                  <TableCell className="text-[#1A365D]">HONDA CIVIC</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-[#1A365D]">#R00099</TableCell>
                  <TableCell className="text-[#1A365D]">BLAINE RAMOS</TableCell>
                  <TableCell className="text-[#1A365D]">FORD RAPTOR</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-[#1A365D]">#R00098</TableCell>
                  <TableCell className="text-[#1A365D]">LEO MACAYA</TableCell>
                  <TableCell className="text-[#1A365D]">TOYOTA VIOS</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  )
}

