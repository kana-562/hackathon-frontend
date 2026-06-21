import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_SEARCH } from '../api/mock';
import { StarterSetCard } from '../types';
import BottomNav from '../components/BottomNav';
import SearchBar from '../components/SearchBar';
import SetCard from '../components/SetCard';
import CategoryChip from '../components/CategoryChip';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQ = searchParams.get('q') ?? '';
  const initialSmart = searchParams.get('smart') === 'true';
  const isBrowseMode = searchParams.get('browse') === 'true';
  const initialSortParam = searchParams.get('sort');
  const initSort = ((): 'recommended' | 'newest' | 'price' => {
    if (initialSortParam === 'newest') return 'newest';
    if (initialSortParam === 'price') return 'price';
    return 'recommended';
  })();

  const [searchValue, setSearchValue] = useState(initialQ);
  const [sets, setSets] = useState<StarterSetCard[]>([]);
  const [smartMessage, setSmartMessage] = useState<string | undefined>();
  const [relatedChips, setRelatedChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(isBrowseMode);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'recommended' | 'newest' | 'price'>(initSort);

  const fetchBrowseSets = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getSets({});
      setSets(result.sets);
    } catch {
      setSets(MOCK_SEARCH.sets);
      setRelatedChips(MOCK_SEARCH.relatedChips ?? []);
    } finally {
      setLoading(false);
    }
  };

  const fetchSets = async (q: string, smart: boolean) => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number | boolean> = { q };
      if (smart) params['smart'] = true;
      const result = await api.getSets(params);
      setSets(result.sets);
      setSmartMessage(result.smartMessage);
      setRelatedChips(result.relatedChips ?? []);
    } catch {
      setSets(MOCK_SEARCH.sets);
      setRelatedChips(MOCK_SEARCH.relatedChips ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isBrowseMode) {
      void fetchBrowseSets();
    } else {
      void fetchSets(initialQ, initialSmart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (value: string, smart?: boolean) => {
    const params = new URLSearchParams({ q: value });
    if (smart) params.set('smart', 'true');
    setSearchParams(params);
    setSearchValue(value);
    void fetchSets(value, !!smart);
  };

  const handleChipClick = (chip: string) => {
    handleSearchSubmit(chip, true);
  };

  const sortedSets = (() => {
    const copy = [...sets];
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
        <div style={{ flex: 1 }}>
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={handleSearchSubmit}
            placeholder="キーワードや質問で探す"
          />
        </div>
      </div>

      {/* Smart message */}
      {smartMessage && !loading && (
        <div className="smart-message-box">
          <span className="smart-message-icon">✦</span>
          <p className="smart-message-text">{smartMessage}</p>
        </div>
      )}

      {/* Related chips */}
      {relatedChips.length > 0 && !loading && (
        <div className="chip-scroll" style={{ padding: '4px 16px 8px' }}>
          {relatedChips.map((chip) => (
            <CategoryChip
              key={chip}
              label={chip}
              onClick={() => handleChipClick(chip)}
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
        <LoadingSpinner message="検索中..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => fetchSets(searchValue, initialSmart)} />
      ) : !searchValue.trim() && !isBrowseMode ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <p className="empty-state-title">キーワードを入力してください</p>
          <p className="empty-state-message">
            例: ギター、キャンプ道具、コーヒー入門
            <br />
            ✦ で「初心者が始めやすい趣味は？」などAIに相談も可能
          </p>
        </div>
      ) : sortedSets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">😔</span>
          <p className="empty-state-title">「{searchValue}」の検索結果がありません</p>
          <p className="empty-state-message">別のキーワードで試してみましょう</p>
        </div>
      ) : (
        <>
          <p style={{ padding: '8px 16px 4px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {isBrowseMode
              ? `${sortedSets.length}件のセット`
              : `「${searchValue}」の検索結果 ${sortedSets.length}件`}
          </p>
          <div className="set-list">
            {sortedSets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
