export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>

        <div className="prose max-w-none space-y-6 text-gray-700">
          <p className="text-lg">
            Please read these Terms of Service carefully before using our website and services.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.
          </p>
          <p>Under this license you may not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or public display</li>
            <li>Attempt to reverse engineer any software contained on our website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Disclaimer</h2>
          <p>
            The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Limitations</h2>
          <p>
            In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Accuracy of Materials</h2>
          <p>
            The materials appearing on our website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on our website are accurate, complete, or current.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Links</h2>
          <p>
            We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Modifications</h2>
          <p>
            We may revise these terms of service for our website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:legal@example.com" className="text-primary hover:underline">
              legal@example.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}
