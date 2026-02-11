import { useState } from 'react';
import { Link } from 'react-router-dom';
import { register as apiRegister } from './api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ message: string; verificationLink?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);
    try {
      const data = await apiRegister(email.trim(), password, fullName.trim());
      setSuccess({
        message: data.message,
        verificationLink: data.verificationLink,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, color: 'green' }}>Check your email</h2>
        <p>{success.message}</p>
        {success.verificationLink && (
          <p style={{ fontSize: 13, color: '#666', wordBreak: 'break-all' }}>
            Or copy this link (no email configured):{' '}
            <a href={success.verificationLink} target="_blank" rel="noreferrer">{success.verificationLink}</a>
          </p>
        )}
        <Link to="/login">Go to login</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 320, margin: '40px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h1 style={{ marginTop: 0 }}>Create account</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          />
        </div>
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
          <label style={{ display: 'block', marginBottom: 4 }}>Password (min 8 characters)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'crimson', fontSize: 14, marginBottom: 8 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? '...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
