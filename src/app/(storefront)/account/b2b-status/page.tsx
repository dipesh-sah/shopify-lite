import { getCustomerProfile } from '@/actions/customer-auth';
import { redirect } from 'next/navigation';
import { getCustomerB2BApplication } from '@/lib/b2b-applications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'B2B Application Status',
  description: 'Check your wholesale account application status',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  under_review: 'bg-blue-100 text-blue-800 border-blue-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

const statusMessages = {
  pending: 'Your application is in queue and will be reviewed soon.',
  under_review: 'Our team is currently reviewing your application.',
  approved: 'Congratulations! Your wholesale account is now active.',
  rejected: 'Unfortunately, your application was not approved at this time.',
};

export default async function B2BStatusPage() {
  const customer = await getCustomerProfile();

  if (!customer) {
    redirect('/login?redirect=/account/b2b-status');
  }

  const application = await getCustomerB2BApplication(customer.id);

  if (!application) {
    redirect('/account/apply-b2b');
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>B2B Application Status</CardTitle>
          <CardDescription>
            Track the progress of your wholesale account application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={statusColors[application.status]}>
              {application.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">{statusMessages[application.status]}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Company Name:</span>
              <span className="font-medium">{application.companyName}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Submitted:</span>
              <span className="font-medium">
                {new Date(application.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {application.reviewedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reviewed:</span>
                <span className="font-medium">
                  {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          {application.status === 'rejected' && application.rejectionReason && (
            <div className="border-l-4 border-red-500 bg-red-50 p-4">
              <h4 className="font-semibold text-red-800 mb-2">Rejection Reason:</h4>
              <p className="text-sm text-red-700">{application.rejectionReason}</p>
            </div>
          )}

          {application.status === 'approved' && customer.company && (
            <div className="border-l-4 border-green-500 bg-green-50 p-4 space-y-2">
              <h4 className="font-semibold text-green-800">Your Wholesale Benefits:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✓ Wholesale pricing discount: {customer.company.discountPercentage}%</li>
                <li>✓ Payment Terms: {customer.company.paymentTerms}</li>
                <li>✓ Credit Limit: ${customer.company.creditLimit.toLocaleString()}</li>
                {customer.company.minimumOrderValue > 0 && (
                  <li>✓ Minimum Order: ${customer.company.minimumOrderValue.toLocaleString()}</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            <Button asChild variant="outline" className="flex-1">
              <a href="/account">Return to Account</a>
            </Button>

            {application.status === 'approved' && (
              <Button asChild className="flex-1">
                <a href="/products">Start Shopping</a>
              </Button>
            )}

            {application.status === 'rejected' && (
              <Button asChild className="flex-1">
                <a href="/contact">Contact Support</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
