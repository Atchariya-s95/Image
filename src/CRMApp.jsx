import React, { useMemo, useState } from "react";

/**
 * CRM UI (MVP) – Single-file demo
 * - App Shell: Sidebar + Topbar + Search
 * - Sales Orders: List + Filters + Bulk actions
 * - Sales Order: Create/Edit modal + Detail drawer
 *
 * TailwindCSS required.
 */

const STAGES = ["Draft", "Pending Approval", "Approved", "Sent", "Confirmed", "Closed", "Cancelled"];

const mockOrders = [
  {
    id: "SO-2026-00012",
    customer: "Bangkok Trading Co., Ltd.",
    contact: "P. Somchai",
    opportunity: "OPP-7781",
    owner: "Nina",
    status: "Draft",
    currency: "THB",
    paymentTerms: "Net 30",
    dueDate: "2026-02-15",
    createdAt: "2026-02-01",
    updatedAt: "2026-02-03",
    items: [
      { sku: "SV-001", name: "Service Package A", qty: 1, unit: "job", price: 25000, discount: 0, taxRate: 7 },
      { sku: "PR-033", name: "Product X", qty: 3, unit: "pcs", price: 4200, discount: 5, taxRate: 7 },
    ],
    notesCustomer: "Thank you for your business.",
    notesInternal: "Need manager approval if discount > 10%",
  },
  {
    id: "SO-2026-00013",
    customer: "Chiangmai Food Supply",
    contact: "K. Arisa",
    opportunity: "OPP-7810",
    owner: "View",
    status: "Pending Approval",
    currency: "THB",
    paymentTerms: "50% upfront",
    dueDate: "2026-02-18",
    createdAt: "2026-02-02",
    updatedAt: "2026-02-04",
    items: [{ sku: "PR-010", name: "Consumable Set", qty: 10, unit: "box", price: 980, discount: 12, taxRate: 7 }],
    notesCustomer: "",
    notesInternal: "Discount 12% triggers approval",
  },
  {
    id: "SO-2026-00014",
    customer: "Siam Construction",
    contact: "K. Jakkrit",
    opportunity: "OPP-7842",
    owner: "Nina",
    status: "Sent",
    currency: "THB",
    paymentTerms: "Net 15",
    dueDate: "2026-02-20",
    createdAt: "2026-02-03",
    updatedAt: "2026-02-03",
    items: [{ sku: "SV-090", name: "On-site Installation", qty: 2, unit: "day", price: 12000, discount: 0, taxRate: 7 }],
    notesCustomer: "Please confirm delivery date.",
    notesInternal: "",
  },
];

function formatMoney(n, currency = "THB") {
  const v = Number(n || 0);
  return new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(v);
}

