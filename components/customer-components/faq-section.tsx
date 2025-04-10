"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/customer-components/ui/accordion"
import { BackgroundLogo } from "./background-logo"

// Organize FAQs by category
const faqCategories = [
  {
    category: "General Information",
    questions: [
      {
        question: "What are your operating hours?",
        answer: "8am to 7pm.",
      },
      {
        question: "Do I need an appointment, or do you accept walk-ins?",
        answer: "Both.",
      },
      {
        question: "What types of vehicles do you service?",
        answer: "Everything except Alfa Romeo and Chinese cars with the exception of Geely.",
      },
      {
        question: "What should I do if my car breaks down?",
        answer:
          "Usually go through your panel gauge to check for errors or fault lights but in the case of not working or electronics not working usually check the battery if it does ignition but does not start the car usually there's a starter problem.",
      },
      {
        question: "Do you offer emergency repair services?",
        answer:
          "Yes we do in emergency situations like backjobs from our shop but in repair services that aren't associated with us not really since we have other matters to do.",
      },
    ],
  },
  {
    category: "Services & Repairs",
    questions: [
      {
        question: "What types of repairs and maintenance do you offer?",
        answer:
          "Usually mechanical or in the engine but not programming ECUs nor tire repairs usually just maintenance or PMS.",
      },
      {
        question: "How long do your services usually take?",
        answer:
          "Usually fast around 1 to 4 hours but since we are always have a long queue usually takes 5 days to 2 weeks in order for your car to be serviced.",
      },
      {
        question: "How do I track the status of my vehicle repair?",
        answer: "Via the service advisor to update you via text, call, or viber.",
      },
      {
        question: "Do you offer a warranty on repairs?",
        answer: "1 year warranty and 1 week free replacement.",
      },
      {
        question: "Can I bring my own parts for the repair?",
        answer: "Yes but the labor will cost you.",
      },
      {
        question: "What brands of parts do you use?",
        answer: "Tohtachi or Toyota Genuine Parts, Mahle and Mann too for european ones.",
      },
      {
        question: "How do I know if my car needs immediate attention?",
        answer:
          "Usually it's common sense but since most people don't know how to read their own vehicles just bring them to the shop for a check up.",
      },
    ],
  },
  {
    category: "Pricing & Payments",
    questions: [
      {
        question: "How can I get an estimate for my repair?",
        answer: "Usually they go through our service advisors or our general manager for an estimate for the repair.",
      },
      {
        question: "How do I pay for the service?",
        answer:
          "Any payments rather Gcash, Maya, or even Bank transfer but only a limited amount of banks to go through E.g.; BDO, BPI, and Chinabank.",
      },
      {
        question: "Do you offer any discounts or promotions?",
        answer: "Only 10% discount if referred.",
      },
      {
        question: "Is there a cancellation fee?",
        answer: "Yes 80% refund.",
      },
    ],
  },
  {
    category: "Additional Services",
    questions: [
      {
        question: "Do you offer towing services?",
        answer: "Yes but not a flatbed only around Makati City Only.",
      },
      {
        question: "How do I know if my car repair is covered by insurance?",
        answer: "None we don't associate with insurance.",
      },
      {
        question: "Can I get a digital receipt or invoice?",
        answer: "Yes. Through Gmail, WhatsApp, WeChat, Telegram and Viber.",
      },
    ],
  },
]

export function FAQSection() {
  return (
    <section id="faqs" className="relative py-16 md:py-24 overflow-hidden">
      <BackgroundLogo position="right" className="-z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-12">
          <span className="text-primary-dark">Frequently Asked</span> <span className="text-secondary">Questions</span>
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:gap-8">
          {/* First row: General Information and Services & Repairs */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* General Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-primary-dark mb-4">{faqCategories[0].category}</h3>
              <Accordion type="single" collapsible className="space-y-2">
                {faqCategories[0].questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`0-item-${index}`}
                    className="bg-white/80 rounded-md overflow-hidden"
                  >
                    <AccordionTrigger className="text-left px-4 py-2 text-sm hover:no-underline hover:text-secondary [&[data-state=open]]:text-secondary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 text-gray-600 text-xs">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Services & Repairs */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-primary-dark mb-4">{faqCategories[1].category}</h3>
              <Accordion type="single" collapsible className="space-y-2">
                {faqCategories[1].questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`1-item-${index}`}
                    className="bg-white/80 rounded-md overflow-hidden"
                  >
                    <AccordionTrigger className="text-left px-4 py-2 text-sm hover:no-underline hover:text-secondary [&[data-state=open]]:text-secondary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 text-gray-600 text-xs">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Second row: Pricing & Payments and Additional Services */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pricing & Payments */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-primary-dark mb-4">{faqCategories[2].category}</h3>
              <Accordion type="single" collapsible className="space-y-2">
                {faqCategories[2].questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`2-item-${index}`}
                    className="bg-white/80 rounded-md overflow-hidden"
                  >
                    <AccordionTrigger className="text-left px-4 py-2 text-sm hover:no-underline hover:text-secondary [&[data-state=open]]:text-secondary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 text-gray-600 text-xs">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Additional Services */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-primary-dark mb-4">{faqCategories[3].category}</h3>
              <Accordion type="single" collapsible className="space-y-2">
                {faqCategories[3].questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`3-item-${index}`}
                    className="bg-white/80 rounded-md overflow-hidden"
                  >
                    <AccordionTrigger className="text-left px-4 py-2 text-sm hover:no-underline hover:text-secondary [&[data-state=open]]:text-secondary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 text-gray-600 text-xs">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
