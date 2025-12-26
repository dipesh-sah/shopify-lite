import { getCustomerProfile } from '@/actions/customer-auth';
import { redirect } from 'next/navigation';
import B2BApplicationForm from '@/components/storefront/B2BApplicationForm';
import { getCustomerB2BApplication } from '@/lib/b2b-applications';

export const metadata = {
  title: 'Apply for Wholesale Account',
  description: 'Apply for B2B wholesale pricing and terms',
};

export default async function ApplyB2BPage() {
  const customer = await getCustomerProfile();

  if (!customer) {
    redirect('/login?redirect=/account/apply-b2b');
  }

  // Check if already B2B or has pending application
  if (customer.customerType === 'b2b') {
    redirect('/account/b2b-status');
  }

  const existingApplication = await getCustomerB2BApplication(customer.id);

  if (existingApplication && existingApplication.status !== 'rejected') {
    redirect('/account/b2b-status');
  }

  return (
    <div className="container mx-auto py-8">
      <B2BApplicationForm />
    </div>
  );
}
