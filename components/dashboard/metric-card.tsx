interface MetricCardProps {
  title: string
  value: string
}

export function MetricCard({ title, value }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-2xl font-semibold text-[#2a69ac] mb-4">{title}</h3>
      <p className="text-6xl font-bold text-[#1a365d]">{value}</p>
    </div>
  )
}

