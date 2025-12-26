import { getCustomerProfile } from '@/actions/customer-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'My Account',
  description: 'Manage your account settings and view your information',
};

export default async function AccountDashboard() {
  const customer = await getCustomerProfile();

  if (!customer) {
    redirect('/login?redirect=/account');
  }

  const accountTypeLabel = customer.customerType === 'b2b' ? 'Wholesale' : 'Retail';
  const accountTypeColor = customer.customerType === 'b2b' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {customer.firstName || 'Customer'}!</h1>
          <p className="text-muted-foreground mt-1">Manage your account and view your orders</p>
        </div>
        <Badge className={accountTypeColor}>
          {accountTypeLabel} Account
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="text-sm font-medium">
                {customer.firstName} {customer.lastName}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="text-sm font-medium">{customer.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Account Type:</span>
              <span className="text-sm font-medium">{accountTypeLabel}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={customer.accountStatus === 'active' ? 'default' : 'secondary'}>
                {customer.accountStatus}
              </Badge>
            </div>

            <Button asChild className="w-full mt-4">
              <a href="/account/settings">Edit Profile</a>
            </Button>
          </CardContent>
        </Card>

        {/* B2B Information */}
        {customer.customerType === 'b2b' && customer.company && (
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900">Wholesale Benefits</CardTitle>
              <CardDescription>Your B2B account perks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-purple-900">Company</p>
                <p className="text-sm text-muted-foreground">{customer.company.name}</p>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Wholesale Discount:</span>
                <span className="text-sm font-semibold text-green-600">
                  {customer.company.discountPercentage}% OFF
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment Terms:</span>
                <span className="text-sm font-medium">{customer.company.paymentTerms}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Credit Limit:</span>
                <span className="text-sm font-medium">
                  ${customer.company.creditLimit.toLocaleString()}
                </span>
              </div>
              {customer.company.minimumOrderValue > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Min. Order:</span>
                    <span className="text-sm font-medium">
                      ${customer.company.minimumOrderValue.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Apply for B2B */}
        {customer.customerType === 'b2c' && customer.accountStatus === 'active' && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="text-purple-900">Upgrade to Wholesale</CardTitle>
              <CardDescription>Get exclusive B2B pricing and benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Up to 20% wholesale discount</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Flexible payment terms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>

              <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                <a href="/account/apply-b2b">Apply for Wholesale Account</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* B2B Application Status */}
        {customer.customerType === 'b2b' && customer.accountStatus !== 'active' && (
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>Your B2B application progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Badge variant={customer.accountStatus === 'pending' ? 'secondary' : 'destructive'}>
                  {customer.accountStatus.toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground mt-4">
                  {customer.accountStatus === 'pending' && 'Your application is being reviewed'}
                  {customer.accountStatus === 'suspended' && 'Your account has been suspended'}
                  {customer.accountStatus === 'rejected' && 'Your application was not approved'}
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <a href="/account/b2b-status">View Details</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <a href="/account/orders">
                <span className="text-2xl">📦</span>
                <span className="text-sm">My Orders</span>
              </a>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <a href="/account/addresses">
                <span className="text-2xl">📍</span>
                <span className="text-sm">Addresses</span>
              </a>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <a href="/account/settings">
                <span className="text-2xl">⚙️</span>
                <span className="text-sm">Settings</span>
              </a>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <a href="/products">
                <span className="text-2xl">🛍️</span>
                <span className="text-sm">Shop Now</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
