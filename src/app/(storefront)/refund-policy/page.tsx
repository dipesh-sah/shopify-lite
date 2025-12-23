export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Refund Policy</h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <p className="text-lg">
            We want you to be completely satisfied with your purchase. If you're not happy with your order, we're here to help.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Returns</h2>
          <p>
            You have 30 days from the date of delivery to return an item. To be eligible for a return, your item must be:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Unused and in the same condition that you received it</li>
            <li>In the original packaging</li>
            <li>Accompanied by a receipt or proof of purchase</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Refunds</h2>
          <p>
            Once we receive your return, we will inspect the item and notify you of the approval or rejection of your refund.
          </p>
          <p>
            If approved, your refund will be processed within 5-7 business days, and a credit will automatically be applied to your original method of payment.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Late or Missing Refunds</h2>
          <p>
            If you haven't received a refund yet, first check your bank account again. Then contact your credit card company, as it may take some time before your refund is officially posted.
          </p>
          <p>
            If you've done all of this and still have not received your refund, please contact us at{" "}
            <a href="mailto:support@example.com" className="text-primary hover:underline">
              support@example.com
            </a>.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Exchanges</h2>
          <p>
            We only replace items if they are defective or damaged. If you need to exchange an item, please contact us at{" "}
            <a href="mailto:support@example.com" className="text-primary hover:underline">
              support@example.com
            </a>.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Shipping Costs</h2>
          <p>
            You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable.
          </p>
        </div>
      </div>
    </div>
  )
}
