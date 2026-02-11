import { useState, useEffect } from 'react';
import Login from './Login';
import POS from './POS';
import './App.css';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (!token) localStorage.removeItem('token');
    else localStorage.setItem('token', token);
  }, [token]);

  function logout() {
    setToken(null);
    localStorage.removeItem('token');
  }

  if (!token) {
    return <Login onSuccess={() => setToken(localStorage.getItem('token'))} />;
  }

  return (
    <div>
      <header style={{ padding: '8px 24px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>POS</h2>
        <button type="button" onClick={logout}>Logout</button>
      </header>
      <POS />
    </div>
  );
}

export default App;
