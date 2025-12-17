"use client"

import React, { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

export function showToast(message: string, type: ToastType = 'info', duration = 4000) {
  if (typeof window === 'undefined') return
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { id, message, type, duration } }))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Array<any>>([])

  useEffect(() => {
    function onToast(e: any) {
      const t = e.detail
      setToasts((s) => [...s, t])
      setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== t.id))
      }, t.duration || 4000)
    }

    window.addEventListener('app-toast', onToast as EventListener)
    return () => window.removeEventListener('app-toast', onToast as EventListener)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`max-w-sm px-4 py-2 rounded shadow text-white ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : t.type === 'warning' ? 'bg-yellow-600' : 'bg-gray-800'}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
