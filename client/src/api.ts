const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
  return res.json();
}

export async function getProductsPos() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${BASE}/products/pos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load products');
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
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Order failed');
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
  if (!res.ok) throw new Error('Confirm failed');
  return res.json();
}
