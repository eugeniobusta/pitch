import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK_SIZE = 1900;

// Native (iOS/Android): split large tokens across SecureStore chunks to stay
// within the 2 KB per-entry limit.
const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const count = await SecureStore.getItemAsync(`${key}_count`);
      if (!count) return null;
      const chunks: string[] = [];
      for (let i = 0; i < parseInt(count, 10); i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
        if (chunk == null) return null;
        chunks.push(chunk);
      }
      return chunks.join('');
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }
      await SecureStore.setItemAsync(`${key}_count`, String(chunks.length));
      await Promise.all(
        chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk)),
      );
    } catch {}
  },
  async removeItem(key: string): Promise<void> {
    try {
      const count = await SecureStore.getItemAsync(`${key}_count`);
      if (!count) return;
      const n = parseInt(count, 10);
      await Promise.all(
        Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)),
      );
      await SecureStore.deleteItemAsync(`${key}_count`);
    } catch {}
  },
};

// Web / SSR: use localStorage.
const webStorage = {
  getItem: (key: string) =>
    Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null),
  setItem: (key: string, value: string) =>
    Promise.resolve(typeof localStorage !== 'undefined' ? void localStorage.setItem(key, value) : undefined),
  removeItem: (key: string) =>
    Promise.resolve(typeof localStorage !== 'undefined' ? void localStorage.removeItem(key) : undefined),
};

// WebSocket transport:
//   - Native  → React Native's built-in WebSocket global (always present)
//   - Browser → the browser's native WebSocket
//   - SSR     → no-op class so Supabase Realtime doesn't throw at module init
class NoopWebSocket {
  static CONNECTING = 0 as const;
  static OPEN = 1 as const;
  static CLOSING = 2 as const;
  static CLOSED = 3 as const;
  readyState = 3;
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}

function resolveWsTransport(): any {
  if (Platform.OS !== 'web') {
    // React Native always has a global WebSocket — reference it by name
    // to avoid the module-level `typeof globalThis.WebSocket` pitfall
    // where RN may not attach it to globalThis.
    return (globalThis as any).WebSocket ?? WebSocket;
  }
  if (typeof globalThis.WebSocket !== 'undefined') return globalThis.WebSocket;
  return NoopWebSocket; // SSR / Node.js < 21
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<any>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : nativeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    transport: resolveWsTransport(),
  },
});
