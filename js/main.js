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
$$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; revealer.observe(el); });

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

$$("#filters .filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    $$("#filters .filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    $$("#productGrid .card").forEach(card => {
      const show = f === "all" || card.dataset.cat === f;
      card.classList.toggle("hide", !show);
      if (show) { card.classList.remove("in"); requestAnimationFrame(() => card.classList.add("in")); }
    });
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
      <span class="q-name">${item.name}</span>
      <input class="q-qty" type="number" min="0" step="1" value="${item.qty}" aria-label="الكمية">
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

$$(".add-btn").forEach(btn => {
  btn.addEventListener("click", () => {
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
