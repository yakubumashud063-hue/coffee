/* ============================================================
   Ember & Origin — app.js
   Catalog, rendering, search/filter, cart, detail view, checkout sim
   ============================================================ */
(function () {
  "use strict";

  /* ----------------------- Catalog data ----------------------- */
  const PRODUCTS = [
    {
      id: "eth-guji",
      name: "Ethiopia Guji Natural",
      category: "Single Origin",
      price: 21.5,
      compareAt: null,
      weight: "250 g whole bean",
      roastLevel: 2, // 1..5
      roastName: "Light",
      origin: "Guji Zone, Ethiopia",
      farm: "Shakiso Washing Station lot 4",
      altitude: "1,950–2,100 m",
      process: "Natural (dry)",
      varietal: "Heirloom (74110, 74112)",
      cupScore: 88.5,
      notes: "Blueberry, jasmine, honeyed stone fruit",
      badge: "Staff pick",
      story: "Picked from smallholder plots around Shakiso and dried slowly on raised beds, this natural is a jammy, floral showstopper. We roast it light to keep the blueberry loud and the finish clean like tea.",
      art: { kind: "bag", hue: ["#b3552e", "#7a3a20"], accent: "#f2d3ae" }
    },
    {
      id: "col-huila",
      name: "Colombia Huila Lavado",
      category: "Single Origin",
      price: 19.0,
      compareAt: null,
      weight: "250 g whole bean",
      roastLevel: 3,
      roastName: "Medium",
      origin: "Huila, Colombia",
      farm: "Finca La Esperanza",
      altitude: "1,700 m",
      process: "Washed (lavado)",
      varietal: "Caturra, Castillo",
      cupScore: 87.25,
      notes: "Red apple, panela, cocoa nib",
      badge: null,
      story: "From a third-generation farming family near Pitalito. A textbook washed Colombian — balanced, sweet, and endlessly drinkable. Our house favorite for filter in the morning and espresso after lunch.",
      art: { kind: "bag", hue: ["#c07a3c", "#8a5226"], accent: "#f7e6c8" }
    },
    {
      id: "ember-blend",
      name: "Ember House Blend",
      category: "Blends",
      price: 17.0,
      compareAt: null,
      weight: "340 g whole bean",
      roastLevel: 4,
      roastName: "Medium-Dark",
      origin: "Brazil + Colombia",
      farm: "Partners in Cerrado & Huila",
      altitude: "1,100–1,700 m",
      process: "Washed + pulped natural",
      varietal: "Mundo Novo, Caturra",
      cupScore: 85.5,
      notes: "Milk chocolate, toasted almond, caramel",
      badge: "Best seller",
      story: "The blend that named us. Built for milk drinks but lovely black, it pulls a syrupy espresso with cocoa depth and a nutty, praline-like finish. Roasted in batches of just 12 kg.",
      art: { kind: "bag", hue: ["#5c3a22", "#33200f"], accent: "#e2b87d" }
    },
    {
      id: "midnight-decaf",
      name: "Midnight Decaf — Swiss Water",
      category: "Decaf",
      price: 18.5,
      compareAt: 21.0,
      weight: "250 g whole bean",
      roastLevel: 4,
      roastName: "Medium-Dark",
      origin: "Nariño, Colombia",
      farm: "Regional smallholder pool",
      altitude: "1,800 m",
      process: "Swiss Water decaffeination",
      varietal: "Variedad Colombia",
      cupScore: 84.75,
      notes: "Dark cherry, brown sugar, walnut",
      badge: "Sale",
      story: "Chemical-free Swiss Water process keeps all the fruit and none of the jitter. Proof that a good decaf deserves the same care as any micro-lot — because evenings are for coffee too.",
      art: { kind: "bag", hue: ["#3d3550", "#241f31"], accent: "#a99cc7" }
    },
    {
      id: "gooseneck-kettle",
      name: "Cuora Gooseneck Kettle 0.9 L",
      category: "Brewing Gear",
      price: 68.0,
      compareAt: null,
      weight: "0.9 L · matte copper",
      roastLevel: null,
      origin: "Designed in Portland",
      process: "—",
      cupScore: null,
      notes: "Precision pour, happy brew",
      badge: null,
      story: "A counterweighted gooseneck that makes slow, even pours almost automatic. The built-in thermometer and flat-bottom design work on induction and gas alike. The last kettle you'll buy for a while.",
      art: { kind: "kettle", hue: ["#b07d4f", "#7c5331"], accent: "#f0dcc0" }
    },
    {
      id: "ceramic-dripper",
      name: "Hearth Ceramic Dripper Set",
      category: "Brewing Gear",
      price: 42.0,
      compareAt: 49.0,
      weight: "Dripper + 2 cups",
      roastLevel: null,
      origin: "Thrown in Oregon",
      process: "—",
      cupScore: null,
      notes: "Glazed stoneware, cone 6",
      badge: "Sale",
      story: "Hand-thrown stoneware dripper with two matching 240 ml cups, glazed in warm oatmeal with a raw clay foot. Holds heat beautifully and looks like it belongs on your shelf, not in a cupboard.",
      art: { kind: "dripper", hue: ["#7c8a63", "#57633f"], accent: "#e9efdd" }
    }
  ];

  const CATEGORIES = ["All", ...Array.from(new Set(PRODUCTS.map(p => p.category)))];

  /* ----------------------- State ----------------------- */
  const state = {
    query: "",
    category: "All",
    sort: "featured",
    cart: loadCart(),          // { [productId]: qty }
    detailId: null,
    detailQty: 1
  };

  const CART_KEY = "eo_cart_v1";
  const MAX_QTY = 12;
  const FREE_SHIP_THRESHOLD = 45;
  const SHIP_FEE = 5.5;
  const TAX_RATE = 0.08;

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const clean = {};
      Object.keys(parsed).forEach(k => {
        if (PRODUCTS.some(p => p.id === k)) {
          clean[k] = Math.min(MAX_QTY, Math.max(1, parseInt(parsed[k], 10) || 1));
        }
      });
      return clean;
    } catch (e) { return {}; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) { /* private mode */ }
  }

  /* ----------------------- Helpers ----------------------- */
  const $ = sel => document.querySelector(sel);
  const money = n => "$" + n.toFixed(2);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function productById(id) { return PRODUCTS.find(p => p.id === id); }

  function cartCount() {
    return Object.values(state.cart).reduce((a, b) => a + b, 0);
  }
  function cartSubtotal() {
    return Object.entries(state.cart).reduce((sum, [id, qty]) => sum + productById(id).price * qty, 0);
  }
  function shippingFor(sub) {
    return sub === 0 ? 0 : (sub >= FREE_SHIP_THRESHOLD ? 0 : SHIP_FEE);
  }
  function totals() {
    const subtotal = cartSubtotal();
    const shipping = shippingFor(subtotal);
    const tax = subtotal * TAX_RATE;
    return { subtotal, shipping, tax, grand: subtotal + shipping + tax };
  }

  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* ----------------------- Product artwork (inline SVG) ----------------------- */
  function bagArt(p, uid) {
    const [c1, c2] = p.art.hue;
    const label = p.name.split(" ").slice(0, 2).join(" ");
    return `<svg viewBox="0 0 320 240" role="img" aria-label="${esc(p.name)}">
      <defs>
        <linearGradient id="bg${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f6ecdb"/><stop offset="100%" stop-color="#ecdcc3"/>
        </linearGradient>
        <linearGradient id="bag${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg${uid})"/>
      <circle cx="262" cy="46" r="60" fill="${p.art.accent}" opacity=".35"/>
      <ellipse cx="160" cy="206" rx="86" ry="12" fill="rgba(46,31,22,.16)"/>
      <g transform="translate(160 118)">
        <path d="M-58 -70 h116 l8 128 a14 14 0 0 1 -14 14 h-104 a14 14 0 0 1 -14 -14 z" fill="url(#bag${uid})"/>
        <path d="M-58 -70 h116 l4 22 h-124 z" fill="rgba(0,0,0,.22)"/>
        <rect x="-62" y="-84" width="124" height="18" rx="6" fill="rgba(0,0,0,.35)"/>
        <rect x="-40" y="-34" width="80" height="66" rx="8" fill="#fff8ee" opacity=".92"/>
        <text x="0" y="-14" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="bold" fill="${c2}">${esc(label)}</text>
        <line x1="-28" y1="-6" x2="28" y2="-6" stroke="${c1}" stroke-width="1.4" opacity=".6"/>
        <text x="0" y="10" text-anchor="middle" font-family="sans-serif" font-size="8.5" letter-spacing="2" fill="#6f5138">WHOLE BEAN</text>
        <text x="0" y="23" text-anchor="middle" font-family="sans-serif" font-size="7.5" fill="#a08b76">${esc(p.roastName || "")}</text>
        <circle cx="34" cy="-52" r="7" fill="none" stroke="#fff8ee" stroke-width="2" opacity=".8"/>
      </g>
      ${beanCluster(38, 196, uid)}${beanCluster(276, 186, uid)}
    </svg>`;
  }

  function kettleArt(p, uid) {
    const [c1, c2] = p.art.hue;
    return `<svg viewBox="0 0 320 240" role="img" aria-label="${esc(p.name)}">
      <defs>
        <linearGradient id="bg${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f3e9d7"/><stop offset="100%" stop-color="#e8d5b8"/>
        </linearGradient>
        <linearGradient id="kt${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg${uid})"/>
      <circle cx="60" cy="190" r="70" fill="${p.art.accent}" opacity=".3"/>
      <ellipse cx="165" cy="204" rx="92" ry="11" fill="rgba(46,31,22,.16)"/>
      <g transform="translate(165 120)">
        <path d="M-62 60 v-58 a62 46 0 0 1 124 0 v58 a10 10 0 0 1 -10 10 h-104 a10 10 0 0 1 -10 -10 z" fill="url(#kt${uid})"/>
        <path d="M-58 -34 q-16 -6 -22 -22 q-2 -8 6 -8 q10 0 16 8 q8 10 14 14 z" fill="none" stroke="${c2}" stroke-width="12" stroke-linecap="round"/>
        <path d="M-60 -30 C -95 -50 -120 -78 -128 -108" fill="none" stroke="${c2}" stroke-width="11" stroke-linecap="round"/>
        <path d="M-133 -114 l12 -4 l3 13 z" fill="${c2}"/>
        <path d="M62 -18 q26 4 26 26 q0 22 -26 26" fill="none" stroke="${c2}" stroke-width="10" stroke-linecap="round"/>
        <rect x="-16" y="-66" width="32" height="10" rx="5" fill="#2e1f16"/>
        <ellipse cx="0" cy="-58" rx="46" ry="10" fill="rgba(255,255,255,.22)"/>
        <rect x="-30" y="18" width="60" height="26" rx="6" fill="rgba(255,248,238,.85)"/>
        <text x="0" y="35" text-anchor="middle" font-family="sans-serif" font-size="10" letter-spacing="2" fill="${c2}">CUORA</text>
      </g>
    </svg>`;
  }

  function dripperArt(p, uid) {
    const [c1, c2] = p.art.hue;
    return `<svg viewBox="0 0 320 240" role="img" aria-label="${esc(p.name)}">
      <defs>
        <linearGradient id="bg${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f5efdf"/><stop offset="100%" stop-color="#eadfc6"/>
        </linearGradient>
        <linearGradient id="dr${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg${uid})"/>
      <circle cx="255" cy="60" r="52" fill="${p.art.accent}" opacity=".4"/>
      <ellipse cx="160" cy="210" rx="88" ry="11" fill="rgba(46,31,22,.15)"/>
      <g transform="translate(160 112)">
        <path d="M-66 -44 h132 l-40 66 h-52 z" fill="url(#dr${uid})"/>
        <ellipse cx="0" cy="-44" rx="66" ry="13" fill="${c1}"/>
        <ellipse cx="0" cy="-44" rx="52" ry="9" fill="#3a2a1b"/>
        <path d="M-30 22 h60 v10 a30 22 0 0 1 -60 0 z" fill="#efe4d0" stroke="#cdb794" stroke-width="2"/>
        <path d="M30 34 q22 2 22 16 q0 14 -22 14" fill="none" stroke="#cdb794" stroke-width="6" stroke-linecap="round"/>
        <path d="M-66 -44 h132" stroke="rgba(255,255,255,.5)" stroke-width="3"/>
        <path d="M-14 -28 l6 14 M2 -30 l4 16 M16 -26 l2 12" stroke="#caa06a" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      </g>
      ${beanCluster(52, 190, uid)}
    </svg>`;
  }

  function beanCluster(x, y, uid) {
    return `<g transform="translate(${x} ${y})" opacity=".85">
      <g transform="rotate(-18)"><ellipse rx="13" ry="8.5" fill="#4b3524"/><path d="M-10 0 q10 -7 20 0" stroke="#f3ead9" stroke-width="1.6" fill="none"/></g>
      <g transform="translate(24 8) rotate(24)"><ellipse rx="11" ry="7.5" fill="#5c3a22"/><path d="M-8 0 q8 -6 16 0" stroke="#f3ead9" stroke-width="1.4" fill="none"/></g>
    </g>`;
  }

  function productArt(p, uid) {
    switch (p.art.kind) {
      case "kettle": return kettleArt(p, uid);
      case "dripper": return dripperArt(p, uid);
      default: return bagArt(p, uid);
    }
  }

  function roastMeter(level) {
    let dots = "";
    for (let i = 1; i <= 5; i++) dots += `<span class="roast-dot${i <= level ? " on" : ""}"></span>`;
    return `<div class="roast-meter" title="${esc(p_roastLabel(level))}">${dots}<span style="margin-left:8px;font-size:.82rem;color:var(--mocha)">${esc(p_roastLabel(level))}</span></div>`;
  }
  function p_roastLabel(l) {
    return ["", "Light", "Light-Medium", "Medium", "Medium-Dark", "Dark"][l] || "";
  }

  /* ----------------------- Filtering & sorting ----------------------- */
  function visibleProducts() {
    const q = state.query.trim().toLowerCase();
    let list = PRODUCTS.filter(p => {
      if (state.category !== "All" && p.category !== state.category) return false;
      if (!q) return true;
      const hay = [p.name, p.category, p.notes, p.origin, p.process, p.varietal, p.roastName, p.story]
        .filter(Boolean).join(" ").toLowerCase();
      return q.split(/\s+/).every(word => hay.includes(word));
    });
    switch (state.sort) {
      case "price-asc": list = list.slice().sort((a, b) => a.price - b.price); break;
      case "price-desc": list = list.slice().sort((a, b) => b.price - a.price); break;
      case "name": list = list.slice().sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }

  /* ----------------------- Rendering ----------------------- */
  function renderChips() {
    const wrap = $("#categoryChips");
    wrap.innerHTML = CATEGORIES.map(c =>
      `<button type="button" class="chip${c === state.category ? " active" : ""}" data-category="${esc(c)}" aria-pressed="${c === state.category}">${esc(c)}</button>`
    ).join("");
  }

  function cardHTML(p, idx) {
    const inCart = state.cart[p.id] || 0;
    const badge = p.badge
      ? `<span class="badge${p.badge.toLowerCase() === "sale" ? " sale" : ""}">${esc(p.badge)}</span>` : "";
    const priceHTML = p.compareAt
      ? `<span class="price"><span class="compare">${money(p.compareAt)}</span>${money(p.price)}</span>`
      : `<span class="price">${money(p.price)}</span>`;
    return `
    <article class="product-card" style="animation-delay:${idx * 45}ms" data-id="${p.id}">
      <div class="card-media" data-action="open-detail" data-id="${p.id}" role="button" tabindex="0" aria-label="View details for ${esc(p.name)}">
        ${badge}${productArt(p, "c" + p.id.replace(/[^a-z]/g, ""))}
      </div>
      <div class="card-body">
        <p class="card-category">${esc(p.category)}</p>
        <h3 class="card-title" data-action="open-detail" data-id="${p.id}" tabindex="0">${esc(p.name)}</h3>
        <p class="card-notes">${esc(p.notes)}</p>
        ${p.roastLevel ? roastMeter(p.roastLevel) : ""}
        <div class="card-foot">
          ${priceHTML}
          <div class="card-qty" role="group" aria-label="Quantity for ${esc(p.name)}">
            <button type="button" class="qty-btn" data-incart-dec="${p.id}" aria-label="Decrease quantity" ${inCart === 0 ? "disabled" : ""}>−</button>
            <span class="qty-val" data-cart-qty="${p.id}">${inCart}</span>
            <button type="button" class="qty-btn" data-incart-inc="${p.id}" aria-label="Increase quantity" ${inCart >= MAX_QTY ? "disabled" : ""}>+</button>
          </div>
          <button type="button" class="add-btn" data-add="${p.id}">${inCart > 0 ? "Added ✓" : "Add to cart"}</button>
        </div>
      </div>
    </article>`;
  }

  function renderGrid() {
    const list = visibleProducts();
    const grid = $("#productGrid");
    grid.innerHTML = list.map(cardHTML).join("");
    $("#emptyState").hidden = list.length > 0;
    const rc = $("#resultCount");
    const parts = [];
    if (state.query.trim()) parts.push(`matching “${state.query.trim()}”`);
    if (state.category !== "All") parts.push(`in ${state.category}`);
    rc.textContent = list.length === PRODUCTS.length && parts.length === 0
      ? `Showing all ${PRODUCTS.length} products`
      : `Showing ${list.length} product${list.length === 1 ? "" : "s"}${parts.length ? " " + parts.join(" ") : ""}`;
  }

  /* Refresh only the per-card cart widgets (avoids full re-render flicker) */
  function refreshCardWidgets() {
    PRODUCTS.forEach(p => {
      const qty = state.cart[p.id] || 0;
      const val = document.querySelector(`[data-cart-qty="${p.id}"]`);
      if (val) val.textContent = qty;
      const dec = document.querySelector(`[data-incart-dec="${p.id}"]`);
      const inc = document.querySelector(`[data-incart-inc="${p.id}"]`);
      if (dec) dec.disabled = qty === 0;
      if (inc) inc.disabled = qty >= MAX_QTY;
      const add = document.querySelector(`[data-add="${p.id}"]`);
      if (add) add.textContent = qty > 0 ? "Added ✓" : "Add to cart";
    });
  }

  function renderCartBadge() {
    const badge = $("#cartCount");
    const n = cartCount();
    badge.hidden = n === 0;
    badge.textContent = n;
    badge.classList.remove("bump");
    void badge.offsetWidth; // restart animation
    if (n > 0) badge.classList.add("bump");
  }

  function cartItemHTML(id, qty) {
    const p = productById(id);
    const uid = "t" + id.replace(/[^a-z]/g, "");
    return `
    <li class="cart-item" data-id="${id}">
      <div class="cart-thumb">${productArt(p, uid)}</div>
      <div>
        <p class="ci-name">${esc(p.name)}</p>
        <p class="ci-meta">${esc(p.weight)} · ${money(p.price)} each</p>
        <div class="ci-controls">
          <div class="mini-stepper" role="group" aria-label="Quantity for ${esc(p.name)}">
            <button type="button" class="qty-btn" data-cart-dec="${id}" aria-label="Decrease quantity">−</button>
            <span>${qty}</span>
            <button type="button" class="qty-btn" data-cart-inc="${id}" aria-label="Increase quantity" ${qty >= MAX_QTY ? "disabled" : ""}>+</button>
          </div>
          <p class="ci-line">${money(p.price * qty)}</p>
        </div>
      </div>
      <div class="ci-remove-col">
        <button type="button" class="remove-btn" data-cart-remove="${id}">Remove</button>
      </div>
    </li>`;
  }

  function renderCart() {
    const entries = Object.entries(state.cart);
    const itemsEl = $("#cartItems");
    const emptyEl = $("#cartEmpty");
    const footEl = $("#drawerFoot");
    itemsEl.innerHTML = entries.map(([id, qty]) => cartItemHTML(id, qty)).join("");
    emptyEl.hidden = entries.length > 0;
    footEl.hidden = entries.length === 0;

    const t = totals();
    const shipLine = t.shipping === 0 && t.subtotal > 0
      ? `<span class="free-tag">Free 🎉</span>` : money(t.shipping);
    $("#totalsLines").innerHTML = `
      <div class="total-line"><span>Subtotal (${cartCount()} item${cartCount() === 1 ? "" : "s"})</span><span>${money(t.subtotal)}</span></div>
      <div class="total-line"><span>Shipping</span><span>${shipLine}</span></div>
      <div class="total-line"><span>Estimated tax (8%)</span><span>${money(t.tax)}</span></div>
      <div class="total-line grand"><span>Total</span><span>${money(t.grand)}</span></div>
      ${t.subtotal > 0 && t.subtotal < FREE_SHIP_THRESHOLD
        ? `<div class="total-line"><span style="font-size:.8rem;color:var(--mocha)">Add ${money(FREE_SHIP_THRESHOLD - t.subtotal)} more for free shipping</span></div>` : ""}`;
    renderCartBadge();
    refreshCardWidgets();
  }

  /* ----------------------- Cart operations ----------------------- */
  function setQty(id, qty) {
    qty = Math.max(0, Math.min(MAX_QTY, qty));
    if (qty === 0) delete state.cart[id];
    else state.cart[id] = qty;
    saveCart();
    renderCart();
  }
  function addToCart(id, delta) {
    const cur = state.cart[id] || 0;
    const next = Math.min(MAX_QTY, cur + (delta == null ? 1 : delta));
    if (cur === MAX_QTY) { toast(`Max ${MAX_QTY} bags per order — you’re well stocked!`); return; }
    setQty(id, next);
    const p = productById(id);
    if (next > cur) toast(`${p.name} added — ${next} in cart`);
  }

  /* ----------------------- Detail modal ----------------------- */
  function openDetail(id) {
    const p = productById(id);
    if (!p) return;
    state.detailId = id;
    state.detailQty = state.cart[id] || 1;

    $("#detailMedia").innerHTML = productArt(p, "d" + id.replace(/[^a-z]/g, ""));
    $("#detailCategory").textContent = p.category + (p.badge ? " · " + p.badge : "");
    $("#detailTitle").textContent = p.name;
    $("#detailPrice").innerHTML = p.compareAt
      ? `<span class="compare">${money(p.compareAt)}</span>${money(p.price)}` : money(p.price);
    $("#detailWeightNote").textContent = p.weight;
    $("#detailNotes").textContent = "Tasting notes: " + p.notes + ".";

    const rows = [];
    if (p.origin) rows.push(["Origin", p.origin]);
    if (p.farm) rows.push(["Farm / lot", p.farm]);
    if (p.altitude) rows.push(["Altitude", p.altitude]);
    if (p.process) rows.push(["Process", p.process]);
    if (p.varietal) rows.push(["Varietal", p.varietal]);
    if (p.cupScore) rows.push(["SCA cup score", p.cupScore.toFixed(2)]);
    if (p.roastLevel) rows.push(["Roast", p_roastLabel(p.roastLevel)]);
    $("#detailSpecs").innerHTML = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
    $("#detailStory").textContent = p.story;
    updateDetailQtyUI();

    show($("#detailOverlay"));
    document.body.style.overflow = "hidden";
  }
  function updateDetailQtyUI() {
    $("#detailQty").textContent = state.detailQty;
    const p = productById(state.detailId);
    const inCart = state.cart[p.id] || 0;
    $("#detailAddBtn").textContent = inCart > 0
      ? `Update cart (${inCart})` : "Add to cart";
  }

  /* ----------------------- Overlay plumbing ----------------------- */
  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }

  function closeDetail() { hide($("#detailOverlay")); maybeUnlock(); }
  function closeCart() { hide($("#drawerOverlay")); hide($("#cartDrawer")); maybeUnlock(); }
  function closeCheckout() {
    hide($("#checkoutOverlay"));
    resetCheckoutSteps();
    maybeUnlock();
  }
  function maybeUnlock() {
    const anyOpen = !$("#detailOverlay").hidden || !$("#cartDrawer").hidden || !$("#checkoutOverlay").hidden;
    if (!anyOpen) document.body.style.overflow = "";
  }

  /* ----------------------- Checkout ----------------------- */
  function openCheckout() {
    if (cartCount() === 0) { toast("Your cart is empty — add a bag first."); return; }
    closeCart();
    resetCheckoutSteps();
    const t = totals();
    $("#checkoutSummary").innerHTML = `
      <div class="total-line"><span>${cartCount()} item${cartCount() === 1 ? "" : "s"}</span><span>${money(t.subtotal)}</span></div>
      <div class="total-line"><span>Shipping</span><span>${t.shipping === 0 ? '<span class="free-tag">Free</span>' : money(t.shipping)}</span></div>
      <div class="total-line"><span>Tax</span><span>${money(t.tax)}</span></div>
      <div class="total-line grand"><span>Total due (simulated)</span><span>${money(t.grand)}</span></div>`;
    show($("#checkoutOverlay"));
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#ckName").focus(), 60);
  }

  function resetCheckoutSteps() {
    showStep("form");
    $("#checkoutForm").reset();
    clearErrors();
  }
  function showStep(which) {
    $("#checkoutStepForm").hidden = which !== "form";
    $("#checkoutStepProcessing").hidden = which !== "processing";
    $("#checkoutStepSuccess").hidden = which !== "success";
  }

  function setError(inputId, msg) {
    const input = $("#" + inputId);
    input.closest(".field").classList.toggle("invalid", !!msg);
    const err = document.querySelector(`[data-error-for="${inputId}"]`);
    if (err) err.textContent = msg || "";
  }
  function clearErrors() {
    document.querySelectorAll(".field.invalid").forEach(f => f.classList.remove("invalid"));
    document.querySelectorAll(".field-error").forEach(e => (e.textContent = ""));
  }

  function validateCheckout() {
    clearErrors();
    let ok = true;
    const v = id => $("#" + id).value.trim();
    if (v("ckName").length < 2) { setError("ckName", "Please tell us your name."); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("ckEmail"))) { setError("ckEmail", "That email doesn’t look right."); ok = false; }
    if (v("ckAddress").length < 5) { setError("ckAddress", "Street address required."); ok = false; }
    if (v("ckCity").length < 2) { setError("ckCity", "City required."); ok = false; }
    if (v("ckZip").length < 3) { setError("ckZip", "Postal code required."); ok = false; }
    const digits = v("ckCard").replace(/\s+/g, "");
    if (!/^\d{13,19}$/.test(digits)) { setError("ckCard", "Enter 13–19 digits (try 4242 4242 4242 4242)."); ok = false; }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(v("ckExp"))) { setError("ckExp", "Use MM/YY format."); ok = false; }
    if (!/^\d{3,4}$/.test(v("ckCvc"))) { setError("ckCvc", "3–4 digits."); ok = false; }
    return ok;
  }

  function submitCheckout(e) {
    e.preventDefault();
    if (!validateCheckout()) {
      const firstBad = document.querySelector(".field.invalid input");
      if (firstBad) firstBad.focus();
      return;
    }
    showStep("processing");
    setTimeout(() => {
      const t = totals();
      const name = $("#ckName").value.trim().split(/\s+/)[0];
      const email = $("#ckEmail").value.trim();
      const city = $("#ckCity").value.trim();
      const orderNo = "EO-" + Date.now().toString(36).toUpperCase().slice(-6) +
        "-" + Math.floor(Math.random() * 900 + 100);

      $("#orderNumber").textContent = orderNo;
      $("#successName").textContent = name;
      $("#successCity").textContent = city;
      $("#successEmail").textContent = email;
      $("#successSummary").innerHTML =
        Object.entries(state.cart).map(([id, qty]) => {
          const p = productById(id);
          return `<div class="total-line"><span>${qty} × ${esc(p.name)}</span><span>${money(p.price * qty)}</span></div>`;
        }).join("") +
        `<div class="total-line"><span>Shipping</span><span>${t.shipping === 0 ? "Free" : money(t.shipping)}</span></div>
         <div class="total-line grand"><span>Paid (simulated)</span><span>${money(t.grand)}</span></div>`;

      // Clear the cart now that the "order" went through
      state.cart = {};
      saveCart();
      renderCart();
      showStep("success");
    }, 1600);
  }

  /* ----------------------- Event wiring ----------------------- */
  function init() {
    renderChips();
    renderGrid();
    renderCart();

    // Search toggle & input
    const searchBar = $("#searchBar");
    $("#searchToggle").addEventListener("click", () => {
      searchBar.hidden = !searchBar.hidden;
      $("#searchToggle").setAttribute("aria-expanded", String(!searchBar.hidden));
      if (!searchBar.hidden) $("#searchInput").focus();
    });
    $("#searchInput").addEventListener("input", e => {
      state.query = e.target.value;
      renderGrid();
    });
    $("#searchClear").addEventListener("click", () => {
      $("#searchInput").value = "";
      state.query = "";
      renderGrid();
      $("#searchInput").focus();
    });

    // Category chips
    $("#categoryChips").addEventListener("click", e => {
      const chip = e.target.closest("[data-category]");
      if (!chip) return;
      state.category = chip.dataset.category;
      renderChips();
      renderGrid();
    });

    // Sort
    $("#sortSelect").addEventListener("change", e => {
      state.sort = e.target.value;
      renderGrid();
    });

    // Reset filters
    $("#resetFilters").addEventListener("click", () => {
      state.query = ""; state.category = "All"; state.sort = "featured";
      $("#searchInput").value = ""; $("#sortSelect").value = "featured";
      renderChips(); renderGrid();
    });

    // Grid interactions (delegated)
    $("#productGrid").addEventListener("click", e => {
      const add = e.target.closest("[data-add]");
      if (add) { addToCart(add.dataset.add); return; }
      const inc = e.target.closest("[data-incart-inc]");
      if (inc) { addToCart(inc.dataset.incartInc, 1); return; }
      const dec = e.target.closest("[data-incart-dec]");
      if (dec) {
        const id = dec.dataset.incartDec;
        setQty(id, (state.cart[id] || 0) - 1);
        return;
      }
      const open = e.target.closest('[data-action="open-detail"]');
      if (open) { openDetail(open.dataset.id); return; }
    });
    $("#productGrid").addEventListener("keydown", e => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches('[data-action="open-detail"]')) {
        e.preventDefault();
        openDetail(e.target.dataset.id);
      }
    });

    // Detail modal
    $("#detailOverlay").addEventListener("click", e => {
      if (e.target === $("#detailOverlay") || e.target.closest('[data-close="detail"]')) { closeDetail(); return; }
      if (e.target.closest("[data-detail-inc]")) {
        state.detailQty = Math.min(MAX_QTY, state.detailQty + 1);
        updateDetailQtyUI(); return;
      }
      if (e.target.closest("[data-detail-dec]")) {
        state.detailQty = Math.max(1, state.detailQty - 1);
        updateDetailQtyUI(); return;
      }
      if (e.target.closest("#detailAddBtn")) {
        setQty(state.detailId, state.detailQty);
        const p = productById(state.detailId);
        toast(`${state.detailQty} × ${p.name} in your cart`);
        updateDetailQtyUI();
      }
    });

    // Cart drawer
    $("#cartToggle").addEventListener("click", () => {
      show($("#drawerOverlay")); show($("#cartDrawer"));
      document.body.style.overflow = "hidden";
    });
    $("#drawerOverlay").addEventListener("click", closeCart);
    $("#cartDrawer").addEventListener("click", e => {
      if (e.target.closest('[data-close="cart"]')) { closeCart(); return; }
      const inc = e.target.closest("[data-cart-inc]");
      if (inc) { addToCart(inc.dataset.cartInc, 1); return; }
      const dec = e.target.closest("[data-cart-dec]");
      if (dec) {
        const id = dec.dataset.cartDec;
        setQty(id, (state.cart[id] || 0) - 1);
        return;
      }
      const rm = e.target.closest("[data-cart-remove]");
      if (rm) {
        const p = productById(rm.dataset.cartRemove);
        setQty(rm.dataset.cartRemove, 0);
        toast(`${p.name} removed from cart`);
      }
    });

    // Checkout
    $("#checkoutBtn").addEventListener("click", openCheckout);
    $("#checkoutForm").addEventListener("submit", submitCheckout);
    $("#checkoutOverlay").addEventListener("click", e => {
      if (e.target === $("#checkoutOverlay") || e.target.closest('[data-close="checkout"]')) closeCheckout();
    });
    $("#continueShopping").addEventListener("click", closeCheckout);

    // Card number formatting nicety
    $("#ckCard").addEventListener("input", e => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
      e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
    });
    $("#ckExp").addEventListener("input", e => {
      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
      e.target.value = v;
    });

    // Smooth-scroll helpers & Escape key
    document.addEventListener("click", e => {
      const s = e.target.closest('[data-action="scroll-shop"]');
      if (s) { e.preventDefault(); $("#shop").scrollIntoView({ behavior: "smooth" }); }
      const h = e.target.closest('[data-action="go-home"]');
      if (h) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (!$("#checkoutOverlay").hidden) closeCheckout();
      else if (!$("#detailOverlay").hidden) closeDetail();
      else if (!$("#cartDrawer").hidden) closeCart();
    });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
