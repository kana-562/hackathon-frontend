import { useNavigate } from 'react-router-dom';
import { StarterSetCard } from '../types';

interface Props {
  set: StarterSetCard;
  onFavorite?: (id: number, current: boolean) => void;
}

export default function SetCard({ set }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/sets/${set.id}`);
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
