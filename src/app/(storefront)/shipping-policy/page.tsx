export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Shipping Policy</h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <p className="text-lg">
            We aim to process and ship all orders as quickly as possible. Please review our shipping policy below.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Processing Time</h2>
          <p>
            All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.
          </p>
          <p>
            If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Shipping Rates & Delivery Estimates</h2>
          <p>
            Shipping charges for your order will be calculated and displayed at checkout. Delivery time depends on your location:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Domestic (USA):</strong> 3-7 business days</li>
            <li><strong>International:</strong> 10-21 business days</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Free Shipping</h2>
          <p>
            We offer free standard shipping on all orders over $50 within the United States.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Shipment Confirmation & Order Tracking</h2>
          <p>
            You will receive a shipment confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Customs, Duties, and Taxes</h2>
          <p>
            We are not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Damages</h2>
          <p>
            We are not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim.
          </p>
          <p>
            Please save all packaging materials and damaged goods before filing a claim.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">International Shipping</h2>
          <p>
            We currently ship to select international destinations. International shipping rates and delivery times vary by location. Please note that international orders may be subject to import duties and taxes.
          </p>
        </div>
      </div>
    </div>
  )
}
