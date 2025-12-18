import { notFound } from "next/navigation"
import { getCustomer } from "@/lib/customers"
import { CustomerForm } from "@/components/admin/customers/CustomerForm"
import { getCustomerOrdersAction } from "@/actions/orders"
import { getCustomerAction } from "@/actions/customers"

interface EditCustomerPageProps {
  params: Promise<{
    id: string
  }>
}

// Next.js 15+ compatible
export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) { // Changed function name and params type
  const { id } = await params
  const customer = await getCustomerAction(id) // Changed to getCustomerAction

  if (!customer) {
    notFound()
  }

  // Map customer data to form values
  const defaultAddress = customer.defaultAddress || (customer.addresses && customer.addresses[0])

  // Fetch customer orders
  const orders = await getCustomerOrdersAction(undefined, id); // Changed parameters for getCustomerOrdersAction

  const initialData = {
    id: customer.id,
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    email: customer.email || "",
    phone: customer.phone || "",
    notes: customer.notes || "",
    tags: customer.tags || [],
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

  return <CustomerForm initialData={initialData} isEditing orders={orders} />
}
