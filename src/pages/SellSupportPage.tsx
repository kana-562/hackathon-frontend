import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

interface ChipItem {
  id: number;
  text: string;
  exiting: boolean;
}

interface LocationState {
  message: string;
  suggestedChips: string[];
  progress: { current: number; total: number };
}

const CONDITION_OPTIONS = ['ほぼ新品', '目立った傷なし', 'やや傷あり', '傷・汚れあり', '動作未確認'];

const CHIP_EXPANSIONS: Record<string, string[]> = {
  'ギター本体':    ['ストラップ', 'ギターケース'],
  'チューナー':    ['替え弦', '替え電池'],
  'ピック':       ['サムピック'],
  'カポタスト':    ['スライドバー'],
  'ギタースタンド': ['壁掛けハンガー'],
  'コード譜':      ['教則DVD'],
  'ドリッパー':    ['コーヒーサーバー'],
  'コーヒーミル':  ['クリーニングブラシ'],
  'ドリップポット': ['温度計'],
  '細口ドリップポット': ['温度計'],
  'ヨガマット':    ['ヨガブロック', 'ヨガベルト'],
  'ロッド':       ['リール', 'ライン'],
  'リール':       ['仕掛けセット'],
  'テント':       ['ペグ', 'ロープ'],
  'シュラフ':     ['インナーシュラフ'],
  'バーナー':     ['ガスカートリッジ'],
  'スケッチブック': ['ペン立て'],
  'コピック':     ['コピック補充インク'],
};

function parsePrice(text: string): number | null {
  let s = text.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  const manMatch = s.match(/(\d[\d,，]*)\s*万/);
  if (manMatch) return parseInt(manMatch[1].replace(/[,，]/g, ''), 10) * 10000;
  s = s.replace(/[¥￥円,，、\s]/g, '');
  const m = s.match(/\d+/);
  if (m) {
    const n = parseInt(m[0], 10);
    if (n > 0 && n < 10_000_000) return n;
  }
  return null;
}

