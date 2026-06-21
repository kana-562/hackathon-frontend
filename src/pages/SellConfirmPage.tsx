import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_DRAFT } from '../api/mock';
import { DraftDetail, SetItemDTO } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const CONDITION_OPTIONS = [
  '未使用に近い',
  '良い',
  '目立った傷や汚れなし',
  'やや傷や汚れあり',
  '傷や汚れあり',
  '全体的に状態が悪い',
];

export default function SellConfirmPage() {
  const { draftSetId } = useParams<{ draftSetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { suggestedPrice?: number } | null;

  const [draft, setDraft] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [readinessScore, setReadinessScore] = useState(50);
  const [previousOwnerNote, setPreviousOwnerNote] = useState('');
  const [items, setItems] = useState<SetItemDTO[]>([]);

  const fetchDraft = async () => {
    if (!draftSetId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await api.getDraft(Number(draftSetId));
      setDraft(result);
      setTitle(result.title);
      // Use suggested price from SellSupportPage if draft price is 0
      setPrice(result.price > 0 ? result.price : (navState?.suggestedPrice ?? 0));
      setDescription(result.description);
      setReadinessScore(result.readinessScore);
      setPreviousOwnerNote(result.previousOwnerNote);
      setItems(result.items);
    } catch {
      const m = MOCK_DRAFT;
      setDraft(m);
      setTitle(m.title);
      setPrice(m.price > 0 ? m.price : (navState?.suggestedPrice ?? 0));
      setDescription(m.description);
      setReadinessScore(m.readinessScore);
      setPreviousOwnerNote(m.previousOwnerNote);
      setItems(m.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSetId]);

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleItemConditionChange = (id: number, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, conditionLabel: value } : item))
    );
  };

  const handlePublish = async () => {
    if (!draftSetId || publishing) return;
    setPublishing(true);
    setPublishError(null);
    try {
      await api.updateDraft(Number(draftSetId), {
        title,
        price,
        description,
        readinessScore,
        previousOwnerNote,
        items,
      });
      await api.publishDraft(Number(draftSetId));
      navigate('/mypage?tab=selling');
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : '出品に失敗しました');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="下書きを読み込み中..." />;
  }

  if (error || !draft) {
    return <ErrorMessage message={error ?? '下書きが見つかりません'} onRetry={fetchDraft} />;
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="page-header-title">出品確認</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Image upload banner */}
      <div
        className="preview-image-upload"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="写真をアップロード"
      >
        {imagePreview ? (
          <img src={imagePreview} alt="セット画像" className="preview-image-uploaded" />
        ) : (
          <div className="preview-image-placeholder">
            <span className="preview-image-icon">📷</span>
            <p>タップして写真を追加</p>
            <p className="preview-image-sub">JPG・PNG・GIF</p>
          </div>
        )}
        {imagePreview && (
          <div className="preview-image-change-hint">タップして変更</div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Editable form */}
      <div className="sell-confirm-form">
        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="title">セット名</label>
          <input
            id="title"
            className="form-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 初心者向けアコースティックギターセット"
          />
        </div>

        {/* Price */}
        <div className="form-group">
          <label className="form-label" htmlFor="price">価格（円）</label>
          <input
            id="price"
            className="form-input"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="例: 15000"
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="description">説明文</label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="セットの説明を入力してください"
            rows={4}
          />
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="form-group">
            <label className="form-label">入っているもの（状態を確認）</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item) => (
                <div key={item.id} style={{
                  background: 'white',
                  borderRadius: 10,
                  padding: '10px 12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</p>
                    {item.quantity > 1 && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>×{item.quantity}</p>
                    )}
                  </div>
                  <select
                    className="form-select"
                    value={item.conditionLabel}
                    onChange={(e) => handleItemConditionChange(item.id, e.target.value)}
                    style={{ width: 'auto', fontSize: 13, padding: '6px 28px 6px 10px' }}
                  >
                    {CONDITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Readiness score */}
        <div className="form-group">
          <label className="form-label">
            セット充実度（{readinessScore}%）
          </label>
          <input
            className="range-input"
            type="range"
            min={0}
            max={100}
            step={5}
            value={readinessScore}
            onChange={(e) => setReadinessScore(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            <span>セット内容が少ない</span>
            <span>必要なものが揃っている</span>
          </div>
        </div>

        {/* Previous owner note */}
        <div className="form-group">
          <label className="form-label" htmlFor="owner-note">前の持ち主の一言</label>
          <textarea
            id="owner-note"
            className="form-textarea"
            value={previousOwnerNote}
            onChange={(e) => setPreviousOwnerNote(e.target.value)}
            placeholder="次の人へのメッセージや使用経験などを書きましょう"
            rows={3}
          />
        </div>

        {/* Notice */}
        <div style={{
          padding: 14,
          background: 'rgba(78,205,196,0.06)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            ※ 出品後は購入者が現れるまで編集・削除が可能です。<br />
            ※ 内容に偽りのないよう正確に記載してください。
          </p>
        </div>

        {publishError && (
          <div className="auth-error" style={{ marginBottom: 16 }}>{publishError}</div>
        )}
      </div>

      {/* Publish bar */}
      <div className="sell-publish-bar">
        <button
          className="btn-primary"
          onClick={handlePublish}
          disabled={publishing || !title.trim() || price <= 0}
          type="button"
        >
          {publishing ? '出品中...' : '出品する'}
        </button>
      </div>
    </div>
  );
}
