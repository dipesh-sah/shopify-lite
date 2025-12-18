
"use client"

import { useState, useEffect } from 'react';
import { getRulesAction, deleteRuleAction } from '@/actions/rules';
import { Rule } from '@/lib/rules/service';
import { RuleForm } from './RuleForm';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function RuleManager() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [rules, setRules] = useState<Rule[]>([]);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await getRulesAction();
      setRules(res.rules);
    } catch (e) {
      console.error(e);
      showToast("Failed to load rules", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      await deleteRuleAction(id);
      loadRules();
      showToast("Rule deleted");
    } catch (e) {
      showToast("Failed to delete rule", "error");
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setView('edit');
  };

  const handleCreate = () => {
    setEditingRule(undefined);
    setView('create');
  };

  const handleCloseModal = () => {
    setView('list');
    setEditingRule(undefined);
  };

  const handleSuccess = () => {
    handleCloseModal();
    loadRules();
  };

  const isModalOpen = view === 'create' || view === 'edit';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Rule Builder</h3>
          <p className="text-sm text-muted-foreground">Define global business logic and conditions.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Rule
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50 text-muted-foreground">
          No rules found. Start by creating one.
        </div>
      ) : (
        <div className="border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="text-xs bg-gray-50 uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {rule.name}
                    {rule.description && <div className="text-xs text-muted-foreground line-clamp-1">{rule.description}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{rule.priority}</td>
                  <td className="px-4 py-3">
                    <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {rule.is_active ? 'Active' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Nested Dialog for Editing/Creating */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-5xl h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{view === 'edit' ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
            <DialogDescription>
              Configure the conditions and logic for this rule.
            </DialogDescription>
          </DialogHeader>

          <RuleForm
            initialData={editingRule}
            isEditing={view === 'edit'}
            onCancel={handleCloseModal}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
