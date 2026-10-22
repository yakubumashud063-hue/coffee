/* ============================================================
   Ember & Origin — jsdom smoke tests
   Run: npm test   (requires devDependency jsdom)
   ============================================================ */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dataJs = fs.readFileSync(path.join(root, "js/data.js"), "utf8");
const appJs = fs.readFileSync(path.join(root, "js/app.js"), "utf8");

let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.error("  ✗ " + name); }
}

function makeDom({ url = "https://local.test/", storage = "{}", seedCart = null } = {}) {
    if (seedCart !== null) {
      const obj = JSON.parse(storage);
      obj.eo_cart_v2 = JSON.stringify(seedCart);
      storage = JSON.stringify(obj);
    }
  const vc = new VirtualConsole();
  vc.on("jsdomError", () => {});
  const dom = new JSDOM(html, {
    url,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  const w = dom.window;
  // localStorage shim (jsdom's own Storage is non-writable in newer versions)
  const store = new Map(Object.entries(JSON.parse(storage)));
  Object.defineProperty(w, "localStorage", {
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    configurable: true,
  });
  w.__store = store;
  w.eval(dataJs);
  w.eval(appJs);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));
  return { dom, w, d: w.document };
}

const click = (w, el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

(async function main() {
  console.log("Catalog & rendering");
  {
    const { d } = makeDom();
    ok("6 product cards rendered", d.querySelectorAll(".product-card").length === 6);
    ok("5 category chips (All + 4)", d.querySelectorAll("#categoryChips .chip").length === 5);
    ok("result count present", /Showing all 6 products/.test(d.querySelector("#resultCount").textContent));
    ok("ratings shown on cards", d.querySelectorAll(".card-rating .stars").length === 6);
    ok("low-stock note for kettle (stock 9)", !!d.querySelector('[data-id="gooseneck-kettle"] .stock-note.low'));
  }

  console.log("Search & filters");
  {
    const { w, d } = makeDom();
    d.querySelector("#searchInput").value = "blueberry";
    d.querySelector("#searchInput").dispatchEvent(new w.Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250)); // debounce 150ms
    ok("search 'blueberry' → 1 card", d.querySelectorAll(".product-card").length === 1);
    ok("URL reflects query", w.location.search.includes("q=blueberry"));

    d.querySelector('#categoryChips [data-category="Brewing Gear"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("gear filter → empty state visible", !d.querySelector("#emptyState").hidden);

    d.querySelector("#resetFilters").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("reset restores 6 cards", d.querySelectorAll(".product-card").length === 6);
  }

  console.log("Cart controls & persistence");
  {
    const { w, d } = makeDom();
    click(w, d.querySelector('[data-add="eth-guji"]'));
    click(w, d.querySelector('[data-incart-inc="col-huila"]'));
    click(w, d.querySelector('[data-incart-inc="col-huila"]'));
    ok("badge counts 3 items", d.querySelector("#cartCount").textContent === "3");
    const saved = JSON.parse(w.__store.get("eo_cart_v2") || "{}");
    ok("persisted eth=1 col=2", saved["eth-guji"] === 1 && saved["col-huila"] === 2);

    d.querySelector("#cartToggle").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("drawer opens", !d.querySelector("#cartDrawer").hidden);
    ok("two cart line items", d.querySelectorAll(".cart-item").length === 2);
    ok("free shipping tag (subtotal $60 > $45)", /Free/.test(d.querySelector("#totalsLines").textContent));

    click(w, d.querySelector('[data-cart-dec="col-huila"]'));
    ok("qty decrement reflected", d.querySelector("#cartCount").textContent === "2");
    click(w, d.querySelector('[data-cart-remove="eth-guji"]'));
    ok("remove works", d.querySelectorAll(".cart-item").length === 1);
  }

  console.log("Detail modal & deep links");
  {
    const { w, d } = makeDom({ url: "https://local.test/#ember-house-blend" });
    ok("hash deep link opens detail", !d.querySelector("#detailOverlay").hidden);
    ok("correct product title", d.querySelector("#detailTitle").textContent === "Ember House Blend");
    ok("specs table populated", d.querySelectorAll("#detailSpecs dt").length >= 6);
    ok("note chips rendered", d.querySelectorAll("#detailNotes .note-chip").length === 3);
    click(w, d.querySelector("[data-detail-inc]"));
    ok("detail qty increments", d.querySelector("#detailQty").textContent === "2");
    click(w, d.querySelector("#detailAddBtn"));
    ok("add from detail sets cart qty 2", d.querySelector('[data-cart-qty="ember-blend"]').textContent === "2");
    d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    ok("Escape closes detail", d.querySelector("#detailOverlay").hidden);
  }

  console.log("Checkout validation & success");
  {
    const { w, d } = makeDom();
    click(w, d.querySelector('[data-add="midnight-decaf"]')); // $18.50 < $45 → shipping hint
    d.querySelector("#cartToggle").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("shipping hint appears under threshold", /Add .* more for free shipping/.test(d.querySelector("#totalsLines").textContent));
    d.querySelector("#checkoutBtn").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    ok("checkout overlay opens", !d.querySelector("#checkoutOverlay").hidden);

    // Submit empty → errors
    d.querySelector("#checkoutForm").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    ok("invalid submit shows field errors", d.querySelectorAll(".field.invalid").length >= 6);

    // Fill with bad card number (fails Luhn)
    const setVal = (id, v) => { const el = d.querySelector("#" + id); el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); };
    setVal("ckName", "Ada Lovelace");
    setVal("ckEmail", "ada@example.com");
    setVal("ckAddress", "128 Roastery Lane");
    setVal("ckCity", "Portland");
    setVal("ckZip", "97205");
    setVal("ckCard", "1234 5678 9012 3456");
    setVal("ckExp", "12/30");
    setVal("ckCvc", "123");
    d.querySelector("#checkoutForm").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    ok("Luhn rejects bad card", d.querySelector('[data-error-for="ckCard"]').textContent.length > 0);

    setVal("ckCard", "4242 4242 4242 4242");
    d.querySelector("#checkoutForm").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    ok("processing step shown", !d.querySelector("#checkoutStepProcessing").hidden);
    await new Promise((r) => setTimeout(r, 1900));
    ok("success step shown", !d.querySelector("#checkoutStepSuccess").hidden);
    ok("order number generated", /^EO-[A-Z0-9]+-\d+$/.test(d.querySelector("#orderNumber").textContent));
    ok("cart cleared after order", d.querySelector("#cartItems").children.length === 0 && d.querySelector("#cartCount").hidden);
    const orders = JSON.parse(w.__store.get("eo_orders_v1") || "[]");
    ok("order persisted to history", orders.length === 1 && orders[0].items[0].id === "midnight-decaf");
  }

  console.log("Cart restored from storage");
  {
    const { w, d } = makeDom({ seedCart: { "ceramic-dripper": 2, "bogus-id": 5 } });
    ok("restores valid item, drops bogus id", d.querySelector("#cartCount").textContent === "2" && d.querySelectorAll(".cart-item").length === 1);
    // Cross-tab sync (storage event) — production nicety for multi-tab carts
    click(w, d.querySelector('[data-add="eth-guji"]'));
    const other = makeDom();
    other.w.__store.set("eo_cart_v2", '{"col-huila":3}');
    other.w.dispatchEvent(new other.w.StorageEvent("storage", { key: "eo_cart_v2", newValue: '{"col-huila":3}' }));
    ok("other tab adopts external cart change", other.d.querySelector("#cartCount").textContent === "3");
    other.w.__store.delete("eo_cart_v2");
    other.w.dispatchEvent(new other.w.StorageEvent("storage", { key: "eo_cart_v2", newValue: null }));
    ok("cleared storage empties other tab", other.d.querySelector("#cartItems").children.length === 0);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
