import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_DRAFT } from '../api/mock';
import { DraftDetail, SetItemDTO } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

// Shared condition options (same as SellSupportPage)
const CONDITION_OPTIONS = ['ほぼ新品', '目立った傷なし', 'やや傷あり', '傷・汚れあり', '動作未確認'];

// Map API-returned English condition codes → Japanese labels
function mapConditionLabel(label: string): string {
  const map: Record<string, string> = {
    new: 'ほぼ新品',
    like_new: 'ほぼ新品',
    good: '目立った傷なし',
    fair: 'やや傷あり',
    poor: '傷・汚れあり',
    unknown: '動作未確認',
  };
  return CONDITION_OPTIONS.includes(label) ? label : (map[label] ?? '目立った傷なし');
}

let nextTempId = -1;
const newTempId = () => nextTempId--;

export default function SellConfirmPage() {
  const { draftSetId } = useParams<{ draftSetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as {
    suggestedPrice?: number;
    itemsList?: string[];
    conditionMap?: Record<string, string>;
  } | null;

  const [draft, setDraft] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

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

  // Build items: prefer chat-captured items, fall back to API items
  const buildItems = (apiItems: SetItemDTO[]): SetItemDTO[] => {
    const chatItems = navState?.itemsList ?? [];
    const chatConditions = navState?.conditionMap ?? {};
    if (chatItems.length > 0) {
      return chatItems.map((name, idx) => ({
        id: idx + 1,
        name,
        conditionLabel: chatConditions[name] ?? '目立った傷なし',
        quantity: 1,
        isEssential: true,
        note: '',
      }));
    }
    return apiItems.map(item => ({
      ...item,
      conditionLabel: mapConditionLabel(item.conditionLabel),
    }));
  };

  const fetchDraft = async () => {
    if (!draftSetId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await api.getDraft(Number(draftSetId));
      setDraft(result);
      setTitle(result.title);
      setPrice(result.price > 0 ? result.price : (navState?.suggestedPrice ?? 0));
      setDescription(result.description);
      setReadinessScore(result.readinessScore);
      setPreviousOwnerNote(result.previousOwnerNote);
      setItems(buildItems(result.items));
    } catch {
      const m = MOCK_DRAFT;
      setDraft(m);
      setTitle(m.title);
      setPrice(m.price > 0 ? m.price : (navState?.suggestedPrice ?? 0));
      setDescription(m.description);
      setReadinessScore(m.readinessScore);
      setPreviousOwnerNote(m.previousOwnerNote);
      setItems(buildItems(m.items));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSetId]);

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

  const handleItemNameChange = (id: number, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, name: value } : item));
  };

  const handleItemConditionChange = (id: number, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, conditionLabel: value } : item));
  };

  const deleteItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: newTempId(),
      name: '',
      conditionLabel: '目立った傷なし',
      quantity: 1,
      isEssential: false,
      note: '',
    }]);
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
      setPublished(true);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : '出品に失敗しました');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <LoadingSpinner message="下書きを読み込み中..." />;
  if (error || !draft) return <ErrorMessage message={error ?? '下書きが見つかりません'} onRetry={fetchDraft} />;

  if (published) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>出品しました！</h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          「{title}」が出品されました。<br />購入者が現れるまで編集・削除できます。
        </p>
        <button
          className="btn-primary"
          style={{ marginBottom: 12 }}
          onClick={() => navigate('/mypage?tab=selling&refresh=1')}
          type="button"
        >
          出品中セットを確認する
        </button>
        <button
          className="btn-secondary"
          onClick={() => navigate('/')}
          type="button"
          style={{ background: 'none', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)', width: '100%', cursor: 'pointer' }}
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 100, paddingTop: 'env(safe-area-inset-top, 0)' }}>
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
      <div style={{ margin: '12px 16px 0', borderRadius: 14, overflow: 'hidden' }}>
        <div
          className="preview-image-upload"
          style={{ borderRadius: 0 }}
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
            onChange={e => setTitle(e.target.value)}
            placeholder="例: アコギ入門セット"
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
            onChange={e => setPrice(Number(e.target.value))}
            placeholder="例: 8000"
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="description">説明文（このセットで始められること）</label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="このセットでどんなことが始められるか、どんな方におすすめかを書きましょう"
            rows={4}
          />
        </div>

        {/* Items */}
        <div className="form-group">
          <label className="form-label">入っているもの</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => (
              <div key={item.id} className="confirm-item-row">
                <input
                  className="confirm-item-name"
                  type="text"
                  value={item.name}
                  onChange={e => handleItemNameChange(item.id, e.target.value)}
                  placeholder="アイテム名"
                />
                <select
                  className="condition-select confirm-item-condition"
                  value={item.conditionLabel}
                  onChange={e => handleItemConditionChange(item.id, e.target.value)}
                >
                  {CONDITION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <button
                  className="confirm-item-delete"
                  onClick={() => deleteItem(item.id)}
                  type="button"
                  aria-label={`${item.name}を削除`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              className="confirm-add-item-btn"
              onClick={addItem}
              type="button"
            >
              ＋ 商品を追加
            </button>
          </div>
        </div>

        {/* Readiness score */}
        <div className="form-group">
          <label className="form-label">セット充実度（{readinessScore}%）</label>
          <input
            className="range-input"
            type="range"
            min={0}
            max={100}
            step={5}
            value={readinessScore}
            onChange={e => setReadinessScore(Number(e.target.value))}
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
            onChange={e => setPreviousOwnerNote(e.target.value)}
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
