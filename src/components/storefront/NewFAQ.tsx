"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
}

interface FAQSection {
  title: string
  items: FAQItem[]
}

const faqData: FAQSection[] = [
  {
    title: "Company Information:",
    items: [
      {
        question: "What products does Alkaline specialize in?",
        answer: "Alkaline specializes in selling high-quality supplements, including BPC-157 and Pro-Healin TB500 + BPC-157. Our products are designed to support healing, accelerate recovery, and promote maximum healing and flexibility."
      },
      {
        question: "What sets Alkaline's products apart from others on the market?",
        answer: "Alkaline offers superior formulations with clean and highly active ingredients, setting us apart from other companies on the market. Our products are of the highest quality and are carefully crafted to provide optimal healing benefits."
      }
    ]
  },
  {
    title: "Peptide Information:",
    items: [
      {
        question: "What is a peptide?",
        answer: "A peptide is a short chain of amino acids, which are the building blocks of proteins. Peptides can have various functions in the body, including signaling molecules, hormones, and enzymes."
      },
      {
        question: "How does a peptide work?",
        answer: "Peptides work by binding to specific receptors on cells, triggering a response or signaling pathway. Depending on their structure and function, peptides can have a wide range of effects on the body, such as regulating hormone levels, promoting muscle growth, or enhancing skin elasticity."
      },
      {
        question: "What are amino acids?",
        answer: "Amino acids are organic compounds that combine to form proteins. In nature, approximately 500 amino acids have been identified, yet only 20 of them constitute the proteins present in the human body. Each with its own unique structure and properties. Amino acids are essential for various biological processes, including protein synthesis, enzyme function, and cell signaling."
      },
      {
        question: "Is it legal to take these types of products?",
        answer: "Our products are offered exclusively for scientific and research applications. They are not licensed for medical use and must not be used to diagnose, prevent, treat, or cure any condition or disease. These materials are not suitable for human consumption and should only be managed by trained professionals in a controlled laboratory environment. We recommend that customers seek independent legal advice regarding the use of these products, as we cannot provide legal guidance."
      }
    ]
  },
  {
    title: "Product Information and Testing:",
    items: [
      {
        question: "Do you test your products (Certificate of Analysis - COA)?",
        answer: "We test our products in a third-party lab located in the USA. We have a Certificate of Analysis (COA) for our products, ensuring their quality and safety. These COAs will be made available on our website for transparency and assurance. If you have any specific questions about our COAs, please feel free to ask."
      },
      {
        question: "Are your peptides FDA approved?",
        answer: "The statements and products provided on this website have not been evaluated or approved by the U.S. Food and Drug Administration (FDA) or any other regulatory body. They are not intended to diagnose, treat, cure, or prevent any disease."
      },
      {
        question: "Do you provide usage instructions or storage information?",
        answer: "Our products are intended for research purposes only. Dosage or application will vary depending on individual conditions."
      }
    ]
  },
  {
    title: "Return and Exchange Policy:",
    items: [
      {
        question: "What is the return policy for retail items?",
        answer: "You can return your unopened merchandise to our warehouse up to 30 days from the purchase date. We do not accept opened or used products nor partially or fully refund opened or used products. Please make sure to contact our Customer Service to receive a Return Authorization Number before returning the item."
      },
      {
        question: "Can I return or exchange a product that hasn't been opened?",
        answer: "If you have a product you ordered and haven't yet opened it, we can give you a refund as long as the item is returned within 30 days from the date of purchase. To make a return, please contact us with your name, order number, telephone number, and reason for return."
      },
      {
        question: "Can I return a product that I already opened?",
        answer: "If you wish to return an item that you've opened or used, we will need to determine the reason. To make a return, please contact us with your name, order number, telephone number, and a reason for the return. If your return qualifies, we'll email you a \"Return Authorization\" form. Returns or refunds will not be processed without a completed Return Authorization Notice. Items returned without a Return Authorization Notice will NOT be refunded, nor reshipped to you."
      }
    ]
  },
  {
    title: "Shipping and Delivery:",
    items: [
      {
        question: "What is the shipping policy?",
        answer: "Our products are stored, picked, packed, and sent automatically via a 3rd Party Logistics Company (3-PL), and we have several warehouses in the USA. When your order is placed, it is automatically processed via our system and shipped from the warehouse closest to you. Please allow 3-5 days for order processing."
      },
      {
        question: "Do you ship internationally or outside of the USA?",
        answer: "At this time, we only process and ship orders within the United States. We do not offer international shipping."
      },
      {
        question: "Can I make changes to my order or delivery address?",
        answer: "Once the order has started being processed, we cannot make any changes to the order or delivery address. If you made a mistake, please contact the courier company once you receive your tracking number and directly request delivery changes from them."
      },
      {
        question: "What happens if I receive a damaged item during shipping?",
        answer: "If you receive a damaged item during shipping, please contact us immediately with a picture of the damaged item within 24 hours of the order receipt. Provide us with your name, order number, telephone number, and the item that was damaged. We will ship a replacement for the damaged item(s) immediately if your claim is approved."
      },
      {
        question: "What happens if I receive the wrong item?",
        answer: "If you receive the wrong item, please contact us immediately with a picture of the incorrect product within 48 hours of receiving the order. Provide us with your name, order number, telephone number, and the item that was received with the incorrect one(s). We will check our inventory and ship a replacement for the correct item(s) immediately. However, if you placed the order for the item(s) more than 30 days ago, we are unable to accept the return."
      },
      {
        question: "When will I receive my refund?",
        answer: "If you are receiving a refund from us for any reason, it will be processed once the item(s) has been received at our warehouse in original condition, unused with original tags and labels, and in re-sellable condition within 30 business days. We will process your credit immediately upon receipt of the returned product. However, refunds may take up to two billing cycles to appear on your credit card statement. The amount will be refunded back to the account used in the original purchase."
      },
      {
        question: "Why am I being charged an extra fee?",
        answer: "As we are an international company, some banks may classify your transaction as international, which could result in extra charges. We recommend contacting your bank to confirm their fees for international transactions."
      }
    ]
  }
]

interface NewFAQProps {
  showTitle?: boolean
  className?: string
}

export function NewFAQ({ showTitle = true, className = "" }: NewFAQProps) {
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({ "0-0": true })

  const toggleItem = (sectionIndex: number, itemIndex: number) => {
    const key = `${sectionIndex}-${itemIndex}`
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <section className={`bg-white py-12 md:py-20 ${className}`}>
      <div className="container mx-auto px-4 md:px-8 max-w-[1200px]">
        {showTitle && (
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
        )}

        <div className="space-y-16">
          {faqData.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                {section.title}
              </h3>
              <div className="space-y-0">
                {section.items.map((item, itemIndex) => {
                  const isOpen = openItems[`${sectionIndex}-${itemIndex}`] ?? false
                  return (
                    <div key={itemIndex} className="border-b border-gray-100 last:border-0">
                      <button
                        onClick={() => toggleItem(sectionIndex, itemIndex)}
                        className="w-full text-left flex justify-between items-start py-1.5 gap-4"
                      >
                        <span className="text-base md:text-lg font-bold text-gray-900">
                          {item.question}
                        </span>
                        <div className="mt-1 flex-shrink-0">
                          {isOpen ? (
                            <X className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Plus className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="pb-8 animate-in fade-in slide-in-from-top-1 duration-300">
                          <p className="text-[#4D4D4D] text-sm md:text-base leading-relaxed max-w-[90%] font-medium">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
