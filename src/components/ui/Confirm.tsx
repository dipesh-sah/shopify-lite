"use client"

import React, { useEffect, useState } from 'react'

type ConfirmPayload = { id: string; title?: string; message: string }

export function showConfirm(message: string, title?: string) {
  if (typeof window === 'undefined') return Promise.resolve(false)
  const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
  const ev = new CustomEvent('app-confirm', { detail: { id, message, title } })
  window.dispatchEvent(ev)

  return new Promise<boolean>((resolve) => {
    function handler(e: any) {
      if (e.detail?.id !== id) return
      window.removeEventListener('app-confirm-response', handler as EventListener)
      resolve(Boolean(e.detail?.result))
    }
    window.addEventListener('app-confirm-response', handler as EventListener)
  })
}

export default function ConfirmContainer() {
  const [pending, setPending] = useState<ConfirmPayload | null>(null)

  useEffect(() => {
    function onConfirm(e: any) {
      setPending(e.detail)
    }
    window.addEventListener('app-confirm', onConfirm as EventListener)
    return () => window.removeEventListener('app-confirm', onConfirm as EventListener)
  }, [])

  if (!pending) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="bg-white rounded-lg p-6 z-10 max-w-md w-full">
        {pending.title && <h3 className="text-lg font-semibold mb-2">{pending.title}</h3>}
        <p className="mb-4">{pending.message}</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded border" onClick={() => {
            window.dispatchEvent(new CustomEvent('app-confirm-response', { detail: { id: pending.id, result: false } }))
            setPending(null)
          }}>Cancel</button>
          <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => {
            window.dispatchEvent(new CustomEvent('app-confirm-response', { detail: { id: pending.id, result: true } }))
            setPending(null)
          }}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
