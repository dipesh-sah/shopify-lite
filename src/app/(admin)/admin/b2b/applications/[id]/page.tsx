import { getB2BApplicationAction, getApplicationLogsAction } from '@/actions/admin-b2b';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ApplicationActions from './ApplicationActions';

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const application = await getB2BApplicationAction(parseInt(params.id));

  if (!application) {
    notFound();
  }

  const logs = await getApplicationLogsAction(application.id);

  const statusColors = {
    pending: 'default',
    under_review: 'secondary',
    approved: 'default',
    rejected: 'destructive',
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{application.companyName}</h1>
          <p className="text-muted-foreground mt-1">Application #{application.id}</p>
        </div>
        <Badge variant={statusColors[application.status as keyof typeof statusColors]}>
          {application.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-sm">{application.companyName}</p>
                </div>
                {application.companyRegistrationNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Registration Number</p>
                    <p className="text-sm">{application.companyRegistrationNumber}</p>
                  </div>
                )}
                {application.taxId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
                    <p className="text-sm">{application.taxId}</p>
                  </div>
                )}
                {application.businessType && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Business Type</p>
                    <p className="text-sm">{application.businessType}</p>
                  </div>
                )}
                {application.website && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Website</p>
                    <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {application.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                  <p className="text-sm">{application.contactPersonName}</p>
                  {application.contactPersonTitle && (
                    <p className="text-xs text-muted-foreground">{application.contactPersonTitle}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{application.contactEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{application.contactPhone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Account</p>
                  <p className="text-sm">{application.customer_email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Address */}
          {application.businessAddress1 && (
            <Card>
              <CardHeader>
                <CardTitle>Business Address</CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic text-sm">
                  {application.businessAddress1}<br />
                  {application.businessAddress2 && <>{application.businessAddress2}<br /></>}
                  {application.businessCity}, {application.businessProvince} {application.businessZip}<br />
                  {application.businessCountry}
                </address>
              </CardContent>
            </Card>
          )}

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {application.annualRevenue && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Annual Revenue</p>
                    <p className="text-sm">${application.annualRevenue.toLocaleString()}</p>
                  </div>
                )}
                {application.employeeCount && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employees</p>
                    <p className="text-sm">{application.employeeCount}</p>
                  </div>
                )}
                {application.expectedMonthlyVolume && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Expected Monthly Volume</p>
                    <p className="text-sm">${application.expectedMonthlyVolume.toLocaleString()}/month</p>
                  </div>
                )}
              </div>

              {application.applicationMessage && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Application Message</p>
                    <p className="text-sm whitespace-pre-wrap">{application.applicationMessage}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Application history and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.map((log: any, index: number) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {index < logs.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-sm font-medium">{log.action.replace('_', ' ').toUpperCase()}</p>
                        {log.notes && <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>}
                        {log.admin_email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            by {log.admin_first_name} {log.admin_last_name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <ApplicationActions application={application} />
        </div>
      </div>
    </div>
  );
}
