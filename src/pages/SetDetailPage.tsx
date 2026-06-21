import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_SET_DETAIL } from '../api/mock';
import { StarterSetDetail, SetItemDTO, RecommendedItemDTO } from '../types';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

// ────────────────────────────────────────────
// Question Bottom Sheet
// ────────────────────────────────────────────

interface QuestionMessage {
  sender: 'user' | 'assistant';
  text: string;
}

const SUGGESTED_CHIPS = [
  '初心者でも大丈夫？',
  '他に何が必要？',
  '新品より安い？',
  'どれくらいで始められる？',
  '状態は問題なさそう？',
];

interface QuestionBottomSheetProps {
  setId: number;
  onClose: () => void;
}

function QuestionBottomSheet({ setId, onClose }: QuestionBottomSheetProps) {
  const [messages, setMessages] = useState<QuestionMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [usedChips, setUsedChips] = useState<Set<string>>(new Set());
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, sending]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg: QuestionMessage = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const res = await api.askQuestion(setId, text);
      setMessages((prev) => [...prev, { sender: 'assistant', text: res.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'エラーが発生しました。もう一度お試しください。' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleChipClick = (chip: string) => {
    setUsedChips((prev) => new Set([...prev, chip]));
    void sendMessage(chip);
  };

  const handleSubmit = () => {
    void sendMessage(input);
  };

  const availableChips = SUGGESTED_CHIPS.filter((c) => !usedChips.has(c));

  return (
    <div className="bottom-sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="bottom-sheet-title">このセットについて聞く</p>
              <p className="bottom-sheet-subtitle">このセットについて何でも聞いてください</p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)' }}
              type="button"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="chat-area" ref={chatAreaRef}>
          {messages.length === 0 && (
            <div className="chat-bubble assistant">
              こんにちは！このセットについて気になることがあれば何でも聞いてください。
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {sending && (
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}
          {!sending && availableChips.length > 0 && (
            <div className="chat-chips">
              {availableChips.map((chip) => (
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

        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && handleSubmit()}
            placeholder="質問を入力..."
            disabled={sending}
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

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function conditionClass(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('良') || l.includes('美') || l.includes('good')) return 'good';
  if (l.includes('可') || l.includes('fair')) return 'fair';
  return 'poor';
}

function importanceClass(importance: string): string {
  const l = importance.toLowerCase();
  if (l.includes('high') || l.includes('高')) return 'high';
  if (l.includes('low') || l.includes('低')) return 'low';
  return 'medium';
}

function importanceLabel(importance: string): string {
  const l = importance.toLowerCase();
  if (l.includes('high') || l.includes('高')) return '必須';
  if (l.includes('low') || l.includes('低')) return 'あれば便利';
  return '推奨';
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────

export default function SetDetailPage() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [detail, setDetail] = useState<StarterSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);

  const fetchDetail = async () => {
    if (!setId) return;
    try {
      setLoading(true);
      const result = await api.getSetDetail(Number(setId));
      setDetail(result);
      setIsFavorite(result.isFavorite);
    } catch {
      setDetail(MOCK_SET_DETAIL);
      setIsFavorite(MOCK_SET_DETAIL.isFavorite);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const handleFavorite = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!detail || favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await api.removeFavorite(detail.id);
        setIsFavorite(false);
      } else {
        await api.addFavorite(detail.id);
        setIsFavorite(true);
      }
    } catch {
      // ignore
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBuy = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (detail) {
      navigate(`/purchase/${detail.id}`);
    }
  };

  const handleDM = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!detail || dmLoading) return;
    setDmLoading(true);
    try {
      const res = await api.getOrCreateDMRoom(detail.seller.id, detail.id);
      navigate(`/dm/${res.roomId}`);
    } catch {
      navigate('/dm');
    } finally {
      setDmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner message="セット情報を読み込み中..." />
        <BottomNav />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="page">
        <ErrorMessage message="セットが見つかりませんでした" onRetry={fetchDetail} />
        <BottomNav />
      </div>
    );
  }

  const savings = detail.estimatedNewPrice > 0 ? detail.estimatedNewPrice - detail.price : null;

  return (
    <>
      <div style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 72px)' }}>
        {/* Hero image with overlay buttons */}
        <div className="detail-hero">
          {detail.images && detail.images.length > 0 ? (
            <img src={detail.images[0]} alt={detail.title} />
          ) : (
            <div className="detail-hero-placeholder">
              {detail.categoryName.includes('音楽') ? '🎵' :
               detail.categoryName.includes('アウトドア') ? '⛺' :
               detail.categoryName.includes('クリエイティブ') ? '🎨' :
               detail.categoryName.includes('料理') ? '☕' :
               detail.categoryName.includes('運動') ? '💪' : '🎯'}
            </div>
          )}
          <button className="detail-back-btn" onClick={() => navigate(-1)} type="button" aria-label="戻る">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            className="detail-favorite-btn"
            onClick={handleFavorite}
            disabled={favoriteLoading}
            type="button"
            aria-label={isFavorite ? 'お気に入り解除' : 'お気に入り追加'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Detail content */}
        <div className="detail-content">
          <div>
            <span className="detail-hobby-tag">{detail.hobbyName}</span>
          </div>
          <h1 className="detail-title">{detail.title}</h1>
          <p className="detail-price">¥{detail.price.toLocaleString()}</p>

          {/* このセットで始められること */}
          <div className="detail-section">
            <p className="detail-section-title">このセットで始められること</p>
            <div className="detail-startable-summary">{detail.startableSummary}</div>
          </div>

          {/* 入っているもの */}
          <div className="detail-section">
            <p className="detail-section-title">入っているもの</p>
            <div className="item-list">
              {detail.items.map((item: SetItemDTO) => (
                <div key={item.id} className="item-row">
                  <div className={`item-essential-dot${item.isEssential ? '' : ''}`}
                    style={{ background: item.isEssential ? 'var(--color-primary)' : '#ccc' }} />
                  <span className="item-name">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="item-quantity">×{item.quantity}</span>
                  )}
                  <span className={`condition-badge ${conditionClass(item.conditionLabel)}`}>
                    {item.conditionLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* セット充実度 */}
          <div className="detail-section">
            <p className="detail-section-title">セット充実度</p>
            <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <div className="score-row">
                <span className="score-label">充実度</span>
                <div className="readiness-bar">
                  <div className="readiness-fill" style={{ width: `${detail.readinessScore}%` }} />
                </div>
                <span className="readiness-text">{detail.readinessScore}%</span>
              </div>
            </div>
          </div>

          {/* 追加であると安心 */}
          {detail.recommendedItems.length > 0 && (
            <div className="detail-section">
              <p className="detail-section-title">追加であると安心</p>
              <div className="item-list">
                {detail.recommendedItems.map((item: RecommendedItemDTO) => (
                  <div key={item.id} className="recommended-item">
                    <span className="recommended-item-icon">➕</span>
                    <div className="recommended-item-content">
                      <p className="recommended-item-name">{item.name}</p>
                      <p className="recommended-item-reason">{item.reason}</p>
                    </div>
                    <span className={`recommended-item-importance ${importanceClass(item.importance)}`}>
                      {importanceLabel(item.importance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 新品との差額 */}
          {savings && savings > 0 && (
            <div className="detail-section">
              <p className="detail-section-title">お得度</p>
              <div className="savings-box">
                <div>
                  <p className="savings-label">新品でそろえた場合との差額</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    新品想定: ¥{detail.estimatedNewPrice.toLocaleString()}
                  </p>
                </div>
                <p className="savings-amount">¥{savings.toLocaleString()} お得</p>
              </div>
            </div>
          )}

          {/* 前の持ち主の一言 */}
          {detail.previousOwnerNote && (
            <div className="detail-section">
              <p className="detail-section-title">前の持ち主の一言</p>
              <div className="quote-box">{detail.previousOwnerNote}</div>
            </div>
          )}

          {/* このセットについて聞く */}
          <button className="ask-button" onClick={() => setShowQuestion(true)} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            このセットについて聞く（AI）
          </button>

          {/* 出品者情報 */}
          <div className="detail-section">
            <p className="detail-section-title">出品者</p>
            <div className="seller-card">
              {detail.seller.avatarUrl ? (
                <img className="seller-avatar" src={detail.seller.avatarUrl} alt={detail.seller.displayName} />
              ) : (
                <div className="seller-avatar-placeholder">
                  {detail.seller.displayName.charAt(0)}
                </div>
              )}
              <div className="seller-info">
                <p className="seller-name">{detail.seller.displayName}</p>
                <p className="seller-rating">⭐ {detail.seller.ratingAverage.toFixed(1)}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleDM()}
                disabled={dmLoading}
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  opacity: dmLoading ? 0.6 : 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                連絡する
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Bar (above bottom nav) */}
      <div className="cta-bar">
        <p className="cta-bar-price">¥{detail.price.toLocaleString()}</p>
        <button className="cta-bar-btn" onClick={handleBuy} type="button">
          このセットで始める
        </button>
      </div>

      <BottomNav />

      {/* Question Bottom Sheet */}
      {showQuestion && (
        <QuestionBottomSheet setId={detail.id} onClose={() => setShowQuestion(false)} />
      )}
    </>
  );
}
