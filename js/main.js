const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const html = document.documentElement;
const savedTheme = localStorage.getItem("sq-theme");
if (savedTheme) html.dataset.theme = savedTheme;
else if (matchMedia("(prefers-color-scheme: dark)").matches) html.dataset.theme = "dark";

$("#themeToggle").addEventListener("click", () => {
  const next = html.dataset.theme === "dark" ? "light" : "dark";
  html.dataset.theme = next;
  localStorage.setItem("sq-theme", next);
});

const burger = $("#burger");
const navLinks = $("#navLinks");
burger.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.addEventListener("click", e => {
  if (e.target.tagName === "A") navLinks.classList.remove("open");
});

const sections = $$("main section[id]");
const linkEls = $$(".nav-links a");
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      linkEls.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach(s => spy.observe(s));

const revealer = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); revealer.unobserve(en.target); }
  });
}, { threshold: 0.12 });

function observeReveals(root = document) {
  $$(".reveal", root).forEach((el, i) => {
    if (el.classList.contains("in")) return;
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    revealer.observe(el);
  });
}
observeReveals();

const counter = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, target = +el.dataset.count, dur = 1400, t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counter.unobserve(el);
  });
}, { threshold: 0.6 });
$$("[data-count]").forEach(el => counter.observe(el));

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const CAT_LABEL = { crush: "ركام", natural: "طبيعي", powder: "مطحون" };
const CAT_VISUAL = { crush: "v-gravel", natural: "v-boulder", powder: "v-powder" };

let products = sqLoadProducts();
let currentFilter = "all";

function cardHTML(p) {
  const visual = p.visual || CAT_VISUAL[p.cat] || "v-gravel";
  const media = p.img
    ? `<img class="card-img" src="${p.img}" alt="${esc(p.name)}" loading="lazy">`
    : `<div class="card-visual ${esc(visual)}"></div>`;
  return `<article class="card glass reveal" data-cat="${esc(p.cat)}">
    ${media}
    <div class="card-body">
      <div class="card-top"><h3>${esc(p.name)}</h3><span class="tag ${p.cat === "natural" ? "tag-gold" : ""}">${CAT_LABEL[p.cat] || "منتج"}</span></div>
      <p class="desc">${esc(p.desc)}</p>
      <ul class="specs"><li><b>المقاس:</b> ${esc(p.size || "—")}</li><li><b>الاستخدام:</b> ${esc(p.use || "—")}</li></ul>
      <div class="card-foot">
        <span class="price">${esc(p.price || "السعر عند الطلب")}</span>
        <button class="btn btn-outline add-btn" data-name="${esc(p.name)}">أضف للعرض</button>
      </div>
    </div>
  </article>`;
}

function renderProducts() {
  const grid = $("#productGrid");
  const empty = $("#emptyState");
  const list = products.filter(p => currentFilter === "all" || p.cat === currentFilter);
  grid.innerHTML = list.map(cardHTML).join("");

  if (!products.length) {
    empty.hidden = false;
    empty.innerHTML = 'لا توجد منتجات حالياً — يمكن إضافتها من <a href="admin.html">صفحة الإدارة</a>.';
  } else if (!list.length) {
    empty.hidden = false;
    empty.textContent = "لا توجد منتجات في هذا القسم.";
  } else {
    empty.hidden = true;
  }
  observeReveals(grid);
}
renderProducts();

$$("#filters .filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    $$("#filters .filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderProducts();
  });
});

const toast = $("#toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

const drawer = $("#quoteDrawer");
const backdrop = $("#backdrop");
const openDrawer = () => { drawer.classList.add("open"); backdrop.classList.add("open"); };
const closeDrawer = () => { drawer.classList.remove("open"); backdrop.classList.remove("open"); };

$("#openQuote").addEventListener("click", openDrawer);
$("#closeQuote").addEventListener("click", closeDrawer);
backdrop.addEventListener("click", closeDrawer);
addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

const UNITS = ["م³", "طن"];
let cart = [];
try { cart = JSON.parse(localStorage.getItem("sq-cart")) || []; } catch { cart = []; }

const quoteItems = $("#quoteItems");
const quoteEmpty = $("#quoteEmpty");
const quoteCount = $("#quoteCount");

function saveCart() { localStorage.setItem("sq-cart", JSON.stringify(cart)); }

function renderCart() {
  quoteCount.textContent = cart.length;
  $$(".q-item", quoteItems).forEach(el => el.remove());
  quoteEmpty.style.display = cart.length ? "none" : "block";

  cart.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "q-item";
    row.innerHTML = `
      <span class="q-name">${esc(item.name)}</span>
      <input class="q-qty" type="number" min="0" step="1" value="${+item.qty || 0}" aria-label="الكمية">
      <select class="q-qty q-unit" aria-label="الوحدة" style="width:62px">
        ${UNITS.map(u => `<option ${u === item.unit ? "selected" : ""}>${u}</option>`).join("")}
      </select>
      <button class="q-del" title="حذف">✕</button>`;
    $(".q-qty", row).addEventListener("input", e => { item.qty = +e.target.value || 0; saveCart(); });
    $(".q-unit", row).addEventListener("change", e => { item.unit = e.target.value; saveCart(); });
    $(".q-del", row).addEventListener("click", () => { cart.splice(i, 1); saveCart(); renderCart(); });
    quoteItems.appendChild(row);
  });
  saveCart();
}
renderCart();

$("#productGrid").addEventListener("click", e => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;
  const name = btn.dataset.name;
  const found = cart.find(c => c.name === name);
  if (found) { found.qty += 10; showToast("تمت زيادة الكمية: " + name); }
  else { cart.push({ name, qty: 10, unit: "م³" }); showToast("أُضيف إلى السلة: " + name); }
  renderCart();
  btn.classList.add("added");
  btn.textContent = "تمت الإضافة ✓";
  setTimeout(() => { btn.classList.remove("added"); btn.textContent = "أضف للعرض"; }, 1500);
  openDrawer();
});

$("#sendQuote").addEventListener("click", () => {
  const note = $("#quoteNote");
  const name = $("#qName").value.trim();
  const phone = $("#qPhone").value.trim();
  if (!cart.length) { note.textContent = "أضف منتجاً واحداً على الأقل."; note.classList.add("err"); return; }
  if (!name || !phone) { note.textContent = "يرجى إدخال الاسم ورقم الهاتف."; note.classList.add("err"); return; }
  note.classList.remove("err");
  note.textContent = "تم استلام طلبك بنجاح، سنتواصل معك قريباً ✔";
  showToast("تم إرسال طلب عرض السعر");
  cart = []; saveCart(); renderCart();
  setTimeout(() => { $("#qName").value = ""; $("#qPhone").value = ""; note.textContent = ""; closeDrawer(); }, 2200);
});

$("#contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const note = $("#formNote");
  const name = $("#cname").value.trim();
  const phone = $("#cphone").value.trim();
  if (!name || !phone) { note.textContent = "الاسم ورقم الهاتف مطلوبان."; note.classList.add("err"); return; }
  note.classList.remove("err");
  note.textContent = "تم إرسال طلبك، سنتواصل معك خلال ساعات ✔";
  showToast("تم إرسال الطلب بنجاح");
  e.target.reset();
  setTimeout(() => { note.textContent = ""; }, 4000);
});

$("#year").textContent = new Date().getFullYear();
