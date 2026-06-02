import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
  unreadNotifications: number;
  unreadMessages: number;
  setUnreadNotifications: (n: number) => void;
  setUnreadMessages: (n: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  unreadNotifications: 0,
  unreadMessages: 0,
  showToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
  setUnreadMessages: (unreadMessages) => set({ unreadMessages }),
}));
