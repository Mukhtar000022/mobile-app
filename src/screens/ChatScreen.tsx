import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import { colors } from '../theme';
import { useI18n } from '../i18n';
import { useAuth } from '../auth';
import { useChat } from '../chatContext';
import {
  ChatMessage,
  ChatPeer,
  Conversation,
  fetchContacts,
  fetchMessages,
  markConversationRead,
  openConversation,
  sendMessageRest,
} from '../chat';

const initials = (p: { firstname: string; surname: string }) =>
  `${(p.firstname || '?').slice(0, 1)}${(p.surname || '').slice(0, 1)}`.toUpperCase();

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ChatScreen() {
  const { t } = useI18n();
  const { token } = useAuth();
  const { conversations, reload, socket } = useChat();

  const [contacts, setContacts] = useState<ChatPeer[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [query, setQuery] = useState('');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (token) fetchContacts(token).then(setContacts);
  }, [token]);

  // Единый список: показываем ВСЕХ собеседников группы, а у тех, с кем
  // переписка уже идёт, подставляем последнее сообщение и непрочитанные.
  const rows = contacts.map((peer) => {
    const conv = conversations.find((c) => c.peer.id === peer.id) || null;
    return { peer, conv };
  });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter(({ peer }) =>
        `${peer.firstname} ${peer.surname} ${(peer.children || []).join(' ')}`.toLowerCase().includes(q),
      )
    : rows;

  // Сверху — активные переписки (свежие первыми), затем остальные по алфавиту.
  const sorted = [...filtered].sort((a, b) => {
    const aT = a.conv?.last_message ? Date.parse(a.conv.last_message.created_at) : 0;
    const bT = b.conv?.last_message ? Date.parse(b.conv.last_message.created_at) : 0;
    if (aT !== bT) return bT - aT;
    return `${a.peer.surname}${a.peer.firstname}`.localeCompare(`${b.peer.surname}${b.peer.firstname}`);
  });

  // Открыть переписку: существующую или новую (создаётся при первом обращении).
  const openWith = async (peer: ChatPeer, conv: Conversation | null) => {
    if (conv) return setActive(conv);
    if (!token || opening) return;
    setOpening(true);
    const created = await openConversation(peer.id, token);
    setOpening(false);
    if (created) {
      await reload();
      setActive(created);
    }
  };

  if (active) {
    return (
      <Thread
        conversation={active}
        onBack={() => {
          setActive(null);
          reload();
        }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.listPad} keyboardShouldPersistTaps="handled">
      {contacts.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="users" size={40} color={colors.navInactive} />
          <Text style={styles.emptyText}>{t('chat.empty')}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>
            {t('chat.contacts_title')} · {contacts.length}
          </Text>

          {contacts.length > 4 && (
            <View style={styles.searchWrap}>
              <AppIcon name="account" size={17} color={colors.navInactive} />
              <TextInput
                style={styles.search}
                placeholder={t('chat.search')}
                placeholderTextColor="#c4a99b"
                value={query}
                onChangeText={setQuery}
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <AppIcon name="x" size={17} color={colors.navInactive} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {sorted.length === 0 && <Text style={styles.emptyThread}>{t('chat.nothing_found')}</Text>}

          {sorted.map(({ peer, conv }) => {
            const subtitle = conv?.last_message
              ? conv.last_message.text
              : peer.children && peer.children.length
                ? peer.children.join(', ')
                : peer.role === 'tutor'
                  ? t('login.role_tutor')
                  : t('login.role_parent');
            return (
              <TouchableOpacity
                key={peer.id}
                style={styles.row}
                onPress={() => openWith(peer, conv)}
                activeOpacity={0.8}
              >
                <View style={[styles.avatar, !conv && styles.avatarGhost]}>
                  <Text style={[styles.avatarText, !conv && { color: colors.muted }]}>{initials(peer)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {peer.firstname} {peer.surname}
                  </Text>
                  <Text style={styles.rowLast} numberOfLines={1}>
                    {subtitle}
                  </Text>
                </View>
                <View style={styles.rowSide}>
                  {conv?.last_message ? (
                    <Text style={styles.rowTime}>{timeOf(conv.last_message.created_at)}</Text>
                  ) : (
                    <AppIcon name="chevron-right" size={18} color={colors.navInactive} />
                  )}
                  {!!conv && conv.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{conv.unread}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {!socket?.connected && contacts.length > 0 && (
        <Text style={styles.offline}>{t('chat.reconnecting')}</Text>
      )}
    </ScrollView>
  );
}

/* ------------------------------- Переписка ------------------------------- */

function Thread({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const { t } = useI18n();
  const { token, user } = useAuth();
  const { socket, subscribe, reload } = useChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [peerTyping, setPeerTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  // История + отметка «прочитано» при открытии.
  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      const list = await fetchMessages(conversation.id, token);
      if (!alive) return;
      setMessages(list);
      setLoading(false);
      scrollDown();
      if (!socket?.markRead(conversation.id)) await markConversationRead(conversation.id, token);
      reload();
    })();
    return () => {
      alive = false;
    };
  }, [conversation.id, token]);

  // Realtime: новые сообщения и «печатает…».
  useEffect(() => {
    return subscribe((e) => {
      if (e.type === 'message' && e.conversation_id === conversation.id) {
        setMessages((prev) => (prev.some((m) => m.id === e.message.id) ? prev : [...prev, e.message]));
        scrollDown();
        // Мы в открытом чате — сразу помечаем входящее прочитанным.
        if (e.message.sender_user_id !== user?.id) socket?.markRead(conversation.id);
      }
      if (e.type === 'typing' && e.conversation_id === conversation.id) {
        setPeerTyping(e.on);
      }
      if (e.type === 'read' && e.conversation_id === conversation.id && e.by_user_id !== user?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.sender_user_id === user?.id && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)),
        );
      }
    });
  }, [conversation.id, subscribe, socket, user?.id, scrollDown]);

  const send = useCallback(
    async (value: string) => {
      if (!value || !token) return;
      // Сокет быстрее; если он не подключён — уходим через REST.
      if (!socket?.sendMessage(conversation.id, value)) {
        const saved = await sendMessageRest(conversation.id, value, token);
        if (saved) {
          setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
          scrollDown();
        }
      }
    },
    [conversation.id, socket, token, scrollDown],
  );

  const notifyTyping = useCallback(
    (on: boolean) => {
      socket?.typing(conversation.id, on);
    },
    [conversation.id, socket],
  );

  return (
    <KeyboardAvoidingView
      style={styles.threadRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.threadBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <AppIcon name="arrow-left" size={20} color={colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.avatarSm}>
          <Text style={[styles.avatarText, { fontSize: 13 }]}>{initials(conversation.peer)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.threadName} numberOfLines={1}>
            {conversation.peer.firstname} {conversation.peer.surname}
          </Text>
          <Text style={styles.threadRole}>
            {peerTyping
              ? t('chat.typing')
              : conversation.peer.role === 'tutor'
                ? t('login.role_tutor')
                : t('login.role_parent')}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.msgPad} onContentSizeChange={scrollDown}>
          {messages.length === 0 && <Text style={styles.emptyThread}>{t('chat.no_messages')}</Text>}
          {messages.map((m) => {
            const mine = m.sender_user_id === user?.id;
            return (
              <View key={m.id} style={[styles.bubbleWrap, mine ? styles.bubbleRight : styles.bubbleLeft]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.msgText, mine && { color: '#fff' }]}>{m.text}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.msgTime, mine && { color: 'rgba(255,255,255,0.75)' }]}>
                      {timeOf(m.created_at)}
                    </Text>
                    {mine && (
                      <Text style={[styles.msgTime, { color: 'rgba(255,255,255,0.9)' }]}>
                        {m.read_at ? ' ✓✓' : ' ✓'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <MessageInput placeholder={t('chat.placeholder')} onSend={send} onTyping={notifyTyping} />
    </KeyboardAvoidingView>
  );
}

/* ------------------------------ Поле ввода ------------------------------ */

/**
 * Поле ввода сообщения — НЕуправляемое (без пропа `value`).
 *
 * Это принципиально для кириллицы: русская и казахская клавиатуры на Android
 * набирают слово «составным» вводом (composing region). Если на каждый символ
 * возвращать текст обратно через `value`, система сбрасывает набор — буквы
 * пропадают, и проходят только латинские, которые вводятся посимвольно.
 * Поэтому текст живёт в ref, а состояние меняется лишь при переходе
 * «пусто ↔ не пусто» (для активности кнопки отправки).
 */
const MessageInput = React.memo(function MessageInput({
  placeholder,
  onSend,
  onTyping,
}: {
  placeholder: string;
  onSend: (text: string) => void;
  onTyping: (on: boolean) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const textRef = useRef('');
  const [hasText, setHasText] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTyping = useRef(0);

  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  const change = (v: string) => {
    textRef.current = v;
    const filled = v.trim().length > 0;
    // Перерисовываем только когда кнопка меняет состояние, а не на каждый символ.
    setHasText((prev) => (prev === filled ? prev : filled));

    // «печатает…» отправляем не чаще раза в секунду.
    const now = Date.now();
    if (now - lastTyping.current > 1000) {
      lastTyping.current = now;
      onTyping(true);
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => onTyping(false), 1500);
  };

  const submit = () => {
    const text = textRef.current.trim();
    if (!text) return;
    inputRef.current?.clear();
    textRef.current = '';
    setHasText(false);
    if (stopTimer.current) clearTimeout(stopTimer.current);
    onTyping(false);
    onSend(text);
  };

  return (
    <View style={styles.inputBar}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#c4a99b"
        onChangeText={change}
        multiline
        // Раскладку не ограничиваем: клавиатура свободно переключается
        // между русским, казахским и английским.
        autoCapitalize="sentences"
      />
      <TouchableOpacity
        style={[styles.sendBtn, !hasText && styles.sendBtnOff]}
        onPress={submit}
        disabled={!hasText}
      >
        <AppIcon name="send" size={19} color="#fff" />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  listPad: { padding: 16, paddingBottom: 30 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { color: colors.muted, fontSize: 14, fontWeight: '700', textAlign: 'center', fontFamily: 'Nunito_700Bold' },

  sectionLabel: {
    fontSize: 11.5,
    letterSpacing: 0.6,
    color: colors.muted,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 10,
    fontFamily: 'Nunito_800ExtraBold',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#e6d3c8',
    borderRadius: 14,
    paddingHorizontal: 13,
    marginBottom: 12,
  },
  search: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.text,
    fontFamily: 'Nunito_600SemiBold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.heroBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGhost: { backgroundColor: '#f4efec' },
  avatarSm: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.heroBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.primaryDark, fontFamily: 'Nunito_800ExtraBold' },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  rowLast: { fontSize: 12.5, color: colors.muted, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  rowSide: { alignItems: 'flex-end', gap: 5 },
  rowTime: { fontSize: 11, color: colors.navInactive, fontFamily: 'Nunito_600SemiBold' },
  badge: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', fontFamily: 'Nunito_800ExtraBold' },
  offline: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 14, fontFamily: 'Nunito_600SemiBold' },

  threadRoot: { flex: 1, backgroundColor: colors.bg },
  threadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  threadName: { fontSize: 15, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' },
  threadRole: { fontSize: 11.5, color: colors.muted, fontFamily: 'Nunito_600SemiBold' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgPad: { padding: 14, paddingBottom: 20 },
  emptyThread: { textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: 40, fontFamily: 'Nunito_600SemiBold' },
  bubbleWrap: { marginBottom: 8, flexDirection: 'row' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleTheirs: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgText: { fontSize: 14.5, color: colors.text, lineHeight: 20, fontFamily: 'Nunito_600SemiBold' },
  metaRow: { flexDirection: 'row', alignSelf: 'flex-end', marginTop: 3 },
  msgTime: { fontSize: 10.5, color: colors.navInactive, fontFamily: 'Nunito_600SemiBold' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
    padding: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    borderWidth: 1.5,
    borderColor: '#e6d3c8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14.5,
    color: colors.text,
    backgroundColor: '#FFFBF9',
    fontFamily: 'Nunito_600SemiBold',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.45 },
});
