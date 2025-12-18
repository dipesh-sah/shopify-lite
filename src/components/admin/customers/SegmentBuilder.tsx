"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

// Unique fields for Customer Segmentation
const SEGMENT_FIELDS = {
  'orders_count': { label: 'Number of Orders', type: 'number', operators: ['equals', 'gt', 'lt', 'gte', 'lte'] },
  'total_spent': { label: 'Total Spent', type: 'number', operators: ['equals', 'gt', 'lt', 'gte', 'lte'] },
  'accepts_marketing': { label: 'Accepts Marketing', type: 'boolean', operators: ['equals'] },
  'country_code': { label: 'Country Code', type: 'string', operators: ['equals', 'contains'] },
  'tags': { label: 'Tags', type: 'string', operators: ['contains'] },
  // 'last_order_date': { label: 'Last Order Date', type: 'date', operators: ['gt', 'lt'] } // Needs date picker handling
}

interface SegmentBuilderProps {
  value: any
  onChange: (value: any) => void
}

export function SegmentBuilder({ value, onChange }: SegmentBuilderProps) {
  // If no value, we can't render the builder properly.
  // The parent should provide an initial value.
  if (!value) {
    return <div className="p-4 text-center text-muted-foreground">No rules defined.</div>
  }

  function updateNode(path: number[], updates: any) {
    const newValue = JSON.parse(JSON.stringify(value))
    let target = newValue
    for (const index of path) {
      target = target.children[index]
    }
    Object.assign(target, updates)
    onChange(newValue)
  }

  function addNode(path: number[], type: 'condition' | 'container') {
    const newValue = JSON.parse(JSON.stringify(value))
    let target = newValue
    for (const index of path) {
      target = target.children[index]
    }

    if (!target.children) target.children = []

    if (type === 'condition') {
      target.children.push({ type: 'condition', field: 'total_spent', operator: 'gt', value: 0 })
    } else {
      target.children.push({
        type: 'container',
        operator: 'AND',
        children: [{ type: 'condition', field: 'total_spent', operator: 'gt', value: 0 }]
      })
    }
    onChange(newValue)
  }

  function removeNode(path: number[]) {
    const newValue = JSON.parse(JSON.stringify(value))
    // If removing root, reset
    if (path.length === 0) {
      onChange(null)
      return
    }

    const parentPath = path.slice(0, -1)
    const childIndex = path[path.length - 1]

    let parent = newValue
    for (const index of parentPath) {
      parent = parent.children[index]
    }
    parent.children.splice(childIndex, 1)
    onChange(newValue)
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-background">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Customer Filters</h3>
      </div>
      <SegmentNode
        node={value}
        path={[]}
        updateNode={updateNode}
        addNode={addNode}
        removeNode={removeNode}
        isRoot={true}
      />
    </div>
  )
}

function SegmentNode({ node, path, updateNode, addNode, removeNode, isRoot }: any) {
  if (node.type === 'container') {
    return (
      <div className={`space-y-3 ${!isRoot ? 'pl-4 border-l-2 border-dashed ml-2' : ''}`}>
        <div className="flex items-center gap-2">
          {!isRoot && <span className="text-xs text-muted-foreground uppercase">Group</span>}
          <Select
            value={node.operator}
            onValueChange={val => updateNode(path, { operator: val })}
          >
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">ALL match</SelectItem>
              <SelectItem value="OR">ANY match</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 ml-auto">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => addNode(path, 'condition')}>
              <Plus className="h-3 w-3 mr-1" /> Rule
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => addNode(path, 'container')}>
              <Plus className="h-3 w-3 mr-1" /> Group
            </Button>
            {!isRoot && (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => removeNode(path)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {node.children?.map((child: any, i: number) => (
            <SegmentNode
              key={i}
              node={child}
              path={[...path, i]}
              updateNode={updateNode}
              addNode={addNode}
              removeNode={removeNode}
            />
          ))}
          {(!node.children || node.children.length === 0) && (
            <p className="text-xs text-muted-foreground p-2">No rules. Add one above.</p>
          )}
        </div>
      </div>
    )
  }

  // LEAF NODE (Condition)
  const fieldDef = SEGMENT_FIELDS[node.field as keyof typeof SEGMENT_FIELDS] || SEGMENT_FIELDS['total_spent']

  return (
    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border text-sm">
      <Select
        value={node.field}
        onValueChange={val => updateNode(path, { field: val, value: '' })} // Reset value on field change
      >
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SEGMENT_FIELDS).map(([key, def]) => (
            <SelectItem key={key} value={key}>{def.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={node.operator}
        onValueChange={val => updateNode(path, { operator: val })}
      >
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fieldDef.operators.map(op => (
            <SelectItem key={op} value={op}>{op.replace('_', ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {fieldDef.type === 'boolean' ? (
        <Select
          value={String(node.value)}
          onValueChange={val => updateNode(path, { value: val === 'true' })}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          className="h-8 text-xs flex-1 min-w-[100px]"
          type={fieldDef.type === 'number' ? 'number' : 'text'}
          value={node.value}
          onChange={e => updateNode(path, { value: fieldDef.type === 'number' ? Number(e.target.value) : e.target.value })}
          placeholder="Value..."
        />
      )}

      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-auto" onClick={() => removeNode(path)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
