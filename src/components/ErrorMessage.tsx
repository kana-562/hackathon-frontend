interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="error-container">
      <span className="error-icon">😟</span>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button className="error-retry" onClick={onRetry} type="button">
          再試行
        </button>
      )}
    </div>
  );
}
