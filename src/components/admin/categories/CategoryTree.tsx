'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CategoryItem } from './CategoryItem'
import { Category } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface CategoryTreeProps {
  initialTree: Category[]
  locale: string
  onAdd: () => void
  onEdit: (category: Category) => void
  onDelete: (id: string) => Promise<void>
}

export function CategoryTree({ initialTree, locale, onAdd, onEdit, onDelete }: CategoryTreeProps) {
  const [tree, setTree] = useState<Category[]>(initialTree)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const flattenTree = (items: Category[]): Category[] => {
    let result: Category[] = []
    items.forEach((item) => {
      result.push(item)
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenTree(item.children))
      }
    })
    return result
  }

  const findCategory = (items: Category[], id: string): Category | undefined => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children) {
        const found = findCategory(item.children, id)
        if (found) return found
      }
    }
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      // Simplified local reordering logic for demo
      // In a real Shopware app, we'd handle nesting changes here
      const items = flattenTree(tree)
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)

      // Update backend
      const reorders = [
        { id: active.id as string, position: newIndex }
      ]

      await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorders })
      })

      // Refresh data (simplified)
      const res = await fetch(`/api/admin/categories?locale=${locale}`)
      const newTree = await res.json()
      setTree(newTree)
    }
  }

  const activeCategory = activeId ? findCategory(tree, activeId) : null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Categories</h2>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={flattenTree(tree)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
            {tree.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                locale={locale}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdate={() => { }}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCategory ? (
            <div className="p-4 bg-white border rounded shadow-lg opacity-80 cursor-grabbing">
              {activeCategory.translations[locale]?.name || 'Category'}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
