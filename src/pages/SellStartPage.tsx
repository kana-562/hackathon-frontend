import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';

export default function SellStartPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [hobbyText, setHobbyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!hobbyText.trim()) return;

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.createDraft(hobbyText.trim());
      navigate(`/sell/support/${result.draftSetId}`, {
        state: {
          message: result.message,
          suggestedChips: result.suggestedChips,
          progress: result.progress,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '出品の開始に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ width: 28 }} />
        <span className="page-header-title">出品する</span>
        <div style={{ width: 28 }} />
      </div>

      <div style={{ padding: '32px 24px' }}>
        {/* Hero illustration */}
        <div style={{
          textAlign: 'center',
          marginBottom: 32,
          padding: 24,
          background: 'linear-gradient(135deg, rgba(78,205,196,0.12) 0%, rgba(255,159,67,0.08) 100%)',
          borderRadius: 20,
        }}>
          <p style={{ fontSize: 56, marginBottom: 12 }}>📦</p>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
            趣味セットを出品する
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            使わなくなった趣味道具を、次に始める人へリレーしましょう。AIが出品をサポートします。
          </p>
        </div>

        {/* Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="hobby-input">
            何のセットですか？
          </label>
          <input
            id="hobby-input"
            className="form-input"
            type="text"
            value={hobbyText}
            onChange={(e) => setHobbyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例: ギター、キャンプ、コーヒー"
            disabled={loading}
            autoFocus
          />
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
            ジャンルや趣味名を入力してください
          </p>
        </div>

        {/* Hint chips */}
        <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {['🎸 ギター', '⛺ キャンプ', '☕ コーヒー', '🎨 水彩画', '🏃 ランニング'].map((hint) => (
            <button
              key={hint}
              className="chip"
              type="button"
              onClick={() => setHobbyText(hint.split(' ')[1])}
              style={{ margin: 0 }}
            >
              {hint}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div className="auth-error">{error}</div>}

        {/* Submit */}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!hobbyText.trim() || loading}
          type="button"
        >
          {loading ? '準備中...' : '出品サポートを始める ✦'}
        </button>

      </div>

      <BottomNav />
    </div>
  );
}
