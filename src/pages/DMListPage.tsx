import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_DM_ROOMS } from '../api/mock';
import { DMRoom } from '../types';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diffDays === 1) return '昨日';
  if (diffDays < 7) return `${diffDays}日前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function DMListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [rooms, setRooms] = useState<DMRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const fetchRooms = async () => {
      try {
        const data = await api.getDMRooms();
        setRooms(data ?? []);
      } catch {
        setRooms(MOCK_DM_ROOMS);
      } finally {
        setLoading(false);
      }
    };
    void fetchRooms();
  }, [isLoggedIn, navigate, location.key]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>メッセージ</h1>
      </div>

      {loading ? (
        <LoadingSpinner message="読み込み中..." />
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">💬</span>
          <p className="empty-state-title">メッセージはありません</p>
          <p className="empty-state-message">
            気になるセットの出品者に連絡してみましょう
          </p>
        </div>
      ) : (
        <div>
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => navigate(`/dm/${room.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '14px 16px',
                background: 'white',
                border: 'none',
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {room.partnerAvatar ? (
                  <img src={room.partnerAvatar} alt={room.partnerName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  room.partnerName.charAt(0)
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>
                    {room.partnerName}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flexShrink: 0, marginLeft: 8 }}>
                    {formatTime(room.lastMessageAt)}
                  </span>
                </div>
                {room.setTitle && (
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📦 {room.setTitle}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{
                    fontSize: 13,
                    color: room.unreadCount > 0 ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    fontWeight: room.unreadCount > 0 ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {room.lastMessage || 'メッセージなし'}
                  </p>
                  {room.unreadCount > 0 && (
                    <span style={{
                      background: 'var(--color-primary)',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginLeft: 8,
                    }}>
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
