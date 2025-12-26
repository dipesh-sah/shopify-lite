import { Navbar } from "@/components/storefront/Navbar"
import { Footer } from "@/components/storefront/Footer"
import { StoreSettingsProvider } from "@/contexts/StoreSettingsContext"

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StoreSettingsProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </StoreSettingsProvider>
  )
}
