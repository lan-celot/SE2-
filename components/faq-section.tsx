"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BackgroundLogo } from "./background-logo"

const faqs = [
  {
    question: "How long does the service take?",
    answer: `PMS-Oil Change: typically takes 2 to 3 hours
Brakes: typically takes 1.5 hours
Vehicle Diagnosis: duration varies depending on the specific car problem`,
  },
  {
    question: "What are your operating hours?",
    answer:
      "We operate from 8:00 AM to 7:00 PM, Monday to Sunday. You can, however, book an appointment anytime through our website.",
  },
  {
    question: "How do I pay for the service?",
    answer:
      "We offer flexible payment options. You can pay online via our website using credit cards, GCash, Maya, other e-wallets, or online bank transfer.",
  },
  {
    question: "How can I get an estimate?",
    answer:
      "You can request an estimate online by selecting contacting us for the services. In most cases, we will give you a price instantly. You will see the breakdown of labor fees and parts costs. There will never be any surprises or hidden costs. If an instant price is not available, we will send you a quote within 24 hours, usually sooner.",
  },
  {
    question: "Is there a cancellation fee?",
    answer:
      "We appreciate as much notice as possible if you need to change an appointment. It's free to cancel more than 48 hours prior to your appointment. If you cancel within 48 hours of an appointment you will be charged a cancellation fee.",
  },
]

export function FAQSection() {
  return (
    <section id="faqs" className="relative py-16 md:py-24 overflow-hidden">
      <BackgroundLogo position="right" className="-z-10" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-16">
          <span className="text-primary-dark">Frequently Asked</span> <span className="text-secondary">Questions</span>
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="bg-white/50 rounded-lg">
              <AccordionTrigger className="text-left px-6 hover:no-underline hover:text-secondary [&[data-state=open]]:text-secondary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 whitespace-pre-line">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

