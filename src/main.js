import { config } from "./config.js";
import { services } from "./data/services.js";
import { getDemoUser, signIn, signUp, signOut, getOrders, createDemoOrder } from "./lib/store.js";
import "./styles.css";

const app = document.querySelector("#app");
let currentPage = "home";
let selectedService = null;
let currentUser = getDemoUser();
let menuSettings = { sound: "confirm", vibration: "light" };

const money = (n) => `${config.currency}${Number(n).toLocaleString("en-IN")}`;
const waLink = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent("Hi, I need help with SMMTRENDA1 services.")}`;
const icon = (name) => ({ home: "⌂", orders: "▤", new: "＋", menu: "☰" }[name] || "•");

function header() {
  return `<header class="topbar">
    <a class="brand" href="#" data-page="home" aria-label="${config.siteName} home">
      <span class="brand-mark">S1</span><span class="brand-name">${config.siteName}</span>
    </a>
    <div class="top-actions">
      <button class="icon-button" data-action="theme" aria-label="Toggle theme">☼</button>
      <button class="button button-small" data-page="login">${currentUser ? "Account" : "Login"}</button>
    </div>
  </header>`;
}

function bottomNav() {
  return `<nav class="bottom-nav">
    <button data-page="orders" class="${currentPage === "orders" ? "active" : ""}"><span>▤</span><small>My Orders</small></button>
    <button class="new-order-nav" data-page="services"><span>＋</span><b>New Order</b></button>
    <button data-page="menu" class="${currentPage === "menu" ? "active" : ""}"><span>☰</span><small>Menu</small></button>
  </nav>`;
}

function footer() {
  return `<footer class="footer">
    <div class="footer-brand"><span class="brand-mark">S1</span><strong>${config.siteName}</strong></div>
    <div class="trust-pills"><span>✓ Clear pricing</span><span>UPI checkout</span><span>Support</span></div>
    <div class="footer-links"><a data-page="home">Home</a><a data-page="orders">My Orders</a><a data-page="faq">FAQ</a><a href="${waLink}" target="_blank" rel="noreferrer">WhatsApp Support</a></div>
    <p>© ${new Date().getFullYear()} ${config.siteName}. All rights reserved.</p>
  </footer>`;
}

function whatsapp() {
  return `<a class="whatsapp-float" href="${waLink}" target="_blank" rel="noreferrer" aria-label="WhatsApp support"><span>◉</span><small>WhatsApp</small></a>`;
}

function serviceCard(service) {
  return `<article class="service-card">
    <div class="service-icon">${service.icon}</div>
    <div class="service-info"><h3>${service.title}</h3><p>${service.description}</p><div class="service-meta"><span>${service.category}</span><span>${money(service.price)} <small>${service.unit}</small></span></div></div>
    <button class="button plan-button" data-service="${service.id}">Choose <span>→</span></button>
  </article>`;
}

function homePage() {
  const featured = services.slice(0, 3);
  return `<main>
    <section class="hero">
      <div class="hero-orb orb-one"></div><div class="hero-orb orb-two"></div>
      <div class="eyebrow"><span class="live-dot"></span> YOUR SOCIAL MEDIA, YOUR WAY</div>
      <h1>Make your brand<br><span>stand out.</span></h1>
      <p>Creative social-media services to help your brand show up with confidence.</p>
      <div class="hero-actions"><button class="button" data-page="services">Explore services <span>→</span></button><a class="button button-ghost" href="${waLink}" target="_blank" rel="noreferrer">Talk to us</a></div>
      <div class="hero-stats"><div><b>Creative</b><small>Content support</small></div><div><b>Transparent</b><small>Clear pricing</small></div><div><b>Helpful</b><small>Customer care</small></div></div>
    </section>
    <section class="comparison-banner">
      <div class="comparison-col orange"><span class="comparison-icon">✦</span><div><b>Content that connects</b><small>Reels, posts and profile setup</small></div></div>
      <div class="comparison-col green"><span class="comparison-icon">↗</span><div><b>Promotion with a plan</b><small>Campaign review and reporting</small></div></div>
    </section>
    <section class="section">
      <div class="section-heading"><div><h2>Social Media Services</h2><p>Choose a service to get started</p></div><button class="text-link" data-page="services">View all →</button></div>
      <div class="service-list">${featured.map(serviceCard).join("")}</div>
    </section>
    <section class="section review-section"><div class="section-heading"><div><h2>Built around your goals</h2><p>Clear service details, helpful support, no confusing checkout.</p></div></div>
      <div class="review-card"><div class="stars">★★★★★</div><p>“A simple place to plan and organise social-media work.”</p><div class="review-author"><span class="avatar">S</span><div><b>SMMTRENDA1</b><small>Service promise</small></div></div></div>
    </section>
  </main>`;
}

function servicesPage() {
  const categories = [...new Set(services.map(s => s.category))];
  return `<main class="page-main"><div class="page-intro"><span class="eyebrow">SERVICE CATALOGUE</span><h1>Find your <span>next step.</span></h1><p>Explore our available social-media marketing services.</p></div>
    ${categories.map(category => `<section class="section"><div class="section-heading"><div><h2>${category}</h2><p>Packages and service details</p></div></div><div class="service-list">${services.filter(s => s.category === category).map(serviceCard).join("")}</div></section>`).join("")}
  </main>`;
}

function orderFormPage() {
  if (!selectedService) return servicesPage();
  return `<main class="page-main"><button class="back-link" data-page="services">‹ Back to services</button>
    <div class="checkout-hero"><div class="service-icon large">${selectedService.icon}</div><span class="badge">SERVICE ORDER</span><h1>${selectedService.title}</h1><p>${selectedService.description}</p><div class="price-large">${money(selectedService.price)} <small>${selectedService.unit}</small></div></div>
    <form id="order-form" class="panel form-panel">
      <label for="customer-link">Your profile or project link <span class="muted">(required)</span></label>
      <input id="customer-link" name="customerLink" type="url" placeholder="https://..." required>
      <label for="notes">Instructions <span class="muted">(optional)</span></label>
      <textarea id="notes" name="notes" rows="3" placeholder="Tell us what you need..."></textarea>
      <div class="summary-row"><span>Service</span><b>${selectedService.title}</b></div>
      <div class="summary-row"><span>Price</span><b>${money(selectedService.price)}</b></div>
      <div class="notice">This starter checkout creates an order record only. Payment is not collected until a verified payment gateway is configured.</div>
      <button class="button button-wide" type="submit">Continue to checkout →</button>
    </form>
  </main>`;
}

function loginPage() {
  return `<main class="page-main narrow"><div class="page-intro"><span class="eyebrow">WELCOME</span><h1>Your account, <span>your orders.</span></h1><p>Sign in or create an account to keep track of requests.</p></div>
    <div class="panel"><div class="tabs"><button class="tab active" data-auth="login">Login</button><button class="tab" data-auth="signup">Create account</button></div>
      <form id="auth-form" class="stack-form"><label>Email</label><input type="email" name="email" placeholder="you@example.com" required><label>Password</label><input type="password" name="password" minlength="6" placeholder="At least 6 characters" required><button class="button button-wide" type="submit">Login →</button><p class="muted tiny">Demo mode stores a preview account in this browser only. Connect Supabase before production.</p></form>
    </div>
  </main>`;
}

async function ordersPage() {
  let orders = [];
  let error = "";
  try { orders = await getOrders(); } catch (e) { error = e.message || "Could not load orders."; }
  const content = orders.length ? orders.map(o => `<article class="order-card"><div class="order-top"><b>${o.service_name || o.service_id}</b><span class="status">${String(o.status || "pending").replaceAll("_", " ")}</span></div><div class="order-bottom"><span>${o.id || o.order_number || "Order"}</span><b>${money(o.amount || 0)}</b></div><small>${o.created_at ? new Date(o.created_at).toLocaleString() : ""}</small></article>`).join("") : `<div class="empty-state"><span>▤</span><h3>No orders yet</h3><p>Your service requests will appear here.</p><button class="button" data-page="services">Browse services</button></div>`;
  return `<main class="page-main"><div class="page-intro"><span class="eyebrow">YOUR DASHBOARD</span><h1>My <span>Orders</span></h1><p>Check the status of your service requests.</p></div>${error ? `<div class="notice">${escapeHtml(error)}</div>` : ""}<div class="order-list">${content}</div></main>`;
}

function menuPage() {
  return `<main class="page-main"><section class="panel guest-panel"><div class="guest-avatar">${currentUser ? "✓" : "?"}</div><div><span class="muted">Hello,</span><h2>${currentUser ? escapeHtml(currentUser.email || "Customer") : "Guest"}</h2></div><button class="button" data-page="login">${currentUser ? "Account settings" : "Login to continue"}</button></section>
    <section class="panel settings-panel"><div class="panel-heading"><span class="setting-icon">♫</span><div><h2>Sound & Vibration</h2><p>Saved on this device only</p></div></div>
      <h3>Sound</h3><p class="muted">A soft click as you tap, and a confirmation on orders.</p><div class="choice-row">${["everything","confirm","off"].map(v => `<button class="choice ${menuSettings.sound === v ? "selected" : ""}" data-sound="${v}">${({everything:"Everything",confirm:"Confirm only",off:"Off"})[v]}</button>`).join("")}</div>
      <h3>Vibration</h3><p class="muted">A small buzz as you tap (where supported).</p><div class="choice-row">${["off","light","medium","strong"].map(v => `<button class="choice ${menuSettings.vibration === v ? "selected" : ""}" data-vibration="${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}</div>
      <button class="button button-ghost button-wide" data-action="test-sound">Play a test sound</button>
    </section>
    <section class="panel menu-links"><h3>SUPPORT</h3><a href="${waLink}" target="_blank" rel="noreferrer">💬 WhatsApp Support <span>›</span></a></section>
    <section class="panel menu-links"><h3>APP</h3><button data-action="install">⇩ <span><b>Install App</b><small>Get this site on your home screen</small></span><em>›</em></button><div class="menu-row">🔔 <span><b>Notifications</b><small>Order updates and offers</small></span><em class="coming">Coming Soon</em></div></section>
    ${currentUser ? `<button class="button button-ghost button-wide" data-action="logout">Log out</button>` : ""}
  </main>`;
}

function faqPage() {
  return `<main class="page-main narrow"><div class="page-intro"><span class="eyebrow">HELP CENTRE</span><h1>Frequently asked <span>questions</span></h1></div><section class="panel faq"><details open><summary>How do I place an order?</summary><p>Choose a service, submit the relevant link and instructions, then follow the checkout instructions shown on the site.</p></details><details><summary>Is payment active?</summary><p>Not in this starter project. A server-verified gateway integration must be configured before real payments can be accepted.</p></details><details><summary>How can I contact support?</summary><p>Use the floating WhatsApp button to contact SMMTRENDA1 support.</p></details></section></main>`;
}

function paymentPage(order) {
  return `<main class="page-main narrow"><div class="page-intro"><span class="eyebrow">CHECKOUT</span><h1>Payment <span>setup pending</span></h1><p>Your order request was saved in preview mode.</p></div><div class="panel payment-panel"><div class="amount-box"><small>ORDER AMOUNT</small><strong>${money(order.amount)}</strong></div><div class="payment-placeholder">₹<br><small>Payment gateway will appear here after secure server-side setup.</small></div><div class="notice warning">No payment has been collected. Do not send money to a manually displayed QR code.</div><div class="summary-row"><span>Order ID</span><b>${order.id || order.order_number}</b></div><div class="summary-row"><span>Status</span><b>Awaiting payment setup</b></div><button class="button button-wide" data-page="orders">View My Orders</button></div></main>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}

async function render() {
  let body = "";
  if (currentPage === "home") body = homePage();
  else if (currentPage === "services") body = servicesPage();
  else if (currentPage === "order") body = orderFormPage();
  else if (currentPage === "login") body = loginPage();
  else if (currentPage === "orders") body = await ordersPage();
  else if (currentPage === "menu") body = menuPage();
  else if (currentPage === "faq") body = faqPage();
  else if (currentPage === "payment") body = paymentPage(window.lastOrder || {});
  app.innerHTML = `${header()}${body}${footer()}${whatsapp()}${bottomNav()}<div id="toast" class="toast" role="status"></div>`;
}

function toast(message) {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3200);
}

function navigate(page) {
  currentPage = page;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", async (event) => {
  const pageButton = event.target.closest("[data-page]");
  const serviceButton = event.target.closest("[data-service]");
  const authButton = event.target.closest("[data-auth]");
  const soundButton = event.target.closest("[data-sound]");
  const vibrationButton = event.target.closest("[data-vibration]");
  const actionButton = event.target.closest("[data-action]");

  if (pageButton) { event.preventDefault(); navigate(pageButton.dataset.page); }
  if (serviceButton) {
    selectedService = services.find(s => s.id === serviceButton.dataset.service);
    currentPage = "order";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (authButton) {
    document.querySelectorAll("[data-auth]").forEach(b => b.classList.toggle("active", b === authButton));
    const submit = document.querySelector('#auth-form button[type="submit"]');
    if (submit) submit.textContent = authButton.dataset.auth === "signup" ? "Create account →" : "Login →";
    document.querySelector("#auth-form")?.setAttribute("data-mode", authButton.dataset.auth);
  }
  if (soundButton) { menuSettings.sound = soundButton.dataset.sound; render(); }
  if (vibrationButton) { menuSettings.vibration = vibrationButton.dataset.vibration; render(); }
  if (actionButton?.dataset.action === "theme") {
    document.body.classList.toggle("light-mode");
  }
  if (actionButton?.dataset.action === "test-sound") {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = 660; gain.gain.value = 0.04;
      oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
    } catch {}
    if (menuSettings.vibration !== "off" && navigator.vibrate) navigator.vibrate(menuSettings.vibration === "strong" ? 100 : 25);
    toast("Test sound played where supported.");
  }
  if (actionButton?.dataset.action === "logout") {
    try { await signOut(); currentUser = null; toast("Logged out."); render(); }
    catch (e) { toast(e.message); }
  }
  if (actionButton?.dataset.action === "install") {
    toast("In Chrome, open the menu and choose Install app or Add to Home screen if available.");
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "auth-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const mode = event.target.dataset.mode || "login";
    try {
      currentUser = mode === "signup" ? await signUp(email, password) : await signIn(email, password);
      toast(mode === "signup" ? "Account request submitted." : "Login successful.");
      navigate("home");
    } catch (e) { toast(e.message || "Could not authenticate."); }
  }
  if (event.target.id === "order-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      const order = await createDemoOrder(selectedService, String(form.get("customerLink") || ""), String(form.get("notes") || ""));
      window.lastOrder = order;
      currentPage = "payment";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast(e.message || "Could not create order.");
      if (String(e.message || "").includes("log in")) setTimeout(() => navigate("login"), 1000);
    }
  }
});

render();