import { notFound } from "next/navigation"
import { getCompanyAction } from "@/actions/companies"
import { CompanyForm } from "@/components/admin/companies/CompanyForm"

// Next.js 15+ / 16+ requires awaiting params
export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await getCompanyAction(id)

  if (!company) {
    notFound()
  }

  return <CompanyForm initialData={company} isEditing />
}
