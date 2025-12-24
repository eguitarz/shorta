export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Page not found</p>
      <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Return Home
      </a>
    </div>
  );
}
