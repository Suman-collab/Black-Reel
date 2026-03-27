export default function StatePanel({ title, message, actionLabel, onAction }) {
  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        textAlign: 'center',
        padding: '32px 20px',
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>
      {message ? <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: '540px' }}>{message}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
