import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { StarterSetDetail } from '../types';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function PurchasePage() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [detail, setDetail] = useState<StarterSetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const fetchDetail = async () => {
      if (!setId) return;
      try {
        setLoading(true);
        setError(null);
        const result = await api.getSetDetail(Number(setId));
        setDetail(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [setId, isLoggedIn, navigate]);

  const handleConfirm = async () => {
    if (!detail || purchasing) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const result = await api.createTransaction(detail.id);
      navigate(`/purchase/${detail.id}/complete?txId=${result.transactionId}`);
    } catch (e) {
      setPurchaseError(e instanceof Error ? e.message : '購入処理に失敗しました');
    } finally {
      setPurchasing(false);
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

  if (error || !detail) {
    return (
      <div className="page">
        <ErrorMessage message={error ?? 'セットが見つかりませんでした'} />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="page-header-title">購入確認</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Set summary */}
      <div className="purchase-summary">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {detail.images && detail.images.length > 0 ? (
            <img
              src={detail.images[0]}
              alt={detail.title}
              style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }}
            />
          ) : (
            <div style={{
              width: 80, height: 60, borderRadius: 8,
              background: 'linear-gradient(135deg, #4ECDC4, #FF9F43)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0
            }}>
              🎯
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
              {detail.title}
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {detail.hobbyName}
            </p>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="purchase-price-box">
        <p className="purchase-price-label">合計金額</p>
        <p className="purchase-price-value">¥{detail.price.toLocaleString()}</p>
      </div>

      {/* Items list */}
      <div style={{ padding: '0 16px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: 'var(--color-text)' }}>
          入っているもの
        </p>
        <div className="item-list">
          {detail.items.map((item) => (
            <div key={item.id} className="item-row">
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: item.isEssential ? 'var(--color-primary)' : '#ccc'
              }} />
              <span className="item-name">{item.name}</span>
              {item.quantity > 1 && <span className="item-quantity">×{item.quantity}</span>}
              <span
                className={`condition-badge ${
                  item.conditionLabel.includes('良') || item.conditionLabel.includes('美')
                    ? 'good' : item.conditionLabel.includes('可') ? 'fair' : 'poor'
                }`}
              >
                {item.conditionLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended items */}
      {detail.recommendedItems.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: 'var(--color-text)' }}>
            追加であると安心
          </p>
          <div className="item-list">
            {detail.recommendedItems.map((item) => (
              <div key={item.id} style={{
                padding: '10px 12px', background: 'white', borderRadius: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 10, alignItems: 'center'
              }}>
                <span style={{ fontSize: 16 }}>➕</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notice */}
      <div style={{
        margin: '0 16px 16px',
        padding: 16,
        background: 'rgba(78,205,196,0.06)',
        borderRadius: 12,
        border: '1px solid var(--color-border)'
      }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          ※ 購入後、出品者と取引メッセージにて受け渡し方法を確認します。<br />
          ※ 購入後のキャンセルはできませんのでご注意ください。
        </p>
      </div>

      {/* Error */}
      {purchaseError && (
        <div style={{ margin: '0 16px 16px' }} className="auth-error">
          {purchaseError}
        </div>
      )}

      {/* Confirm button */}
      <div style={{ padding: '0 16px 24px' }}>
        <button
          className="btn-primary"
          onClick={handleConfirm}
          disabled={purchasing}
          type="button"
        >
          {purchasing ? '処理中...' : '購入を確定する'}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
