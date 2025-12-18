
import Link from 'next/link';
import { getRules } from '@/lib/rules/service';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { deleteRuleAction } from '@/actions/rules';

export default async function RulesPage() {
  const rules = await getRules();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Business Rules</h1>
        <Link href="/admin/rules/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Rule
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full text-sm text-left">
          <thead className="text-xs bg-gray-50 uppercase text-gray-700">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Priority</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No rules found. Create one to get started.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{rule.name}</span>
                      {rule.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">{rule.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">{rule.priority}</td>
                  <td className="px-6 py-4">
                    <Badge variant={rule.is_active ? 'default' : 'secondary'} className={rule.is_active ? 'bg-green-600' : ''}>
                      {rule.is_active ? 'Active' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(rule.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/rules/${rule.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <form action={async () => {
                        "use server"
                        await deleteRuleAction(rule.id)
                      }}>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
