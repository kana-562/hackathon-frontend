import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  chips?: string[];
}

interface LocationState {
  message: string;
  suggestedChips: string[];
  progress: { current: number; total: number };
}

export default function SellSupportPage() {
  const { draftSetId } = useParams<{ draftSetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState | null;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (state?.message) {
      return [{ sender: 'assistant', text: state.message, chips: state.suggestedChips ?? [] }];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(state?.progress ?? { current: 0, total: 5 });
  const [activeChips, setActiveChips] = useState<string[]>(state?.suggestedChips ?? []);
  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, sending]);

  // If no state (e.g., direct navigation), show a fallback greeting
  useEffect(() => {
    if (!state && draftSetId) {
      setMessages([{
        sender: 'assistant',
        text: 'セットについて教えてください。どんなものが入っていますか？',
        chips: ['まず確認したい', '箱に入っています', '袋に入っています'],
      }]);
    }
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending || !draftSetId) return;

    const userMsg: ChatMessage = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setActiveChips([]);
    setSending(true);

    try {
      const res = await api.sendSellMessage(Number(draftSetId), text);
      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: res.message,
        chips: res.suggestedChips ?? [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setProgress(res.progress);
      setActiveChips(res.suggestedChips ?? []);

      if (res.done) {
        // Brief pause then navigate to confirm
        setTimeout(() => {
          navigate(`/sell/confirm/${draftSetId}`);
        }, 1200);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'エラーが発生しました。もう一度試してください。',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleChipClick = (chip: string) => {
    setInput((prev) => prev ? `${prev}、${chip}` : chip);
  };

  const handleSubmit = () => {
    void sendMessage(input);
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="sell-support-page">
      {/* Header */}
      <div className="sell-support-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          type="button"
          aria-label="戻る"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="sell-support-title">出品サポート</span>
        <span className="sell-support-progress">
          {progress.current}/{progress.total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="sell-support-progress-bar">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Chat area */}
      <div className="sell-support-chat" ref={chatRef}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className={`chat-bubble ${msg.sender}`}>
              {msg.text}
            </div>
            {/* Show chips only for last assistant message when not sending */}
            {msg.sender === 'assistant' &&
              i === messages.length - 1 &&
              !sending &&
              activeChips.length > 0 && (
                <div className="chat-chips">
                  {activeChips.map((chip) => (
                    <button
                      key={chip}
                      className="chat-chip"
                      onClick={() => handleChipClick(chip)}
                      type="button"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
          </div>
        ))}

        {sending && (
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="sell-support-input-area">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            className="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="メッセージを入力..."
            disabled={sending}
            style={{ flex: 1 }}
          />
          <button
            className="chat-send-btn"
            onClick={handleSubmit}
            disabled={!input.trim() || sending}
            type="button"
            aria-label="送信"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
