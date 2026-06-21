import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_DM_MESSAGES, MOCK_DM_ROOMS } from '../api/mock';
import { DMMessage, DMRoom } from '../types';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { getStoredUser } from '../api/client';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DMRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const currentUser = getStoredUser();
  const myId = currentUser?.id ?? 0;

  const [room, setRoom] = useState<DMRoom | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const rId = Number(roomId);
    if (!rId) return;

    const fetchData = async () => {
      try {
        const [roomsData, msgsData] = await Promise.all([
          api.getDMRooms(),
          api.getDMMessages(rId),
        ]);
        const found = (roomsData ?? []).find((r: DMRoom) => r.id === rId);
        setRoom(found ?? null);
        setMessages(msgsData ?? []);
        void api.markDMRead(rId).catch(() => {});
      } catch {
        setRoom(MOCK_DM_ROOMS.find((r) => r.id === rId) ?? null);
        setMessages(MOCK_DM_MESSAGES.filter((m) => m.roomId === rId));
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [isLoggedIn, navigate, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!isLoggedIn || !roomId) return;
    const rId = Number(roomId);
    const interval = setInterval(async () => {
      try {
        const msgsData = await api.getDMMessages(rId);
        if (msgsData) setMessages(msgsData);
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn, roomId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');

    const optimistic: DMMessage = {
      id: Date.now(),
      roomId: Number(roomId),
      senderId: myId,
      body: text,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const sent = await api.sendDMMessage(Number(roomId), text);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? sent : m))
      );
    } catch {
      // keep optimistic message
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner message="読み込み中..." />
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <button className="back-button" onClick={() => navigate('/dm')} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{room?.partnerName ?? '...'}</p>
          {room?.setTitle && (
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>📦 {room.setTitle}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingBottom: 80,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 32 }}>
            メッセージを送ってみましょう
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === myId;
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 6,
              }}
            >
              {!isMine && (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {room?.partnerName.charAt(0) ?? '?'}
                </div>
              )}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 2 }}>
                <div style={{
                  background: isMine ? 'var(--color-primary)' : 'white',
                  color: isMine ? 'white' : 'var(--color-text)',
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '10px 14px',
                  fontSize: 14,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  wordBreak: 'break-word',
                }}>
                  {msg.body}
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: 'fixed',
        bottom: 'var(--bottom-nav-height)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'white',
        borderTop: '1px solid var(--color-border)',
        padding: '10px 16px',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        zIndex: 50,
      }}>
        <input
          ref={inputRef}
          style={{
            flex: 1,
            border: '1.5px solid var(--color-border)',
            borderRadius: 24,
            padding: '10px 16px',
            fontSize: 14,
            outline: 'none',
            background: 'var(--color-bg)',
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && void handleSend()}
          placeholder="メッセージを入力..."
          disabled={sending}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: input.trim() ? 'var(--color-primary)' : '#ccc',
            border: 'none',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
          aria-label="送信"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
