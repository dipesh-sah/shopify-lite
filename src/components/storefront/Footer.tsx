"use client"

import Link from "next/link"
import { Facebook, Instagram, Youtube, Twitter, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

// FaXTwitter replacement with Twitter icon
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0a12 12 0 0 0-4.37 23.17c-.09-.8-.17-2.03.04-2.91.18-.79 1.17-4.98 1.17-4.98s-.3-.6-.3-1.49c0-1.39.81-2.43 1.82-2.43.86 0 1.27.64 1.27 1.41 0 .86-.55 2.15-.83 3.34-.24.99.5 1.8 1.48 1.8 1.77 0 3.13-1.87 3.13-4.56 0-2.38-1.71-4.05-4.15-4.05-2.83 0-4.49 2.12-4.49 4.31 0 .85.33 1.77.74 2.27.08.1.09.19.07.29-.08.31-.25 1.03-.28 1.17-.04.18-.15.22-.35.13-1.24-.58-2.02-2.4-2.02-3.87 0-3.14 2.28-6.03 6.58-6.03 3.45 0 6.14 2.46 6.14 5.75 0 3.43-2.16 6.19-5.16 6.19-1.01 0-1.96-.52-2.28-1.14 0 0-.5 1.9-.62 2.37-.22.87-.83 1.96-1.24 2.62A12 12 0 1 0 12 0z" />
  </svg>
)

export function Footer() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: "Subscribed!",
      description: "Thank you for subscribing to our newsletter.",
    })

    setEmail("")
    setIsSubmitting(false)
  }

  const quickLinks = [
    { name: "Become A Wholesaler", href: "/wholesaler" },
    { name: "Customer Accounts", href: "/account" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Shipping Policy", href: "/shipping-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Privacy Policy", href: "/privacy-policy" },
  ]

  const bottomLinks = [
    { name: "Contact Us", href: "/contact" },
    { name: "FAQ", href: "/faq" },
  ]

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
    { name: "YouTube", icon: Youtube, href: "https://youtube.com" },
    { name: "X", icon: XIcon, href: "https://x.com" },
    { name: "Pinterest", icon: PinterestIcon, href: "https://pinterest.com" },
  ]

  return (
    <footer className="w-full">
      {/* Newsletter Section */}
      <div className="bg-[#86BC25] py-12 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Subscribe to our emails
          </h2>
          <p className="text-white/90 mb-6">
            Join our mailing list and get "10% Discount" on your first order.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-transparent border-white text-white placeholder:text-white/70 focus-visible:ring-white h-12"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={isSubmitting}
              className="h-12 w-12 hover:bg-white/20 text-white"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[#1a1a1a] text-white py-12 px-4">
        <div className="container mx-auto">
          {/* Quick Links */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-6">Quick links</h3>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex justify-center gap-x-6 gap-y-3">
              {bottomLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-6 mb-8">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                aria-label={social.name}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 mb-6" />

          {/* Copyright */}
          <div className="text-center text-sm text-white/60">
            © {new Date().getFullYear()}, Alkaline Peptides
          </div>
        </div>
      </div>
    </footer>
  )
}
