import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { StarterSetCard } from '../types';

interface Props {
  set: StarterSetCard;
}

export default function SetCard({ set }: Props) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [isFavorite, setIsFavorite] = useState(set.isFavorite);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleClick = () => {
    navigate(`/sets/${set.id}`);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      if (prev) {
        await api.removeFavorite(set.id);
      } else {
        await api.addFavorite(set.id);
      }
    } catch {
      setIsFavorite(prev);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="set-card" onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}>
      {set.imageUrl ? (
        <img
          className="set-card-image"
          src={set.imageUrl}
          alt={set.title}
          loading="lazy"
        />
      ) : (
        <div className="set-card-image-placeholder">
          <span>{categoryEmoji(set.categoryName)}</span>
        </div>
      )}
      <div className="set-card-content">
        <p className="set-card-title">{set.title}</p>
        <p className="set-card-price">¥{set.price.toLocaleString()}</p>
        <div className="set-card-meta">
          <span className="set-card-hobby-tag">{set.hobbyName}</span>
        </div>
        <span className="set-card-readiness">セット充実度 {set.readinessScore}%</span>
      </div>
      <button
        className={`set-card-favorite-btn${isFavorite ? ' active' : ''}`}
        onClick={handleFavorite}
        type="button"
        aria-label={isFavorite ? 'お気に入り解除' : 'お気に入り追加'}
        disabled={favoriteLoading}
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>
    </div>
  );
}

function categoryEmoji(categoryName: string): string {
  if (categoryName.includes('音楽')) return '🎵';
  if (categoryName.includes('運動')) return '💪';
  if (categoryName.includes('アウトドア')) return '⛺';
  if (categoryName.includes('クリエイティブ')) return '🎨';
  if (categoryName.includes('料理') || categoryName.includes('暮らし')) return '☕';
  if (categoryName.includes('学び') || categoryName.includes('スキル')) return '📚';
  return '🎯';
}
