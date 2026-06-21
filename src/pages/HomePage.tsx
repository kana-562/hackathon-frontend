import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_HOME } from '../api/mock';
import { HomeData } from '../types';
import BottomNav from '../components/BottomNav';
import SearchBar from '../components/SearchBar';
import SetCard from '../components/SetCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORY_ICONS: Record<string, string> = {
  '音楽': '🎸',
  'アウトドア': '⛺',
  'アート': '🎨',
  'クリエイティブ': '🎨',
  'クラフト': '✂️',
  'フード': '🍳',
  '料理': '🍳',
  'フィットネス': '🏃',
  'スポーツ': '🏃',
  '運動': '💪',
  'テクノロジー': '💻',
  '学び': '📚',
  'スキル': '📚',
};

function getCategoryIcon(name: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.includes(key)) return icon;
  }
  return '🎯';
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHome = async () => {
    try {
      setLoading(true);
      const result = await api.getHome();
      setData(result);
    } catch {
      setData(MOCK_HOME);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (value: string, smart?: boolean) => {
    const params = new URLSearchParams({ q: value });
    if (smart) params.set('smart', 'true');
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-logo">🏷️ Hobby Relay</div>
        <div className="home-header-tagline">
          使わなくなった趣味セットを、次に始める人へ。
        </div>
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={handleSearchSubmit}
          placeholder="例: 初心者向けギターセット ✦で何でも聞く"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="読み込み中..." />
      ) : data ? (
        <>
          {/* Categories */}
          <div style={{ padding: '20px 0 8px' }}>
            <p className="section-title">何を始めてみる？</p>
            <div className="category-grid">
              {(data.categories ?? []).slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  className="category-btn"
                  onClick={() => navigate(`/categories/${cat.id}`)}
                  type="button"
                >
                  <span className="category-btn-icon">{getCategoryIcon(cat.name)}</span>
                  <span className="category-btn-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Featured: horizontal scroll */}
          <div style={{ padding: '16px 0 4px' }}>
            <div className="section-header">
              <p className="section-title">おすすめセット</p>
              <button
                className="more-btn"
                type="button"
                onClick={() => navigate('/search')}
              >
                もっと見る ›
              </button>
            </div>
            <div className="horizontal-scroll">
              {data.featuredSets.map((set) => (
                <SetCard key={set.id} set={set} />
              ))}
              {data.featuredSets.length === 0 && (
                <p style={{ padding: '0 16px', color: 'var(--color-text-secondary)', fontSize: 14 }}>
                  セットがありません
                </p>
              )}
            </div>
          </div>

          <div className="divider" />

          {/* New sets: horizontal scroll */}
          <div style={{ padding: '16px 0 8px' }}>
            <div className="section-header">
              <p className="section-title">新着セット</p>
              <button
                className="more-btn"
                type="button"
                onClick={() => navigate('/search?sort=newest')}
              >
                もっと見る ›
              </button>
            </div>
            <div className="horizontal-scroll">
              {data.newSets.map((set) => (
                <SetCard key={set.id} set={set} />
              ))}
              {data.newSets.length === 0 && (
                <div className="empty-state">
                  <span className="empty-state-icon">📦</span>
                  <p className="empty-state-title">まだ新着セットがありません</p>
                  <p className="empty-state-message">最初の出品者になりましょう！</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      <BottomNav />
    </div>
  );
}
