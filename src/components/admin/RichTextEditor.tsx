
"use client"

import { useState, useRef, useEffect } from "react"
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Code as CodeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoreHorizontal,
  ChevronDown,
  Sparkles,
  Type
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [currentBlock, setCurrentBlock] = useState("Paragraph")

  // Track active states
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false
  })

  // Update active states on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!contentRef.current || document.activeElement !== contentRef.current) return;

      setActiveStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
      })
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      if (document.activeElement === contentRef.current) return;
      contentRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg)
    if (contentRef.current) {
      contentRef.current.focus()
      // Force update states
      setActiveStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
      })
    }
  }

  const ToolButton = ({ icon: Icon, command, arg, active = false, onClick }: any) => (
    <Button
      variant="ghost"
      size="sm"
      onMouseDown={(e) => {
        e.preventDefault()
        if (onClick) {
          onClick()
        } else {
          execCommand(command, arg)
        }
      }}
      className={cn("h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80", active && "bg-muted text-foreground")}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  const insertImage = () => {
    const url = prompt("Enter Image URL:")
    if (url) execCommand("insertImage", url)
  }

  const insertVideo = () => {
    const url = prompt("Enter Video URL (YouTube embed or direct link):")
    if (url) {
      // Simple iframe embed for demo purposes, robust editor needs sanitization
      const embed = `< iframe width = "560" height = "315" src = "${url.replace('watch?v=', 'embed/')}" frameborder = "0" allowfullscreen ></iframe > `
      execCommand("insertHTML", embed)
    }
  }

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background shadow-sm", isFocused && "ring-2 ring-ring ring-offset-2", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/20 flex-wrap">
        {/* AI / Sparkles */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground"><Sparkles className="h-4 w-4" /></Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Paragraph Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-muted-foreground font-normal">
              {currentBlock} <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); execCommand("formatBlock", "<P>"); setCurrentBlock("Paragraph") }}>Paragraph</DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); execCommand("formatBlock", "<H1>"); setCurrentBlock("Heading 1") }}>Heading 1</DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); execCommand("formatBlock", "<H2>"); setCurrentBlock("Heading 2") }}>Heading 2</DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); execCommand("formatBlock", "<H3>"); setCurrentBlock("Heading 3") }}>Heading 3</DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); execCommand("formatBlock", "<H4>"); setCurrentBlock("Heading 4") }}>Heading 4</DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); execCommand("formatBlock", "<BLOCKQUOTE>"); setCurrentBlock("Blockquote") }}>Blockquote</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Formatting */}
        <ToolButton icon={Bold} command="bold" active={activeStates.bold} />
        <ToolButton icon={Italic} command="italic" active={activeStates.italic} />
        <ToolButton icon={Underline} command="underline" active={activeStates.underline} />
        <ToolButton icon={Type} onClick={() => {
          const color = prompt("Enter color (hex or name):", "#000000");
          if (color) execCommand("foreColor", color);
        }} />

        <div className="w-px h-4 bg-border mx-1" />

        {/* Alignment Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
              {activeStates.justifyCenter ? <AlignCenter className="h-4 w-4" /> :
                activeStates.justifyRight ? <AlignRight className="h-4 w-4" /> :
                  <AlignLeft className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); execCommand("justifyLeft") }}><AlignLeft className="h-4 w-4 mr-2" /> Left</DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); execCommand("justifyCenter") }}><AlignCenter className="h-4 w-4 mr-2" /> Center</DropdownMenuItem>
            <DropdownMenuItem onMouseDown={(e) => { e.preventDefault(); execCommand("justifyRight") }}><AlignRight className="h-4 w-4 mr-2" /> Right</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Media & Links */}
        <ToolButton icon={LinkIcon} onClick={() => {
          const url = prompt('Enter URL:')
          if (url) execCommand('createLink', url)
        }} />
        <ToolButton icon={ImageIcon} onClick={insertImage} />
        <ToolButton icon={Video} onClick={insertVideo} />

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground ml-auto"><MoreHorizontal className="h-4 w-4" /></Button>

        {/* Code View Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0 text-muted-foreground", showCode && "bg-muted text-foreground")}
          onClick={() => setShowCode(!showCode)}
        >
          <CodeIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="relative min-h-[200px]">
        {showCode ? (
          <textarea
            className="w-full h-full min-h-[200px] p-4 font-mono text-sm resize-none focus:outline-none bg-muted/10"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <div
            ref={contentRef}
            className="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none dark:prose-invert"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        )}
      </div>
    </div>
  )
}
