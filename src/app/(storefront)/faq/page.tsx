"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: "Orders & Shipping",
    question: "How long does shipping take?",
    answer: "Domestic orders typically arrive within 3-7 business days. International orders may take 10-21 business days depending on your location."
  },
  {
    category: "Orders & Shipping",
    question: "Do you offer free shipping?",
    answer: "Yes! We offer free standard shipping on all orders over $50 within the United States."
  },
  {
    category: "Orders & Shipping",
    question: "How can I track my order?",
    answer: "Once your order ships, you'll receive a confirmation email with a tracking number. You can use this number to track your package on the carrier's website."
  },
  {
    category: "Returns & Refunds",
    question: "What is your return policy?",
    answer: "We accept returns within 30 days of delivery. Items must be unused, in original packaging, and accompanied by proof of purchase."
  },
  {
    category: "Returns & Refunds",
    question: "How long do refunds take?",
    answer: "Once we receive and approve your return, refunds are processed within 5-7 business days. The credit will be applied to your original payment method."
  },
  {
    category: "Returns & Refunds",
    question: "Who pays for return shipping?",
    answer: "Customers are responsible for return shipping costs unless the item is defective or we made an error."
  },
  {
    category: "Products",
    question: "Are your products authentic?",
    answer: "Yes, all of our products are 100% authentic and sourced directly from authorized distributors."
  },
  {
    category: "Products",
    question: "Do you restock sold-out items?",
    answer: "We try to restock popular items when possible. Sign up for email notifications on product pages to be alerted when items are back in stock."
  },
  {
    category: "Account & Payment",
    question: "Do I need an account to place an order?",
    answer: "No, you can checkout as a guest. However, creating an account allows you to track orders, save addresses, and view order history."
  },
  {
    category: "Account & Payment",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and Apple Pay."
  },
  {
    category: "Account & Payment",
    question: "Is it safe to use my credit card?",
    answer: "Yes, we use industry-standard SSL encryption to protect your payment information. We never store your credit card details."
  },
  {
    category: "Wholesale",
    question: "Do you offer wholesale pricing?",
    answer: "Yes! We have a wholesale program for qualified businesses. Visit our Become A Wholesaler page for more information."
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const categories = Array.from(new Set(faqs.map(faq => faq.category)))

  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-center">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-700 text-center mb-12">
          Find answers to common questions about our products, shipping, returns, and more.
        </p>

        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-primary">{category}</h2>
            <div className="space-y-3">
              {faqs.filter(faq => faq.category === category).map((faq, index) => {
                const globalIndex = faqs.indexOf(faq)
                const isOpen = openIndex === globalIndex

                return (
                  <div
                    key={globalIndex}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold pr-8">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        isOpen ? "max-h-96" : "max-h-0"
                      )}
                    >
                      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="mt-12 p-6 bg-primary/10 rounded-lg text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-gray-700 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
