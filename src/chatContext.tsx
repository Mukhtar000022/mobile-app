// Общий на всё приложение realtime-канал чата.
// Живёт, пока пользователь в аккаунте: одно WebSocket-соединение на всё
// приложение — благодаря этому значок непрочитанных обновляется на любом экране.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './auth';
import {
  ChatSocket,
  Conversation,
  ServerEvent,
  fetchConversations,
} from './chat';

type ChatValue = {
  socket: ChatSocket | null;
  conversations: Conversation[];
  totalUnread: number;
  reload: () => Promise<void>;
  /** Подписка на события сокета. Возвращает функцию отписки. */
  subscribe: (fn: (e: ServerEvent) => void) => () => void;
};

const ChatContext = createContext<ChatValue>({
  socket: null,
  conversations: [],
  totalUnread: 0,
  reload: async () => {},
  subscribe: () => () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const socketRef = useRef<ChatSocket | null>(null);
  const listeners = useRef(new Set<(e: ServerEvent) => void>());

  const reload = useCallback(async () => {
    if (!token) return;
    setConversations(await fetchConversations(token));
  }, [token]);

  useEffect(() => {
    if (!token) {
      socketRef.current?.close();
      socketRef.current = null;
      setConversations([]);
      return;
    }

    const s = new ChatSocket(token);
    socketRef.current = s;
    const off = s.on((e) => {
      // Список диалогов обновляем на входящие события — счётчики всегда свежие.
      if (e.type === 'message' || e.type === 'read') reload();
      listeners.current.forEach((fn) => fn(e));
    });
    s.connect();
    reload();

    return () => {
      off();
      s.close();
      socketRef.current = null;
    };
  }, [token, reload]);

  const subscribe = useCallback((fn: (e: ServerEvent) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const totalUnread = useMemo(
    () => conversations.reduce((n, c) => n + (c.unread || 0), 0),
    [conversations],
  );

  const value = useMemo<ChatValue>(
    () => ({ socket: socketRef.current, conversations, totalUnread, reload, subscribe }),
    // socketRef.current меняется вместе с token — этого достаточно
    [conversations, totalUnread, reload, subscribe, token, user?.id],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
