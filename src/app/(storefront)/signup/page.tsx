'use client'

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { signupAction } from "@/actions/customer-auth"
import { useFormStatus } from "react-dom"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account..." : "Sign Up"}
    </Button>
  )
}

export default function SignUpPage() {
  const router = useRouter()
  // @ts-ignore
  const [state, formAction, isPending] = useActionState(signupAction, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/signin?registered=true")
    }
  }, [state, router])

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <div className="rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">First Name</label>
              <input type="text" id="firstName" name="firstName" required className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">Last Name</label>
              <input type="text" id="lastName" name="lastName" required className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input type="email" id="email" name="email" required className="w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
            <input type="password" id="password" name="password" required minLength={6} className="w-full px-3 py-2 border rounded-md" />
          </div>

          {state?.error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {state.error}
            </div>
          )}

          <SubmitButton />
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/signin" className="text-primary hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
