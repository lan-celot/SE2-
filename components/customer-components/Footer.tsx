import Image from "next/image"
import Link from "next/link"
import { Mail, MapPin, Phone, Shield } from "lucide-react"

interface FooterProps {
  isLoggedIn?: boolean
}

export function Footer({ isLoggedIn = false }: FooterProps) {
  return (
    <footer className="bg-[#1a365d] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IvHIqsnbZo32MpjL3mD01Urzi5xkwE.svg"
              alt="MAR & NOR AUTO REPAIR"
              width={41}
              height={25}
              className="h-6 w-auto"
            />
            <h2 className="text-m font-semibold">MAR & NOR AUTO REPAIR</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 flex-shrink-0 mt-1 text-[#D6D6D6]" />
            <p className="text-[#D6D6D6]">567 J.P. Rizal, 1208, Makati, Metro Manila, Philippines</p>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Phone className="w-5 h-5 text-[#D6D6D6]" />
            <p className="text-[#D6D6D6]">+632 897 5973</p>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Mail className="w-5 h-5 text-[#D6D6D6]" />
            <a href="mailto:mar&nor.autorepair@gmail.com" className="text-[#D6D6D6] hover:text-primary-light">
              mar&nor.autorepair@gmail.com
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
          <p className="text-sm text-gray-400 mb-4 md:mb-0">
            Copyright 2024 • Mar & Nor Auto Repair, All Rights Reserved
          </p>
          <Link
            href={isLoggedIn ? "/customer/terms/logged-in" : "/customer/terms"}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <Shield className="w-4 h-4" />
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  )
}

