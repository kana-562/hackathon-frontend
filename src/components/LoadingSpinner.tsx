interface Props {
  message?: string;
}

export default function LoadingSpinner({ message }: Props) {
  return (
    <div className="spinner-container" style={{ flexDirection: 'column', gap: 12 }}>
      <div className="spinner" />
      {message && (
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{message}</p>
      )}
    </div>
  );
}