function calcTotals(order) {
  const lines = order.items || [];
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.price * (1 - (l.discount || 0) / 100), 0);
  const tax = lines.reduce((sum, l) => {
    const lineNet = l.qty * l.price * (1 - (l.discount || 0) / 100);
    return sum + lineNet * ((l.taxRate || 0) / 100);
  }, 0);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function Badge({ status }) {
  const cls = {
    Draft: "bg-gray-100 text-gray-700",
    "Pending Approval": "bg-amber-100 text-amber-800",
    Approved: "bg-emerald-100 text-emerald-800",
    Sent: "bg-blue-100 text-blue-800",
    Confirmed: "bg-indigo-100 text-indigo-800",
    Closed: "bg-slate-200 text-slate-800",
    Cancelled: "bg-rose-100 text-rose-800",
  }[status] || "bg-gray-100 text-gray-700";

  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

function Icon({ name }) {
  // minimalist inline icons
  const common = "w-5 h-5";
  if (name === "search")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none">
        <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (name === "filter")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (name === "x")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (name === "doc")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none">
        <path d="M8 3h6l4 4v14H8V3Z" stroke="currentColor" strokeWidth="2" />
        <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  return <span className="inline-block w-5 h-5" />;
}

function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  }[variant];
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-200 ${className}`}
      {...props}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-200 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function SectionTitle({ title, right }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {right}
    </div>
  );
}

function Drawer({ open, onClose, title, children }) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/30 transition ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Icon name="doc" />
            <div className="font-semibold text-slate-900">{title}</div>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </Button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100%-56px)]">{children}</div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/30 transition ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-3xl bg-white rounded-2xl shadow-xl transition ${
            open ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="font-semibold text-slate-900">{title}</div>
            <Button variant="ghost" onClick={onClose} aria-label="Close">
              <Icon name="x" />
            </Button>
          </div>
          <div className="p-5">{children}</div>
          {footer ? <div className="px-5 py-4 border-t border-slate-100">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

function SalesOrderForm({ initial, onCancel, onSave }) {
  const [order, setOrder] = useState(() =>
    initial || {
      id: `SO-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      customer: "",
      contact: "",
      opportunity: "",
      owner: "View",
      status: "Draft",
      currency: "THB",
      paymentTerms: "Net 30",
      dueDate: "",
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      items: [{ sku: "", name: "", qty: 1, unit: "pcs", price: 0, discount: 0, taxRate: 7 }],
      notesCustomer: "",
      notesInternal: "",
    }
  );

  const totals = useMemo(() => calcTotals(order), [order]);

  function updateItem(idx, key, val) {
    setOrder((prev) => {
      const items = prev.items.map((it, i) => (i === idx ? { ...it, [key]: val } : it));
      return { ...prev, items };
    });
  }

  function addLine() {
    setOrder((prev) => ({
      ...prev,
      items: [...prev.items, { sku: "", name: "", qty: 1, unit: "pcs", price: 0, discount: 0, taxRate: 7 }],
    }));
  }

  function removeLine(idx) {
    setOrder((prev) => ({
      ...prev,
      items: prev.items.length <= 1 ? prev.items : prev.items.filter((_, i) => i !== idx),
    }));
  }

  function validate() {
    if (!order.customer.trim()) return "กรุณาใส่ชื่อลูกค้า (Customer)";
    if (!order.dueDate) return "กรุณาเลือก Due date";
    const hasValidItem = order.items.some((it) => it.name.trim() && Number(it.qty) > 0);
    if (!hasValidItem) return "กรุณาใส่อย่างน้อย 1 รายการสินค้า/บริการ";
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) return alert(err);
    onSave({ ...order, updatedAt: new Date().toISOString().slice(0, 10) });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs text-slate-500">Customer *</label>
          <Input value={order.customer} onChange={(e) => setOrder({ ...order, customer: e.target.value })} placeholder="Company / Customer name" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Status</label>
          <Select value={order.status} onChange={(e) => setOrder({ ...order, status: e.target.value })}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-xs text-slate-500">Contact</label>
          <Input value={order.contact} onChange={(e) => setOrder({ ...order, contact: e.target.value })} placeholder="Contact person" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Opportunity</label>
          <Input value={order.opportunity} onChange={(e) => setOrder({ ...order, opportunity: e.target.value })} placeholder="OPP-xxxx" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Owner</label>
          <Input value={order.owner} onChange={(e) => setOrder({ ...order, owner: e.target.value })} placeholder="Owner" />
        </div>

        <div>
          <label className="text-xs text-slate-500">Currency</label>
          <Select value={order.currency} onChange={(e) => setOrder({ ...order, currency: e.target.value })}>
            <option value="THB">THB</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Payment Terms</label>
          <Input value={order.paymentTerms} onChange={(e) => setOrder({ ...order, paymentTerms: e.target.value })} placeholder="Net 30 / 50% upfront" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Due Date *</label>
          <Input type="date" value={order.dueDate} onChange={(e) => setOrder({ ...order, dueDate: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle
          title="Line Items"
          right={
            <Button variant="secondary" onClick={addLine}>
              <Icon name="plus" /> Add line
            </Button>
          }
        />
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-0 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <div className="col-span-3">Item</div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-1">Unit</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-1 text-right">Disc%</div>
            <div className="col-span-1 text-right">Tax%</div>
            <div className="col-span-1 text-right">Total</div>
          </div>
          {order.items.map((it, idx) => {
            const lineNet = Number(it.qty || 0) * Number(it.price || 0) * (1 - Number(it.discount || 0) / 100);
            const lineTax = lineNet * (Number(it.taxRate || 0) / 100);
            const lineTotal = lineNet + lineTax;
            return (
              <div key={idx} className="grid grid-cols-12 gap-0 px-3 py-2 border-t border-slate-100 items-center">
                <div className="col-span-3 pr-2">
                  <Input value={it.name} onChange={(e) => updateItem(idx, "name", e.target.value)} placeholder="Product / Service name" />
                </div>
                <div className="col-span-2 pr-2">
                  <Input value={it.sku} onChange={(e) => updateItem(idx, "sku", e.target.value)} placeholder="SKU" />
                </div>
                <div className="col-span-1 pr-2">
                  <Input
                    type="number"
                    min="0"
                    value={it.qty}
                    onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                    className="text-right"
                  />
                </div>
                <div className="col-span-1 pr-2">
                  <Input value={it.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} />
                </div>
                <div className="col-span-2 pr-2">
                  <Input
                    type="number"
                    min="0"
                    value={it.price}
                    onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                    className="text-right"
                  />
                </div>
                <div className="col-span-1 pr-2">
                  <Input
                    type="number"
                    min="0"
                    value={it.discount}
                    onChange={(e) => updateItem(idx, "discount", Number(e.target.value))}
                    className="text-right"
                  />
                </div>
                <div className="col-span-1 pr-2">
                  <Input
                    type="number"
                    min="0"
                    value={it.taxRate}
                    onChange={(e) => updateItem(idx, "taxRate", Number(e.target.value))}
                    className="text-right"
                  />
                </div>
                <div className="col-span-1 text-right text-sm font-medium text-slate-900">
                  {formatMoney(lineTotal, order.currency)}
                </div>

                <div className="col-span-12 mt-2 flex justify-end">
                  <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => removeLine(idx)}>
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-start md:justify-between">
          <div className="flex-1 space-y-3">
            <div>
              <label className="text-xs text-slate-500">Note to customer</label>
              <textarea
                className="w-full min-h-[90px] px-3 py-2 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                value={order.notesCustomer}
                onChange={(e) => setOrder({ ...order, notesCustomer: e.target.value })}
                placeholder="Message that appears on PDF/email"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Internal note</label>
              <textarea
                className="w-full min-h-[90px] px-3 py-2 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                value={order.notesInternal}
                onChange={(e) => setOrder({ ...order, notesInternal: e.target.value })}
                placeholder="Visible only to internal team"
              />
            </div>
          </div>

          <div className="w-full md:w-[320px] border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <div className="text-sm font-semibold text-slate-900 mb-3">Summary</div>
            <div className="flex justify-between text-sm text-slate-700">
              <span>Subtotal</span>
              <span className="font-medium">{formatMoney(totals.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-700 mt-2">
              <span>Tax</span>
              <span className="font-medium">{formatMoney(totals.tax, order.currency)}</span>
            </div>
            <div className="h-px bg-slate-200 my-3" />
            <div className="flex justify-between text-sm text-slate-900">
              <span className="font-semibold">Grand Total</span>
              <span className="font-semibold">{formatMoney(totals.total, order.currency)}</span>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Tip: ตั้ง rule approval เมื่อ Discount &gt; 10% / Total &gt; 100,000
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Sales Order
        </Button>
      </div>
    </div>
  );
}

function SalesOrderDetail({ order, onEdit, onAction }) {
  const totals = calcTotals(order);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-semibold text-slate-900">{order.id}</div>
          <div className="text-sm text-slate-600">{order.customer}</div>
          <div className="mt-2">
            <Badge status={order.status} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Grand Total</div>
          <div className="text-lg font-semibold">{formatMoney(totals.total, order.currency)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="border border-slate-200 rounded-2xl p-3">
          <div className="text-xs text-slate-500">Contact</div>
          <div className="font-medium text-slate-900">{order.contact || "-"}</div>
          <div className="text-xs text-slate-500 mt-2">Opportunity</div>
          <div className="font-medium text-slate-900">{order.opportunity || "-"}</div>
        </div>
        <div className="border border-slate-200 rounded-2xl p-3">
          <div className="text-xs text-slate-500">Owner</div>
          <div className="font-medium text-slate-900">{order.owner}</div>
          <div className="text-xs text-slate-500 mt-2">Due Date</div>
          <div className="font-medium text-slate-900">{order.dueDate}</div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Items</div>
        <div className="divide-y divide-slate-100">
          {order.items.map((it, idx) => {
            const net = it.qty * it.price * (1 - (it.discount || 0) / 100);
            const tax = net * ((it.taxRate || 0) / 100);
            const total = net + tax;
            return (
              <div key={idx} className="px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900">{it.name || "-"}</div>
                    <div className="text-xs text-slate-500">
                      {it.sku || "SKU-"} • {it.qty} {it.unit} • Disc {it.discount || 0}% • Tax {it.taxRate || 0}%
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900">{formatMoney(total, order.currency)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(order.notesCustomer || order.notesInternal) && (
        <div className="grid grid-cols-1 gap-3">
          <div className="border border-slate-200 rounded-2xl p-3">
            <div className="text-xs text-slate-500">Note to customer</div>
            <div className="text-sm text-slate-900 whitespace-pre-wrap">{order.notesCustomer || "-"}</div>
          </div>
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
            <div className="text-xs text-slate-500">Internal note</div>
            <div className="text-sm text-slate-900 whitespace-pre-wrap">{order.notesInternal || "-"}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="secondary" onClick={() => onAction("pdf")}>
          Generate PDF
        </Button>
        <Button variant="primary" onClick={() => onAction("send")}>
          Send to Customer
        </Button>
      </div>

      <div className="text-xs text-slate-500">
        Created {order.createdAt} • Updated {order.updatedAt}
      </div>
    </div>
  );
}

function SalesOrderPage({ orders, setOrders }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [owner, setOwner] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawerOrder, setDrawerOrder] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const owners = useMemo(() => ["All", ...Array.from(new Set(orders.map((o) => o.owner)))], [orders]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return orders
      .filter((o) => (status === "All" ? true : o.status === status))
      .filter((o) => (owner === "All" ? true : o.owner === owner))
      .filter((o) => {
        if (!qq) return true;
        return (
          o.id.toLowerCase().includes(qq) ||
          o.customer.toLowerCase().includes(qq) ||
          (o.opportunity || "").toLowerCase().includes(qq) ||
          (o.contact || "").toLowerCase().includes(qq)
        );
      });
  }, [orders, q, status, owner]);

  function togglePick(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function pickAllOnPage() {
    const ids = filtered.map((o) => o.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])));
  }

  function bulkAssign(newOwner) {
    if (!selectedIds.length) return alert("เลือก Sales Order ก่อน");
    setOrders((prev) => prev.map((o) => (selectedIds.includes(o.id) ? { ...o, owner: newOwner, updatedAt: today() } : o)));
    setSelectedIds([]);
  }

  function bulkStatus(newStatus) {
    if (!selectedIds.length) return alert("เลือก Sales Order ก่อน");
    setOrders((prev) => prev.map((o) => (selectedIds.includes(o.id) ? { ...o, status: newStatus, updatedAt: today() } : o)));
    setSelectedIds([]);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(order) {
    setEditing(order);
    setFormOpen(true);
  }

  function handleSave(order) {
    setOrders((prev) => {
      const exists = prev.some((x) => x.id === order.id);
      if (exists) return prev.map((x) => (x.id === order.id ? order : x));
      return [order, ...prev];
    });
    setFormOpen(false);
    setEditing(null);
  }

  function handleRowClick(order) {
    setDrawerOrder(order);
  }

  function handleAction(type) {
    // demo only
    if (!drawerOrder) return;
    if (type === "pdf") alert(`Generate PDF for ${drawerOrder.id}`);
    if (type === "send") alert(`Send ${drawerOrder.id} to customer`);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900">Sales Orders</div>
          <div className="text-sm text-slate-600">List • Filters • Detail drawer • Create/Edit</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => alert("Export CSV (demo)")}>
            Export
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Icon name="plus" /> New Sales Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" />
          </div>
          <Input className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SO No., customer, opportunity..." />
        </div>
        <div className="md:col-span-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All Status</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-3">
          <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o === "All" ? "All Owners" : o}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 flex flex-col md:flex-row md:items-center gap-2 md:justify-between">
          <div className="text-sm text-slate-700">
            Selected <span className="font-semibold">{selectedIds.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => bulkAssign(prompt("Assign owner to:", "View") || "")}>
              Assign Owner
            </Button>
            <Button variant="secondary" onClick={() => bulkStatus(prompt("Change status to:", "Approved") || "")}>
              Change Status
            </Button>
            <Button variant="ghost" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          <div className="col-span-1 flex items-center gap-2">
            <input type="checkbox" checked={filtered.length > 0 && filtered.every((o) => selectedIds.includes(o.id))} onChange={pickAllOnPage} />
          </div>
          <div className="col-span-2">SO No.</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Opportunity</div>
          <div className="col-span-1">Owner</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((o) => {
            const totals = calcTotals(o);
            return (
              <div key={o.id} className="grid grid-cols-12 px-3 py-3 items-center hover:bg-slate-50 cursor-pointer" onClick={() => handleRowClick(o)}>
                <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => togglePick(o.id)} />
                </div>
                <div className="col-span-2 text-sm font-semibold text-slate-900">{o.id}</div>
                <div className="col-span-3">
                  <div className="text-sm font-medium text-slate-900">{o.customer}</div>
                  <div className="text-xs text-slate-500">{o.contact || "-"}</div>
                </div>
                <div className="col-span-2 text-sm text-slate-700">{o.opportunity || "-"}</div>
                <div className="col-span-1 text-sm text-slate-700">{o.owner}</div>
                <div className="col-span-1">
                  <Badge status={o.status} />
                </div>
                <div className="col-span-2 text-right text-sm font-semibold text-slate-900">{formatMoney(totals.total, o.currency)}</div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">No sales orders found.</div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <Drawer
        open={!!drawerOrder}
        onClose={() => setDrawerOrder(null)}
        title={drawerOrder ? `${drawerOrder.id} • ${drawerOrder.customer}` : "Sales Order"}
      >
        {drawerOrder && (
          <SalesOrderDetail
            order={drawerOrder}
            onEdit={() => {
              setDrawerOrder(null);
              openEdit(drawerOrder);
            }}
            onAction={handleAction}
          />
        )}
      </Drawer>

      {/* Modal */}
      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? `Edit ${editing.id}` : "New Sales Order"}
        footer={
          <div className="text-xs text-slate-500">
            * Demo UI: ต่อ API จริงให้ map field กับ backend ได้ทันที (POST/PUT /salesorders)
          </div>
        }
      >
        <SalesOrderForm
          initial={editing}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function NavItem({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${active ? "bg-white" : "bg-slate-300"}`} />
      {label}
    </button>
  );
}

export default function CRMApp() {
  const [page, setPage] = useState("Sales Orders");
  const [orders, setOrders] = useState(mockOrders);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white grid place-items-center font-semibold">CRM</div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Your CRM</div>
              <div className="text-xs text-slate-500">Sales-centric • Orders • Activities</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
              Role: <span className="font-semibold">Sales Manager</span>
            </div>
            <Button variant="secondary" onClick={() => alert("Notifications (demo)")}>
              Notifications
            </Button>
          </div>
        </div>
      </div>

      {/* Shell */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 sticky top-[84px]">
            <div className="text-xs font-semibold text-slate-500 px-2">MENU</div>
            {["Dashboard", "Customers", "Sales", "Activities", "Sales Orders", "Service", "Reports", "Settings"].map((x) => (
              <NavItem key={x} label={x} active={page === x} onClick={() => setPage(x)} />
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="lg:col-span-9">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            {page === "Sales Orders" ? (
              <SalesOrderPage orders={orders} setOrders={setOrders} />
            ) : (
              <div className="p-8 text-center">
                <div className="text-xl font-semibold text-slate-900">{page}</div>
                <div className="text-sm text-slate-600 mt-2">
                  หน้านี้เป็น placeholder — ถ้าคุณต้องการ ผมจะสร้าง UI ให้ครบทุกเมนู (Customers/Leads/Opportunities/Pipeline/Activities) ให้ต่อเนื่องในสไตล์เดียวกัน
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
