
import { getRule } from '@/lib/rules/service';
import { notFound } from 'next/navigation';
import { RuleForm } from '@/components/admin/rules/RuleForm';


// Next.js 15+ / 16+ requires awaiting params
export default async function EditRulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = await getRule(id);

  if (!rule) {
    notFound();
  }

  return <RuleForm initialData={rule} isEditing={true} />;
}
