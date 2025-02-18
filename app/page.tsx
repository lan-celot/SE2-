import { redirect } from "next/navigation"
import Link from "next/link"

export default function Home() {
  redirect("/dashboard")
  return (
    <div>
      <Link href="/transactions" className="text-blue-600 hover:underline">
        Transactions
      </Link>
    </div>
  )
}

