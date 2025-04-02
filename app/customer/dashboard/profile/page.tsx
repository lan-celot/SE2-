import { ProfileHeader } from "@/components/customer-components/dashboard/profile/profile-header"
import { PersonalInformation } from "@/components/customer-components/dashboard/profile/personal-information"
import { AddressInformation } from "@/components/customer-components/dashboard/profile/address-information"
import { MetricCard } from "@/components/customer-components/dashboard/metric-card"

export default function ProfilePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-[#1A365D] mb-6">Profile</h1>

      <div className="space-y-6">
        <ProfileHeader />

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <PersonalInformation />
            <AddressInformation />
          </div>

          <div className="space-y-6">
            <MetricCard title="COMPLETED RESERVATIONS" value="20" className="bg-white" />
            <MetricCard title="ON-GOING REPAIRS" value="1" className="bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

