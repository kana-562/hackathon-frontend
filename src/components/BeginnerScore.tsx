interface Props {
  score: number;
  max?: number;
  showLabel?: boolean;
}

export default function BeginnerScore({ score, max = 5, showLabel = true }: Props) {
  return (
    <div className="beginner-score">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`beginner-score-dot${i < score ? ' filled' : ''}`}
        />
      ))}
      {showLabel && (
        <span className="beginner-score-label">{score}/{max}</span>
      )}
    </div>
  );
}
