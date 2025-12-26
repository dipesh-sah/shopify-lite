'use client';

import { submitB2BApplicationAction } from '@/actions/customer-auth';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function B2BApplicationForm() {
  const [state, formAction] = useActionState(submitB2BApplicationAction, null);

  if (state?.success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">Application Submitted Successfully!</CardTitle>
          <CardDescription>
            Thank you for applying for a wholesale account. Our team will review your application and get back to you within 2-3 business days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You'll receive an email notification once your application has been reviewed.
          </p>
          <Button asChild className="mt-4">
            <a href="/account">Return to Account</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Apply for Wholesale Account</CardTitle>
          <CardDescription>
            Fill out the form below to apply for B2B wholesale pricing and terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {state.error}
            </div>
          )}

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" name="companyName" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyRegistrationNumber">Registration Number</Label>
                <Input id="companyRegistrationNumber" name="companyRegistrationNumber" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">GST/VAT ID</Label>
                <Input id="taxId" name="taxId" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input id="businessType" name="businessType" placeholder="e.g., Retailer, Distributor" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" type="url" placeholder="https://" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPersonName">Contact Person *</Label>
                <Input id="contactPersonName" name="contactPersonName" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonTitle">Title</Label>
                <Input id="contactPersonTitle" name="contactPersonTitle" placeholder="e.g., Purchasing Manager" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input id="contactEmail" name="contactEmail" type="email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone *</Label>
                <Input id="contactPhone" name="contactPhone" type="tel" required />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Address</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessAddress1">Address Line 1</Label>
                <Input id="businessAddress1" name="businessAddress1" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress2">Address Line 2</Label>
                <Input id="businessAddress2" name="businessAddress2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessCity">City</Label>
                  <Input id="businessCity" name="businessCity" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessProvince">State/Province</Label>
                  <Input id="businessProvince" name="businessProvince" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessZip">ZIP/Postal Code</Label>
                  <Input id="businessZip" name="businessZip" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessCountry">Country</Label>
                <Input id="businessCountry" name="businessCountry" />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualRevenue">Annual Revenue (USD)</Label>
                <Input id="annualRevenue" name="annualRevenue" type="number" step="0.01" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount">Number of Employees</Label>
                <Input id="employeeCount" name="employeeCount" type="number" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expectedMonthlyVolume">Expected Monthly Order Volume (USD)</Label>
                <Input id="expectedMonthlyVolume" name="expectedMonthlyVolume" type="number" step="0.01" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationMessage">Tell us about your business</Label>
              <Textarea
                id="applicationMessage"
                name="applicationMessage"
                placeholder="Why are you interested in a wholesale account? What types of products are you interested in?"
                rows={5}
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full">
            Submit Application
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
