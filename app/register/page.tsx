import { Footer } from "@/components/footer"
import { RegisterForm } from "@/components/register-form"
import Image from "next/image"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#ebf8ff] flex flex-col">
      <header className="p-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IvHIqsnbZo32MpjL3mD01Urzi5xkwE.svg"
            alt="MAR & NOR AUTO REPAIR"
            width={41}
            height={25}
            className="h-6 w-auto"
          />
          <span className="text-primary font-bold">MAR & NOR AUTO REPAIR</span>
        </Link>
      </header>

      <main className="flex-1 grid lg:grid-cols-2 gap-8 items-center p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="hidden lg:flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Rev Up Your Experience:
            <br />
            <span className="text-secondary">Join Us and Get Started!</span>
          </h1>
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/porsche_car-kBzY9Vqb8Pxc2uOCNIQyuyLfcjcFnA.svg"
              alt="Blue Porsche Sports Car"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-primary mb-8 lg:hidden">
            Rev Up Your Experience:
            <br />
            <span className="text-secondary">Join Us and Get Started!</span>
          </h1>
          <RegisterForm />
        </div>
      </main>

      <Footer />
    </div>
  )
}

