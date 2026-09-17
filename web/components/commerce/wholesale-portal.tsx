'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Search,
  MapPin,
  ChevronDown,
  ShoppingCart,
  ArrowUpRight,
  ArrowRight,
  Grid2X2,
  List,
  Heart,
  Plus,
  Package,
  Headphones,
  Check,
  Zap,
  X,
  SlidersHorizontal,
  Trash2,
  ArrowLeft,
  CreditCard,
  Landmark,
  ShieldCheck,
  RotateCcw,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from '@/components/ui/sheet';
import {
  Product,
  products as fixtureProducts,
  categories,
  money,
  casePrice,
} from '@/modules/catalog/data';
import { sampleOrders, SampleOrder } from '@/modules/catalog/orders';
import { ProductCard } from './product-card';
import { QuantityInput } from './quantity-input';
import { AdminWorkspace } from './admin-workspace';

type Page = 'catalog' | 'again' | 'saved' | 'orders' | 'checkout';
type Modal = 'quick' | 'account' | 'location' | 'apply' | null;
const locations = [
  {
    name: 'Jean’s Market · Downtown',
    street: '125 NE 1st Avenue',
    city: 'Miami, FL 33101',
  },
  {
    name: 'Jean’s Market · North',
    street: '840 NE 125th Street',
    city: 'North Miami, FL 33161',
  },
];
export default function WholesalePortal() {
  const [products, setProducts] = useState(fixtureProducts);
  const [mode, setMode] = useState<'buyer' | 'admin'>('buyer');
  const [page, setPage] = useState<Page>('catalog');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All products');
  const [brands, setBrands] = useState<string[]>([]);
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState('Recommended');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [saved, setSaved] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [location, setLocation] = useState(0);
  const [minimum, setMinimum] = useState(25000);
  const [quickText, setQuickText] = useState('');
  const [quickError, setQuickError] = useState('');
  const [orderDetail, setOrderDetail] = useState<SampleOrder | null>(null);
  const [orderQuery, setOrderQuery] = useState('');
  const [delivery, setDelivery] = useState('ground');
  const [payment, setPayment] = useState('card');
  const [confirmed, setConfirmed] = useState(false);
  const [applicationDone, setApplicationDone] = useState(false);
  const [po, setPo] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4200);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const lines = products
    .filter((p) => cart[p.id] > 0)
    .map((p) => ({ p, quantity: cart[p.id] }));
  const caseCount = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce(
    (n, l) => n + casePrice(l.p, l.quantity) * l.quantity,
    0,
  );
  const savings = lines.reduce(
    (n, l) => n + (l.p.price - casePrice(l.p, l.quantity)) * l.quantity,
    0,
  );
  const shipping = delivery === 'pickup' ? 0 : 4800;
  const previousIds = new Set(
    sampleOrders
      .filter((o) => o.company === 'Jean’s Market')
      .flatMap((o) => o.lines.map((l) => l.id)),
  );
  let filtered = products.filter(
    (p) =>
      (category === 'All products' || p.category === category) &&
      (!stockOnly || p.available) &&
      (!brands.length || brands.includes(p.brand)) &&
      `${p.name} ${p.brand} ${p.sku} ${p.category}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (page !== 'saved' || saved.includes(p.id)) &&
      (page !== 'again' || previousIds.has(p.id)),
  );
  if (sort === 'Price: low to high')
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === 'Name: A–Z')
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  const hasFilters =
    query || category !== 'All products' || brands.length || stockOnly;
  function resetFilters() {
    setQuery('');
    setCategory('All products');
    setBrands([]);
    setStockOnly(false);
  }
  function navigate(next: Page) {
    setPage(next);
    resetFilters();
    setConfirmed(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function toggleSaved(id: string) {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function addItems(items: { id: string; quantity: number }[]) {
    const next = { ...cart };
    const unavailable: string[] = [];
    for (const item of items) {
      const p = products.find((p) => p.id === item.id);
      if (!p?.available) {
        unavailable.push(p?.name ?? item.id);
        continue;
      }
      const q = (next[item.id] ?? 0) + item.quantity;
      if (q > 999) {
        setNotice('Maximum 999 cases per product in this preview.');
        return false;
      }
      next[item.id] = q;
    }
    setCart(next);
    setNotice(
      unavailable.length
        ? `Available items added. Unavailable: ${unavailable.join(', ')}.`
        : `${items.reduce((s, i) => s + i.quantity, 0)} cases added to your cart.`,
    );
    return true;
  }
  function openProduct(p: Product) {
    setSelected(p);
    setDetailQuantity(1);
  }
  function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    const parsed = quickText
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line, index) => {
        const [sku, q, ...rest] = line.trim().split(/[\s,;]+/);
        const p = products.find(
          (p) => p.sku.toLowerCase() === sku.toLowerCase(),
        );
        const quantity = Number(q);
        if (
          !p ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 999 ||
          rest.length ||
          !p.available
        )
          throw new Error(
            `Line ${index + 1}: enter an available SKU and a whole case quantity from 1 to 999.`,
          );
        return { id: p.id, quantity };
      });
    if (!parsed.length) {
      setQuickError('Enter at least one SKU and case quantity.');
      return;
    }
    if (addItems(parsed)) {
      setModal(null);
      setQuickText('');
      setQuickError('');
      setCartOpen(true);
    }
  }
  const title =
    page === 'saved'
      ? 'Saved products'
      : page === 'again'
        ? 'Buy it again'
        : page === 'orders'
          ? 'Your orders'
          : 'Wholesale catalog';
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="preview-bar">
        <span>
          <span className="preview-dot" /> DESIGN PREVIEW{' '}
          <span className="preview-note">
            Sample account, pricing & availability
          </span>
        </span>
        <div className="preview-switch">
          <button
            className={mode === 'buyer' ? 'active' : ''}
            onClick={() => setMode('buyer')}
          >
            Buyer portal
          </button>
          <span>/</span>
          <button
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => setMode('admin')}
          >
            Admin workspace <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
      {mode === 'admin' ? (
        <AdminWorkspace
          products={products}
          onProducts={setProducts}
          onBuyer={() => setMode('buyer')}
          onNotice={setNotice}
          minimum={minimum}
          onMinimum={setMinimum}
        />
      ) : (
        <>
          <header className="main-header">
            <div className="header-inner">
              <button onClick={() => navigate('catalog')} className="wordmark">
                HORIZON
                <span>
                  VERT<span className="logo-period">®</span>
                </span>
                <small>FOODS · WHOLESALE</small>
              </button>
              <div className="search-field">
                <Search size={19} />
                <Input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (page === 'orders' || page === 'checkout')
                      setPage('catalog');
                  }}
                  placeholder="Search products, brands or SKU…"
                  aria-label="Search catalog"
                />
                {query ? (
                  <button
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <kbd>⌘ K</kbd>
                )}
              </div>
              <button className="ship-to" onClick={() => setModal('location')}>
                <MapPin size={19} />
                <span>
                  <small>Deliver to</small>
                  <strong>{locations[location].city}</strong>
                </span>
                <ChevronDown size={14} />
              </button>
              <button
                className="account-trigger"
                onClick={() => setModal('account')}
                aria-label="Open business account"
              >
                <span className="avatar">JM</span>
                <span>
                  <small>Your business account</small>
                  <strong>
                    Jean’s Market <ChevronDown size={13} />
                  </strong>
                </span>
              </button>
            </div>
          </header>
          <nav className="main-nav" aria-label="Wholesale navigation">
            <div className="nav-inner">
              <div>
                {(
                  [
                    { id: 'catalog', label: 'Shop products' },
                    { id: 'again', label: 'Buy again' },
                    { id: 'saved', label: 'Saved lists' },
                    { id: 'orders', label: 'Orders' },
                  ] as const
                ).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => navigate(n.id)}
                    className={`nav-link ${page === n.id ? 'active' : ''}`}
                  >
                    {n.label}
                    {n.id === 'saved' && saved.length > 0 && (
                      <span className="nav-count">{saved.length}</span>
                    )}
                  </button>
                ))}
              </div>
              <div>
                <button className="quick-nav" onClick={() => setModal('quick')}>
                  <Zap size={16} />
                  Quick order
                </button>
                <button className="cart-nav" onClick={() => setCartOpen(true)}>
                  <ShoppingCart size={18} />
                  Cart <b>{caseCount}</b>
                </button>
              </div>
            </div>
          </nav>
          {page === 'checkout' ? (
            <main id="main-content" className="page-wrap checkout-wrap">
              <button className="back-link" onClick={() => navigate('catalog')}>
                <ArrowLeft size={14} />
                Back to catalog
              </button>
              {confirmed ? (
                <div className="confirmation">
                  <CheckCircle2 size={43} />
                  <p className="eyebrow">CHECKOUT DESIGN PREVIEW</p>
                  <h1>Your order, clearly confirmed.</h1>
                  <p>
                    This is the confirmation layout. No order was placed and no
                    payment was collected.
                  </p>
                  <div className="confirmation-details">
                    <div>
                      <span>Sample reference</span>
                      <strong>SAMPLE-ORDER</strong>
                    </div>
                    <div>
                      <span>Items</span>
                      <strong>
                        {caseCount} cases · {lines.length} products
                      </strong>
                    </div>
                    <div>
                      <span>Payment method</span>
                      <strong>
                        {payment === 'ach'
                          ? 'US bank account · ACH'
                          : 'Credit card'}
                      </strong>
                    </div>
                  </div>
                  {payment === 'ach' && (
                    <div className="notice-box">
                      A real ACH order would show “Payment processing” and
                      remain on fulfillment hold until confirmation.
                    </div>
                  )}
                  <Button
                    className="large-primary"
                    onClick={() => navigate('catalog')}
                  >
                    Continue shopping <ArrowRight size={16} />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">ONE LAST LOOK</p>
                      <h1>
                        Review your order
                        <span className="orange-period">.</span>
                      </h1>
                      <p>Confirm delivery and choose how you’d like to pay.</p>
                    </div>
                    <span className="secure-note">
                      <ShieldCheck size={17} />
                      Checkout design preview
                    </span>
                  </div>
                  <div className="checkout-layout">
                    <div>
                      <section className="checkout-card">
                        <h2>
                          <span>1</span>Delivery details
                        </h2>
                        <div className="address-preview">
                          <Building2 size={22} />
                          <div>
                            <strong>{locations[location].name}</strong>
                            <p>
                              {locations[location].street}
                              <br />
                              {locations[location].city}
                              <br />
                              United States
                            </p>
                          </div>
                          <button
                            className="text-link"
                            onClick={() => setModal('location')}
                          >
                            Change
                          </button>
                        </div>
                        <div className="form-grid">
                          <label>
                            Purchase order number <span>(optional)</span>
                            <Input
                              placeholder="e.g. PO-2026-0917"
                              value={po}
                              onChange={(e) => setPo(e.target.value)}
                            />
                          </label>
                          <label>
                            Delivery instructions <span>(optional)</span>
                            <Input placeholder="Receiving hours, dock access…" />
                          </label>
                        </div>
                      </section>
                      <section className="checkout-card">
                        <h2>
                          <span>2</span>Delivery method
                        </h2>
                        {[
                          {
                            id: 'ground',
                            label: 'Standard commercial delivery',
                            detail: 'Sample ground shipping estimate',
                            price: '$48.00',
                          },
                          {
                            id: 'pickup',
                            label: 'Local pickup',
                            detail:
                              'Sample pickup option · Confirm availability with your representative',
                            price: 'No charge',
                          },
                        ].map((m) => (
                          <label
                            key={m.id}
                            className={`radio-card ${delivery === m.id ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name="delivery"
                              checked={delivery === m.id}
                              onChange={() => setDelivery(m.id)}
                            />
                            <div>
                              <strong>{m.label}</strong>
                              <small>{m.detail}</small>
                            </div>
                            <b>{m.price}</b>
                          </label>
                        ))}
                      </section>
                      <section className="checkout-card">
                        <h2>
                          <span>3</span>Payment method
                        </h2>
                        <div className="payment-options">
                          {[
                            {
                              id: 'card',
                              name: 'Credit card',
                              Icon: CreditCard,
                            },
                            {
                              id: 'ach',
                              name: 'US bank account · ACH',
                              Icon: Landmark,
                            },
                          ].map(({ id, name, Icon }) => (
                            <label
                              key={id}
                              className={`radio-card ${payment === id ? 'selected' : ''}`}
                            >
                              <input
                                type="radio"
                                name="payment"
                                checked={payment === id}
                                onChange={() => setPayment(id)}
                              />
                              <Icon size={22} />
                              <strong>{name}</strong>
                            </label>
                          ))}
                        </div>
                        <div className="payment-preview">
                          <ShieldCheck size={22} />
                          <div>
                            <strong>
                              {payment === 'ach'
                                ? 'Bank verification through Stripe'
                                : 'Secure card entry through Stripe'}
                            </strong>
                            <p>
                              {payment === 'ach'
                                ? 'Bank verification and authorization will happen securely with Stripe. ACH confirmation can take several business days.'
                                : 'Card details will be entered securely through Stripe. This design preview does not collect payment information.'}
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                    <aside className="checkout-summary">
                      <h2>
                        Order summary <span>{caseCount} cases</span>
                      </h2>
                      {lines.map(({ p, quantity }) => (
                        <div className="checkout-item" key={p.id}>
                          <img src={p.image} alt="" />
                          <div>
                            <strong>{p.name}</strong>
                            <small>
                              {quantity} cases · {p.pack}
                            </small>
                          </div>
                          <span>
                            {money(casePrice(p, quantity) * quantity)}
                          </span>
                        </div>
                      ))}
                      <div className="summary-row">
                        <span>Merchandise subtotal</span>
                        <strong>{money(subtotal)}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Sample delivery</span>
                        <strong>{money(shipping)}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Sales tax</span>
                        <span>Not calculated</span>
                      </div>
                      {savings > 0 && (
                        <div className="summary-row saving">
                          <span>Volume savings included</span>
                          <strong>{money(savings)}</strong>
                        </div>
                      )}
                      <div className="summary-row total">
                        <span>Estimated subtotal</span>
                        <strong>{money(subtotal + shipping)}</strong>
                      </div>
                      <p className="summary-note">
                        Before tax. Live shipping and tax calculations will be
                        connected during implementation.
                      </p>
                      <Button
                        className="large-primary full-width"
                        disabled={
                          !lines.length ||
                          subtotal < minimum ||
                          lines.some((l) => !l.p.available)
                        }
                        onClick={() => {
                          setConfirmed(true);
                          window.scrollTo({ top: 0, behavior: 'instant' });
                        }}
                      >
                        Preview confirmation <ArrowRight size={16} />
                      </Button>
                      <p className="checkout-safe">
                        Design preview only. No charge. No order submission.
                      </p>
                    </aside>
                  </div>
                </>
              )}
            </main>
          ) : (
            <main id="main-content" className="page-wrap">
              <div className="breadcrumb">
                <button onClick={() => navigate('catalog')}>Wholesale</button>
                <span>/</span>
                {page === 'catalog' ? 'Catalog' : title}
              </div>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    {page === 'catalog'
                      ? 'GOOD FOOD. GOOD BUSINESS.'
                      : page === 'orders'
                        ? 'EVERY ORDER, IN ONE PLACE.'
                        : 'LESS SEARCHING. MORE BUSINESS.'}
                  </p>
                  <h1>
                    {title}
                    <span className="orange-period">.</span>
                  </h1>
                  <p>
                    {page === 'catalog'
                      ? 'Your essentials, by the case. Quality ingredients for your next order.'
                      : page === 'saved'
                        ? 'Your go-to assortment. Save products with the heart icon as you shop.'
                        : page === 'again'
                          ? 'Your familiar favorites, ready for the next order.'
                          : 'Track your deliveries and restock from previous orders.'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="large-button"
                  onClick={() => setModal('quick')}
                >
                  <List size={16} />
                  Quick order by SKU
                  <ArrowUpRight size={15} />
                </Button>
              </div>
              {page === 'orders' ? (
                <section className="orders-view">
                  <div className="orders-summary-strip">
                    <Package size={19} />
                    <div>
                      <strong>Your latest order is on its way.</strong>
                      <span>Sample order #HV-10482 · Shipped September 15</span>
                    </div>
                    <button onClick={() => setOrderDetail(sampleOrders[0])}>
                      View order <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="mini-search order-search">
                    <Search size={16} />
                    <Input
                      placeholder="Search by order number"
                      aria-label="Search your orders"
                      value={orderQuery}
                      onChange={(e) => setOrderQuery(e.target.value)}
                    />
                  </div>
                  <div className="table-scroll">
                    <table className="admin-table buyer-orders">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Placed</th>
                          <th>Items</th>
                          <th>Order total</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {sampleOrders
                          .filter(
                            (o) =>
                              o.company === 'Jean’s Market' &&
                              o.id
                                .toLowerCase()
                                .includes(orderQuery.toLowerCase()),
                          )
                          .map((o) => (
                            <tr key={o.id}>
                              <td>
                                <button
                                  className="table-link"
                                  onClick={() => setOrderDetail(o)}
                                >
                                  #{o.id}
                                </button>
                              </td>
                              <td>{o.date}</td>
                              <td>
                                {o.lines.reduce((s, l) => s + l.quantity, 0)}{' '}
                                cases <small>{o.lines.length} products</small>
                              </td>
                              <td className="numeric">{money(o.total)}</td>
                              <td>
                                <span
                                  className={`status-pill ${o.status === 'Delivered' ? 'green' : 'neutral'}`}
                                >
                                  {o.status}
                                </span>
                              </td>
                              <td>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    addItems(o.lines);
                                    setCartOpen(true);
                                  }}
                                >
                                  <RotateCcw size={14} />
                                  Buy again
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="summary-note">
                    Reorders use current sample prices and availability. Review
                    your cart before checkout.
                  </p>
                </section>
              ) : (
                <div className="catalog-layout">
                  <aside
                    className={`catalog-sidebar ${filtersOpen ? 'mobile-open' : ''}`}
                  >
                    <div className="sidebar-heading">
                      CATEGORIES <span>{products.length}</span>
                    </div>
                    <div className="category-list">
                      {categories.map((c, i) => (
                        <button
                          key={c}
                          className={category === c ? 'selected' : ''}
                          onClick={() => setCategory(c)}
                        >
                          {c}
                          <span>
                            {i === 0
                              ? products.length
                              : products.filter((p) => p.category === c).length}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="filter-block">
                      <h3>Availability</h3>
                      <label>
                        <input
                          type="checkbox"
                          checked={stockOnly}
                          onChange={(e) => setStockOnly(e.target.checked)}
                        />
                        In stock only
                      </label>
                    </div>
                    <div className="filter-block">
                      <h3>Brand</h3>
                      {['Madame Sarah', 'Horizon Vert', 'Partner brands'].map(
                        (b) => (
                          <label key={b}>
                            <input
                              type="checkbox"
                              checked={brands.includes(b)}
                              onChange={() =>
                                setBrands((prev) =>
                                  prev.includes(b)
                                    ? prev.filter((x) => x !== b)
                                    : [...prev, b],
                                )
                              }
                            />
                            {b}
                          </label>
                        ),
                      )}
                    </div>
                    <div className="help-card">
                      <Headphones size={21} />
                      <h3>A partner in every order.</h3>
                      <p>
                        Need help with bulk quantities or building your
                        assortment?
                      </p>
                      <a href="mailto:info@horizonvertnaturals.com">
                        Talk to our team <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </aside>
                  <section className="catalog-content" aria-label="Products">
                    <div className="account-strip">
                      <span className="account-check">
                        <Check size={15} />
                      </span>
                      <div>
                        <strong>Your wholesale pricing is ready.</strong>
                        <span>
                          {' '}
                          Case pricing shown in USD. Save more when you order
                          10+ cases.
                        </span>
                      </div>
                      <Package size={20} />
                    </div>
                    <div className="catalog-toolbar">
                      <span aria-live="polite">
                        <strong>{filtered.length} products</strong>
                        <span className="muted"> in your catalog</span>
                      </span>
                      <div>
                        <button
                          className="mobile-filter"
                          onClick={() => setFiltersOpen(!filtersOpen)}
                          aria-expanded={filtersOpen}
                        >
                          <SlidersHorizontal size={14} />
                          Filters
                        </button>
                        <label>
                          Sort by:{' '}
                          <select
                            aria-label="Sort products"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                          >
                            {[
                              'Recommended',
                              'Price: low to high',
                              'Name: A–Z',
                            ].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                        <div className="view-switch">
                          <button
                            className={view === 'grid' ? 'selected' : ''}
                            onClick={() => setView('grid')}
                            aria-label="Grid view"
                            aria-pressed={view === 'grid'}
                          >
                            <Grid2X2 size={17} />
                          </button>
                          <button
                            className={view === 'list' ? 'selected' : ''}
                            onClick={() => setView('list')}
                            aria-label="List view"
                            aria-pressed={view === 'list'}
                          >
                            <List size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                    {hasFilters && (
                      <div className="active-filters">
                        <span>
                          {category !== 'All products'
                            ? category
                            : 'Filtered results'}
                          {query && ` · “${query}”`}
                        </span>
                        <button onClick={resetFilters}>
                          Clear filters <X size={12} />
                        </button>
                      </div>
                    )}
                    {filtered.length ? (
                      <div
                        className={`product-grid ${view === 'list' ? 'product-list' : ''}`}
                      >
                        {filtered.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            saved={saved.includes(p.id)}
                            onSave={() => toggleSaved(p.id)}
                            onAdd={(quantity) =>
                              addItems([{ id: p.id, quantity }])
                            }
                            onOpen={() => openProduct(p)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state catalog-empty">
                        {page === 'saved' ? (
                          <Heart size={29} />
                        ) : (
                          <Search size={29} />
                        )}
                        <h2>
                          {page === 'saved' && !hasFilters
                            ? 'Your next order starts with a list.'
                            : 'No products found.'}
                        </h2>
                        <p>
                          {page === 'saved' && !hasFilters
                            ? 'Tap the heart on any product to keep your regular essentials together.'
                            : 'Try another product name or SKU, or clear your filters.'}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            resetFilters();
                            if (page === 'saved') navigate('catalog');
                          }}
                        >
                          {page === 'saved'
                            ? 'Explore the catalog'
                            : 'Clear filters'}
                          <ArrowRight size={15} />
                        </Button>
                      </div>
                    )}
                    <div className="catalog-end">
                      {filtered.length} sample products · Wholesale pricing in
                      USD<span>Built for the way you buy.</span>
                    </div>
                  </section>
                </div>
              )}
            </main>
          )}
          <footer>
            <div className="footer-inner">
              <span>
                HORIZON VERT{' '}
                <small>Quality ingredients. Lasting partnerships.</small>
              </span>
              <span>
                <a href="mailto:info@horizonvertnaturals.com">
                  Contact your wholesale team
                </a>
                <span className="footer-dot">•</span>US wholesale · USD
              </span>
            </div>
          </footer>
        </>
      )}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="cart-sheet">
          <SheetHeader>
            <SheetTitle>
              Your order <span className="count-badge">{caseCount} cases</span>
            </SheetTitle>
            <SheetDescription>
              {lines.length} products · Prices in USD
            </SheetDescription>
          </SheetHeader>
          {lines.length ? (
            <>
              <div className="cart-lines">
                {lines.map(({ p, quantity }) => (
                  <div className="cart-line" key={p.id}>
                    <img src={p.image} alt={p.name} />
                    <div className="cart-line-main">
                      <strong>{p.name}</strong>
                      <small>{p.pack} / case</small>
                      <span>
                        {money(casePrice(p, quantity))} / case
                        {quantity >= 10 && <b>Volume price</b>}
                      </span>
                      <div>
                        <QuantityInput
                          value={quantity}
                          label={`Cart cases of ${p.name}`}
                          onChange={(q) => setCart({ ...cart, [p.id]: q })}
                        />
                        <button
                          className="remove-line"
                          aria-label={`Remove ${p.name}`}
                          onClick={() =>
                            setCart((c) => {
                              const next = { ...c };
                              delete next[p.id];
                              return next;
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                        <strong>
                          {money(casePrice(p, quantity) * quantity)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-bottom">
                {lines.some((l) => !l.p.available) && (
                  <p className="field-error">
                    Remove unavailable products before continuing.
                  </p>
                )}
                {subtotal < minimum ? (
                  <div className="cart-minimum">
                    <Package size={16} />
                    <span>
                      Add <strong>{money(minimum - subtotal)}</strong> to meet
                      the {money(minimum)} order minimum.
                    </span>
                  </div>
                ) : (
                  <div className="cart-minimum met">
                    <CheckCircle2 size={16} />
                    Your order minimum is met.
                  </div>
                )}
                <div className="summary-row">
                  <span>Subtotal · {caseCount} cases</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                {savings > 0 && (
                  <div className="summary-row saving">
                    <span>Volume savings included</span>
                    <strong>{money(savings)}</strong>
                  </div>
                )}
                <p className="summary-note">
                  Shipping and tax reviewed at checkout. All commercial values
                  in this preview are illustrative.
                </p>
                <Button
                  className="large-primary full-width"
                  disabled={
                    subtotal < minimum || lines.some((l) => !l.p.available)
                  }
                  onClick={() => {
                    setCartOpen(false);
                    setMode('buyer');
                    navigate('checkout');
                  }}
                >
                  Review checkout <ArrowRight size={16} />
                </Button>
                <button
                  className="continue-shopping"
                  onClick={() => setCartOpen(false)}
                >
                  Continue shopping
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state cart-empty">
              <ShoppingCart size={34} />
              <h2>Make room for good food.</h2>
              <p>Add products by the case to start your next order.</p>
              <Button
                onClick={() => {
                  setCartOpen(false);
                  setMode('buyer');
                  navigate('catalog');
                }}
              >
                Shop the catalog <ArrowRight size={15} />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="product-dialog">
          {selected && (
            <>
              <div className="detail-image">
                <img src={selected.image} alt={selected.name} />
              </div>
              <div className="detail-content">
                <p className="eyebrow">{selected.brand}</p>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
                <p className="product-sku">
                  {selected.sku} · Sample specifications
                </p>
                <dl className="product-specs">
                  <div>
                    <dt>Case pack</dt>
                    <dd>{selected.pack}</dd>
                  </div>
                  <div>
                    <dt>Units per case</dt>
                    <dd>{selected.units}</dd>
                  </div>
                  <div>
                    <dt>Minimum order</dt>
                    <dd>1 case</dd>
                  </div>
                </dl>
                <table className="price-break-table">
                  <thead>
                    <tr>
                      <th>Order quantity</th>
                      <th>Price per case</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={detailQuantity < 10 ? 'active' : ''}>
                      <td>1–9 cases</td>
                      <td>{money(selected.price)}</td>
                    </tr>
                    <tr className={detailQuantity >= 10 ? 'active' : ''}>
                      <td>10+ cases</td>
                      <td>{money(selected.volumePrice)}</td>
                    </tr>
                  </tbody>
                </table>
                <p
                  className={`stock ${!selected.available ? 'unavailable' : ''}`}
                >
                  <span />
                  {selected.available
                    ? 'In stock · Available by the case'
                    : 'Temporarily unavailable'}
                </p>
                <div className="detail-order">
                  <QuantityInput
                    value={detailQuantity}
                    onChange={setDetailQuantity}
                    label="Product detail case quantity"
                  />
                  <strong>
                    {money(
                      casePrice(selected, detailQuantity) * detailQuantity,
                    )}
                  </strong>
                </div>
                <p className="detail-math">
                  {detailQuantity} cases × {selected.units} units ={' '}
                  {detailQuantity * selected.units} units
                </p>
                <Button
                  className="large-primary full-width"
                  disabled={!selected.available}
                  onClick={() => {
                    addItems([{ id: selected.id, quantity: detailQuantity }]);
                    setSelected(null);
                  }}
                >
                  Add {detailQuantity} {detailQuantity === 1 ? 'case' : 'cases'}{' '}
                  to cart <Plus size={16} />
                </Button>
                <button
                  className="save-detail"
                  onClick={() => toggleSaved(selected.id)}
                >
                  <Heart
                    size={14}
                    fill={saved.includes(selected.id) ? 'currentColor' : 'none'}
                  />
                  {saved.includes(selected.id)
                    ? 'Saved to your list'
                    : 'Save for your next order'}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
      >
        <DialogContent className="form-dialog">
          {modal === 'quick' && (
            <>
              <DialogTitle>Quick order by SKU</DialogTitle>
              <DialogDescription>
                Know what you need? Enter one SKU and case quantity per line.
              </DialogDescription>
              <form
                className="stack-form"
                onSubmit={(e) => {
                  try {
                    quickAdd(e);
                  } catch (error) {
                    setQuickError(
                      error instanceof Error
                        ? error.message
                        : 'Check your SKUs and quantities.',
                    );
                  }
                }}
              >
                <label htmlFor="sku-lines">SKU, cases</label>
                <textarea
                  id="sku-lines"
                  autoFocus
                  rows={5}
                  value={quickText}
                  onChange={(e) => {
                    setQuickText(e.target.value);
                    setQuickError('');
                  }}
                  placeholder={'HV-RIC-001, 10\nHV-BEA-002, 6'}
                  required
                />
                <p className="summary-note">
                  Example: HV-RIC-001, 10 adds 10 cases of Premium Jasmine Rice.
                  Current sample volume prices apply.
                </p>
                {quickError && (
                  <p className="field-error" role="alert">
                    {quickError}
                  </p>
                )}
                <Button type="submit" className="large-primary">
                  Add cases to cart <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}
          {modal === 'account' && (
            <>
              <DialogTitle>Your business account</DialogTitle>
              <DialogDescription>
                Jean’s Market · Sample approved wholesale account
              </DialogDescription>
              <dl className="account-details">
                <div>
                  <dt>Account owner</dt>
                  <dd>Jean Martin</dd>
                </div>
                <div>
                  <dt>Account status</dt>
                  <dd>
                    <span className="status-pill green">Approved</span>
                  </dd>
                </div>
                <div>
                  <dt>Pricing</dt>
                  <dd>Standard wholesale · USD</dd>
                </div>
                <div>
                  <dt>Payment terms</dt>
                  <dd>Prepaid · Card or ACH</dd>
                </div>
                <div>
                  <dt>Delivery location</dt>
                  <dd>{locations[location].city}</dd>
                </div>
              </dl>
              <Button
                variant="outline"
                className="large-button"
                onClick={() => setModal('location')}
              >
                <MapPin size={15} />
                Manage sample locations
              </Button>
              <div className="modal-divider" />
              <p className="summary-note">
                Explore how a new business applies for wholesale access.
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setApplicationDone(false);
                  setModal('apply');
                }}
              >
                Preview account application <ArrowUpRight size={14} />
              </Button>
            </>
          )}
          {modal === 'location' && (
            <>
              <DialogTitle>Your delivery location</DialogTitle>
              <DialogDescription>
                Choose the location for this sample order.
              </DialogDescription>
              <div className="location-options">
                {locations.map((l, i) => (
                  <button
                    key={l.name}
                    className={`location-card ${location === i ? 'selected' : ''}`}
                    onClick={() => {
                      setLocation(i);
                      setModal(null);
                      setNotice('Sample delivery location updated.');
                    }}
                  >
                    <MapPin size={20} />
                    <div>
                      <strong>{l.name}</strong>
                      <span>
                        {l.street}
                        <br />
                        {l.city}
                      </span>
                    </div>
                    {location === i && <CheckCircle2 size={18} />}
                  </button>
                ))}
              </div>
            </>
          )}
          {modal === 'apply' && (
            <>
              <DialogTitle>
                {applicationDone
                  ? 'Application preview complete'
                  : 'Grow with Horizon Vert'}
              </DialogTitle>
              <DialogDescription>
                {applicationDone
                  ? 'Nothing was submitted. This demonstrates the application experience.'
                  : 'Apply for a wholesale account. Approved businesses receive access to case pricing and volume discounts.'}
              </DialogDescription>
              {applicationDone ? (
                <div className="application-success">
                  <CheckCircle2 size={34} />
                  <p>
                    In the live experience, our wholesale team reviews your
                    business and emails you the next steps.
                  </p>
                  <Button variant="outline" onClick={() => setModal(null)}>
                    Back to the preview
                  </Button>
                </div>
              ) : (
                <form
                  className="stack-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setApplicationDone(true);
                  }}
                >
                  <div className="form-grid">
                    <label>
                      First name
                      <Input required placeholder="First name" />
                    </label>
                    <label>
                      Last name
                      <Input required placeholder="Last name" />
                    </label>
                  </div>
                  <label>
                    Business name
                    <Input required placeholder="Your company’s legal name" />
                  </label>
                  <label>
                    Business email
                    <Input
                      required
                      type="email"
                      placeholder="you@company.com"
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Business type
                      <select required defaultValue="">
                        <option value="" disabled>
                          Select type
                        </option>
                        <option>Grocery / retail</option>
                        <option>Restaurant / foodservice</option>
                        <option>Distributor</option>
                        <option>Other business</option>
                      </select>
                    </label>
                    <label>
                      ZIP code
                      <Input
                        required
                        pattern="[0-9]{5}"
                        placeholder="33101"
                        maxLength={5}
                      />
                    </label>
                  </div>
                  <label className="check-label">
                    <input type="checkbox" required />I am purchasing for a
                    registered business.
                  </label>
                  <p className="summary-note">
                    Design preview: use sample information. No application or
                    email is sent.
                  </p>
                  <Button type="submit" className="large-primary">
                    Preview application submission <ArrowRight size={15} />
                  </Button>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!orderDetail}
        onOpenChange={(open) => !open && setOrderDetail(null)}
      >
        <DialogContent className="form-dialog">
          <DialogTitle>Order #{orderDetail?.id}</DialogTitle>
          <DialogDescription>
            Sample order · {orderDetail?.date} · Jean’s Market
          </DialogDescription>
          {orderDetail && (
            <>
              <div className="order-detail-status">
                <span className="status-pill green">{orderDetail.status}</span>
                <span className="status-pill neutral">Paid</span>
              </div>
              {orderDetail.lines.map((l) => (
                <div className="summary-row" key={l.id}>
                  <span>{products.find((p) => p.id === l.id)?.name}</span>
                  <strong>{l.quantity} cases</strong>
                </div>
              ))}
              <div className="summary-row total">
                <span>Historical sample total</span>
                <strong>{money(orderDetail.total)}</strong>
              </div>
              <p className="summary-note">
                Current pricing is recalculated when you add these products to
                your cart.
              </p>
              <Button
                className="large-primary"
                onClick={() => {
                  addItems(orderDetail.lines);
                  setOrderDetail(null);
                  setCartOpen(true);
                }}
              >
                <RotateCcw size={15} />
                Buy this order again
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
