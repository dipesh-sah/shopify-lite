'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  approveB2BApplicationAction,
  rejectB2BApplicationAction,
  setApplicationUnderReviewAction,
} from '@/actions/admin-b2b';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function ApplicationActions({ application }: { application: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const canTakeAction = application.status === 'pending' || application.status === 'under_review';

  const handleApprove = async () => {
    if (!confirm(`Approve this B2B application for ${application.companyName}?`)) return;

    setLoading(true);
    try {
      const result = await approveB2BApplicationAction(application.id, approvalNotes);

      if (result.success) {
        alert(`Application approved successfully! Company ID: ${result.companyId}`);
        router.push('/admin/b2b/applications');
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('An error occurred while approving the application');
      console.error(error);
    }
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm(`Reject this application from ${application.companyName}?`)) return;

    setLoading(true);
    try {
      const result = await rejectB2BApplicationAction(application.id, rejectionReason);

      if (result.success) {
        alert('Application rejected');
        router.push('/admin/b2b/applications');
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('An error occurred while rejecting the application');
      console.error(error);
    }
    setLoading(false);
  };

  const handleSetUnderReview = async () => {
    setLoading(true);
    try {
      const result = await setApplicationUnderReviewAction(application.id, reviewNotes);

      if (result.success) {
        alert('Application marked as under review');
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('An error occurred');
      console.error(error);
    }
    setLoading(false);
  };

  if (!canTakeAction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Actions</CardTitle>
          <CardDescription>
            This application has already been {application.status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <a href="/admin/b2b/applications">Back to Applications</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sticky top-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {application.status === 'pending' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add notes about the review process..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSetUnderReview}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                Mark as Under Review
              </Button>
              <Separator />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-green-800">Approve Application</CardTitle>
          <CardDescription>
            This will create a company record and activate the B2B account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approvalNotes">Admin Notes (Optional)</Label>
            <Textarea
              id="approvalNotes"
              placeholder="Internal notes about this approval..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Processing...' : '✓ Approve Application'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-800">Reject Application</CardTitle>
          <CardDescription>
            This will notify the customer that their application was rejected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason *</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Explain why the application is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              This reason will be shown to the customer
            </p>
          </div>
          <Button
            onClick={handleReject}
            disabled={loading || !rejectionReason.trim()}
            variant="destructive"
            className="w-full"
          >
            {loading ? 'Processing...' : '✗ Reject Application'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