export default function SellSupportPage() {
  const { draftSetId } = useParams<{ draftSetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const chipIdRef = useRef(0);
  const knownChipTexts = useRef(new Set<string>());
  const parsedPriceRef = useRef<number | null>(null);
  // Refs for async-safe access when navigating after done
  const capturedItemsRef = useRef<string[]>([]);
  const capturedConditionMapRef = useRef<Record<string, string>>({});

  const [chips, setChips] = useState<ChipItem[]>(() => {
    const initialTexts = state?.suggestedChips ?? [];
    return initialTexts.map(t => {
      knownChipTexts.current.add(t);
      return { id: ++chipIdRef.current, text: t, exiting: false };
    });
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (state?.message) return [{ sender: 'assistant', text: state.message }];
    return [];
  });
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showChips, setShowChips] = useState(!!state?.suggestedChips?.length);
  // progress.current: 1=items, 2=condition, 3=price, 4=note, 5=done
  const [progress, setProgress] = useState(state?.progress ?? { current: 1, total: 5 });

  const [itemsList, setItemsList] = useState<string[]>([]);
  const [conditionMap, setConditionMap] = useState<Record<string, string>>({});

  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, sending]);

  useEffect(() => {
    if (!state && draftSetId) {
      const fallbackChips = ['まず確認したい', '箱に入っています', '袋に入っています'];
      fallbackChips.forEach(t => knownChipTexts.current.add(t));
      setMessages([{ sender: 'assistant', text: 'セットについて教えてください。どんなものが入っていますか？' }]);
      setChips(fallbackChips.map(t => ({ id: ++chipIdRef.current, text: t, exiting: false })));
      setShowChips(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSubmitText = () => {
    // Condition table (step 2)
    if (progress.current === 2 && capturedItemsRef.current.length > 0) {
      return capturedItemsRef.current
        .map(item => `${item}は${capturedConditionMapRef.current[item] ?? '目立った傷なし'}`)
        .join('、');
    }
    return [...selectedBadges, inputText.trim()].filter(Boolean).join('、');
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending || !draftSetId) return;

    // Step 1 (progress=1): capture items list
    if (progress.current === 1) {
      const items = text.split(/[、,，]+/).map(s => s.trim()).filter(Boolean);
      capturedItemsRef.current = items;
      const initMap: Record<string, string> = {};
      items.forEach(item => { initMap[item] = '目立った傷なし'; });
      capturedConditionMapRef.current = initMap;
      setItemsList(items);
      setConditionMap(initMap);
    }

    // Step 3 (progress=3): parse price
    if (progress.current === 3) {
      const price = parsePrice(text);
      if (price !== null) parsedPriceRef.current = price;
    }

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setSelectedBadges([]);
    setChips([]);
    setShowChips(false);
    knownChipTexts.current.clear();
    setSending(true);

    try {
      const res = await api.sendSellMessage(Number(draftSetId), text);
      setMessages(prev => [...prev, { sender: 'assistant', text: res.message }]);
      setProgress(res.progress);

      const newTexts = res.suggestedChips ?? [];
      newTexts.forEach(t => knownChipTexts.current.add(t));
      setChips(newTexts.map(t => ({ id: ++chipIdRef.current, text: t, exiting: false })));
      // Don't show chips as clickable for the price step (step 3) — show as card instead
      setShowChips(newTexts.length > 0 && res.progress.current !== 3);

      if (res.done) {
        setTimeout(() => navigate(`/sell/confirm/${draftSetId}`, {
          state: {
            suggestedPrice: parsedPriceRef.current,
            itemsList: capturedItemsRef.current,
            conditionMap: capturedConditionMapRef.current,
          },
        }), 1200);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', text: 'エラーが発生しました。もう一度試してください。' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleChipClick = (chip: ChipItem) => {
    setChips(prev => prev.map(c => c.id === chip.id ? { ...c, exiting: true } : c));
    setSelectedBadges(prev => [...prev, chip.text]);

    const expansions = (CHIP_EXPANSIONS[chip.text] ?? []).filter(
      t => !knownChipTexts.current.has(t),
    );
    expansions.forEach(t => knownChipTexts.current.add(t));

    setTimeout(() => {
      setChips(prev => {
        const remaining = prev.filter(c => c.id !== chip.id);
        const newChips = expansions.map(t => ({
          id: ++chipIdRef.current,
          text: t,
          exiting: false,
        }));
        return [...remaining, ...newChips];
      });
    }, 280);
  };

  const removeBadge = (index: number) => {
    const text = selectedBadges[index];
    setSelectedBadges(prev => prev.filter((_, i) => i !== index));
    if (!chips.some(c => c.text === text)) {
      knownChipTexts.current.add(text);
      setChips(prev => [...prev, { id: ++chipIdRef.current, text, exiting: false }]);
    }
  };

  const handleConditionChange = (item: string, value: string) => {
    const newMap = { ...capturedConditionMapRef.current, [item]: value };
    capturedConditionMapRef.current = newMap;
    setConditionMap(newMap);
  };

  const addTextAsBadge = () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSelectedBadges(prev => [...prev, text]);
    setInputText('');
  };

  const handleSubmit = () => void sendMessage(getSubmitText());
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const submitText = getSubmitText();

  return (
    <div className="sell-support-page">
      {/* Header */}
      <div className="sell-support-header">
        <button className="back-button" onClick={() => navigate(-1)} type="button" aria-label="戻る">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="sell-support-title">出品サポート</span>
        <span className="sell-support-progress">{progress.current}/{progress.total}</span>
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
          <div key={i} className={`chat-bubble ${msg.sender}`}>
            {msg.text}
          </div>
        ))}

        {!sending && (
          // Step 2: condition table (after items submitted, progress becomes 2)
          progress.current === 2 && itemsList.length > 0 ? (
            <div className="condition-table-container">
              <table className="condition-table">
                <thead>
                  <tr>
                    <th>アイテム</th>
                    <th>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsList.map(item => (
                    <tr key={item}>
                      <td>{item}</td>
                      <td>
                        <select
                          value={conditionMap[item] ?? '目立った傷なし'}
                          onChange={e => handleConditionChange(item, e.target.value)}
                          className="condition-select"
                        >
                          {CONDITION_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : progress.current === 3 ? (
            // Step 3: price recommendation card (no clickable chips)
            <div className="price-rec-card">
              <p className="price-rec-title">💡 おすすめ価格帯</p>
              {chips.length >= 2 && (
                <p className="price-rec-range">{chips[0].text} 〜 {chips[chips.length - 1].text}</p>
              )}
              <p className="price-rec-reason">同ジャンルのスターターセットの相場に基づいた参考価格です。状態や付属品によって調整してください。</p>
            </div>
          ) : showChips && chips.length > 0 ? (
            <div className="chat-chips">
              {chips.map(chip => (
                <button
                  key={chip.id}
                  className={`chat-chip${chip.exiting ? ' exiting' : ''}`}
                  onClick={() => !chip.exiting && handleChipClick(chip)}
                  type="button"
                >
                  {chip.text}
                </button>
              ))}
            </div>
          ) : null
        )}

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
        <div className="sell-support-input-row">
          <div className={`chat-input-with-badges${selectedBadges.length > 0 ? ' has-badges' : ''}`}>
            {selectedBadges.map((badge, i) => (
              <span key={i} className="input-badge">
                {badge}
                <button
                  className="input-badge-remove"
                  onClick={() => removeBadge(i)}
                  type="button"
                  aria-label={`${badge}を削除`}
                >×</button>
              </span>
            ))}
            <input
              className="chat-input-inner"
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.nativeEvent.isComposing) return;
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputText.trim()) {
                    addTextAsBadge();
                  } else {
                    handleSubmit();
                  }
                }
              }}
              placeholder={
                selectedBadges.length > 0 ? '' :
                progress.current === 2 ? '追加のメモを入力...' :
                'メッセージを入力...'
              }
              disabled={sending}
            />
          </div>
          <button
            className="chat-send-btn"
            onClick={handleSubmit}
            disabled={!submitText || sending}
            type="button"
            aria-label="送信"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="chat-input-hint">⌘+Enter で送信</div>
      </div>
    </div>
  );
}
