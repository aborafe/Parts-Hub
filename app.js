"use strict";
/* ================================================================
   نظام إدارة قطع الغيار v2
   ج.م = جنيه مصري | مخازن | بروفيل عميل | طباعة فواتير
================================================================ */

const DB = {
  get: (k, d = []) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

const State = {
  page: "dashboard",
  cart: [],
  searchQ: "",
  editId: null,
  warehouseFilter: null,
};

const EGP = (n) =>
  `${(+n || 0).toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ج.م`;
const fmt = (n) =>
  (+n || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now() + Math.random().toString(36).slice(2, 6);

function nid(type) {
  const ids = DB.get("nextId", {});
  const id = ids[type] || 1;
  ids[type] = id + 1;
  DB.set("nextId", ids);
  return id;
}

/* ── SEED DATA ──────────────────────────────────────── */
function seedData() {
  if (DB.get("seeded", false)) return;
  DB.set("categories", [
    { id: 1, name: "محركات وقطع المحرك", code: "ENG" },
    { id: 2, name: "الفرامل والتعليق", code: "BRK" },
    { id: 3, name: "الكهرباء والأضواء", code: "ELC" },
    { id: 4, name: "زيوت ومستلزمات", code: "OIL" },
    { id: 5, name: "إطارات وجنوط", code: "TYR" },
  ]);
  DB.set("warehouses", [
    {
      id: 1,
      name: "المخزن الرئيسي",
      location: "القاهرة - المعادي",
      icon: "🏭",
    },
    {
      id: 2,
      name: "فرع الإسكندرية",
      location: "الإسكندرية - المنتزه",
      icon: "🏪",
    },
    {
      id: 3,
      name: "مخزن الطوارئ",
      location: "القاهرة - مدينة نصر",
      icon: "📦",
    },
  ]);
  DB.set("suppliers", [
    {
      id: 1,
      name: "شركة مصر للقطع",
      phone: "0100-123-4567",
      email: "info@misrparts.com",
      balance: 15000,
    },
    {
      id: 2,
      name: "مؤسسة النيل للتجارة",
      phone: "0111-987-6543",
      email: "nile@trade.com",
      balance: 8500,
    },
    {
      id: 3,
      name: "مجموعة القاهرة",
      phone: "0122-111-2233",
      email: "cairo@group.com",
      balance: 0,
    },
  ]);
  DB.set("customers", [
    {
      id: 1,
      name: "أحمد محمد علي",
      phone: "0100-123-4567",
      address: "القاهرة - مصر الجديدة",
      type: "vip",
      balance: 2500,
      totalPurchases: 45000,
      email: "ahmed@email.com",
      notes: "عميل VIP - خصم 10%",
    },
    {
      id: 2,
      name: "ورشة السرعة",
      phone: "0111-987-6543",
      address: "الجيزة - الهرم",
      type: "wholesale",
      balance: 0,
      totalPurchases: 120000,
      email: "",
      notes: "ورشة جملة كبيرة",
    },
    {
      id: 3,
      name: "محمد حسن",
      phone: "0122-111-2233",
      address: "الإسكندرية",
      type: "retail",
      balance: 750,
      totalPurchases: 8500,
      email: "",
      notes: "",
    },
    {
      id: 4,
      name: "عبدالرحمن سالم",
      phone: "0100-334-4556",
      address: "المنصورة",
      type: "retail",
      balance: 0,
      totalPurchases: 3200,
      email: "",
      notes: "",
    },
  ]);
  DB.set("products", [
    {
      id: 1,
      sku: "ENG-001",
      name: "فلتر زيت تويوتا كامري",
      catId: 1,
      supplierId: 1,
      buyPrice: 125,
      sellPrice: 220,
      minStock: 10,
      unit: "قطعة",
    },
    {
      id: 2,
      sku: "ENG-002",
      name: "شمعات اشتعال NGK",
      catId: 1,
      supplierId: 1,
      buyPrice: 380,
      sellPrice: 650,
      minStock: 8,
      unit: "طقم",
    },
    {
      id: 3,
      sku: "BRK-001",
      name: "تيل فرامل أمامي هيونداي",
      catId: 2,
      supplierId: 2,
      buyPrice: 580,
      sellPrice: 950,
      minStock: 5,
      unit: "طقم",
    },
    {
      id: 4,
      sku: "BRK-002",
      name: "ديسك فرامل خلفي",
      catId: 2,
      supplierId: 2,
      buyPrice: 850,
      sellPrice: 1400,
      minStock: 5,
      unit: "زوج",
    },
    {
      id: 5,
      sku: "ELC-001",
      name: "بطارية Varta 70Ah",
      catId: 3,
      supplierId: 3,
      buyPrice: 1600,
      sellPrice: 2500,
      minStock: 4,
      unit: "قطعة",
    },
    {
      id: 6,
      sku: "ELC-002",
      name: "دينامو مُعاد تصنيعه",
      catId: 3,
      supplierId: 3,
      buyPrice: 1900,
      sellPrice: 3200,
      minStock: 2,
      unit: "قطعة",
    },
    {
      id: 7,
      sku: "OIL-001",
      name: "زيت محرك Castrol 5W-30",
      catId: 4,
      supplierId: 1,
      buyPrice: 560,
      sellPrice: 900,
      minStock: 20,
      unit: "لتر",
    },
    {
      id: 8,
      sku: "OIL-002",
      name: "مياه راديتر محضّرة",
      catId: 4,
      supplierId: 2,
      buyPrice: 38,
      sellPrice: 70,
      minStock: 12,
      unit: "لتر",
    },
    {
      id: 9,
      sku: "TYR-001",
      name: "إطار Bridgestone 205/65",
      catId: 5,
      supplierId: 3,
      buyPrice: 1050,
      sellPrice: 1700,
      minStock: 8,
      unit: "قطعة",
    },
    {
      id: 10,
      sku: "TYR-002",
      name: "جنط ألومنيوم 16 بوصة",
      catId: 5,
      supplierId: 3,
      buyPrice: 1800,
      sellPrice: 2900,
      minStock: 4,
      unit: "قطعة",
    },
  ]);
  // Warehouse stock: {productId_warehouseId: qty}
  DB.set("whStock", {
    "1_1": 30,
    "2_1": 20,
    "3_1": 8,
    "4_1": 5,
    "5_1": 7,
    "6_1": 3,
    "7_1": 40,
    "8_1": 2,
    "9_1": 12,
    "10_1": 4,
    "1_2": 12,
    "2_2": 8,
    "3_2": 5,
    "4_2": 3,
    "5_2": 4,
    "6_2": 1,
    "7_2": 18,
    "8_2": 1,
    "9_2": 7,
    "10_2": 2,
    "1_3": 6,
    "2_3": 4,
    "3_3": 2,
    "4_3": 0,
    "5_3": 1,
    "6_3": 0,
    "7_3": 2,
    "8_3": 0,
    "9_3": 1,
    "10_3": 0,
  });
  DB.set("sales", [
    {
      id: 1001,
      date: "2026-03-25",
      customerId: 2,
      warehouseId: 1,
      items: [
        { productId: 7, qty: 4, price: 900 },
        { productId: 1, qty: 2, price: 220 },
      ],
      total: 4040,
      discount: 0,
      tax: 0,
      status: "paid",
      payMethod: "cash",
    },
    {
      id: 1002,
      date: "2026-03-26",
      customerId: 1,
      warehouseId: 1,
      items: [
        { productId: 5, qty: 1, price: 2500 },
        { productId: 2, qty: 1, price: 650 },
      ],
      total: 3150,
      discount: 150,
      tax: 0,
      status: "paid",
      payMethod: "card",
    },
    {
      id: 1003,
      date: "2026-03-27",
      customerId: 3,
      warehouseId: 2,
      items: [{ productId: 3, qty: 1, price: 950 }],
      total: 950,
      discount: 0,
      tax: 0,
      status: "paid",
      payMethod: "cash",
    },
    {
      id: 1004,
      date: "2026-03-28",
      customerId: 4,
      warehouseId: 1,
      items: [{ productId: 9, qty: 2, price: 1700 }],
      total: 3400,
      discount: 200,
      tax: 0,
      status: "credit",
      payMethod: "credit",
    },
    {
      id: 1005,
      date: "2026-03-30",
      customerId: 2,
      warehouseId: 1,
      items: [{ productId: 7, qty: 6, price: 880 }],
      total: 5280,
      discount: 0,
      tax: 0,
      status: "paid",
      payMethod: "transfer",
    },
  ]);
  DB.set("returns", [
    {
      id: 2001,
      date: "2026-03-27",
      saleId: 1002,
      customerId: 1,
      items: [{ productId: 2, qty: 1, price: 650 }],
      total: 650,
      reason: "قطعة تالفة",
      status: "approved",
    },
  ]);
  DB.set("payments", [
    {
      id: 3001,
      date: "2026-03-29",
      customerId: 4,
      amount: 1000,
      note: "دفعة أولى",
      type: "payment",
    },
    {
      id: 3002,
      date: "2026-03-28",
      customerId: 1,
      amount: 2500,
      note: "سداد رصيد سابق",
      type: "payment",
    },
  ]);
  DB.set("nextId", {
    product: 11,
    customer: 5,
    supplier: 4,
    sale: 1006,
    return: 2002,
    category: 6,
    warehouse: 4,
    payment: 3003,
  });
  DB.set("seeded", true);
}

/* ── UTILS ──────────────────────────────────────────── */
function showToast(msg, type = "success") {
  const c = document.querySelector(".toast-container");
  if (!c) return;
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `${type === "success" ? "✓" : "✕"} ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
  State.editId = null;
}

function whStock(productId, warehouseId) {
  const ws = DB.get("whStock", {});
  return ws[`${productId}_${warehouseId}`] || 0;
}
function totalStock(productId) {
  const whs = DB.get("warehouses");
  return whs.reduce((a, w) => a + whStock(productId, w.id), 0);
}
function setWhStock(productId, warehouseId, qty) {
  const ws = DB.get("whStock", {});
  ws[`${productId}_${warehouseId}`] = Math.max(0, qty);
  DB.set("whStock", ws);
}

function startClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const tick = () => {
    const n = new Date();
    el.textContent = n.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  tick();
  setInterval(tick, 1000);
}

/* ── SHELL ──────────────────────────────────────────── */
function renderShell() {
  const lowProds = DB.get("products").filter(
    (p) => totalStock(p.id) <= p.minStock,
  ).length;
  const pendRet = DB.get("returns").filter(
    (r) => r.status === "pending",
  ).length;
  document.getElementById("app").innerHTML = `
    <header class="topbar">
      <div class="topbar-brand"><div class="brand-icon">⚙</div>نظام قطع الغيار</div>
      <div class="topbar-center">
        <button class="quick-btn" onclick="navigate('pos')">🛒 بيع جديد</button>
        <button class="quick-btn sec" onclick="navigate('products');setTimeout(()=>openProductModal(),80)">+ منتج</button>
        <button class="quick-btn sec" onclick="navigate('warehouses')">🏭 مخازن</button>
        <button class="quick-btn sec" onclick="navigate('purchases')">📦 شراء</button>
      </div>
      <div class="topbar-right">
        <div class="topbar-clock">🕐 <span id="clock"></span></div>
        <div class="profile-wrap">
          <button class="profile-btn" onclick="this.nextElementSibling.classList.toggle('open')">
            <div class="avatar">م</div><span>المدير</span><span>▾</span>
          </button>
          <div class="profile-dropdown" id="profileDd">
            <div class="dd-header"><strong>محمد إبراهيم</strong><span>مدير النظام</span></div>
            <a href="#" onclick="navigate('reports')"><span class="dd-icon">📊</span>التقارير</a>
            <a href="#"><span class="dd-icon">⚙</span>الإعدادات</a>
            <a href="#" class="dd-danger"><span class="dd-icon">🚪</span>تسجيل الخروج</a>
          </div>
        </div>
      </div>
    </header>
    <nav class="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-section-title">الرئيسية</div>
        <div class="sidebar-item ${State.page === "dashboard" ? "active" : ""}" onclick="navigate('dashboard')"><span class="s-icon">🏠</span>لوحة التحكم</div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title">المبيعات</div>
        <div class="sidebar-item ${State.page === "pos" ? "active" : ""}" onclick="navigate('pos')"><span class="s-icon">🛒</span>نقطة البيع</div>
        <div class="sidebar-item ${State.page === "sales" ? "active" : ""}" onclick="navigate('sales')"><span class="s-icon">🧾</span>سجل المبيعات</div>
        <div class="sidebar-item ${State.page === "returns" ? "active" : ""}" onclick="navigate('returns')"><span class="s-icon">↩</span>المرتجعات${pendRet ? `<span class="s-badge">${pendRet}</span>` : ""}</div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title">المخزون</div>
        <div class="sidebar-item ${State.page === "warehouses" ? "active" : ""}" onclick="navigate('warehouses')"><span class="s-icon">🏭</span>المخازن</div>
        <div class="sidebar-item ${State.page === "products" ? "active" : ""}" onclick="navigate('products')"><span class="s-icon">📦</span>المنتجات${lowProds ? `<span class="s-badge">${lowProds}</span>` : ""}</div>
        <div class="sidebar-item ${State.page === "categories" ? "active" : ""}" onclick="navigate('categories')"><span class="s-icon">🏷</span>التصنيفات</div>
        <div class="sidebar-item ${State.page === "inventory" ? "active" : ""}" onclick="navigate('inventory')"><span class="s-icon">🗃</span>حركة المخزون</div>
        <div class="sidebar-item ${State.page === "purchases" ? "active" : ""}" onclick="navigate('purchases')"><span class="s-icon">🚚</span>المشتريات</div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title">الأطراف</div>
        <div class="sidebar-item ${State.page === "customers" ? "active" : ""}" onclick="navigate('customers')"><span class="s-icon">👥</span>العملاء</div>
        <div class="sidebar-item ${State.page === "suppliers" ? "active" : ""}" onclick="navigate('suppliers')"><span class="s-icon">🏭</span>الموردون</div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title">التحليل</div>
        <div class="sidebar-item ${State.page === "reports" ? "active" : ""}" onclick="navigate('reports')"><span class="s-icon">📊</span>التقارير</div>
      </div>
    </nav>
    <main class="main-content" id="mainContent"></main>
    <div class="toast-container"></div>`;
  startClock();
  document.addEventListener(
    "click",
    (e) => {
      if (!e.target.closest(".profile-wrap"))
        document.getElementById("profileDd")?.classList.remove("open");
    },
    { once: false },
  );
  renderPage();
}

function navigate(page) {
  State.page = page;
  State.searchQ = "";
  renderShell();
}

function refreshPage() {
  renderPage();
}

function renderPage() {
  (
    ({
      dashboard: renderDashboard,
      products: renderProducts,
      categories: renderCategories,
      customers: renderCustomers,
      suppliers: renderSuppliers,
      sales: renderSales,
      returns: renderReturns,
      inventory: renderInventory,
      purchases: renderPurchases,
      reports: renderReports,
      pos: renderPOS,
      warehouses: renderWarehouses,
    })[State.page] || renderDashboard
  )();
}

/* ── DASHBOARD ──────────────────────────────────────── */
function renderDashboard() {
  const sales = DB.get("sales"),
    products = DB.get("products"),
    customers = DB.get("customers"),
    returns = DB.get("returns");
  const tod = sales.filter((s) => s.date === today());
  const todRev = tod.reduce((a, s) => a + s.total, 0);
  const totalRev = sales.reduce((a, s) => a + s.total, 0);
  const lowStock = products.filter((p) => totalStock(p.id) <= p.minStock);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const daySales = days.map((d) =>
    sales.filter((s) => s.date === d).reduce((a, s) => a + s.total, 0),
  );
  const maxS = Math.max(...daySales, 1);
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">لوحة التحكم</div>
        <div class="page-subtitle">${new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue">💰</div><div><div class="stat-value">${fmt(todRev)}</div><div class="stat-label">مبيعات اليوم (ج.م)</div><div class="stat-change">▲ ${tod.length} فاتورة</div></div></div>
      <div class="stat-card"><div class="stat-icon green">📦</div><div><div class="stat-value">${products.length}</div><div class="stat-label">إجمالي المنتجات</div><div class="stat-change ${lowStock.length ? "down" : ""}">${lowStock.length ? `⚠ ${lowStock.length} نقص` : "✓ مخزون سليم"}</div></div></div>
      <div class="stat-card"><div class="stat-icon amber">👥</div><div><div class="stat-value">${customers.length}</div><div class="stat-label">العملاء</div><div class="stat-change">إجمالي ${fmt(totalRev)} ج.م</div></div></div>
      <div class="stat-card"><div class="stat-icon red">↩</div><div><div class="stat-value">${returns.length}</div><div class="stat-label">المرتجعات</div><div class="stat-change down">${EGP(returns.reduce((a, r) => a + r.total, 0))}</div></div></div>
    </div>
    <div class="charts-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">📈 مبيعات آخر 7 أيام</span><button class="btn btn-outline btn-sm" onclick="navigate('reports')">تفاصيل</button></div>
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:5px">
            ${days
              .map(
                (d, i) => `<div style="flex:1;text-align:center">
              <div style="height:90px;display:flex;align-items:flex-end;justify-content:center">
                <div style="width:65%;background:${i === 6 ? "var(--primary)" : "var(--primary-light)"};border-radius:3px 3px 0 0;height:${Math.max(Math.round((daySales[i] / maxS) * 90), 2)}px"></div>
              </div>
              <div style="font-size:10px;color:var(--text-hint);margin-top:3px">${d.slice(8)}</div>
              <div style="font-size:11px;font-weight:600">${daySales[i] ? fmt(daySales[i]) : "-"}</div>
            </div>`,
              )
              .join("")}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">⚠ نقص المخزون</span></div>
        <div class="card-body" style="padding:10px">
          ${
            lowStock.length === 0
              ? '<div style="text-align:center;color:var(--success);padding:20px">✓ المخزون بمستويات جيدة</div>'
              : lowStock
                  .map(
                    (
                      p,
                    ) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f3f4f6;font-size:12px">
              <div><div style="font-weight:600">${esc(p.name)}</div><div style="color:var(--text-muted)">${p.sku}</div></div>
              <span class="badge danger">${totalStock(p.id)} / ${p.minStock}</span>
            </div>`,
                  )
                  .join("")
          }
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">🧾 آخر المبيعات</span><button class="btn btn-outline btn-sm" onclick="navigate('sales')">الكل</button></div>
      ${salesTableHtml(sales.slice(-5).reverse())}
    </div>`;
}

/* ── WAREHOUSES ─────────────────────────────────────── */
function renderWarehouses() {
  const whs = DB.get("warehouses"),
    products = DB.get("products");
  const whItems = whs.map((w) => {
    const totalItems = products.reduce((a, p) => a + whStock(p.id, w.id), 0);
    const totalVal = products.reduce(
      (a, p) => a + whStock(p.id, w.id) * p.buyPrice,
      0,
    );
    return { ...w, totalItems, totalVal };
  });
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">🏭 إدارة المخازن</div><div class="page-subtitle">${whs.length} مخازن مسجلة</div></div>
      <div class="page-actions">
        <button class="btn btn-warning" onclick="openTransferModal()">🔄 تحويل بضاعة</button>
        <button class="btn btn-primary" onclick="openWhModal()">+ مخزن جديد</button>
      </div>
    </div>
    <div class="warehouse-grid">
      ${whItems
        .map(
          (w) => `
      <div class="warehouse-card">
        <div class="wh-header">
          <div class="wh-icon">${w.icon || "🏭"}</div>
          <div>
            <div class="wh-name">${esc(w.name)}</div>
            <div class="wh-location">📍 ${esc(w.location)}</div>
          </div>
          <div style="margin-right:auto;display:flex;gap:5px">
            <button class="btn-icon" onclick="openWhModal(${w.id})">✏</button>
            <button class="btn-icon" style="color:var(--danger)" onclick="deleteWh(${w.id})">🗑</button>
          </div>
        </div>
        <div class="wh-stats">
          <div class="wh-stat"><div class="v">${w.totalItems}</div><div class="l">إجمالي الوحدات</div></div>
          <div class="wh-stat"><div class="v">${fmt(w.totalVal)}</div><div class="l">القيمة (ج.م)</div></div>
        </div>
        <button class="btn btn-outline btn-sm" style="width:100%;margin-top:10px" onclick="viewWhStock(${w.id})">📋 عرض المخزون</button>
      </div>`,
        )
        .join("")}
    </div>

    <!-- Warehouse Stock Detail -->
    <div class="card" id="wh-stock-detail" style="display:none">
      <div class="card-header"><span class="card-title" id="wh-detail-title">مخزون المخزن</span>
        <button class="btn-icon" onclick="document.getElementById('wh-stock-detail').style.display='none'">×</button></div>
      <div id="wh-detail-body"></div>
    </div>

    <!-- Add Warehouse Modal -->
    <div class="modal-backdrop" id="modal-wh" onclick="if(event.target===this)closeModal('modal-wh')">
      <div class="modal" style="max-width:420px">
        <div class="modal-header"><span class="modal-title" id="wh-modal-title">إضافة مخزن</span><button class="modal-close" onclick="closeModal('modal-wh')">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">اسم المخزن *</label><input class="form-control" id="wh-name"></div>
          <div class="form-group"><label class="form-label">الموقع</label><input class="form-control" id="wh-location" placeholder="المدينة - المنطقة"></div>
          <div class="form-group"><label class="form-label">الأيقونة</label>
            <select class="form-control" id="wh-icon">
              <option value="🏭">🏭 مخزن رئيسي</option><option value="🏪">🏪 فرع</option>
              <option value="📦">📦 مخزن صغير</option><option value="🚛">🚛 نقطة توزيع</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="saveWh()">حفظ</button>
          <button class="btn btn-outline" onclick="closeModal('modal-wh')">إلغاء</button>
        </div>
      </div>
    </div>

    <!-- Transfer Modal -->
    <div class="modal-backdrop" id="modal-transfer" onclick="if(event.target===this)closeModal('modal-transfer')">
      <div class="modal modal-lg">
        <div class="modal-header"><span class="modal-title">🔄 تحويل بضاعة بين المخازن</span><button class="modal-close" onclick="closeModal('modal-transfer')">×</button></div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">من مخزن *</label>
              <select class="form-control" id="tr-from" onchange="updateTransferStock()">
                ${whs.map((w) => `<option value="${w.id}">${esc(w.name)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group"><label class="form-label">إلى مخزن *</label>
              <select class="form-control" id="tr-to">
                ${whs.map((w) => `<option value="${w.id}">${esc(w.name)}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">المنتج *</label>
              <select class="form-control" id="tr-product" onchange="updateTransferStock()">
                ${products.map((p) => `<option value="${p.id}">${esc(p.name)} (${p.sku})</option>`).join("")}
              </select>
            </div>
            <div class="form-group"><label class="form-label">الكمية المتاحة</label>
              <input class="form-control" id="tr-available" readonly style="background:var(--bg)">
            </div>
          </div>
          <div class="form-group"><label class="form-label">الكمية المحوّلة *</label>
            <input class="form-control" id="tr-qty" type="number" min="1" value="1">
          </div>
          <div class="form-group"><label class="form-label">ملاحظة</label>
            <input class="form-control" id="tr-note" placeholder="سبب التحويل...">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-warning" onclick="saveTransfer()">🔄 تأكيد التحويل</button>
          <button class="btn btn-outline" onclick="closeModal('modal-transfer')">إلغاء</button>
        </div>
      </div>
    </div>`;
  updateTransferStock();
}

function viewWhStock(whId) {
  const wh = DB.get("warehouses").find((w) => w.id === whId);
  const products = DB.get("products");
  const cats = DB.get("categories");
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
  document.getElementById("wh-detail-title").textContent = `مخزون ${wh.name}`;
  document.getElementById("wh-detail-body").innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>الكود</th><th>المنتج</th><th>التصنيف</th><th>الكمية</th><th>الحد الأدنى</th><th>الحالة</th></tr></thead>
        <tbody>
          ${products
            .map((p) => {
              const qty = whStock(p.id, whId);
              const lvl =
                qty <= p.minStock
                  ? "low"
                  : qty <= p.minStock * 2
                    ? "medium"
                    : "high";
              return `<tr>
              <td><code style="font-size:11px;background:#f3f4f6;padding:2px 5px;border-radius:3px">${esc(p.sku)}</code></td>
              <td><strong>${esc(p.name)}</strong></td>
              <td style="font-size:12px">${esc(catMap[p.catId] || "-")}</td>
              <td><strong>${qty}</strong> ${p.unit}</td>
              <td style="color:var(--text-muted)">${p.minStock}</td>
              <td><div class="stock-level"><div class="stock-bar" style="min-width:70px"><div class="stock-bar-fill ${lvl}" style="width:${Math.min((qty / Math.max(p.minStock * 3, 1)) * 100, 100)}%"></div></div></div></td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
  document.getElementById("wh-stock-detail").style.display = "block";
  document
    .getElementById("wh-stock-detail")
    .scrollIntoView({ behavior: "smooth" });
}

function updateTransferStock() {
  const pid = parseInt(document.getElementById("tr-product")?.value);
  const wid = parseInt(document.getElementById("tr-from")?.value);
  if (pid && wid) {
    document.getElementById("tr-available").value = whStock(pid, wid);
  }
}

function openWhModal(id = null) {
  State.editId = id;
  const w = id ? DB.get("warehouses").find((x) => x.id === id) : null;
  document.getElementById("wh-modal-title").textContent = id
    ? "تعديل المخزن"
    : "إضافة مخزن";
  document.getElementById("wh-name").value = w?.name || "";
  document.getElementById("wh-location").value = w?.location || "";
  if (w) document.getElementById("wh-icon").value = w.icon || "🏭";
  openModal("modal-wh");
}

function saveWh() {
  const name = document.getElementById("wh-name")?.value.trim();
  if (!name) return showToast("يرجى إدخال اسم المخزن", "danger");
  const loc = document.getElementById("wh-location")?.value.trim();
  const icon = document.getElementById("wh-icon")?.value || "🏭";
  const whs = DB.get("warehouses");
  if (State.editId) {
    const idx = whs.findIndex((w) => w.id === State.editId);
    if (idx !== -1) {
      whs[idx] = { ...whs[idx], name, location: loc, icon };
    }
  } else {
    whs.push({ id: nid("warehouse"), name, location: loc, icon });
  }
  DB.set("warehouses", whs);
  showToast("تم الحفظ");
  closeModal("modal-wh");
  refreshPage();
}

function deleteWh(id) {
  if (!confirm("حذف هذا المخزن؟")) return;
  DB.set(
    "warehouses",
    DB.get("warehouses").filter((w) => w.id !== id),
  );
  showToast("تم الحذف", "danger");
  refreshPage();
}

function openTransferModal() {
  openModal("modal-transfer");
  updateTransferStock();
}

function saveTransfer() {
  const fromId = parseInt(document.getElementById("tr-from")?.value);
  const toId = parseInt(document.getElementById("tr-to")?.value);
  const pid = parseInt(document.getElementById("tr-product")?.value);
  const qty = parseInt(document.getElementById("tr-qty")?.value) || 0;
  if (fromId === toId) return showToast("يرجى اختيار مخزنين مختلفين", "danger");
  if (qty <= 0) return showToast("الكمية يجب أن تكون أكبر من صفر", "danger");
  const avail = whStock(pid, fromId);
  if (qty > avail)
    return showToast(`الكمية المتاحة فقط ${avail} وحدة`, "danger");
  setWhStock(pid, fromId, avail - qty);
  setWhStock(pid, toId, whStock(pid, toId) + qty);
  const whs = DB.get("warehouses"),
    products = DB.get("products");
  const from = whs.find((w) => w.id === fromId)?.name;
  const to = whs.find((w) => w.id === toId)?.name;
  const prod = products.find((p) => p.id === pid)?.name;
  showToast(`✓ تم تحويل ${qty} من "${prod}" من ${from} إلى ${to}`);
  closeModal("modal-transfer");
  refreshPage();
}

/* ── PRODUCTS ─────────────────────────────────────── */
function renderProducts() {
  const products = DB.get("products"),
    cats = DB.get("categories"),
    suppliers = DB.get("suppliers"),
    whs = DB.get("warehouses");
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
  const suppMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));
  const q = State.searchQ.toLowerCase();
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      )
    : products;
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">📦 المنتجات</div><div class="page-subtitle">${products.length} منتج</div></div>
      <div class="page-actions"><button class="btn btn-primary" onclick="openProductModal()">+ إضافة منتج</button></div>
    </div>
    <div class="card">
      <div class="toolbar">
        <div class="search-wrap"><span class="search-icon">🔍</span>
          <input class="search-input" placeholder="بحث..." value="${esc(State.searchQ)}" oninput="State.searchQ=this.value;renderProducts()">
        </div>
        <span style="color:var(--text-muted);font-size:12px;margin-right:auto">${filtered.length} نتيجة</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>الكود</th><th>المنتج</th><th>التصنيف</th><th>الشراء</th><th>البيع</th>
            ${whs.map((w) => `<th style="text-align:center">${esc(w.icon)} ${esc(w.name)}</th>`).join("")}
            <th>الإجمالي</th><th>الحالة</th><th>إجراء</th></tr></thead>
          <tbody>
            ${
              filtered
                .map((p) => {
                  const total = totalStock(p.id);
                  const lvl =
                    total <= p.minStock
                      ? "low"
                      : total <= p.minStock * 2
                        ? "medium"
                        : "high";
                  const badge =
                    total <= p.minStock
                      ? `<span class="badge danger">نقص</span>`
                      : total <= p.minStock * 2
                        ? `<span class="badge warning">منخفض</span>`
                        : `<span class="badge success">جيد</span>`;
                  return `<tr>
                <td><code style="font-size:11px;background:#f3f4f6;padding:2px 5px;border-radius:3px">${esc(p.sku)}</code></td>
                <td><strong>${esc(p.name)}</strong><br><small style="color:var(--text-muted)">${p.unit}</small></td>
                <td style="font-size:12px">${esc(catMap[p.catId] || "-")}</td>
                <td class="td-num">${fmt(p.buyPrice)}</td>
                <td class="td-num">${fmt(p.sellPrice)}</td>
                ${whs.map((w) => `<td style="text-align:center"><span class="badge ${whStock(p.id, w.id) <= 0 ? "danger" : "gray"}">${whStock(p.id, w.id)}</span></td>`).join("")}
                <td><strong>${total}</strong></td>
                <td>${badge}</td>
                <td class="td-actions">
                  <button class="btn-icon" onclick="editProduct(${p.id})">✏</button>
                  <button class="btn-icon" style="color:var(--danger)" onclick="deleteProduct(${p.id})">🗑</button>
                </td>
              </tr>`;
                })
                .join() ||
              '<tr><td colspan="20" style="text-align:center;padding:28px;color:var(--text-muted)">لا توجد نتائج</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>
    <!-- Product Modal -->
    <div class="modal-backdrop" id="modal-product" onclick="if(event.target===this)closeModal('modal-product')">
      <div class="modal">
        <div class="modal-header"><span class="modal-title" id="pm-title">إضافة منتج</span><button class="modal-close" onclick="closeModal('modal-product')">×</button></div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">الكود (SKU) *</label><input class="form-control" id="pm-sku" placeholder="ENG-001"></div>
            <div class="form-group"><label class="form-label">الوحدة</label>
              <select class="form-control" id="pm-unit"><option>قطعة</option><option>طقم</option><option>زوج</option><option>لتر</option><option>كيلو</option></select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">اسم المنتج *</label><input class="form-control" id="pm-name"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">التصنيف</label>
              <select class="form-control" id="pm-cat">${cats.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select>
            </div>
            <div class="form-group"><label class="form-label">المورد</label>
              <select class="form-control" id="pm-supp">${suppliers.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select>
            </div>
          </div>
          <div class="form-row-3">
            <div class="form-group"><label class="form-label">سعر الشراء (ج.م) *</label><input class="form-control" id="pm-buy" type="number" min="0"></div>
            <div class="form-group"><label class="form-label">سعر البيع (ج.م) *</label><input class="form-control" id="pm-sell" type="number" min="0"></div>
            <div class="form-group"><label class="form-label">الحد الأدنى</label><input class="form-control" id="pm-min" type="number" min="0" value="5"></div>
          </div>
          <div id="pm-stock-section">
            <label class="form-label">توزيع الكمية الافتتاحية على المخازن:</label>
            <div style="margin-top:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
              ${whs
                .map(
                  (
                    w,
                  ) => `<div style="border:1px solid var(--border);border-radius:var(--radius);padding:10px">
                <div style="font-size:12px;font-weight:600;margin-bottom:5px">${w.icon} ${esc(w.name)}</div>
                <input class="form-control" id="pm-stock-${w.id}" type="number" min="0" value="0" placeholder="0">
              </div>`,
                )
                .join("")}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="saveProduct()">💾 حفظ</button>
          <button class="btn btn-outline" onclick="closeModal('modal-product')">إلغاء</button>
        </div>
      </div>
    </div>`;
}

function openProductModal(id = null) {
  State.editId = id;
  const p = id ? DB.get("products").find((x) => x.id === id) : null;
  document.getElementById("pm-title").textContent = id
    ? "تعديل المنتج"
    : "إضافة منتج";
  document.getElementById("pm-sku").value = p?.sku || "";
  document.getElementById("pm-name").value = p?.name || "";
  document.getElementById("pm-buy").value = p?.buyPrice || "";
  document.getElementById("pm-sell").value = p?.sellPrice || "";
  document.getElementById("pm-min").value = p?.minStock || 5;
  if (p) {
    document.getElementById("pm-unit").value = p.unit;
    document.getElementById("pm-cat").value = p.catId;
    document.getElementById("pm-supp").value = p.supplierId;
    document.getElementById("pm-stock-section").style.display = "none";
  } else {
    document.getElementById("pm-stock-section").style.display = "";
  }
  openModal("modal-product");
}
function editProduct(id) {
  if (document.getElementById("modal-product")) openProductModal(id);
  else {
    renderProducts();
    setTimeout(() => openProductModal(id), 80);
  }
}

function saveProduct() {
  const sku = document.getElementById("pm-sku")?.value.trim();
  const name = document.getElementById("pm-name")?.value.trim();
  const buy = parseFloat(document.getElementById("pm-buy")?.value) || 0;
  const sell = parseFloat(document.getElementById("pm-sell")?.value) || 0;
  const min = parseInt(document.getElementById("pm-min")?.value) || 5;
  const unit = document.getElementById("pm-unit")?.value || "قطعة";
  const catId = parseInt(document.getElementById("pm-cat")?.value) || 1;
  const suppId = parseInt(document.getElementById("pm-supp")?.value) || 1;
  if (!sku || !name) return showToast("يرجى ملء الكود والاسم", "danger");
  const products = DB.get("products");
  const whs = DB.get("warehouses");
  if (State.editId) {
    const idx = products.findIndex((p) => p.id === State.editId);
    if (idx !== -1)
      products[idx] = {
        ...products[idx],
        sku,
        name,
        buyPrice: buy,
        sellPrice: sell,
        minStock: min,
        unit,
        catId,
        supplierId: suppId,
      };
    DB.set("products", products);
    showToast("تم التحديث");
  } else {
    const id = nid("product");
    products.push({
      id,
      sku,
      name,
      catId,
      supplierId: suppId,
      buyPrice: buy,
      sellPrice: sell,
      minStock: min,
      unit,
    });
    DB.set("products", products);
    whs.forEach((w) => {
      const qty =
        parseInt(document.getElementById(`pm-stock-${w.id}`)?.value) || 0;
      if (qty > 0) setWhStock(id, w.id, qty);
    });
    showToast("تم الإضافة");
  }
  closeModal("modal-product");
  refreshPage();
}

function deleteProduct(id) {
  if (!confirm("حذف هذا المنتج؟")) return;
  DB.set(
    "products",
    DB.get("products").filter((p) => p.id !== id),
  );
  showToast("تم الحذف", "danger");
  refreshPage();
}

/* ── CATEGORIES ───────────────────────────────────── */
function renderCategories() {
  const cats = DB.get("categories"),
    products = DB.get("products");
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">🏷 التصنيفات</div></div>
      <div class="page-actions"><button class="btn btn-primary" onclick="openCatModal()">+ إضافة</button></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>الاسم</th><th>الكود</th><th>المنتجات</th><th>إجراء</th></tr></thead>
          <tbody>
            ${cats
              .map(
                (c, i) => `<tr>
              <td style="color:var(--text-muted)">${i + 1}</td>
              <td><strong>${esc(c.name)}</strong></td>
              <td><code style="font-size:11px;background:#f3f4f6;padding:2px 5px;border-radius:3px">${esc(c.code)}</code></td>
              <td><span class="badge info">${products.filter((p) => p.catId === c.id).length}</span></td>
              <td class="td-actions">
                <button class="btn-icon" onclick="openCatModal(${c.id})">✏</button>
                <button class="btn-icon" style="color:var(--danger)" onclick="deleteCat(${c.id})">🗑</button>
              </td>
            </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="modal-backdrop" id="modal-cat" onclick="if(event.target===this)closeModal('modal-cat')">
      <div class="modal" style="max-width:380px">
        <div class="modal-header"><span class="modal-title" id="cat-title">إضافة تصنيف</span><button class="modal-close" onclick="closeModal('modal-cat')">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">الاسم *</label><input class="form-control" id="cat-name"></div>
          <div class="form-group"><label class="form-label">الكود</label><input class="form-control" id="cat-code" placeholder="ENG"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="saveCat()">حفظ</button>
          <button class="btn btn-outline" onclick="closeModal('modal-cat')">إلغاء</button>
        </div>
      </div>
    </div>`;
}
function openCatModal(id = null) {
  State.editId = id;
  const c = id ? DB.get("categories").find((x) => x.id === id) : null;
  document.getElementById("cat-title").textContent = id
    ? "تعديل"
    : "إضافة تصنيف";
  document.getElementById("cat-name").value = c?.name || "";
  document.getElementById("cat-code").value = c?.code || "";
  openModal("modal-cat");
}
function saveCat() {
  const name = document.getElementById("cat-name")?.value.trim();
  if (!name) return showToast("يرجى إدخال الاسم", "danger");
  const code = document.getElementById("cat-code")?.value.trim().toUpperCase();
  const cats = DB.get("categories");
  if (State.editId) {
    const idx = cats.findIndex((c) => c.id === State.editId);
    if (idx !== -1) {
      cats[idx].name = name;
      cats[idx].code = code;
    }
  } else cats.push({ id: nid("category"), name, code });
  DB.set("categories", cats);
  showToast("تم الحفظ");
  closeModal("modal-cat");
  refreshPage();
}
function deleteCat(id) {
  if (!confirm("حذف؟")) return;
  DB.set(
    "categories",
    DB.get("categories").filter((c) => c.id !== id),
  );
  showToast("تم الحذف", "danger");
  refreshPage();
}

/* ── CUSTOMERS + PROFILE ──────────────────────────── */
function renderCustomers() {
  const customers = DB.get("customers");
  const q = State.searchQ.toLowerCase();
  const filtered = q
    ? customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
      )
    : customers;
  const typeLabel = {
    vip: '<span class="badge warning">VIP</span>',
    wholesale: '<span class="badge info">جملة</span>',
    retail: '<span class="badge gray">تجزئة</span>',
  };
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">👥 العملاء</div><div class="page-subtitle">${customers.length} عميل</div></div>
      <div class="page-actions"><button class="btn btn-primary" onclick="openCustomerModal()">+ إضافة عميل</button></div>
    </div>
    <div class="card">
      <div class="toolbar">
        <div class="search-wrap"><span class="search-icon">🔍</span>
          <input class="search-input" placeholder="بحث بالاسم أو الهاتف..." value="${esc(State.searchQ)}" oninput="State.searchQ=this.value;renderCustomers()">
        </div>
        <span style="margin-right:auto;font-size:12px;color:var(--text-muted)">${filtered.length} نتيجة</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>العميل</th><th>الهاتف</th><th>النوع</th><th>إجمالي المشتريات</th><th>الرصيد المستحق</th><th>إجراءات</th></tr></thead>
          <tbody>
            ${filtered
              .map(
                (c) => `<tr>
              <td>
                <div style="display:flex;align-items:center;gap:9px">
                  <div class="avatar" style="width:34px;height:34px;font-size:13px">${c.name.slice(0, 2)}</div>
                  <div><strong>${esc(c.name)}</strong><br><small style="color:var(--text-muted)">${esc(c.address || "")}</small></div>
                </div>
              </td>
              <td style="direction:ltr;text-align:right">${esc(c.phone)}</td>
              <td>${typeLabel[c.type] || ""}</td>
              <td class="td-num">${fmt(c.totalPurchases)}</td>
              <td class="td-num">${c.balance > 0 ? `<span class="badge danger">${EGP(c.balance)}</span>` : '<span class="badge success">مسدد</span>'}</td>
              <td class="td-actions">
                <button class="btn-icon" title="البروفيل" onclick="openCustomerProfile(${c.id})">👤</button>
                <button class="btn-icon" title="تعديل" onclick="openCustomerModal(${c.id})">✏</button>
                <button class="btn-icon" style="color:var(--danger)" title="حذف" onclick="deleteCustomer(${c.id})">🗑</button>
              </td>
            </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
    <!-- Customer Modal -->
    <div class="modal-backdrop" id="modal-customer" onclick="if(event.target===this)closeModal('modal-customer')">
      <div class="modal">
        <div class="modal-header"><span class="modal-title" id="cust-title">إضافة عميل</span><button class="modal-close" onclick="closeModal('modal-customer')">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">الاسم *</label><input class="form-control" id="cust-name"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">الهاتف</label><input class="form-control" id="cust-phone" dir="ltr"></div>
            <div class="form-group"><label class="form-label">النوع</label>
              <select class="form-control" id="cust-type">
                <option value="retail">تجزئة</option><option value="wholesale">جملة</option><option value="vip">VIP</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">العنوان</label><input class="form-control" id="cust-address"></div>
          <div class="form-group"><label class="form-label">البريد الإلكتروني</label><input class="form-control" id="cust-email" dir="ltr"></div>
          <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-control" id="cust-notes" rows="2"></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="saveCustomer()">حفظ</button>
          <button class="btn btn-outline" onclick="closeModal('modal-customer')">إلغاء</button>
        </div>
      </div>
    </div>
    <!-- Profile Modal -->
    <div class="modal-backdrop" id="modal-profile" onclick="if(event.target===this)closeModal('modal-profile')">
      <div class="modal modal-xl">
        <div class="modal-header">
          <span class="modal-title" id="prof-title">بروفيل العميل</span>
          <div style="display:flex;gap:7px">
            <button class="btn btn-outline btn-sm no-print" onclick="printStatement()">🖨 طباعة كشف الحساب</button>
            <button class="modal-close no-print" onclick="closeModal('modal-profile')">×</button>
          </div>
        </div>
        <div class="modal-body print-area" id="prof-body"></div>
      </div>
    </div>
    <!-- Pay Debt Modal -->
    <div class="modal-backdrop" id="modal-pay" onclick="if(event.target===this)closeModal('modal-pay')">
      <div class="modal" style="max-width:450px">
        <div class="modal-header"><span class="modal-title">💳 تسديد دين</span><button class="modal-close" onclick="closeModal('modal-pay')">×</button></div>
        <div class="modal-body">
          <p id="pay-info" style="font-size:13px;margin-bottom:12px;color:var(--text-muted)"></p>
          <div class="form-group"><label class="form-label">المبلغ المدفوع (ج.م) *</label><input class="form-control" id="pay-amount" type="number" min="1" oninput="updatePaymentPreview()"></div>
          <div id="pay-preview" style="background:rgba(34,197,94,.08);border-left:3px solid var(--success);padding:10px 12px;border-radius:4px;margin-bottom:15px;font-size:13px;display:none">
            <div style="margin-bottom:6px">الرصيد المستحق: <strong id="prev-balance" style="color:var(--text)"></strong></div>
            <div style="margin-bottom:6px">المبلغ المدفوع: <strong id="prev-amount" style="color:var(--primary)"></strong></div>
            <div style="border-top:1px solid rgba(34,197,94,.2);padding-top:6px;margin-top:6px">الرصيد المتبقي: <strong id="prev-remaining" style="color:var(--success)"></strong></div>
          </div>
          <div class="form-group"><label class="form-label">ملاحظة</label><input class="form-control" id="pay-note" placeholder="دفعة أولى، تسوية نهائية..."></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-success" onclick="savePayment()">✓ تأكيد السداد</button>
          <button class="btn btn-outline" onclick="closeModal('modal-pay')">إلغاء</button>
        </div>
      </div>
    </div>`;
}

function openCustomerModal(id = null) {
  State.editId = id;
  const c = id ? DB.get("customers").find((x) => x.id === id) : null;
  document.getElementById("cust-title").textContent = id
    ? "تعديل العميل"
    : "إضافة عميل";
  document.getElementById("cust-name").value = c?.name || "";
  document.getElementById("cust-phone").value = c?.phone || "";
  document.getElementById("cust-type").value = c?.type || "retail";
  document.getElementById("cust-address").value = c?.address || "";
  document.getElementById("cust-email").value = c?.email || "";
  document.getElementById("cust-notes").value = c?.notes || "";
  openModal("modal-customer");
}
function saveCustomer() {
  const name = document.getElementById("cust-name")?.value.trim();
  if (!name) return showToast("يرجى إدخال الاسم", "danger");
  const data = {
    name,
    phone: document.getElementById("cust-phone")?.value.trim(),
    type: document.getElementById("cust-type")?.value || "retail",
    address: document.getElementById("cust-address")?.value.trim(),
    email: document.getElementById("cust-email")?.value.trim(),
    notes: document.getElementById("cust-notes")?.value.trim(),
  };
  const customers = DB.get("customers");
  if (State.editId) {
    const idx = customers.findIndex((c) => c.id === State.editId);
    if (idx !== -1) customers[idx] = { ...customers[idx], ...data };
  } else {
    customers.push({
      id: nid("customer"),
      balance: 0,
      totalPurchases: 0,
      ...data,
    });
  }
  DB.set("customers", customers);
  showToast("تم الحفظ");
  closeModal("modal-customer");
  refreshPage();
}
function deleteCustomer(id) {
  if (!confirm("حذف هذا العميل؟")) return;
  DB.set(
    "customers",
    DB.get("customers").filter((c) => c.id !== id),
  );
  showToast("تم الحذف", "danger");
  refreshPage();
}

/* CUSTOMER PROFILE */
function openCustomerProfile(customerId) {
  const c = DB.get("customers").find((x) => x.id === customerId);
  if (!c) return;
  const sales = DB.get("sales").filter((s) => s.customerId === customerId);
  const returns = DB.get("returns").filter((r) => r.customerId === customerId);
  const payments = DB.get("payments").filter(
    (p) => p.customerId === customerId,
  );
  const products = DB.get("products");
  const prodMap = Object.fromEntries(products.map((p) => [p.id, p]));
  const typeLabel = { vip: "VIP", wholesale: "جملة", retail: "تجزئة" };
  const totalSales = sales.reduce((a, s) => a + s.total, 0);
  const totalReturns = returns.reduce((a, r) => a + r.total, 0);
  const totalPaid = payments.reduce((a, p) => a + p.amount, 0);

  // Build ledger: all transactions sorted by date
  const ledger = [];
  sales.forEach((s) =>
    ledger.push({
      date: s.date,
      type: "sale",
      ref: `فاتورة #${s.id}`,
      debit: s.total,
      credit: 0,
      id: s.id,
    }),
  );
  returns.forEach((r) =>
    ledger.push({
      date: r.date,
      type: "return",
      ref: `مرتجع فاتورة #${r.saleId}`,
      debit: 0,
      credit: r.total,
      id: r.id,
    }),
  );
  payments.forEach((p) =>
    ledger.push({
      date: p.date,
      type: "payment",
      ref: `سداد - ${p.note || ""}`,
      debit: 0,
      credit: p.amount,
      id: p.id,
    }),
  );
  ledger.sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  ledger.forEach((row) => {
    running += row.debit - row.credit;
    row.balance = running;
  });

  document.getElementById("prof-title").textContent =
    `بروفيل العميل — ${c.name}`;
  document.getElementById("prof-body").innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar-big">${c.name.slice(0, 2)}</div>
      <div class="profile-info-main">
        <h2>${esc(c.name)}</h2>
        <p>${typeLabel[c.type] || ""} ${c.phone ? `• ${c.phone}` : ""} ${c.address ? `• ${c.address}` : ""}</p>
        ${c.email ? `<p style="font-size:12px;opacity:.7">✉ ${esc(c.email)}</p>` : ""}
        <div class="profile-stats-bar">
          <div class="profile-stat"><div class="v">${sales.length}</div><div class="l">فاتورة</div></div>
          <div class="profile-stat"><div class="v">${EGP(totalSales)}</div><div class="l">إجمالي المشتريات</div></div>
          <div class="profile-stat"><div class="v">${EGP(c.balance)}</div><div class="l">الرصيد المستحق</div></div>
          <div class="profile-stat"><div class="v">${returns.length}</div><div class="l">مرتجع</div></div>
        </div>
      </div>
      <div class="no-print" style="margin-right:auto;display:flex;flex-direction:column;gap:7px">
        ${c.balance > 0 ? `<button class="btn btn-success btn-sm" onclick="openPayModal(${c.id})">💳 تسديد دين</button>` : ""}
        <button class="btn btn-outline btn-sm" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.3)" onclick="navigate('pos')">🛒 بيع جديد</button>
      </div>
    </div>
    ${c.notes ? `<div class="alert info" style="margin-bottom:14px">📝 ${esc(c.notes)}</div>` : ""}

    <!-- LEDGER / STATEMENT -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-header">
        <span class="card-title">📋 كشف الحساب</span>
        <span style="font-size:12px;color:var(--text-muted)">الرصيد النهائي: <strong style="color:${c.balance > 0 ? "var(--danger)" : "var(--success)"}">${EGP(c.balance)}</strong></span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>التاريخ</th><th>البيان</th><th>مدين (ج.م)</th><th>دائن (ج.م)</th><th>الرصيد (ج.م)</th><th class="no-print">إجراء</th></tr></thead>
          <tbody>
            ${
              ledger.length === 0
                ? '<tr><td colspan="6" style="text-align:center;padding:22px;color:var(--text-muted)">لا توجد حركات</td></tr>'
                : ledger
                    .map(
                      (
                        row,
                      ) => `<tr style="${row.type === "payment" ? "background:#f0fdf4" : row.type === "return" ? "background:#fff7ed" : ""}">
                <td>${row.date}</td>
                <td>${row.type === "sale" ? "🧾" : row.type === "return" ? "↩" : "💳"} ${esc(row.ref)}</td>
                <td class="td-num">${row.debit > 0 ? fmt(row.debit) : "-"}</td>
                <td class="td-num" style="color:var(--success)">${row.credit > 0 ? fmt(row.credit) : "-"}</td>
                <td class="td-num" style="color:${row.balance > 0 ? "var(--danger)" : "var(--success)"};font-weight:700">${fmt(Math.abs(row.balance))} ${row.balance > 0 ? "دائن" : "مسدد"}</td>
                <td class="td-actions no-print">
                  ${row.type === "sale" ? `<button class="btn-icon" title="طباعة" onclick="printInvoice(${row.id})">🖨</button>` : ""}
                </td>
              </tr>`,
                    )
                    .join("")
            }
          </tbody>
          <tfoot>
            <tr style="background:#f9fafb;font-weight:700">
              <td colspan="2">الإجمالي</td>
              <td class="td-num">${EGP(totalSales)}</td>
              <td class="td-num" style="color:var(--success)">${EGP(totalReturns + totalPaid)}</td>
              <td class="td-num" style="color:${c.balance > 0 ? "var(--danger)" : "var(--success)"}">${EGP(c.balance)}</td>
              <td class="no-print"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- SALES LIST -->
    <div class="card">
      <div class="card-header"><span class="card-title">🧾 فواتير العميل</span></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>الأصناف</th><th>الإجمالي</th><th>الحالة</th><th class="no-print">طباعة</th></tr></thead>
          <tbody>
            ${
              sales.length === 0
                ? '<tr><td colspan="6" style="text-align:center;padding:22px;color:var(--text-muted)">لا توجد فواتير</td></tr>'
                : sales
                    .slice()
                    .reverse()
                    .map(
                      (s) => `<tr>
                <td><strong>#${s.id}</strong></td>
                <td>${s.date}</td>
                <td>${s.items.length} صنف</td>
                <td class="td-num">${EGP(s.total)}</td>
                <td>${s.status === "paid" ? '<span class="badge success">مدفوع</span>' : '<span class="badge warning">آجل</span>'}</td>
                <td class="no-print"><button class="btn-icon" onclick="printInvoice(${s.id})">🖨 طباعة</button></td>
              </tr>`,
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </div>`;
  openModal("modal-profile");
}

function openPayModal(customerId) {
  const c = DB.get("customers").find((x) => x.id === customerId);
  if (!c) return;
  State.editId = customerId;
  State.paymentBalance = c.balance; // Store current balance for validation
  document.getElementById("pay-info").textContent =
    `العميل: ${c.name} | الرصيد المستحق: ${EGP(c.balance)}`;
  document.getElementById("pay-amount").value = c.balance;
  document.getElementById("pay-note").value = "";
  document.getElementById("pay-preview").style.display = "none";
  openModal("modal-pay");
}
function updatePaymentPreview() {
  const balance = State.paymentBalance || 0;
  const amount = parseFloat(document.getElementById("pay-amount")?.value) || 0;
  const remaining = Math.max(0, balance - amount);
  const prevBox = document.getElementById("pay-preview");
  if (amount > 0) {
    document.getElementById("prev-balance").textContent = EGP(balance);
    document.getElementById("prev-amount").textContent = EGP(amount);
    document.getElementById("prev-remaining").textContent = EGP(remaining);
    prevBox.style.display = "block";
    if (amount > balance) {
      prevBox.style.background = "rgba(239,68,68,.08)";
      prevBox.style.borderLeftColor = "var(--danger)";
      document.getElementById("prev-remaining").style.color = "var(--danger)";
      document.getElementById("prev-remaining").textContent =
        `❌ المبلغ يتجاوز الرصيد`;
    } else {
      prevBox.style.background = "rgba(34,197,94,.08)";
      prevBox.style.borderLeftColor = "var(--success)";
      document.getElementById("prev-remaining").style.color = "var(--success)";
      document.getElementById("prev-remaining").textContent = EGP(remaining);
    }
  } else {
    prevBox.style.display = "none";
  }
}

function savePayment() {
  const amount = parseFloat(document.getElementById("pay-amount")?.value) || 0;
  const note = document.getElementById("pay-note")?.value.trim();
  const balance = State.paymentBalance || 0;

  if (amount <= 0) return showToast("المبلغ يجب أن يكون أكبر من صفر", "danger");
  if (amount > balance)
    return showToast(
      `❌ المبلغ يتجاوز الرصيد المستحق (${EGP(balance)})`,
      "danger",
    );

  const customers = DB.get("customers");
  const idx = customers.findIndex((c) => c.id === State.editId);
  const prevBalance = customers[idx]?.balance || 0;
  const newBalance = Math.max(0, prevBalance - amount);

  if (idx !== -1) {
    customers[idx].balance = newBalance;
  }
  DB.set("customers", customers);

  const payments = DB.get("payments");
  payments.push({
    id: nid("payment"),
    date: today(),
    customerId: State.editId,
    amount,
    note: note || "سداد",
    type: "payment",
  });
  DB.set("payments", payments);

  // Show detailed confirmation
  const msg =
    newBalance > 0
      ? `✓ تم تسجيل سداد ${EGP(amount)} | الرصيد المتبقي: ${EGP(newBalance)}`
      : `✓ تم سداد الرصيد بالكامل! (${EGP(amount)})`;
  showToast(msg);
  closeModal("modal-pay");
  openCustomerProfile(State.editId);
}

function printStatement() {
  window.print();
}

/* ── SUPPLIERS ─────────────────────────────────────── */
function renderSuppliers() {
  const suppliers = DB.get("suppliers");
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">🏭 الموردون</div><div class="page-subtitle">${suppliers.length} مورد</div></div>
      <div class="page-actions"><button class="btn btn-primary" onclick="openSupplierModal()">+ إضافة</button></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>المورد</th><th>الهاتف</th><th>البريد</th><th>الرصيد</th><th>إجراء</th></tr></thead>
          <tbody>
            ${suppliers
              .map(
                (s) => `<tr>
              <td><strong>${esc(s.name)}</strong></td>
              <td style="direction:ltr;text-align:right">${esc(s.phone)}</td>
              <td style="direction:ltr;text-align:right">${esc(s.email)}</td>
              <td class="td-num">${s.balance > 0 ? `<span class="badge danger">${EGP(s.balance)}</span>` : '<span class="badge success">مسدد</span>'}</td>
              <td class="td-actions">
                <button class="btn-icon" onclick="openSupplierModal(${s.id})">✏</button>
                <button class="btn-icon" style="color:var(--danger)" onclick="deleteSupplier(${s.id})">🗑</button>
              </td>
            </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="modal-backdrop" id="modal-supplier" onclick="if(event.target===this)closeModal('modal-supplier')">
      <div class="modal">
        <div class="modal-header"><span class="modal-title" id="supp-title">إضافة مورد</span><button class="modal-close" onclick="closeModal('modal-supplier')">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">الاسم *</label><input class="form-control" id="supp-name"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">الهاتف</label><input class="form-control" id="supp-phone" dir="ltr"></div>
            <div class="form-group"><label class="form-label">البريد</label><input class="form-control" id="supp-email" dir="ltr"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="saveSupplier()">حفظ</button>
          <button class="btn btn-outline" onclick="closeModal('modal-supplier')">إلغاء</button>
        </div>
      </div>
    </div>`;
}
function openSupplierModal(id = null) {
  State.editId = id;
  const s = id ? DB.get("suppliers").find((x) => x.id === id) : null;
  document.getElementById("supp-title").textContent = id
    ? "تعديل"
    : "إضافة مورد";
  document.getElementById("supp-name").value = s?.name || "";
  document.getElementById("supp-phone").value = s?.phone || "";
  document.getElementById("supp-email").value = s?.email || "";
  openModal("modal-supplier");
}
function saveSupplier() {
  const name = document.getElementById("supp-name")?.value.trim();
  if (!name) return showToast("يرجى إدخال الاسم", "danger");
  const suppliers = DB.get("suppliers");
  const data = {
    name,
    phone: document.getElementById("supp-phone")?.value.trim(),
    email: document.getElementById("supp-email")?.value.trim(),
  };
  if (State.editId) {
    const idx = suppliers.findIndex((s) => s.id === State.editId);
    if (idx !== -1) suppliers[idx] = { ...suppliers[idx], ...data };
  } else suppliers.push({ id: nid("supplier"), balance: 0, ...data });
  DB.set("suppliers", suppliers);
  showToast("تم الحفظ");
  closeModal("modal-supplier");
  refreshPage();
}
function deleteSupplier(id) {
  if (!confirm("حذف؟")) return;
  DB.set(
    "suppliers",
    DB.get("suppliers").filter((s) => s.id !== id),
  );
  showToast("تم الحذف", "danger");
  refreshPage();
}

/* ── POS ─────────────────────────────────────────── */
function renderPOS() {
  const products = DB.get("products"),
    customers = DB.get("customers"),
    whs = DB.get("warehouses");
  const q = State.searchQ.toLowerCase();
  const whId = State.posWarehouse || whs[0]?.id || 1;
  const filtered = (
    q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
        )
      : products
  ).filter((p) => whStock(p.id, whId) > 0);
  const subtotal = State.cart.reduce((a, i) => a + i.price * i.qty, 0);
  const disc = parseFloat(document.getElementById("pos-discount")?.value || 0);
  const tax = parseFloat(document.getElementById("pos-tax")?.value || 0);
  const total = Math.max(0, subtotal - disc + (subtotal * tax) / 100);

  document.getElementById("mainContent").innerHTML = `
    <div class="page-header" style="margin-bottom:12px">
      <div><div class="page-title">🛒 نقطة البيع</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <label style="font-size:12px;font-weight:600">المخزن:</label>
        <select class="form-control" style="width:170px;font-size:12px" onchange="State.posWarehouse=parseInt(this.value);renderPOS()">
          ${whs.map((w) => `<option value="${w.id}" ${w.id === whId ? "selected" : ""}>${w.icon} ${esc(w.name)}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="pos-layout">
      <div style="display:flex;flex-direction:column;gap:10px;overflow:hidden">
        <div class="card" style="flex-shrink:0">
          <div class="toolbar" style="padding:8px 11px">
            <div class="search-wrap" style="max-width:none">
              <span class="search-icon">🔍</span>
              <input class="search-input" placeholder="بحث عن منتج..." value="${esc(State.searchQ)}" oninput="State.searchQ=this.value;renderPOS()">
            </div>
          </div>
        </div>
        <div class="pos-products-grid">
          ${
            filtered
              .map(
                (p) => `
          <div class="product-tile" onclick="addToCart(${p.id},${whId})">
            <div class="pt-name">${esc(p.name)}</div>
            <div class="pt-sku">${esc(p.sku)}</div>
            <div class="pt-price">${EGP(p.sellPrice)}</div>
            <div class="pt-stock">متوفر: ${whStock(p.id, whId)}</div>
          </div>`,
              )
              .join() ||
            '<div style="padding:30px;text-align:center;color:var(--text-muted);grid-column:1/-1">لا توجد منتجات في هذا المخزن</div>'
          }
        </div>
      </div>
      <div class="cart-panel">
        <div class="cart-header">🛒 الفاتورة <button class="btn-icon" onclick="clearCart()" title="مسح">🗑</button></div>
        <div style="padding:7px 11px;border-bottom:1px solid var(--border)">
          <select class="form-control" id="pos-customer" style="font-size:12px">
            <option value="">-- عميل (اختياري) --</option>
            ${customers.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}
          </select>
        </div>
        <div class="cart-items">
          ${
            State.cart.length === 0
              ? '<div class="cart-empty">🛒<br>الفاتورة فارغة</div>'
              : State.cart
                  .map(
                    (item, idx) => `<div class="cart-item">
              <div class="ci-name">${esc(item.name)}<br><small style="color:var(--text-hint)">${EGP(item.price)}/وحدة</small></div>
              <div class="ci-qty">
                <button onclick="cartQty(${idx},-1)">−</button>
                <span>${item.qty}</span>
                <button onclick="cartQty(${idx},1)">+</button>
              </div>
              <div class="ci-price">${EGP(item.price * item.qty)}</div>
              <span class="ci-del" onclick="removeFromCart(${idx})">×</span>
            </div>`,
                  )
                  .join("")
          }
        </div>
        <div class="cart-footer">
          <div class="cart-total-row"><span>المجموع الفرعي</span><span>${EGP(subtotal)}</span></div>
          <div class="cart-total-row" style="align-items:center;gap:5px">
            <span>خصم</span>
            <input id="pos-discount" type="number" min="0" value="0" style="width:65px;border:1px solid var(--border);border-radius:4px;padding:3px 6px;font-size:12px;text-align:center" oninput="updateCartTotals()">
            <span>ج.م</span>
          </div>
          <div class="cart-total-row" style="align-items:center;gap:5px">
            <span>ضريبة</span>
            <input id="pos-tax" type="number" min="0" max="100" value="0" style="width:50px;border:1px solid var(--border);border-radius:4px;padding:3px 6px;font-size:12px;text-align:center" oninput="updateCartTotals()">
            <span>%</span>
          </div>
          <div class="cart-total-row final"><span>الإجمالي</span><span class="amount" id="pos-total">${EGP(total)}</span></div>
          <div style="margin-top:9px">
            <label class="form-label" style="font-size:12px">طريقة الدفع</label>
            <select class="form-control" id="pos-paymethod" style="font-size:12px">
              <option value="cash">💵 نقداً</option><option value="card">💳 بطاقة</option>
              <option value="transfer">🏦 تحويل</option><option value="credit">📋 آجل</option>
            </select>
          </div>
          <button class="btn btn-success" style="width:100%;margin-top:9px;font-size:13px;padding:10px"
            onclick="completeSale(${whId})" ${State.cart.length === 0 ? "disabled" : ""}>
            ✓ إتمام البيع — ${EGP(total)}
          </button>
        </div>
      </div>
    </div>`;
}

function updateCartTotals() {
  const subtotal = State.cart.reduce((a, i) => a + i.price * i.qty, 0);
  const disc = parseFloat(document.getElementById("pos-discount")?.value || 0);
  const tax = parseFloat(document.getElementById("pos-tax")?.value || 0);
  const total = Math.max(0, subtotal - disc + (subtotal * tax) / 100);
  const el = document.getElementById("pos-total");
  if (el) el.textContent = EGP(total);
  const btn = document.querySelector(".cart-footer .btn-success");
  if (btn) btn.textContent = `✓ إتمام البيع — ${EGP(total)}`;
}

function addToCart(productId, whId) {
  const p = DB.get("products").find((x) => x.id === productId);
  if (!p) return;
  const avail = whStock(productId, whId);
  const existing = State.cart.find((i) => i.productId === productId);
  if (existing) {
    if (existing.qty >= avail) return showToast("لا يوجد مخزون كافٍ", "danger");
    existing.qty++;
  } else
    State.cart.push({
      productId,
      whId,
      name: p.name,
      price: p.sellPrice,
      qty: 1,
      maxStock: avail,
    });
  refreshPage();
}
function cartQty(idx, d) {
  const item = State.cart[idx];
  if (!item) return;
  item.qty = Math.max(1, item.qty + d);
  if (item.qty > item.maxStock) {
    item.qty = item.maxStock;
    showToast("الحد الأقصى", "danger");
  }
  refreshPage();
}
function removeFromCart(idx) {
  State.cart.splice(idx, 1);
  refreshPage();
}
function clearCart() {
  State.cart = [];
  refreshPage();
}

function completeSale(whId) {
  if (State.cart.length === 0) return;
  const subtotal = State.cart.reduce((a, i) => a + i.price * i.qty, 0);
  const disc = parseFloat(document.getElementById("pos-discount")?.value || 0);
  const tax = parseFloat(document.getElementById("pos-tax")?.value || 0);
  const total = Math.max(0, subtotal - disc + (subtotal * tax) / 100);
  const customerId =
    parseInt(document.getElementById("pos-customer")?.value) || null;
  const payMethod = document.getElementById("pos-paymethod")?.value || "cash";
  const saleItems = State.cart.map((i) => ({
    productId: i.productId,
    qty: i.qty,
    price: i.price,
  }));
  // Deduct from warehouse stock
  saleItems.forEach((si) =>
    setWhStock(si.productId, whId, whStock(si.productId, whId) - si.qty),
  );
  // Update customer
  if (customerId) {
    const customers = DB.get("customers");
    const idx = customers.findIndex((c) => c.id === customerId);
    if (idx !== -1) {
      customers[idx].totalPurchases =
        (customers[idx].totalPurchases || 0) + total;
      if (payMethod === "credit")
        customers[idx].balance = (customers[idx].balance || 0) + total;
    }
    DB.set("customers", customers);
  }
  const saleId = nid("sale");
  const sales = DB.get("sales");
  sales.push({
    id: saleId,
    date: today(),
    customerId,
    warehouseId: whId,
    items: saleItems,
    total,
    discount: disc,
    tax,
    status: payMethod === "credit" ? "credit" : "paid",
    payMethod,
  });
  DB.set("sales", sales);
  State.cart = [];
  showToast(`✓ تم البيع! الفاتورة #${saleId}`);
  // Auto print
  if (confirm(`تم البيع بنجاح — فاتورة #${saleId}\nهل تريد طباعة الفاتورة؟`)) {
    printInvoice(saleId);
  }
  refreshPage();
}

/* ── PRINT INVOICE ────────────────────────────────── */
function printInvoice(saleId) {
  const sale = DB.get("sales").find((s) => s.id === saleId);
  if (!sale) {
    showToast("الفاتورة غير موجودة", "danger");
    return;
  }
  const customers = DB.get("customers"),
    products = DB.get("products"),
    whs = DB.get("warehouses");
  const cust = customers.find((c) => c.id === sale.customerId);
  const wh = whs.find((w) => w.id === sale.warehouseId);
  const prodMap = Object.fromEntries(products.map((p) => [p.id, p]));
  const subtotal = sale.items.reduce((a, i) => a + i.price * i.qty, 0);
  const payLabel = {
    cash: "نقداً",
    card: "بطاقة ائتمان",
    transfer: "تحويل بنكي",
    credit: "آجل (ذمم)",
  };

  const win = window.open("", "_blank", "width=800,height:1000");
  win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>فاتورة #${sale.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;background:#fff;color:#000;font-size:13px;padding:30px}
  .inv-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:14px;border-bottom:3px solid #1a56db}
  .inv-logo{font-size:22px;font-weight:700;color:#1a56db}
  .inv-logo small{display:block;font-size:11px;color:#555;font-weight:400;margin-top:3px}
  .inv-badge{background:#1a56db;color:#fff;padding:6px 16px;border-radius:6px;font-size:14px;font-weight:700}
  .inv-meta{margin-top:5px;font-size:12px;color:#555}
  .inv-parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
  .inv-party{border:1px solid #e5e7eb;border-radius:6px;padding:12px}
  .inv-party h4{font-size:11px;text-transform:uppercase;color:#888;margin-bottom:7px;padding-bottom:4px;border-bottom:1px solid #f3f4f6}
  .inv-party p{font-size:12px;margin-bottom:3px}
  table{width:100%;border-collapse:collapse;margin-bottom:18px}
  thead th{background:#1a56db;color:#fff;padding:9px 12px;text-align:right;font-size:12px;font-weight:600}
  tbody td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px}
  tbody tr:nth-child(even) td{background:#f9fafb}
  .totals-box{width:260px;margin-right:auto;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
  .totals-box td{padding:8px 12px;font-size:12px;border-bottom:1px solid #f3f4f6}
  .totals-grand td{background:#1a56db;color:#fff;font-size:15px;font-weight:700}
  .stamp{display:inline-block;border:3px solid #057a55;color:#057a55;border-radius:6px;padding:5px 16px;font-weight:700;font-size:14px;transform:rotate(-8deg);margin:10px 0}
  .footer{margin-top:30px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#888}
  @media print{@page{margin:1cm}button{display:none}}
</style>
</head>
<body>
  <div class="inv-header">
    <div>
      <div class="inv-logo">⚙ نظام قطع الغيار<small>القاهرة، مصر</small></div>
    </div>
    <div style="text-align:left">
      <div class="inv-badge">فاتورة رقم #${sale.id}</div>
      <div class="inv-meta">التاريخ: ${sale.date}<br>المخزن: ${wh ? wh.name : "غير محدد"}<br>الدفع: ${payLabel[sale.payMethod] || sale.payMethod}</div>
    </div>
  </div>
  <div class="inv-parties">
    <div class="inv-party">
      <h4>من (البائع)</h4>
      <p><strong>نظام قطع الغيار</strong></p>
      <p>القاهرة، جمهورية مصر العربية</p>
      <p>رقم السجل التجاري: 123456789</p>
    </div>
    <div class="inv-party">
      <h4>إلى (المشتري)</h4>
      ${
        cust
          ? `<p><strong>${esc(cust.name)}</strong></p><p>${esc(cust.phone || "")}</p><p>${esc(cust.address || "")}</p>`
          : "<p><strong>عميل نقدي</strong></p>"
      }
    </div>
  </div>
  <table>
    <thead><tr><th style="width:40px">#</th><th>المنتج</th><th>الكود</th><th style="text-align:center">الكمية</th><th style="text-align:left">سعر الوحدة</th><th style="text-align:left">الإجمالي</th></tr></thead>
    <tbody>
      ${sale.items
        .map((it, i) => {
          const p = prodMap[it.productId];
          return `<tr>
          <td style="color:#888">${i + 1}</td>
          <td><strong>${esc(p?.name || `منتج #${it.productId}`)}</strong></td>
          <td style="font-size:11px;color:#888">${esc(p?.sku || "-")}</td>
          <td style="text-align:center">${it.qty} ${p?.unit || ""}</td>
          <td style="text-align:left;font-family:monospace">${fmt(it.price)} ج.م</td>
          <td style="text-align:left;font-family:monospace;font-weight:700">${fmt(it.price * it.qty)} ج.م</td>
        </tr>`;
        })
        .join("")}
    </tbody>
  </table>
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      ${sale.status === "paid" ? `<div class="stamp">✓ مدفوع</div>` : `<div class="stamp" style="border-color:#c81e1e;color:#c81e1e">آجل</div>`}
    </div>
    <table class="totals-box">
      <tbody>
        <tr><td>المجموع الفرعي</td><td style="text-align:left;font-family:monospace">${fmt(subtotal)} ج.م</td></tr>
        ${sale.discount ? `<tr><td>الخصم</td><td style="text-align:left;color:#c81e1e;font-family:monospace">- ${fmt(sale.discount)} ج.م</td></tr>` : ""}
        ${sale.tax ? `<tr><td>ضريبة ${sale.tax}%</td><td style="text-align:left;font-family:monospace">${fmt((subtotal * sale.tax) / 100)} ج.م</td></tr>` : ""}
      </tbody>
      <tfoot>
        <tr class="totals-grand"><td>الإجمالي</td><td style="text-align:left;font-family:monospace">${fmt(sale.total)} ج.م</td></tr>
      </tfoot>
    </table>
  </div>
  <div class="footer">
    شكراً لتعاملكم معنا • نظام إدارة قطع الغيار • تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")}
    <br>الفاتورة رقم #${sale.id} — هذه الفاتورة صادرة إلكترونياً وصالحة بدون توقيع
  </div>
  <div style="text-align:center;margin-top:20px">
    <button onclick="window.print()" style="padding:8px 20px;background:#1a56db;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🖨 طباعة الفاتورة</button>
    <button onclick="window.close()" style="padding:8px 20px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;font-size:13px;margin-right:8px">إغلاق</button>
  </div>
</body>
</html>`);
  win.document.close();
}

/* ── SALES ─────────────────────────────────────────── */
function salesTableHtml(sales) {
  const customers = DB.get("customers");
  const custMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  const statusBadge = {
    paid: '<span class="badge success">مدفوع</span>',
    credit: '<span class="badge warning">آجل</span>',
  };
  const payLabel = {
    cash: "💵 نقداً",
    card: "💳 بطاقة",
    transfer: "🏦 تحويل",
    credit: "📋 آجل",
  };
  return `<div class="table-wrap">
    <table class="data-table">
      <thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>العميل</th><th>الإجمالي</th><th>الدفع</th><th>الحالة</th><th>إجراء</th></tr></thead>
      <tbody>
        ${
          sales
            .map(
              (s) => `<tr>
          <td><strong>#${s.id}</strong></td><td>${s.date}</td>
          <td>${esc(custMap[s.customerId] || "نقدي")}</td>
          <td class="td-num">${EGP(s.total)}</td>
          <td style="font-size:12px">${payLabel[s.payMethod] || s.payMethod}</td>
          <td>${statusBadge[s.status] || s.status}</td>
          <td class="td-actions">
            <button class="btn-icon" title="طباعة" onclick="printInvoice(${s.id})">🖨</button>
            <button class="btn-icon" title="مرتجع" onclick="navigate('sales');setTimeout(()=>openReturnModal(${s.id}),100)">↩</button>
          </td>
        </tr>`,
            )
            .join() ||
          '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">لا توجد مبيعات</td></tr>'
        }
      </tbody>
    </table>
  </div>`;
}

function renderSales() {
  const sales = DB.get("sales").slice().reverse();
  const q = State.searchQ.toLowerCase();
  const customers = DB.get("customers");
  const custMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  const filtered = q
    ? sales.filter(
        (s) =>
          String(s.id).includes(q) ||
          (custMap[s.customerId] || "").toLowerCase().includes(q),
      )
    : sales;
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">🧾 سجل المبيعات</div><div class="page-subtitle">${sales.length} فاتورة</div></div>
      <div class="page-actions"><button class="btn btn-primary" onclick="navigate('pos')">🛒 بيع جديد</button></div>
    </div>
    <div class="card">
      <div class="toolbar">
        <div class="search-wrap"><span class="search-icon">🔍</span>
          <input class="search-input" placeholder="بحث..." value="${esc(State.searchQ)}" oninput="State.searchQ=this.value;renderSales()">
        </div>
        <span style="margin-right:auto;font-size:12px;color:var(--text-muted)">${filtered.length} نتيجة</span>
      </div>
      ${salesTableHtml(filtered)}
    </div>
    <!-- Return Modal -->
    <div class="modal-backdrop" id="modal-return" onclick="if(event.target===this)closeModal('modal-return')">
      <div class="modal">
        <div class="modal-header"><span class="modal-title" id="ret-title">تسجيل مرتجع</span><button class="modal-close" onclick="closeModal('modal-return')">×</button></div>
        <div class="modal-body" id="ret-body"></div>
        <div class="modal-footer">
          <button class="btn btn-danger" onclick="saveReturn()">↩ تأكيد الإرجاع</button>
          <button class="btn btn-outline" onclick="closeModal('modal-return')">إلغاء</button>
        </div>
      </div>
    </div>`;
}

function openReturnModal(saleId) {
  State.editId = saleId;
  const sale = DB.get("sales").find((s) => s.id === saleId);
  if (!sale) return;
  const products = DB.get("products");
  const prodMap = Object.fromEntries(products.map((p) => [p.id, p]));
  document.getElementById("ret-title").textContent =
    `مرتجع من فاتورة #${saleId}`;
  document.getElementById("ret-body").innerHTML = `
    <div class="form-group"><label class="form-label">سبب الإرجاع *</label><input class="form-control" id="ret-reason" placeholder="قطعة تالفة، تغيير رأي..."></div>
    <label class="form-label" style="margin-bottom:8px">اختر الأصناف المرتجعة:</label>
    ${sale.items
      .map((it, idx) => {
        const p = prodMap[it.productId];
        return `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
        <input type="checkbox" id="ret-chk-${idx}" style="width:16px;height:16px">
        <label for="ret-chk-${idx}" style="flex:1">${esc(p?.name || `#${it.productId}`)} (${it.qty}×${EGP(it.price)})</label>
        <input type="number" id="ret-qty-${idx}" min="1" max="${it.qty}" value="${it.qty}" style="width:60px;border:1px solid var(--border);border-radius:4px;padding:4px 6px;font-size:12px">
      </div>`;
      })
      .join("")}`;
  openModal("modal-return");
}

function saveReturn() {
  const sale = DB.get("sales").find((s) => s.id === State.editId);
  if (!sale) return;
  const reason = document.getElementById("ret-reason")?.value.trim();
  if (!reason) return showToast("يرجى إدخال سبب الإرجاع", "danger");
  const returnItems = [];
  sale.items.forEach((it, idx) => {
    const chk = document.getElementById(`ret-chk-${idx}`);
    const qty = parseInt(document.getElementById(`ret-qty-${idx}`)?.value) || 0;
    if (chk?.checked && qty > 0)
      returnItems.push({
        productId: it.productId,
        qty: Math.min(qty, it.qty),
        price: it.price,
      });
  });
  if (returnItems.length === 0)
    return showToast("اختر صنفاً واحداً على الأقل", "danger");
  // Restore stock to sale's warehouse
  const whId = sale.warehouseId || 1;
  returnItems.forEach((ri) =>
    setWhStock(ri.productId, whId, whStock(ri.productId, whId) + ri.qty),
  );
  const total = returnItems.reduce((a, i) => a + i.price * i.qty, 0);
  const returns = DB.get("returns");
  returns.push({
    id: nid("return"),
    date: today(),
    saleId: State.editId,
    customerId: sale.customerId,
    items: returnItems,
    total,
    reason,
    status: "approved",
  });
  DB.set("returns", returns);
  showToast("تم تسجيل المرتجع");
  closeModal("modal-return");
  refreshPage();
}

function renderReturns() {
  const returns = DB.get("returns").slice().reverse();
  const customers = DB.get("customers");
  const custMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">↩ المرتجعات</div><div class="page-subtitle">${returns.length} مرتجع</div></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>رقم المرتجع</th><th>التاريخ</th><th>الفاتورة</th><th>العميل</th><th>القيمة</th><th>السبب</th><th>الحالة</th></tr></thead>
          <tbody>
            ${
              returns
                .map(
                  (r) => `<tr>
              <td><strong>#${r.id}</strong></td><td>${r.date}</td>
              <td><span class="badge info">#${r.saleId}</span></td>
              <td>${esc(custMap[r.customerId] || "-")}</td>
              <td class="td-num">${EGP(r.total)}</td>
              <td style="font-size:12px">${esc(r.reason)}</td>
              <td>${r.status === "approved" ? '<span class="badge success">تمت الموافقة</span>' : '<span class="badge warning">قيد المعالجة</span>'}</td>
            </tr>`,
                )
                .join() ||
              '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">لا توجد مرتجعات</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ── INVENTORY ─────────────────────────────────────── */
function renderInventory() {
  const products = DB.get("products"),
    cats = DB.get("categories"),
    whs = DB.get("warehouses");
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
  const lowStock = products.filter((p) => totalStock(p.id) <= p.minStock);
  const totalVal = products.reduce(
    (a, p) => a + totalStock(p.id) * p.buyPrice,
    0,
  );
  const totalSellVal = products.reduce(
    (a, p) => a + totalStock(p.id) * p.sellPrice,
    0,
  );
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">🗃 حركة المخزون</div><div class="page-subtitle">تقييم شامل لجميع المخازن</div></div>
    </div>
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);max-width:700px">
      <div class="stat-card"><div class="stat-icon blue">📦</div><div><div class="stat-value">${products.length}</div><div class="stat-label">إجمالي الأصناف</div></div></div>
      <div class="stat-card"><div class="stat-icon green">💰</div><div><div class="stat-value">${fmt(totalVal)}</div><div class="stat-label">قيمة التكلفة (ج.م)</div></div></div>
      <div class="stat-card"><div class="stat-icon amber">💹</div><div><div class="stat-value">${fmt(totalSellVal)}</div><div class="stat-label">القيمة البيعية (ج.م)</div></div></div>
    </div>
    ${lowStock.length > 0 ? `<div class="alert warning">⚠ يوجد <strong>${lowStock.length}</strong> صنف بمخزون منخفض</div>` : ""}
    <div class="card">
      <div class="card-header"><span class="card-title">📋 تفاصيل المخزون الكامل</span></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>الكود</th><th>المنتج</th><th>التصنيف</th>
              ${whs.map((w) => `<th style="text-align:center">${w.icon} ${esc(w.name)}</th>`).join("")}
              <th>الإجمالي</th><th>الحد الأدنى</th><th>هامش الربح</th><th>قيمة المخزون</th><th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map((p) => {
                const total = totalStock(p.id);
                const margin =
                  p.buyPrice > 0
                    ? Math.round(
                        ((p.sellPrice - p.buyPrice) / p.buyPrice) * 100,
                      )
                    : 0;
                const lvl =
                  total <= p.minStock
                    ? "low"
                    : total <= p.minStock * 2
                      ? "medium"
                      : "high";
                return `<tr>
                <td><code style="font-size:11px;background:#f3f4f6;padding:2px 5px;border-radius:3px">${esc(p.sku)}</code></td>
                <td><strong>${esc(p.name)}</strong><br><small style="color:var(--text-muted)">${p.unit}</small></td>
                <td style="font-size:12px">${esc(catMap[p.catId] || "-")}</td>
                ${whs.map((w) => `<td style="text-align:center"><span class="badge ${whStock(p.id, w.id) === 0 ? "danger" : "gray"}">${whStock(p.id, w.id)}</span></td>`).join("")}
                <td><strong>${total}</strong></td>
                <td style="color:var(--text-muted)">${p.minStock}</td>
                <td><span class="badge ${margin > 30 ? "success" : margin > 15 ? "info" : "warning"}">${margin}%</span></td>
                <td class="td-num">${fmt(total * p.buyPrice)}</td>
                <td><div class="stock-level"><div class="stock-bar" style="min-width:70px"><div class="stock-bar-fill ${lvl}" style="width:${Math.min((total / Math.max(p.minStock * 3, 1)) * 100, 100)}%"></div></div></div></td>
              </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ── PURCHASES ─────────────────────────────────────── */
function renderPurchases() {
  const products = DB.get("products"),
    suppliers = DB.get("suppliers"),
    whs = DB.get("warehouses");
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">🚚 المشتريات</div><div class="page-subtitle">إضافة دفعة شراء وتحديث المخزون</div></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">إضافة دفعة شراء جديدة</span></div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">المورد</label>
            <select class="form-control" id="pur-supplier">${suppliers.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select>
          </div>
          <div class="form-group"><label class="form-label">تاريخ الاستلام</label>
            <input class="form-control" id="pur-date" type="date" value="${today()}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">المنتج</label>
            <select class="form-control" id="pur-product" onchange="fillPurPrice()">${products.map((p) => `<option value="${p.id}">${esc(p.name)} (${p.sku})</option>`).join("")}</select>
          </div>
          <div class="form-group"><label class="form-label">المخزن المستلم</label>
            <select class="form-control" id="pur-warehouse">${whs.map((w) => `<option value="${w.id}">${w.icon} ${esc(w.name)}</option>`).join("")}</select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">الكمية المستلمة</label><input class="form-control" id="pur-qty" type="number" min="1" value="10"></div>
          <div class="form-group"><label class="form-label">سعر الشراء للوحدة (ج.م)</label><input class="form-control" id="pur-price" type="number" min="0"></div>
        </div>
        <div class="form-group"><label class="form-label">ملاحظات</label><input class="form-control" id="pur-note" placeholder="رقم أمر الشراء، فاتورة المورد..."></div>
        <button class="btn btn-primary" onclick="savePurchase()">💾 حفظ وإضافة للمخزون</button>
      </div>
    </div>`;
  fillPurPrice();
}

function fillPurPrice() {
  const pid = parseInt(document.getElementById("pur-product")?.value);
  if (pid) {
    const p = DB.get("products").find((x) => x.id === pid);
    if (p) document.getElementById("pur-price").value = p.buyPrice;
  }
}

function savePurchase() {
  const pid = parseInt(document.getElementById("pur-product")?.value);
  const whId = parseInt(document.getElementById("pur-warehouse")?.value);
  const qty = parseInt(document.getElementById("pur-qty")?.value) || 0;
  const price = parseFloat(document.getElementById("pur-price")?.value) || 0;
  if (!pid || qty <= 0) return showToast("بيانات غير صحيحة", "danger");
  const products = DB.get("products");
  const idx = products.findIndex((p) => p.id === pid);
  if (idx !== -1 && price > 0) {
    products[idx].buyPrice = price;
    DB.set("products", products);
  }
  setWhStock(pid, whId, whStock(pid, whId) + qty);
  const prod = products.find((p) => p.id === pid);
  showToast(
    `✓ تم إضافة ${qty} ${prod?.unit || "وحدة"} من "${prod?.name}" إلى المخزن`,
  );
  refreshPage();
}

/* ── REPORTS ────────────────────────────────────────── */
function renderReports() {
  const sales = DB.get("sales"),
    products = DB.get("products"),
    returns = DB.get("returns"),
    customers = DB.get("customers");
  const totalRev = sales.reduce((a, s) => a + s.total, 0);
  const totalCost = sales.reduce(
    (a, s) =>
      a +
      s.items.reduce((b, i) => {
        const p = products.find((x) => x.id === i.productId);
        return b + (p?.buyPrice || 0) * i.qty;
      }, 0),
    0,
  );
  const totalReturns = returns.reduce((a, r) => a + r.total, 0);
  const netProfit = totalRev - totalCost - totalReturns;
  const custMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  const productSales = {};
  sales.forEach((s) =>
    s.items.forEach((i) => {
      if (!productSales[i.productId])
        productSales[i.productId] = { qty: 0, rev: 0 };
      productSales[i.productId].qty += i.qty;
      productSales[i.productId].rev += i.qty * i.price;
    }),
  );
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].rev - a[1].rev)
    .slice(0, 5)
    .map(([id, v]) => ({
      ...v,
      name: products.find((p) => p.id == id)?.name || `#${id}`,
    }));
  const topCustomers = customers
    .slice()
    .sort((a, b) => b.totalPurchases - a.totalPurchases)
    .slice(0, 5);
  document.getElementById("mainContent").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">📊 التقارير والتحليل</div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue">💰</div><div><div class="stat-value">${fmt(totalRev)}</div><div class="stat-label">إجمالي الإيرادات (ج.م)</div></div></div>
      <div class="stat-card"><div class="stat-icon green">📈</div><div><div class="stat-value">${fmt(netProfit)}</div><div class="stat-label">صافي الربح (ج.م)</div></div></div>
      <div class="stat-card"><div class="stat-icon amber">🧾</div><div><div class="stat-value">${sales.length}</div><div class="stat-label">إجمالي الفواتير</div></div></div>
      <div class="stat-card"><div class="stat-icon red">↩</div><div><div class="stat-value">${fmt(totalReturns)}</div><div class="stat-label">إجمالي المرتجعات (ج.م)</div></div></div>
    </div>
    <div class="charts-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">🏆 أكثر المنتجات مبيعاً</span></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>الإيراد</th></tr></thead>
            <tbody>
              ${
                topProducts
                  .map(
                    (p, i) => `<tr>
                <td style="color:var(--text-muted);font-weight:700">${i + 1}</td>
                <td><strong>${esc(p.name)}</strong></td>
                <td style="text-align:center"><span class="badge info">${p.qty}</span></td>
                <td class="td-num">${EGP(p.rev)}</td>
              </tr>`,
                  )
                  .join() ||
                '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted)">لا توجد بيانات</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">⭐ أفضل العملاء</span></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>العميل</th><th>إجمالي المشتريات</th></tr></thead>
            <tbody>
              ${topCustomers
                .map(
                  (c) => `<tr>
                <td><strong>${esc(c.name)}</strong></td>
                <td class="td-num">${EGP(c.totalPurchases)}</td>
              </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

/* ── INIT ───────────────────────────────────────────── */
seedData();
renderShell();
