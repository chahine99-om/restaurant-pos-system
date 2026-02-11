import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import VerifyEmail from './VerifyEmail';
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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onSuccess={() => setToken(localStorage.getItem('token'))} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/"
          element={
            token ? (
              <div>
                <header style={{ padding: '8px 24px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
                  <h2 style={{ margin: 0 }}>POS</h2>
                  <button type="button" onClick={logout}>Logout</button>
                </header>
                <POS />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
