import { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from './api';

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      localStorage.setItem('token', data.accessToken);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      const isNetwork =
        msg.includes('fetch') ||
        msg.includes('Network') ||
        (err instanceof TypeError && err.message.includes('fetch'));
      setError(
        isNetwork
          ? 'Cannot reach the server. Start the API (npm run start:dev) and ensure the database is running (see README).'
          : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: '40px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h1 style={{ marginTop: 0 }}>Restaurant POS</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'crimson', fontSize: 14, marginBottom: 8 }}>{error}</p>}
        <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
          Demo: cashier@restaurant.local / Password123!
        </p>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? '...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        No account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}
