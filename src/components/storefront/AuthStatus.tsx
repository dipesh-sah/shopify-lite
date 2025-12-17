import Link from "next/link"
import { User, LogOut } from "lucide-react"
import { getSessionAction, logoutAction } from "@/actions/customer-auth"
// import { cookies } from "next/headers" // No longer directly needed if we use getSessionAction
import { Button } from "@/components/ui/button"
// import { logoutAction } from "@/actions/customer-auth" // already imported above

export async function AuthStatus() {
  const user = await getSessionAction()

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/account" className="flex items-center gap-2 text-sm font-medium hover:text-primary">
          <User className="h-4 w-4" />
          <span>{user.firstName}</span>
        </Link>
        <form action={logoutAction}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/signin" className="text-sm font-medium hover:text-primary">Sign In</Link>
      <Link href="/signup">
        <Button size="sm">Sign Up</Button>
      </Link>
    </div>
  )
}
