const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function handleError(res: Response, fallback: string): Promise<never> {
  return res.json().then((j: { message?: string | string[] }) => {
    const msg = j.message;
    throw new Error(Array.isArray(msg) ? msg[0] : msg || fallback);
  }).catch(() => { throw new Error(fallback); });
}

export async function register(email: string, password: string, fullName: string) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });
  if (!res.ok) await handleError(res, 'Registration failed');
  return res.json();
}

export async function verifyEmail(token: string) {
  const res = await fetch(`${BASE}/auth/verify-email?token=${encodeURIComponent(token)}`);
  if (!res.ok) await handleError(res, 'Verification failed');
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) await handleError(res, 'Login failed');
  return res.json();
}

export async function getProductsPos() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${BASE}/products/pos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const msg = j.message;
    throw new Error(Array.isArray(msg) ? msg[0] : msg || 'Failed to load products');
  }
  return res.json();
}

export async function createOrder(items: { productId: string; quantity: number }[]) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const msg = j.message;
    throw new Error(Array.isArray(msg) ? msg[0] : msg || 'Order failed');
  }
  return res.json();
}

export async function confirmOrder(orderId: string, paymentMethod: 'CASH') {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${BASE}/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ paymentMethod }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const msg = j.message;
    throw new Error(Array.isArray(msg) ? msg[0] : msg || 'Confirm failed');
  }
  return res.json();
}
