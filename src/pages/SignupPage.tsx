import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveAuth } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !password.trim()) return;
    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.signup({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });
      saveAuth(result.token, result.user);
      setUser(result.user);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <p className="auth-logo">🏷️ Hobby Relay</p>
      <p className="auth-subtitle">趣味セットのリレーマーケット</p>

      <div className="auth-form">
        <div className="auth-card">
          <h2>新規登録</h2>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">表示名</label>
              <input
                id="displayName"
                className="form-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例: ギター好き太郎"
                required
                disabled={loading}
                autoComplete="nickname"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">メールアドレス</label>
              <input
                id="email"
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                パスワード
                <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: 4 }}>
                  (8文字以上)
                </span>
              </label>
              <input
                id="password"
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを設定"
                required
                minLength={8}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div style={{
              padding: 12,
              background: 'rgba(78,205,196,0.06)',
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}>
              登録することで、利用規約およびプライバシーポリシーに同意したものとみなします。
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={loading || !displayName.trim() || !email.trim() || !password.trim()}
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>
        </div>

        <p className="auth-link">
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
