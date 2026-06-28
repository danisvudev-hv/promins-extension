import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  kind: 'success' | 'error'
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, kind?: Toast['kind']) => void
  dismiss: (id: number) => void
}

let counter = 0

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, kind = 'success') => {
    const id = ++counter
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
