'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Category } from '@/lib/categories'
import { ChevronRight, ChevronDown, GripVertical, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CategoryItemProps {
  category: Category
  locale: string
  onEdit: (category: Category) => void
  onDelete: (id: string) => Promise<void>
  onUpdate: () => void
}

export function CategoryItem({ category, locale, onEdit, onDelete, onUpdate }: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    marginLeft: `${category.level * 24}px`
  }

  const name = category.translations[locale]?.name || 'Untitled Category'

  return (
    <div ref={setNodeRef} style={style} className={cn("group", isDragging && "opacity-50")}>
      <div className="flex items-center gap-2 p-2 bg-background border rounded-md hover:border-primary/50 transition-colors shadow-sm">
        <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="w-4 h-4" />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "p-1 hover:bg-muted rounded transition-transform",
            category.children && category.children.length === 0 && "opacity-0 cursor-default"
          )}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <span className="flex-1 font-medium flex items-center gap-2">
          {name}
          {category.hideFromNav && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Hidden
            </span>
          )}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(category)}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm('Are you sure?')) onDelete(category.id)
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded && category.children && category.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {category.children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              locale={locale}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
