export default function WholesalerPage() {
  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Become A Wholesaler</h1>

        <div className="prose max-w-none space-y-6">
          <p className="text-lg text-gray-700">
            Thank you for your interest in becoming a wholesale partner with us!
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Wholesale Benefits</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Competitive wholesale pricing</li>
            <li>Access to our full product catalog</li>
            <li>Dedicated account manager</li>
            <li>Flexible payment terms</li>
            <li>Priority shipping and handling</li>
            <li>Marketing and promotional support</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Requirements</h2>
          <p className="text-gray-700">
            To qualify for a wholesale account, you must:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Have a valid business license or tax ID</li>
            <li>Operate a physical retail location or online store</li>
            <li>Meet minimum order requirements</li>
            <li>Provide business references</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">How to Apply</h2>
          <p className="text-gray-700">
            To apply for a wholesale account, please contact us at{" "}
            <a href="mailto:wholesale@example.com" className="text-primary hover:underline">
              wholesale@example.com
            </a>{" "}
            with the following information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Business name and address</li>
            <li>Contact person and phone number</li>
            <li>Business license or tax ID number</li>
            <li>Type of business (retail, online, etc.)</li>
            <li>Estimated monthly order volume</li>
          </ul>

          <p className="text-gray-700 mt-6">
            We review all applications and will respond within 2-3 business days.
          </p>
        </div>
      </div>
    </div>
  )
}
