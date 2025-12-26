import { getB2BApplicationsAction } from '@/actions/admin-b2b';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata = {
  title: 'B2B Applications',
  description: 'Manage wholesale account applications',
};

const statusBadgeVariant = {
  pending: 'default' as const,
  under_review: 'secondary' as const,
  approved: 'default' as const,
  rejected: 'destructive' as const,
};

export default async function B2BApplicationsPage() {
  const pendingApps = await getB2BApplicationsAction({ status: 'pending' });
  const underReviewApps = await getB2BApplicationsAction({ status: 'under_review' });
  const approvedApps = await getB2BApplicationsAction({ status: 'approved', limit: 20 });
  const rejectedApps = await getB2BApplicationsAction({ status: 'rejected', limit: 20 });

  const ApplicationsTable = ({ applications }: { applications: any[] }) => {
    if (applications.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No applications found
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="font-medium">{app.companyName}</TableCell>
              <TableCell>
                {app.customer_first_name} {app.customer_last_name}
                <div className="text-sm text-muted-foreground">{app.customer_email}</div>
              </TableCell>
              <TableCell>
                {app.contactPersonName}
                <div className="text-sm text-muted-foreground">{app.contactEmail}</div>
              </TableCell>
              <TableCell>
                {new Date(app.submittedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant[app.status as keyof typeof statusBadgeVariant]}>
                  {app.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                  <a href={`/admin/b2b/applications/${app.id}`}>Review</a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">B2B Applications</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage wholesale account applications
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending {pendingApps.length > 0 && `(${pendingApps.length})`}
          </TabsTrigger>
          <TabsTrigger value="under_review">
            Under Review {underReviewApps.length > 0 && `(${underReviewApps.length})`}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>Applications waiting for review</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationsTable applications={pendingApps} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="under_review">
          <Card>
            <CardHeader>
              <CardTitle>Under Review</CardTitle>
              <CardDescription>Applications currently being reviewed</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationsTable applications={underReviewApps} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Applications</CardTitle>
              <CardDescription>Recently approved wholesale accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationsTable applications={approvedApps} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Applications</CardTitle>
              <CardDescription>Recently rejected applications</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationsTable applications={rejectedApps} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
