
"use client"

import { useState } from 'react';
import Loading from '@/components/ui/Loading';
import { useRouter } from 'next/navigation';
import { createRuleAction, updateRuleAction, evaluateRuleAction } from '@/actions/rules';
import { RulePayload, RuleCondition } from '@/lib/rules/engine';
import { Rule } from '@/lib/rules/service';
import { RuleBuilder } from './RuleBuilder';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

interface RuleFormProps {
  initialData?: any; // Rule from DB
  isEditing?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const DEFAULT_PAYLOAD: RuleCondition = {
  id: 'root',
  type: 'container',
  operator: 'AND',
  children: []
};

export function RuleForm({ initialData, isEditing, onCancel, onSuccess }: RuleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState(initialData?.priority || 0);
  const [payload, setPayload] = useState<RuleCondition>(initialData?.payload || DEFAULT_PAYLOAD);

  // Test Mode State
  const [testContext, setTestContext] = useState(JSON.stringify({
    cart: { total: 150, lineItems: { count: 3 } },
    customer: { email: 'test@example.com', totalSpent: 500 }
  }, null, 2));
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = { name, description, priority, payload, is_active: true };

      let result;
      if (isEditing && initialData?.id) {
        result = await updateRuleAction(initialData.id, data);
      } else {
        result = await createRuleAction(data);
      }

      if (result.success) {
        toast({ title: isEditing ? "Rule updated" : "Rule created" });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/admin/rules');
        }
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error saving rule", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      const context = JSON.parse(testContext);
      const res = await evaluateRuleAction(payload, context);
      if (res.success) {
        setTestResult(res.result ?? null);
      }
      else {
        alert("Evaluation failed");
      }
    } catch (e) {
      alert("Invalid JSON context");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Rule' : 'Create New Rule'}</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loading variant="inline" size="sm" />
                Saving...
              </>
            ) : 'Save Rule'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. High Value Customers" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Internal notes..." />
              </div>
              <div className="space-y-2">
                <Label>Priority (Higher runs first)</Label>
                <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conditions</CardTitle>
              <CardDescription>Define the logic for this rule.</CardDescription>
            </CardHeader>
            <CardContent>
              <RuleBuilder value={payload} onChange={setPayload} />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Rule</CardTitle>
              <CardDescription>Simulate a context to verify logic.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Context JSON</Label>
                <Textarea
                  value={testContext}
                  onChange={e => setTestContext(e.target.value)}
                  className="font-mono text-xs h-[300px]"
                />
              </div>
              <Button onClick={handleTest} className="w-full" variant="secondary">Run Test</Button>

              {testResult !== null && (
                <div className={`p-4 rounded text-center font-bold ${testResult ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Result: {testResult ? 'TRUE' : 'FALSE'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
