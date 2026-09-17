'use client';
import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Package,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  Search,
  Download,
  ChevronRight,
  Check,
  Clock,
  CircleAlert,
  SlidersHorizontal,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Product, money } from '@/modules/catalog/data';
import { sampleOrders, SampleOrder } from '@/modules/catalog/orders';
export function AdminWorkspace({
  products,
  onProducts,
  onBuyer,
  onNotice,
  minimum,
  onMinimum,
}: {
  products: Product[];
  onProducts: (p: Product[]) => void;
  onBuyer: () => void;
  onNotice: (s: string) => void;
  minimum: number;
  onMinimum: (n: number) => void;
}) {
  const [section, setSection] = useState('Overview');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All orders');
  const [editing, setEditing] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SampleOrder | null>(null);
  const [applications, setApplications] = useState([
    {
      name: 'Palm Grove Market',
      city: 'Orlando, FL',
      contact: 'Amelie Laurent',
      email: 'amelie@example.com',
      status: 'Pending',
    },
    {
      name: 'Island Provisions',
      city: 'Atlanta, GA',
      contact: 'David Joseph',
      email: 'david@example.com',
      status: 'Pending',
    },
    {
      name: 'Maison Kitchen',
      city: 'Tampa, FL',
      contact: 'Marie Louis',
      email: 'marie@example.com',
      status: 'Pending',
    },
  ]);
  const [minDraft, setMinDraft] = useState(minimum / 100);
  const [settingsTab, setSettingsTab] = useState('Ordering');
  const [customer, setCustomer] = useState<string | null>(null);
  const pending = applications.filter((a) => a.status === 'Pending').length;
  const orders = sampleOrders.filter(
    (o) =>
      (status === 'All orders' || o.status === status) &&
      `${o.id} ${o.company}`.toLowerCase().includes(query.toLowerCase()),
  );
  function navigate(s: string) {
    setSection(s);
    setQuery('');
    setStatus('All orders');
  }
  function download() {
    const rows = [
      'Order,Company,Date,Total USD,Status,Payment',
      ...orders.map((o) =>
        [
          o.id,
          o.company,
          o.date.replace(',', ''),
          (o.total / 100).toFixed(2),
          o.status,
          o.payment,
        ].join(','),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.join('\n')], { type: 'text/csv' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'horizon-vert-sample-orders.csv';
    a.click();
    URL.revokeObjectURL(url);
    onNotice('Sample orders exported.');
  }
  const orderTable = (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Payment</th>
            <th>Fulfillment</th>
            <th className="right">Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} onClick={() => setSelectedOrder(o)}>
              <td>
                <button
                  className="table-link"
                  onClick={() => setSelectedOrder(o)}
                >
                  #{o.id}
                </button>
              </td>
              <td>{o.date}</td>
              <td>
                <strong>{o.company}</strong>
                <small>{o.contact}</small>
              </td>
              <td>
                <span
                  className={`status-pill ${o.payment === 'Paid' ? 'green' : 'amber'}`}
                >
                  <span />
                  {o.payment}
                </span>
              </td>
              <td>
                <span className="status-pill neutral">{o.status}</span>
              </td>
              <td className="right numeric">{money(o.total)}</td>
              <td>
                <ChevronRight size={14} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="empty-state">No orders match your search.</div>
      )}
    </div>
  );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <button onClick={onBuyer} className="wordmark">
          HORIZON
          <span>
            VERT<sup>®</sup>
          </span>
          <small>WHOLESALE ADMIN</small>
        </button>
        <div className="admin-store">
          <span className="store-avatar">HV</span>
          <div>
            <strong>Horizon Vert Foods</strong>
            <small>Sample workspace</small>
          </div>
        </div>
        <nav>
          {[
            { name: 'Overview', icon: LayoutDashboard },
            { name: 'Orders', icon: ShoppingBag },
            { name: 'Products', icon: Package },
            { name: 'Customers', icon: Users },
            { name: 'Pricing', icon: DollarSign },
            { name: 'Settings', icon: Settings },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={section === name ? 'active' : ''}
              onClick={() => navigate(name)}
            >
              <Icon size={17} />
              {name}
              {name === 'Customers' && pending > 0 && <span>{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <button onClick={onBuyer}>
            View buyer portal <ArrowUpRight size={15} />
          </button>
          <div className="admin-profile">
            <span className="avatar">AM</span>
            <div>
              <strong>Alex Morgan</strong>
              <small>Administrator · Sample</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>
            Workspace <ChevronRight size={12} /> {section}
          </span>
          <span className="workspace-status">
            <span /> Design sandbox
          </span>
        </header>
        <main id="main-content" className="admin-page">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">HORIZON VERT · OPERATIONS</p>
              <h1>
                {section === 'Overview' ? 'Good morning, Alex.' : section}
              </h1>
              <p>
                {section === 'Overview'
                  ? 'A clear view of what needs your attention.'
                  : section === 'Products'
                    ? 'Manage the assortment your wholesale customers see.'
                    : section === 'Customers'
                      ? 'Build lasting relationships, one account at a time.'
                      : section === 'Pricing'
                        ? 'Clear case pricing. Consistent volume discounts.'
                        : section === 'Settings'
                          ? 'Configure your wholesale ordering experience.'
                          : 'Review, manage and fulfill wholesale orders.'}
              </p>
            </div>
            {section === 'Orders' ? (
              <Button
                variant="outline"
                className="large-button"
                onClick={download}
              >
                <Download size={15} />
                Export orders
              </Button>
            ) : (
              <span className="admin-date">Thursday, September 17, 2026</span>
            )}
          </div>
          {section === 'Overview' && (
            <>
              <div className="metrics-grid">
                {[
                  {
                    label: 'Sample order value',
                    value: money(sampleOrders.reduce((s, o) => s + o.total, 0)),
                    detail: 'Across 5 sample orders',
                    icon: ShoppingBag,
                  },
                  {
                    label: 'Ready for fulfillment',
                    value: '1',
                    detail: 'Payment received',
                    icon: Package,
                  },
                  {
                    label: 'Account applications',
                    value: String(pending),
                    detail: 'Awaiting your review',
                    icon: Users,
                  },
                  {
                    label: 'Payment holds',
                    value: '1',
                    detail: 'ACH payment processing',
                    icon: Clock,
                  },
                ].map((m) => (
                  <div className="metric" key={m.label}>
                    <div>
                      {m.label}
                      <m.icon size={16} />
                    </div>
                    <strong>{m.value}</strong>
                    <span>{m.detail}</span>
                  </div>
                ))}
              </div>
              <div className="attention-bar">
                <CircleAlert size={19} />
                <div>
                  <strong>A few things need your attention</strong>
                  <span>
                    {pending} wholesale applications to review · 1 order
                    awaiting ACH confirmation
                  </span>
                </div>
                <Button variant="ghost" onClick={() => navigate('Customers')}>
                  Review accounts <ArrowRight size={15} />
                </Button>
              </div>
              <section className="admin-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent orders</h2>
                    <p>The latest activity in your wholesale business.</p>
                  </div>
                  <button onClick={() => navigate('Orders')}>
                    View all orders <ArrowRight size={14} />
                  </button>
                </div>
                {orderTable}
              </section>
              <div className="admin-bottom-grid">
                <section className="admin-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Applications to review</h2>
                      <p>New businesses ready to grow with you.</p>
                    </div>
                    <Users size={18} />
                  </div>
                  {applications
                    .filter((a) => a.status === 'Pending')
                    .map((a) => (
                      <div className="application-row" key={a.name}>
                        <span className="store-avatar">
                          {a.name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                        <div>
                          <strong>{a.name}</strong>
                          <span>{a.city}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigate('Customers');
                            setCustomer(a.name);
                          }}
                        >
                          Review <ArrowUpRight size={13} />
                        </button>
                      </div>
                    ))}
                  {pending === 0 && (
                    <div className="empty-state">
                      All sample applications reviewed.
                    </div>
                  )}
                </section>
                <section className="admin-panel integration-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Commerce connections</h2>
                      <p>Your operations, connected.</p>
                    </div>
                    <SlidersHorizontal size={18} />
                  </div>
                  {[
                    'Shopify · Product catalog',
                    'Stripe · Cards & ACH',
                    'ShipStation · Fulfillment',
                  ].map((x) => (
                    <div className="connection-row" key={x}>
                      <span>{x}</span>
                      <span className="status-pill neutral">Not connected</span>
                    </div>
                  ))}
                  <p className="integration-note">
                    Connections are configured during implementation. No live
                    data is used in this preview.
                  </p>
                </section>
              </div>
            </>
          )}
          {section === 'Orders' && (
            <section className="admin-panel">
              <div className="table-toolbar">
                <div className="table-tabs">
                  {[
                    'All orders',
                    'Processing',
                    'On hold',
                    'Shipped',
                    'Delivered',
                  ].map((s) => (
                    <button
                      key={s}
                      className={status === s ? 'active' : ''}
                      onClick={() => setStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="mini-search">
                  <Search size={16} />
                  <Input
                    aria-label="Search orders"
                    placeholder="Search order or customer"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              {orderTable}
            </section>
          )}
          {(section === 'Products' || section === 'Pricing') && (
            <section className="admin-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {section === 'Pricing'
                      ? 'Standard wholesale price list'
                      : 'All products'}{' '}
                    <span className="count-badge">{products.length}</span>
                  </h2>
                  <p>
                    {section === 'Pricing'
                      ? 'USD · Prices per case · Sample values'
                      : 'Retail-ready assortment · Case-based ordering'}
                  </p>
                </div>
                <div className="mini-search">
                  <Search size={16} />
                  <Input
                    aria-label="Search products"
                    placeholder="Search product or SKU"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Packaging</th>
                      <th>Case price</th>
                      <th>
                        {section === 'Pricing'
                          ? '10+ case price'
                          : 'Availability'}
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter((p) =>
                        `${p.name} ${p.sku}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((p) => (
                        <tr key={p.id}>
                          <td>
                            <button
                              className="table-product"
                              onClick={() => setEditing({ ...p })}
                            >
                              <img src={p.image} alt="" />
                              <div>
                                <strong>{p.name}</strong>
                                <small>{p.brand}</small>
                              </div>
                            </button>
                          </td>
                          <td className="sku-cell">{p.sku}</td>
                          <td>{p.pack}</td>
                          <td className="numeric">{money(p.price)}</td>
                          <td>
                            {section === 'Pricing' ? (
                              money(p.volumePrice)
                            ) : (
                              <span
                                className={`status-pill ${p.available ? 'green' : 'amber'}`}
                              >
                                {p.available ? 'In stock' : 'Unavailable'}
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              className="table-link"
                              onClick={() => setEditing({ ...p })}
                            >
                              Edit <ArrowUpRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {section === 'Customers' && (
            <>
              <section className="admin-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Wholesale applications{' '}
                      <span className="count-badge">{pending}</span>
                    </h2>
                    <p>
                      Review each business before granting wholesale access.
                    </p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((a) => (
                        <tr key={a.name}>
                          <td>
                            <strong>{a.name}</strong>
                          </td>
                          <td>
                            {a.contact}
                            <small>{a.email}</small>
                          </td>
                          <td>{a.city}</td>
                          <td>
                            <span
                              className={`status-pill ${a.status === 'Approved' ? 'green' : 'amber'}`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="table-link"
                              onClick={() => setCustomer(a.name)}
                            >
                              Review <ArrowUpRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="admin-panel section-space">
                <div className="panel-heading">
                  <div>
                    <h2>Active accounts</h2>
                    <p>Sample approved business customers.</p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Pricing tier</th>
                        <th>Payment terms</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Jean’s Market', 'Jean Martin'],
                        ['Caribbean Table', 'Nadia Pierre'],
                        ['Sunrise Foods', 'Marc Charles'],
                      ].map(([c, n]) => (
                        <tr key={c}>
                          <td>
                            <strong>{c}</strong>
                          </td>
                          <td>{n}</td>
                          <td>Standard wholesale</td>
                          <td>Prepaid</td>
                          <td>
                            <span className="status-pill green">Approved</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {section === 'Settings' && (
            <div className="settings-layout">
              <nav className="settings-nav">
                {['Ordering', 'Payments', 'Brand & experience'].map((t) => (
                  <button
                    key={t}
                    className={settingsTab === t ? 'active' : ''}
                    onClick={() => setSettingsTab(t)}
                  >
                    {t}
                    <ChevronRight size={14} />
                  </button>
                ))}
              </nav>
              <section className="admin-panel settings-panel">
                <h2>{settingsTab}</h2>
                {settingsTab === 'Ordering' ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onMinimum(Math.round(minDraft * 100));
                      onNotice(
                        'Sample minimum updated. It now applies to the preview cart.',
                      );
                    }}
                  >
                    <p>Set the rules for your buyers’ ordering experience.</p>
                    <label>
                      Minimum order value (USD)
                      <Input
                        type="number"
                        min={0}
                        max={100000}
                        step="0.01"
                        value={minDraft}
                        onChange={(e) => setMinDraft(Number(e.target.value))}
                        required
                      />
                    </label>
                    <small>
                      Applies to the merchandise subtotal before shipping and
                      taxes.
                    </small>
                    <div className="setting-description">
                      <Package size={19} />
                      <div>
                        <strong>Case-based ordering</strong>
                        <p>
                          Minimum 1 case. Increments of 1 case. Packaging is
                          always visible to the buyer.
                        </p>
                      </div>
                    </div>
                    <Button type="submit" className="large-primary">
                      Save preview settings <Check size={15} />
                    </Button>
                  </form>
                ) : settingsTab === 'Payments' ? (
                  <>
                    <p>Proposed payment methods for the US wholesale launch.</p>
                    {['Credit card', 'US bank account · ACH'].map((m) => (
                      <div className="setting-description" key={m}>
                        <Check size={18} />
                        <div>
                          <strong>{m}</strong>
                          <p>Processed through Stripe once connected.</p>
                        </div>
                      </div>
                    ))}
                    <div className="notice-box">
                      ACH orders remain on fulfillment hold while payment is
                      processing. Payment methods are visual previews here.
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      The wholesale identity uses the existing Horizon Vert
                      orange, warm neutral surfaces and straightforward
                      typography.
                    </p>
                    <div className="brand-swatches">
                      <span style={{ background: '#ed5728' }} />
                      <span style={{ background: '#252d28' }} />
                      <span
                        style={{
                          background: '#fafaf8',
                          border: '1px solid #ddd',
                        }}
                      />
                    </div>
                    <div className="setting-description">
                      <div>
                        <strong>Shared design tokens</strong>
                        <p>
                          Colors, spacing, type and components are centralized
                          so the buyer portal and admin stay consistent.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
          <p className="admin-disclaimer">
            Design preview · All orders, accounts and commercial values are
            sample data. Changes last for this preview session only.
          </p>
        </main>
      </div>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="form-dialog">
          <DialogTitle>Edit wholesale product</DialogTitle>
          <DialogDescription>
            Changes update the sample catalog for this preview session.
          </DialogDescription>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editing.volumePrice > editing.price) {
                  onNotice(
                    'Volume price must be at or below the standard case price.',
                  );
                  return;
                }
                onProducts(
                  products.map((p) => (p.id === editing.id ? editing : p)),
                );
                setEditing(null);
                onNotice('Sample product updated.');
              }}
              className="stack-form"
            >
              <label>
                Product name
                <Input
                  value={editing.name}
                  required
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </label>
              <label>
                Case packaging
                <Input
                  value={editing.pack}
                  required
                  onChange={(e) =>
                    setEditing({ ...editing, pack: e.target.value })
                  }
                />
              </label>
              <div className="form-grid">
                <label>
                  Case price · USD
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={editing.price / 100}
                    required
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        price: Math.round(Number(e.target.value) * 100),
                      })
                    }
                  />
                </label>
                <label>
                  10+ case price · USD
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={editing.volumePrice / 100}
                    required
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        volumePrice: Math.round(Number(e.target.value) * 100),
                      })
                    }
                  />
                </label>
              </div>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={editing.available}
                  onChange={(e) =>
                    setEditing({ ...editing, available: e.target.checked })
                  }
                />
                Available for ordering
              </label>
              <Button type="submit" className="large-primary">
                Save sample product
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="form-dialog">
          <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
          <DialogDescription>
            Sample order details · {selectedOrder?.company}
          </DialogDescription>
          {selectedOrder && (
            <>
              <div className="order-detail-status">
                <span className="status-pill neutral">
                  {selectedOrder.status}
                </span>
                <span
                  className={`status-pill ${selectedOrder.payment === 'Paid' ? 'green' : 'amber'}`}
                >
                  {selectedOrder.payment}
                </span>
              </div>
              {selectedOrder.lines.map((l) => (
                <div className="summary-row" key={l.id}>
                  <span>{products.find((p) => p.id === l.id)?.name}</span>
                  <strong>{l.quantity} cases</strong>
                </div>
              ))}
              <div className="summary-row total">
                <span>Recorded sample total</span>
                <strong>{money(selectedOrder.total)}</strong>
              </div>
              {selectedOrder.payment === 'ACH processing' && (
                <div className="notice-box">
                  Fulfillment is on hold until the payment provider confirms
                  success.
                </div>
              )}
              <p className="muted">
                Historical order values are snapshots and may differ from
                current catalog prices.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!customer}
        onOpenChange={(open) => !open && setCustomer(null)}
      >
        <DialogContent className="form-dialog">
          <DialogTitle>{customer}</DialogTitle>
          <DialogDescription>
            Sample wholesale application · No email will be sent.
          </DialogDescription>
          {applications
            .filter((a) => a.name === customer)
            .map((a) => (
              <div key={a.name}>
                <dl className="account-details">
                  <div>
                    <dt>Contact</dt>
                    <dd>{a.contact}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{a.email}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{a.city}</dd>
                  </div>
                  <div>
                    <dt>Requested tier</dt>
                    <dd>Standard wholesale</dd>
                  </div>
                  <div>
                    <dt>Payment terms</dt>
                    <dd>Prepaid</dd>
                  </div>
                </dl>
                <div className="dialog-actions">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setApplications(
                        applications.map((x) =>
                          x.name === a.name ? { ...x, status: 'Rejected' } : x,
                        ),
                      );
                      setCustomer(null);
                      onNotice('Sample application marked rejected.');
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setApplications(
                        applications.map((x) =>
                          x.name === a.name ? { ...x, status: 'Approved' } : x,
                        ),
                      );
                      setCustomer(null);
                      onNotice(
                        'Sample application approved. No account or invitation was created.',
                      );
                    }}
                  >
                    Approve sample account <Check size={15} />
                  </Button>
                </div>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
