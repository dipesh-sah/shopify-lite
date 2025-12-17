
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { revokeSessionAction, getLoginHistoryAction } from "@/actions/account/sessions"
import { changePasswordAction } from "@/actions/account/profile"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Shield, Smartphone, Globe } from "lucide-react"

export function SecuritySettings({ sessions }: { sessions: any[] }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handlePasswordChange(formData: FormData) {
    setLoading(true)
    try {
      // @ts-ignore - binding prevState logic if needed, but simple action works
      const result = await changePasswordAction(null, formData)
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Password changed successfully"
        })
        // Reset form?
        const form = document.getElementById("password-form") as HTMLFormElement
        form?.reset()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(sessionId: number) {
    try {
      const result = await revokeSessionAction(sessionId)
      if (result.success) {
        toast({ title: "Session Revoked", description: "The session has been invalidated." })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to revoke session", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Password Change */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Change Password</h3>
        </div>

        <form id="password-form" action={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" name="newPassword" type="password" required />
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-medium">Active Sessions</h3>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{session.userAgent || 'Unknown Device'}</p>
                  <p className="text-xs text-muted-foreground">Last active: {new Date(session.lastActiveAt).toLocaleDateString()}</p>
                </div>
              </div>
              {/* Logic to identify current session is complex without passing it down, 
                        assuming we just show revoke for all for now, maybe hide for current if possible */}
              <Button variant="ghost" size="sm" onClick={() => handleRevoke(session.id)}>Revoke</Button>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-sm text-muted-foreground">No active sessions found.</p>}
        </div>
      </div>
    </div>
  )
}
