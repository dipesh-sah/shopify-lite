import { NewFAQ } from "@/components/storefront/NewFAQ"

export default function FAQPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-[1200px]">
        <h1 className="text-4xl md:text-5xl font-normal mb-8 text-left">FAQ</h1>
        <NewFAQ showTitle={false} className="py-0" />
      </div>
    </div>
  )
}
