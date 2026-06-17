import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_MYPAGE, MOCK_SETS, MOCK_TRANSACTION } from '../api/mock';
import { StarterSetCard, TransactionDetail, MyPageData } from '../types';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import SetCard from '../components/SetCard';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

type TabKey = 'selling' | 'purchases' | 'favorites';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'selling', label: '出品中' },
  { key: 'purchases', label: '購入済み' },
  { key: 'favorites', label: 'お気に入り' },
];

function TransactionCard({ tx }: { tx: TransactionDetail }) {
  const navigate = useNavigate();
  return (
    <div
      className="transaction-card"
      onClick={() => navigate(`/sets/${tx.starterSet.id}`)}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      {tx.starterSet.imageUrl ? (
        <img
          src={tx.starterSet.imageUrl}
          alt={tx.starterSet.title}
          style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 60, height: 45, borderRadius: 8,
          background: 'linear-gradient(135deg, #4ECDC4, #FF9F43)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0
        }}>
          🎯
        </div>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
          {tx.starterSet.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 700 }}>¥{tx.price.toLocaleString()}</p>
          <span className={`transaction-status ${tx.status === 'completed' ? 'completed' : 'pending'}`}>
            {tx.status === 'completed' ? '完了' : '進行中'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('selling');

  const [myPageData, setMyPageData] = useState<MyPageData | null>(null);
  const [myPageLoading, setMyPageLoading] = useState(true);

  const [selling, setSelling] = useState<StarterSetCard[]>([]);
  const [purchases, setPurchases] = useState<TransactionDetail[]>([]);
  const [favorites, setFavorites] = useState<StarterSetCard[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyPage = async () => {
      try {
        const result = await api.getMyPage();
        setMyPageData(result);
      } catch {
        setMyPageData(MOCK_MYPAGE);
      } finally {
        setMyPageLoading(false);
      }
    };
    void fetchMyPage();
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const fetchTab = async () => {
      setTabLoading(true);
      setTabError(null);
      try {
        switch (activeTab) {
          case 'selling': {
            const result = await api.getMySelling();
            setSelling(Array.isArray(result) ? result : []);
            break;
          }
          case 'purchases': {
            const result = await api.getMyPurchases();
            setPurchases(Array.isArray(result) ? result : []);
            break;
          }
          case 'favorites': {
            const result = await api.getMyFavorites();
            setFavorites(Array.isArray(result) ? result : []);
            break;
          }
        }
      } catch {
        switch (activeTab) {
          case 'selling': setSelling(MOCK_SETS.slice(0, 2)); break;
          case 'purchases': setPurchases([MOCK_TRANSACTION]); break;
          case 'favorites': setFavorites(MOCK_SETS.slice(0, 3)); break;
        }
      } finally {
        setTabLoading(false);
      }
    };
    void fetchTab();
  }, [activeTab, isLoggedIn]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayUser = myPageData?.user ?? user;

  // Safe arrays — never null even if API returns null
  const sellingList = Array.isArray(selling) ? selling : [];
  const purchasesList = Array.isArray(purchases) ? purchases : [];
  const favoritesList = Array.isArray(favorites) ? favorites : [];

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      {/* Profile header */}
      <div className="mypage-header">
        <div className="mypage-avatar">
          {displayUser?.avatarUrl ? (
            <img
              src={displayUser.avatarUrl}
              alt={displayUser.displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <span>{displayUser?.displayName.charAt(0) ?? '?'}</span>
          )}
        </div>
        <p className="mypage-name">{displayUser?.displayName ?? 'ゲスト'}</p>
        <p className="mypage-rating">
          ⭐ {displayUser?.ratingAverage?.toFixed(1) ?? '—'}
        </p>
        {myPageLoading && (
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>読み込み中...</p>
        )}
      </div>

      {/* Stats row */}
      {myPageData && (
        <div style={{
          display: 'flex',
          background: 'white',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {[
            { label: '出品中', count: myPageData.sellingCount },
            { label: '購入済み', count: myPageData.purchasesCount },
            { label: 'お気に入り', count: myPageData.favoritesCount },
          ].map((item) => (
            <div key={item.label} style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px 0',
              borderRight: '1px solid var(--color-border)',
            }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>
                {item.count}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mypage-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`mypage-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mypage-tab-content">
        {tabLoading ? (
          <LoadingSpinner />
        ) : tabError ? (
          <ErrorMessage message={tabError} />
        ) : activeTab === 'selling' ? (
          sellingList.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📦</span>
              <p className="empty-state-title">出品中のセットがありません</p>
              <p className="empty-state-message">趣味道具を次の人へリレーしましょう</p>
              <button
                className="btn-primary"
                onClick={() => navigate('/sell')}
                type="button"
                style={{ marginTop: 16, width: 'auto', padding: '10px 24px' }}
              >
                出品する
              </button>
            </div>
          ) : (
            <div className="set-list" style={{ padding: 0 }}>
              {sellingList.map((set) => (
                <SetCard key={set.id} set={set} />
              ))}
            </div>
          )
        ) : activeTab === 'purchases' ? (
          purchasesList.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🛍️</span>
              <p className="empty-state-title">購入済みのセットがありません</p>
              <p className="empty-state-message">気に入ったセットを見つけましょう</p>
            </div>
          ) : (
            <div>
              {purchasesList.map((tx) => (
                <TransactionCard key={tx.id} tx={tx} />
              ))}
            </div>
          )
        ) : (
          favoritesList.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">❤️</span>
              <p className="empty-state-title">お気に入りがありません</p>
              <p className="empty-state-message">気になるセットをお気に入りに追加しましょう</p>
            </div>
          ) : (
            <div className="set-list" style={{ padding: 0 }}>
              {favoritesList.map((set) => (
                <SetCard key={set.id} set={set} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Logout */}
      <button className="logout-btn" onClick={handleLogout} type="button">
        ログアウト
      </button>

      <div style={{ height: 'var(--bottom-nav-height)' }} />
      <BottomNav />
    </div>
  );
}
