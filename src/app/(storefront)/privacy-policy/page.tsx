export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <p className="text-lg">
            This Privacy Policy describes how we collect, use, and protect your personal information.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Name and contact information</li>
            <li>Billing and shipping addresses</li>
            <li>Payment information</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Order history and preferences</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Improve our products and services</li>
            <li>Prevent fraud and enhance security</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Information Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your information with:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Service providers who assist us in operating our website and conducting our business</li>
            <li>Payment processors to process your transactions</li>
            <li>Shipping companies to deliver your orders</li>
            <li>Law enforcement or government agencies when required by law</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience on our website. Cookies help us:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Remember your preferences</li>
            <li>Understand how you use our website</li>
            <li>Provide personalized content and advertisements</li>
          </ul>
          <p>
            You can choose to disable cookies through your browser settings, but this may affect your ability to use certain features of our website.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Object to processing of your personal information</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Children's Privacy</h2>
          <p>
            Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:privacy@example.com" className="text-primary hover:underline">
              privacy@example.com
            </a>.
          </p>

          <p className="text-sm text-gray-500 mt-8">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
