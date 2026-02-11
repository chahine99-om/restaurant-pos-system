import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail as apiVerifyEmail } from './api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    apiVerifyEmail(token)
      .then((data) => {
        setStatus('ok');
        setMessage(data.message || 'Email verified. You can now log in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed.');
      });
  }, [token]);

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Email verification</h2>
      {status === 'loading' && <p>Verifying...</p>}
      {status === 'ok' && <p style={{ color: 'green' }}>{message}</p>}
      {status === 'error' && <p style={{ color: 'crimson' }}>{message}</p>}
      <Link to="/login">Go to login</Link>
    </div>
  );
}
