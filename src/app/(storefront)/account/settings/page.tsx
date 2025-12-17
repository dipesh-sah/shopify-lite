
import { getSessionAction } from "@/actions/customer-auth"
import { getLoginHistoryAction } from "@/actions/account/sessions"
import { ProfileForm } from "@/components/storefront/ProfileForm"
import { SecuritySettings } from "@/components/storefront/SecuritySettings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function SettingsPage() {
  const user = await getSessionAction()
  if (!user) {
    console.log('SettingsPage: User not authenticated, redirecting to /signin')
    redirect("/signin")
  }

  const sessions = await getLoginHistoryAction()

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Account
          </Link>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and security</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
              <ProfileForm user={user} />
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <SecuritySettings sessions={sessions} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
