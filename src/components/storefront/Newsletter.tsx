"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Newsletter() {
  return (
    <section className="bg-green-600 py-16 text-white mb-16">
      <div className="container text-center">
        <h2 className="text-3xl font-bold mb-4">Subscribe to our emails</h2>
        <p className="mb-8 opacity-90">Be the first to know about new collections and exclusive offers.</p>
        <form className="max-w-md mx-auto flex gap-4" onSubmit={(e) => e.preventDefault()}>
          <Input
            type="email"
            placeholder="Email"
            className="bg-white text-black border-0"
            required
          />
          <Button variant="secondary" type="submit">
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  )
}
