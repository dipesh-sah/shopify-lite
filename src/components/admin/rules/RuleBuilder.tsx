
"use client"

import { useState } from 'react';
import { RuleCondition, RuleOperator, ConditionOperator } from '@/lib/rules/engine';
import { FIELD_DEFINITIONS, OPERATOR_LABELS } from './definitions';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface RuleBuilderProps {
  value: RuleCondition;
  onChange: (value: RuleCondition) => void;
}

export function RuleBuilder({ value, onChange }: RuleBuilderProps) {
  // Ensure the root is always a container
  if (value.type !== 'container') {
    // Should typically be initialized as container, but handle safety
    return <div className="text-red-500">Root must be a container rule.</div>;
  }

  const updateNode = (newNode: RuleCondition) => {
    onChange(newNode);
  };

  return (
    <div className="space-y-4">
      <RuleContainer node={value} onChange={updateNode} isRoot={true} onDelete={() => { }} />
    </div>
  );
}

// --- Recursive Container Component ---

interface NodeProps {
  node: RuleCondition;
  onChange: (node: RuleCondition) => void;
  onDelete: () => void;
  isRoot?: boolean;
}

function RuleContainer({ node, onChange, onDelete, isRoot }: NodeProps) {
  const addChild = (type: 'condition' | 'container') => {
    const newChild: RuleCondition = type === 'container'
      ? { id: uuidv4(), type: 'container', operator: 'AND', children: [] }
      : { id: uuidv4(), type: 'condition', field: 'cart.total', conditionOperator: 'gte', value: '' };

    onChange({
      ...node,
      children: [...(node.children || []), newChild]
    });
  };

  const updateChild = (index: number, updatedChild: RuleCondition) => {
    const newChildren = [...(node.children || [])];
    newChildren[index] = updatedChild;
    onChange({ ...node, children: newChildren });
  };

  const removeChild = (index: number) => {
    const newChildren = [...(node.children || [])];
    newChildren.splice(index, 1);
    onChange({ ...node, children: newChildren });
  };

  return (
    <Card className={`border-l-4 ${isRoot ? 'border-l-primary' : 'border-l-blue-400 ml-6'} bg-gray-50/50`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            {isRoot ? 'When ' : 'Nested '}
          </div>
          <Select
            value={node.operator}
            onValueChange={(val) => onChange({ ...node, operator: val as RuleOperator })}
          >
            <SelectTrigger className="w-24 h-8 bg-white border-blue-200 text-blue-700 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">ALL</SelectItem>
              <SelectItem value="OR">ANY</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">of these conditions are true:</span>

          {!isRoot && (
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-3 pl-2 border-l-2 border-dashed border-gray-300">
          {(node.children || []).map((child, index) => (
            child.type === 'container' ? (
              <RuleContainer
                key={child.id}
                node={child}
                onChange={(updated) => updateChild(index, updated)}
                onDelete={() => removeChild(index)}
              />
            ) : (
              <RuleLeaf
                key={child.id}
                node={child}
                onChange={(updated) => updateChild(index, updated)}
                onDelete={() => removeChild(index)}
              />
            )
          ))}

          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => addChild('condition')} className="text-xs h-7 border-dashed">
              <Plus className="mr-1 h-3 w-3" /> Add Condition
            </Button>
            <Button variant="outline" size="sm" onClick={() => addChild('container')} className="text-xs h-7 border-dashed">
              <Plus className="mr-1 h-3 w-3" /> Add Nested Group
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Leaf Condition Component ---

function RuleLeaf({ node, onChange, onDelete }: NodeProps) {
  const definition = node.field ? FIELD_DEFINITIONS[node.field] : null;

  return (
    <div className="flex items-center gap-2 bg-white p-2 rounded border shadow-sm group">
      {/* Field Selector */}
      <Select
        value={node.field}
        onValueChange={(val) => {
          // Reset operator/value if type changes? For simplicity, we just keep defaults.
          onChange({ ...node, field: val, conditionOperator: FIELD_DEFINITIONS[val].operators[0], value: '' });
        }}
      >
        <SelectTrigger className="w-[200px] h-8 text-sm bg-transparent border-0 ring-0 focus:ring-0 shadow-none font-medium text-gray-700 hover:bg-gray-50">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(FIELD_DEFINITIONS).map(([key, def]) => (
            <SelectItem key={key} value={key}>{def.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Selector */}
      <Select
        value={node.conditionOperator}
        onValueChange={(val) => onChange({ ...node, conditionOperator: val as ConditionOperator })}
      >
        <SelectTrigger className="w-[180px] h-8 text-sm bg-gray-50 border-0 focus:ring-0 shadow-none text-gray-600">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(definition?.operators || []).map((op) => (
            <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value Input */}
      <div className="flex-1">
        {definition?.type === 'number' ? (
          <Input
            type="number"
            className="h-8 shadow-none"
            value={node.value}
            onChange={(e) => onChange({ ...node, value: parseFloat(e.target.value) })}
            placeholder="Value"
          />
        ) : (
          <Input
            type="text"
            className="h-8 shadow-none"
            value={node.value}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
            placeholder="Value"
          />
        )}
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
