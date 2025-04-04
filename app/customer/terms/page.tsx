import Image from "next/image"
import Link from "next/link"
import { TermsContent } from "@/components/customer-components/terms-content"
import { Footer } from "@/components/customer-components/Footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#ebf8ff] flex flex-col">
      <header className="p-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IvHIqsnbZo32MpjL3mD01Urzi5xkwE.svg"
              alt="MAR & NOR AUTO REPAIR"
              width={41}
              height={25}
              className="h-6 w-auto"
            />
            <span className="text-primary font-bold">MAR & NOR AUTO REPAIR</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="text-primary hover:text-secondary font-semibold">
              Login
            </Link>
            <Link
              href="/customer/register"
              className="bg-[#2A69AC] text-white hover:bg-[#1E4E8C] transition-colors rounded-md px-4 py-2 font-semibold"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-[#1e4e8c] text-white text-center py-6 rounded-lg mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">TERMS AND CONDITIONS</h1>
        </div>
        <TermsContent />
      </main>

      <Footer />
    </div>
  )
}

