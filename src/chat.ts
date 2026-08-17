// Чат «воспитатель ↔ родитель»: REST для истории и WebSocket для realtime.
import { API_BASE_URL } from './api';

export type ChatPeer = {
  id: number;
  user_id: number;
  firstname: string;
  surname: string;
  role: 'tutor' | 'parent';
  /** Дети этого родителя в группе воспитателя — подпись в списке. */
  children?: string[];
};

export type ChatMessage = {
  id: number;
  conversation_id: number;
  sender_user_id: number;
  sender_role: 'tutor' | 'parent';
  text: string;
  read_at: string | null;
  created_at: string;
};

export type Conversation = {
  id: number;
  peer: ChatPeer;
  last_message: { id: number; text: string; created_at: string; sender_user_id: number } | null;
  unread: number;
  last_message_at: string;
};

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function req<T>(path: string, token: string, init: RequestInit = {}, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { ...headers(token), ...(init.headers || {}) },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (e) {
    return fallback;
  }
}

export const fetchConversations = (token: string) =>
  req<Conversation[]>('/api/chat/conversations', token, {}, []);

export const fetchContacts = (token: string) => req<ChatPeer[]>('/api/chat/contacts', token, {}, []);

export const fetchMessages = (conversationId: number, token: string) =>
  req<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages`, token, {}, []);

export const openConversation = (peerId: number, token: string) =>
  req<Conversation | null>(
    '/api/chat/conversations',
    token,
    { method: 'POST', body: JSON.stringify({ peer_id: peerId }) },
    null,
  );

export const markConversationRead = (conversationId: number, token: string) =>
  req<{ ok: boolean }>(`/api/chat/conversations/${conversationId}/read`, token, { method: 'POST' }, { ok: false });

// Отправка через REST — запасной путь, когда сокет не подключён.
export async function sendMessageRest(
  conversationId: number,
  text: string,
  token: string,
): Promise<ChatMessage | null> {
  return req<ChatMessage | null>(
    `/api/chat/conversations/${conversationId}/messages`,
    token,
    { method: 'POST', body: JSON.stringify({ text }) },
    null,
  );
}

/* ------------------------------- WebSocket ------------------------------- */

export type ServerEvent =
  | { type: 'ready'; user_id: number }
  | { type: 'message'; conversation_id: number; message: ChatMessage }
  | { type: 'read'; conversation_id: number; by_user_id: number; count: number }
  | { type: 'typing'; conversation_id: number; user_id: number; on: boolean }
  | { type: 'error'; error: string }
  | { type: 'pong' };

type Listener = (e: ServerEvent) => void;

// ws://…/ws — тот же хост и порт, что у REST.
function wsUrl(token: string) {
  const base = API_BASE_URL.replace(/^http/, 'ws');
  return `${base}/ws?token=${encodeURIComponent(token)}`;
}

/**
 * Клиент realtime-чата с автопереподключением.
 * Живёт, пока пользователь в аккаунте: connect() при входе, close() при выходе.
 */
export class ChatSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private listeners = new Set<Listener>();
  private retry = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private closedByUs = false;
  connected = false;

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    this.closedByUs = false;
    this.open();
  }

  private open() {
    try {
      this.ws = new WebSocket(wsUrl(this.token));
    } catch (e) {
      return this.scheduleReconnect();
    }

    this.ws.onopen = () => {
      this.connected = true;
      this.retry = 0;
    };

    this.ws.onmessage = (ev) => {
      let data: ServerEvent;
      try {
        data = JSON.parse(String(ev.data));
      } catch (e) {
        return;
      }
      this.listeners.forEach((l) => l(data));
    };

    this.ws.onerror = () => {
      /* реальную обработку делает onclose */
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.ws = null;
      if (!this.closedByUs) this.scheduleReconnect();
    };
  }

  // Переподключение с нарастающей паузой: 1с, 2с, 4с… но не дольше 15с.
  private scheduleReconnect() {
    if (this.closedByUs || this.timer) return;
    const delay = Math.min(1000 * 2 ** this.retry, 15000);
    this.retry += 1;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.open();
    }, delay);
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private raw(payload: object): boolean {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  // true — ушло по сокету; false — нужно отправить через REST.
  sendMessage(conversationId: number, text: string) {
    return this.raw({ type: 'send', conversation_id: conversationId, text });
  }

  markRead(conversationId: number) {
    return this.raw({ type: 'read', conversation_id: conversationId });
  }

  typing(conversationId: number, on: boolean) {
    return this.raw({ type: 'typing', conversation_id: conversationId, on });
  }

  close() {
    this.closedByUs = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.listeners.clear();
    try {
      this.ws?.close();
    } catch (e) {
      /* игнорируем */
    }
    this.ws = null;
    this.connected = false;
  }
}
