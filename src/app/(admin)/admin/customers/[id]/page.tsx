import { notFound } from "next/navigation"
import { getCustomer } from "@/lib/customers"
import { CustomerForm } from "@/components/admin/customers/CustomerForm"

interface EditCustomerPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  // Map customer data to form values
  const defaultAddress = customer.defaultAddress || (customer.addresses && customer.addresses[0])

  const initialData = {
    id: customer.id,
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    email: customer.email || "",
    phone: customer.phone || "",
    notes: customer.notes || "",
    acceptsMarketing: customer.acceptsMarketing,
    address: defaultAddress ? {
      firstName: defaultAddress.firstName || customer.firstName || "",
      lastName: defaultAddress.lastName || customer.lastName || "",
      address1: defaultAddress.address1 || "",
      city: defaultAddress.city || "",
      country: defaultAddress.country || "United States",
      zip: defaultAddress.zip || "",
      phone: defaultAddress.phone || "",
      provinceCode: defaultAddress.provinceCode || "",
    } : undefined
  }

  return <CustomerForm initialData={initialData} isEditing />
}
