import { useEffect, useState } from 'react';
import { createOrder, confirmOrder, getProductsPos } from './api';

type Product = { id: string; name: string; price: number; availableQuantity: number };
type CartItem = { productId: string; name: string; price: number; quantity: number };

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  function load() {
    setError('');
    getProductsPos()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function addToCart(p: Product, qty: number) {
    if (qty < 1 || p.availableQuantity < qty) return;
    setCart((prev) => {
      const i = prev.findIndex((x) => x.productId === p.id);
      const next = i >= 0 ? [...prev] : [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 0 }];
      const idx = i >= 0 ? i : next.length - 1;
      next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
      return next;
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  async function handleConfirm() {
    if (!cart.length) return;
    setError('');
    setConfirming(true);
    try {
      const order = await createOrder(cart.map((i) => ({ productId: i.productId, quantity: i.quantity })));
      await confirmOrder(order.id, 'CASH');
      setCart([]);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Order failed');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ flex: 1 }}>
        <h2>Dishes</h2>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p, 1)}
              disabled={p.availableQuantity < 1}
              style={{
                padding: '12px 16px',
                border: '1px solid #ccc',
                borderRadius: 8,
                background: p.availableQuantity < 1 ? '#eee' : 'white',
                cursor: p.availableQuantity >= 1 ? 'pointer' : 'not-allowed',
              }}
            >
              {p.name} — €{p.price.toFixed(2)} (avail: {p.availableQuantity})
            </button>
          ))}
        </div>
      </div>
      <div style={{ width: 320, border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
        <h3>Cart</h3>
        {cart.length === 0 ? (
          <p>Empty</p>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {cart.map((i) => (
                <li key={i.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{i.name} × {i.quantity}</span>
                  <span>€{(i.price * i.quantity).toFixed(2)}</span>
                  <button type="button" onClick={() => removeFromCart(i.productId)} style={{ marginLeft: 8 }}>✕</button>
                </li>
              ))}
            </ul>
            <p><strong>Total: €{total.toFixed(2)}</strong></p>
            <button onClick={handleConfirm} disabled={confirming} style={{ width: '100%', padding: 12 }}>
              {confirming ? '...' : 'Confirm & Pay (Cash)'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
