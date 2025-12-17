'use client'

import { Suspense } from "react"
import { useActionState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { loginAction } from "@/actions/customer-auth"
import { useFormStatus } from "react-dom"
import Spinner from "@/components/ui/Spinner"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  )
}

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  // @ts-ignore
  const [state, formAction, isPending] = useActionState(loginAction, null)

  useEffect(() => {
    if (state?.success) {
      // Force full reload to ensure cookies are picked up by Server Components
      window.location.href = "/account"
    }
  }, [state])

  return (
    <div className="rounded-lg border bg-card p-8 shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

      {registered && (
        <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-md text-center">
          Account created! Please sign in.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
          <input type="email" id="email" name="email" required className="w-full px-3 py-2 border rounded-md" />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
          <input type="password" id="password" name="password" required className="w-full px-3 py-2 border rounded-md" />
        </div>

        {state?.error && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {state.error}
          </div>
        )}

        <SubmitButton />
      </form>

      <div className="mt-4 text-center text-sm">
        Don't have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <Suspense fallback={<div className="flex justify-center"><Spinner className="h-8 w-8" /></div>}>
        <SignInContent />
      </Suspense>
    </div>
  )
}
