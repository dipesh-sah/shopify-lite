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
      <div className="flex items-center gap-6">
        <Link href="/account" className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors text-sm font-medium group">
          <User className="h-6 w-6" />
          <div className="hidden lg:flex flex-col leading-tight">
            <span className="text-[10px] text-muted-foreground uppercase group-hover:text-primary transition-colors">Mein</span>
            <span>{user.firstName}</span>
          </div>
        </Link>
        <form action={logoutAction} className="flex items-center">
          <button type="submit" className="text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    )
  }

  return (
    <Link href="/signin" className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors text-sm font-medium group">
      <User className="h-6 w-6" />
      <div className="hidden lg:flex flex-col leading-tight">
        <span className="text-[10px] text-muted-foreground uppercase group-hover:text-primary transition-colors">Mein</span>
        <span>Anmelden</span>
      </div>
    </Link>
  )
}
