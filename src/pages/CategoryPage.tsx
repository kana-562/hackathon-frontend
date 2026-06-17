import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_SETS, MOCK_CATEGORIES } from '../api/mock';
import { HobbyCategory, StarterSetCard } from '../types';
import BottomNav from '../components/BottomNav';
import SearchBar from '../components/SearchBar';
import SetCard from '../components/SetCard';
import CategoryChip from '../components/CategoryChip';
import ErrorMessage from '../components/ErrorMessage';
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


export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState('');
  const [sets, setSets] = useState<StarterSetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [sort, setSort] = useState<'recommended' | 'newest' | 'price'>('recommended');
  const [activeHobby, setActiveHobby] = useState<string>('');
  const [categoryName, setCategoryName] = useState('カテゴリー');
  const [allCategories, setAllCategories] = useState<HobbyCategory[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!categoryId) return;
    setActiveHobby('');
    setSearchValue('');
    setLoading(true);

    const run = async () => {
      // カテゴリ一覧を先に取得してから名前を確定する
      let cats: HobbyCategory[] = MOCK_CATEGORIES;
      try {
        cats = await api.getCategories();
        setAllCategories(cats);
      } catch {
        setAllCategories(MOCK_CATEGORIES);
      }

      const cat = cats.find(c => String(c.id) === categoryId);
      if (cat) setCategoryName(cat.name);

      // セット取得
      try {
        const result = await api.getCategorySets(Number(categoryId));
        setSets(result.sets);
        // API がカテゴリ名を返している場合はそちらを優先
        const nameFromSets = result.sets[0]?.categoryName;
        if (nameFromSets) setCategoryName(nameFromSets);
      } catch {
        const mockCat = MOCK_CATEGORIES.find(c => String(c.id) === categoryId);
        const filtered = mockCat ? MOCK_SETS.filter(s => s.categoryName === mockCat.name) : MOCK_SETS;
        setSets(filtered.length > 0 ? filtered : MOCK_SETS);
      } finally {
        setLoading(false);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchSets = async () => { /* 再取得用（エラー時のリトライ） */
    if (!categoryId) return;
    try {
      setLoading(true);
      const result = await api.getCategorySets(Number(categoryId));
      setSets(result.sets);
      if (result.sets[0]?.categoryName) setCategoryName(result.sets[0].categoryName);
    } catch {
      const mockCat = MOCK_CATEGORIES.find(c => String(c.id) === categoryId);
      const filtered = mockCat ? MOCK_SETS.filter(s => s.categoryName === mockCat.name) : MOCK_SETS;
      setSets(filtered.length > 0 ? filtered : MOCK_SETS);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (value: string, smart?: boolean) => {
    const params = new URLSearchParams({ q: value });
    if (smart) params.set('smart', 'true');
    navigate(`/search?${params.toString()}`);
  };

  const handleCategorySelect = (id: number) => {
    setShowPicker(false);
    navigate(`/categories/${id}`);
  };

  const hobbies = Array.from(new Set(sets.map((s) => s.hobbyName)));

  const filteredByHobby = activeHobby ? sets.filter(s => s.hobbyName === activeHobby) : sets;
  const filteredBySearch = searchValue
    ? filteredByHobby.filter(s => s.title.includes(searchValue) || s.hobbyName.includes(searchValue))
    : filteredByHobby;
  const sortedSets = (() => {
    const copy = [...filteredBySearch];
    switch (sort) {
      case 'newest': return copy.sort((a, b) => b.id - a.id);
      case 'price':  return copy.sort((a, b) => a.price - b.price);
      default:       return copy.sort((a, b) => b.readinessScore - a.readinessScore);
    }
  })();

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--color-text)',
            padding: '4px 8px',
            borderRadius: 8,
          }}
        >
          {categoryName}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div style={{ width: 28 }} />
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px' }}>
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={handleSearchSubmit}
          placeholder={`${categoryName}で探す`}
        />
      </div>

      {/* Hobby filter chips */}
      {hobbies.length > 1 && (
        <div className="chip-scroll" style={{ padding: '4px 16px 8px' }}>
          <CategoryChip
            label="すべて"
            active={activeHobby === ''}
            onClick={() => setActiveHobby('')}
          />
          {hobbies.map((h) => (
            <CategoryChip
              key={h}
              label={h}
              active={activeHobby === h}
              onClick={() => setActiveHobby(h)}
            />
          ))}
        </div>
      )}

      {/* Sort bar */}
      <div className="sort-filter-bar">
        {([['recommended', 'おすすめ順'], ['newest', '新着順'], ['price', '安い順']] as const).map(([key, label]) => (
          <button
            key={key}
            className={sort === key ? 'chip active' : 'chip'}
            onClick={() => setSort(key)}
            type="button"
            style={{ margin: 0, flexShrink: 0 }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="セットを読み込み中..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchSets} />
      ) : sortedSets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <p className="empty-state-title">セットが見つかりません</p>
          <p className="empty-state-message">
            別のカテゴリーやキーワードで試してみましょう
          </p>
        </div>
      ) : (
        <div className="set-list" style={{ marginTop: 12 }}>
          {sortedSets.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </div>
      )}

      <BottomNav />

      {/* Category picker dropdown */}
      {showPicker && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setShowPicker(false)}
          />
          <div style={{
            position: 'fixed',
            top: 52,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: 360,
            background: 'white',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            zIndex: 100,
            overflow: 'hidden',
          }}>
            {allCategories.map((cat, i) => {
              const isActive = String(cat.id) === categoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '9px 14px',
                    background: isActive ? 'rgba(78,205,196,0.08)' : 'white',
                    border: 'none',
                    borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>
                    {getCategoryIcon(cat.name)}
                  </span>
                  <span style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  }}>
                    {cat.name}
                  </span>
                  {isActive && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
