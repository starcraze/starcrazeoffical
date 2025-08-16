/* StarCrazeOffical storefront JS (no frameworks) */
const $$ = (sel, ctx=document) => ctx.querySelector(sel);
const $$$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

const CART_KEY = "sc_cart";
const fmt = n => new Intl.NumberFormat(undefined, {style:"currency", currency:"USD"}).format(n);

function setYear(){ $$("#year") && ($$("#year").textContent = new Date().getFullYear()); }

function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY))||[] }catch(e){ return [] }
}
function saveCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); updateCartCount(); }
function updateCartCount(){
  const n = getCart().reduce((s,i)=>s+i.qty,0);
  const el = $$("#cartCount");
  if(el) el.textContent = n;
}

async function loadProducts(){
  const res = await fetch("data/products.json");
  const products = await res.json();
  return products;
}

function renderGrid(products){
  const grid = $$("#productGrid"); if(!grid) return;
  const q = ($$("#searchInput")?.value||"").toLowerCase();
  const filtered = !q ? products : products.filter(p => (p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
  grid.innerHTML = filtered.map(p => `
    <article class="card">
      <a href="product.html?id=${encodeURIComponent(p.id)}">
        <div class="img-wrap"><img src="${p.image}" alt="${p.title}"></div>
      </a>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="price-row">
        <span class="price">${fmt(p.price)}</span>
        <a class="btn" href="product.html?id=${encodeURIComponent(p.id)}">View</a>
      </div>
    </article>
  `).join("") || "<p>No products found.</p>";
}

async function renderProduct(){
  const detail = $$("#productDetail"); if(!detail) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const products = await loadProducts();
  const p = products.find(x => String(x.id) === String(id)) || products[0];
  if(!p){ detail.innerHTML = "<p>Product not found.</p>"; return; }
  detail.innerHTML = `
    <div><img src="${p.image}" alt="${p.title}"></div>
    <div>
      <h1>${p.title}</h1>
      <p>${p.description}</p>
      <p class="price">${fmt(p.price)}</p>
      <div class="quantity">
        <label for="qty">Qty</label>
        <input id="qty" type="number" value="1" min="1">
      </div>
      <div style="margin-top:12px; display:flex; gap:8px">
        <button class="btn" id="addBtn">Add to cart</button>
        <a class="btn ghost" href="index.html">Back</a>
      </div>
    </div>
  `;
  $$("#addBtn").addEventListener("click", () => { 
    const qty = Math.max(1, parseInt($$("#qty").value || "1", 10));
    addToCart(p, qty);
    location.href = "cart.html";
  });
}

function addToCart(product, qty=1){
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if(existing) existing.qty += qty;
  else cart.push({ id: product.id, title: product.title, price: product.price, image: product.image, qty });
  saveCart(cart);
}

async function renderCart(){
  const wrap = $$("#cartItems"); if(!wrap) return;
  const cart = getCart();
  if(cart.length === 0){
    wrap.innerHTML = "<p>Your cart is empty.</p>";
    $$("#subtotal").textContent = fmt(0);
    return;
  }
  wrap.innerHTML = cart.map(i => `
    <div class="cart-item">
      <img src="${i.image}" alt="${i.title}">
      <div>
        <div style="font-weight:700">${i.title}</div>
        <div class="small">${fmt(i.price)} • Qty 
          <input type="number" min="1" value="${i.qty}" data-id="${i.id}" class="qty-input" style="width:64px; padding:4px; border-radius:6px; border:1px solid var(--border); background:#0e1320; color:var(--text)">
        </div>
      </div>
      <div style="display:grid; gap:8px; justify-items:end">
        <div>${fmt(i.price * i.qty)}</div>
        <button class="btn ghost remove-btn" data-id="${i.id}">Remove</button>
      </div>
    </div>
  `).join("");
  Array.from(document.querySelectorAll(".remove-btn")).forEach(b => b.addEventListener("click", e => {
    const id = b.getAttribute("data-id");
    let cart = getCart().filter(x => String(x.id) !== String(id));
    saveCart(cart);
    renderCart();
  }));
  Array.from(document.querySelectorAll(".qty-input")).forEach(inp => inp.addEventListener("change", e => {
    const id = inp.getAttribute("data-id");
    const cart = getCart();
    const item = cart.find(x => String(x.id) === String(id));
    const v = Math.max(1, parseInt(inp.value || "1", 10));
    if(item){ item.qty = v; saveCart(cart); renderCart(); }
  }));
  const subtotal = getCart().reduce((s,i)=> s + i.price * i.qty, 0);
  $$("#subtotal").textContent = fmt(subtotal);
  $$("#checkoutBtn")?.addEventListener("click", () => {
    alert("Demo checkout — integrate Stripe/PayPal to accept payments.");
  });
}

function boot(){
  setYear();
  updateCartCount();
  const path = location.pathname.split("/").pop() || "index.html";
  if(path.includes("index")) loadProducts().then(renderGrid);
  if(path.includes("product")) renderProduct();
  if(path.includes("cart")) renderCart();
  $$("#searchInput")?.addEventListener("input", async () => {
    const products = await loadProducts();
    renderGrid(products);
  });
}
document.addEventListener("DOMContentLoaded", boot);
