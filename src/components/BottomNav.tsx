import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_DM_ROOMS } from '../api/mock';
import { useAuth } from '../hooks/useAuth';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export default function BottomNav() {
  const { isLoggedIn } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetch = async () => {
      try {
        const rooms = await api.getDMRooms();
        setUnread((rooms ?? []).reduce((s: number, r: { unreadCount?: number }) => s + (r.unreadCount ?? 0), 0));
      } catch {
        setUnread(MOCK_DM_ROOMS.reduce((s, r) => s + (r.unreadCount ?? 0), 0));
      }
    };
    void fetch();
    const id = setInterval(() => void fetch(), 15000);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  return (
    <nav className="bottom-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? 'bottom-nav-item active' : 'bottom-nav-item'
        }
      >
        <HomeIcon />
        <span>ホーム</span>
      </NavLink>

      <NavLink
        to="/sell"
        className={({ isActive }) =>
          isActive ? 'bottom-nav-item active' : 'bottom-nav-item'
        }
      >
        <PlusCircleIcon />
        <span>出品</span>
      </NavLink>

      <NavLink
        to="/dm"
        className={({ isActive }) =>
          isActive ? 'bottom-nav-item active' : 'bottom-nav-item'
        }
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <MessageIcon />
          {unread > 0 && (
            <span style={{
              position: 'absolute',
              top: -3,
              right: -3,
              width: 9,
              height: 9,
              background: '#ff3b30',
              borderRadius: '50%',
              border: '1.5px solid white',
            }} />
          )}
        </div>
        <span>メッセージ</span>
      </NavLink>

      <NavLink
        to="/mypage"
        className={({ isActive }) =>
          isActive ? 'bottom-nav-item active' : 'bottom-nav-item'
        }
      >
        <PersonIcon />
        <span>マイページ</span>
      </NavLink>
    </nav>
  );
}
