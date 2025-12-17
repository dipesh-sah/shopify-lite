
"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, ChevronLeft, Plus, MoreVertical, DollarSign, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getMeAction } from "@/actions/auth"
import { getThreadsAction, getMessagesAction, sendMessageAction, createThreadAction } from "@/actions/chat"
import { getDashboardStatsAction } from "@/actions/dashboard"
import { getAnalyticsUsageAction } from "@/actions/analytics"

interface User {
  id: string
  name: string
  email: string
}

interface Thread {
  id: string
  title: string
  lastMessage?: string
  unreadCount: number
  updated_at: string
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  senderName: string
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Views
  const [view, setView] = useState<'list' | 'chat'>('list')
  const [activeThread, setActiveThread] = useState<Thread | null>(null)

  // Data
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)

  // Stats Data
  const [stats, setStats] = useState<{ totalRevenue: number; totalOrders: number } | null>(null)
  const [salesData, setSalesData] = useState<{ date: string; revenue: number; orders: number }[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Init User & Stats
  useEffect(() => {
    getMeAction().then(setCurrentUser)
    Promise.all([
      getDashboardStatsAction(),
      getAnalyticsUsageAction()
    ]).then(([dashStats, analytics]) => {
      setStats({
        totalRevenue: dashStats.totalRevenue,
        totalOrders: dashStats.totalOrders
      })
      setSalesData(analytics.sales)
    }).catch(console.error)
  }, [])

  // 2. Poll Threads (Global)
  useEffect(() => {
    if (!currentUser) return

    function loadThreads() {
      getThreadsAction().then(data => {
        // Simple diff check could go here to avoid re-renders if deep equal
        setThreads(data as any)
      }).catch(console.error)
    }

    loadThreads()
    const interval = setInterval(loadThreads, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [currentUser])

  // 3. Poll Messages (Active Thread)
  useEffect(() => {
    if (!activeThread) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }

    function loadMessages() {
      if (!activeThread) return;
      getMessagesAction(activeThread.id).then(data => {
        setMessages(data as any)
      }).catch(console.error)
    }

    setLoading(true)
    loadMessages() // Initial load
    setLoading(false)

    // Poll frequently when active
    const interval = setInterval(loadMessages, 3000)
    pollingRef.current = interval

    return () => clearInterval(interval)
  }, [activeThread?.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleCreateThread = async () => {
    if (!currentUser) return;
    const title = prompt("Enter chat title (e.g., 'Internal Notes'):")
    if (!title) return

    try {
      setLoading(true)
      const newId = await createThreadAction(title, [currentUser.id])
      // Refresh threads immediately
      const updatedThreads = await getThreadsAction()
      setThreads(updatedThreads as any)

      // Open it
      const newThread = updatedThreads.find((t: any) => t.id === newId)
      if (newThread) {
        setActiveThread(newThread as any)
        setView('chat')
      }
    } catch (e) {
      console.error(e)
      alert("Failed to create thread")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !activeThread || !currentUser) return

    const content = inputValue
    setInputValue("") // Optimistic clear

    // Optimistic append
    const optimId = Date.now().toString()
    const optimMsg: Message = {
      id: optimId,
      sender_id: currentUser.id,
      content: content,
      created_at: new Date().toISOString(),
      senderName: currentUser.name
    }
    setMessages(prev => [...prev, optimMsg])

    try {
      await sendMessageAction(activeThread.id, content)
      // Polling will correct the ID later
    } catch (e) {
      console.error(e)
      // Remove optimistic? Or show error.
    }
  }

  if (!currentUser) return null // Don't show if not logged in

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-[350px] h-[550px] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">

          {/* Header */}
          <div className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between shadow-sm z-10">
            {view === 'chat' && activeThread ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setView('list')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm leading-none">{activeThread.title}</span>
                  <span className="text-[10px] opacity-70">Active Now</span>
                </div>
              </div>
            ) : (
              <span className="font-semibold tracking-tight">Messaging</span>
            )}
            <div className="flex items-center gap-1">
              {view === 'list' && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={handleCreateThread}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden bg-muted/5 relative flex flex-col">

            {/* Quick Stats Chart (Only in List View) */}
            {view === 'list' && stats && (
              <div className="px-4 py-3 bg-card border-b space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-bold">REVENUE</span>
                    <span className="text-xs font-bold">${stats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground font-bold">ORDERS</span>
                    <span className="text-xs font-bold">+{stats.totalOrders}</span>
                  </div>
                </div>

                {/* Mini Chart */}
                <div className="h-12 flex items-end gap-1.5 pt-2 border-t border-dashed border-muted/50">
                  {salesData.length > 0 ? salesData.slice(-7).map((day, i) => {
                    const max = Math.max(...salesData.slice(-7).map(d => d.revenue), 1)
                    const height = Math.max((day.revenue / max) * 100, 10) // Min 10% height
                    return (
                      <div key={i} className="flex-1 bg-primary/20 rounded-sm relative group cursor-default" style={{ height: `${height}%` }}>
                        <div className="absolute bottom-0 w-full h-full bg-primary/60 hover:bg-primary transition-colors rounded-sm" />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-20">
                          ${day.revenue}
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                      No sales data
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Thread List */}
            {view === 'list' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {threads.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <MessageCircle className="h-6 w-6 opacity-20" />
                    </div>
                    <p className="text-sm font-medium">No conversations yet</p>
                    <p className="text-xs text-muted-foreground mb-4">Start a new chat to collaborate.</p>
                    <Button size="sm" onClick={handleCreateThread}>Start a Chat</Button>
                  </div>
                ) : (
                  threads.map(thread => (
                    <button
                      key={thread.id}
                      onClick={() => { setActiveThread(thread); setView('chat') }}
                      className="w-full text-left p-3 rounded-lg bg-card border hover:border-primary/50 hover:shadow-sm transition-all group relative"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{thread.title}</span>
                        {thread.unreadCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 h-4 flex items-center justify-center rounded-full">{thread.unreadCount}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 h-4 pr-12">
                        {thread.lastMessage || "No messages yet"}
                      </p>
                      <span className="text-[10px] text-muted-foreground absolute bottom-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
                        {new Date(thread.updated_at).toLocaleDateString()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Chat Window */}
            {view === 'chat' && activeThread && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                      <MessageCircle className="h-8 w-8 mb-2" />
                      <span className="text-xs">Start the conversation...</span>
                    </div>
                  )}
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUser.id
                    return (
                      <div key={idx} className={cn("flex flex-col max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-medium text-muted-foreground">{msg.senderName}</span>
                          <span className="text-[9px] text-muted-foreground opacity-50">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={cn(
                          "px-3 py-2 rounded-2xl text-sm shadow-sm",
                          isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <form onSubmit={handleSendMessage} className="p-3 bg-background border-t flex gap-2 items-center">
                  <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-input transition-colors"
                  />
                  <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0" disabled={!inputValue.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-xl p-0 bg-primary hover:bg-primary/90 transition-all hover:scale-105 hover:rotate-3"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  )
}
