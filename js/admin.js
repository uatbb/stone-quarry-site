const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const html = document.documentElement;
const savedTheme = localStorage.getItem("sq-theme");
if (savedTheme) html.dataset.theme = savedTheme;
$("#themeToggle").addEventListener("click", () => {
  const next = html.dataset.theme === "dark" ? "light" : "dark";
  html.dataset.theme = next;
  localStorage.setItem("sq-theme", next);
});

const toast = $("#toast");
let toastTimer;
function showToast(msg, err) {
  toast.textContent = msg;
  toast.style.color = err ? "#E5484D" : "";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

const loginView = $("#loginView");
const adminView = $("#adminView");

function isLogged() { return sessionStorage.getItem("sq-admin") === "1"; }

function showAdmin() {
  loginView.hidden = true;
  adminView.hidden = false;
  render();
}

$("#loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const note = $("#loginNote");
  const pass = $("#passInput").value;
  const valid = localStorage.getItem("sq-admin-pass") || "admin123";
  if (pass !== valid) {
    note.textContent = "كلمة المرور غير صحيحة.";
    note.classList.add("err");
    return;
  }
  note.classList.remove("err");
  sessionStorage.setItem("sq-admin", "1");
  $("#passInput").value = "";
  showAdmin();
});

$("#logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("sq-admin");
  adminView.hidden = true;
  loginView.hidden = false;
});

if (isLogged()) showAdmin();

const CAT_LABEL = { crush: "ركام مكسور", natural: "حجر طبيعي", powder: "منتجات مطحونة" };
const CAT_VISUAL = { crush: "v-gravel", natural: "v-boulder", powder: "v-powder" };

let products = sqLoadProducts();
let pendingImg = "";
let editingId = null;

function persist() {
  if (!sqSaveProducts(products)) {
    showToast("تعذّر الحفظ — مساحة التخزين ممتلئة. أزل بعض الصور الصغيرة.", true);
    return false;
  }
  return true;
}

function render() {
  const grid = $("#adminGrid");
  $("#statCount").textContent = products.length;
  $("#countLabel").textContent = products.length;
  $("#adminEmpty").hidden = products.length > 0;

  grid.innerHTML = products.map(p => {
    const media = p.img
      ? `<img src="${p.img}" alt="${esc(p.name)}">`
      : `<div class="a-media ${esc(p.visual || CAT_VISUAL[p.cat] || "v-gravel")}"></div>`;
    return `<article class="a-card">
      ${p.img ? `<div class="a-media">${media}</div>` : media}
      <div class="a-body">
        <h3>${esc(p.name)}</h3>
        <span class="a-meta">${CAT_LABEL[p.cat] || "منتج"} • ${esc(p.size || "—")}</span>
        <div class="a-actions">
          <button class="btn btn-outline" data-edit="${p.id}">تعديل</button>
          <button class="btn btn-outline danger-del" data-del="${p.id}">حذف</button>
        </div>
      </div>
    </article>`;
  }).join("");
}

$("#adminGrid").addEventListener("click", e => {
  const ed = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-del]");
  if (ed) startEdit(ed.dataset.edit);
  if (del) removeProduct(del.dataset.del);
});

function startEdit(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  pendingImg = p.img || "";
  $("#fId").value = id;
  $("#fName").value = p.name || "";
  $("#fCat").value = p.cat || "crush";
  $("#fDesc").value = p.desc || "";
  $("#fSize").value = p.size || "";
  $("#fUse").value = p.use || "";
  $("#fPrice").value = p.price || "";
  $("#formTitle").textContent = "تعديل منتج: " + p.name;
  $("#submitBtn").textContent = "حفظ التعديل";
  $("#cancelEdit").hidden = false;
  showPreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  editingId = null;
  pendingImg = "";
  $("#productForm").reset();
  $("#fId").value = "";
  $("#formTitle").textContent = "إضافة منتج جديد";
  $("#submitBtn").textContent = "إضافة المنتج";
  $("#cancelEdit").hidden = true;
  $("#formNote").textContent = "";
  $("#imgPreview").hidden = true;
  $("#fileLabel").textContent = "📷 اختر صورة من جهازك — JPG أو PNG";
}
$("#cancelEdit").addEventListener("click", resetForm);

function showPreview() {
  const box = $("#imgPreview");
  if (pendingImg) {
    $("#previewImg").src = pendingImg;
    box.hidden = false;
    $("#fileLabel").textContent = "✔ تم اختيار صورة";
  } else {
    box.hidden = true;
    $("#fileLabel").textContent = "📷 اختر صورة من جهازك — JPG أو PNG";
  }
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject("الملف ليس صورة");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => reject("تعذّر قراءة الصورة");
      img.src = reader.result;
    };
    reader.onerror = () => reject("تعذّر فتح الملف");
    reader.readAsDataURL(file);
  });
}

$("#fImage").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    pendingImg = await resizeImage(file);
    showPreview();
    showToast("تم تحميل الصورة");
  } catch (err) {
    showToast(String(err), true);
  }
  e.target.value = "";
});

$("#removeImg").addEventListener("click", () => {
  pendingImg = "";
  showPreview();
});

$("#productForm").addEventListener("submit", e => {
  e.preventDefault();
  const note = $("#formNote");
  const name = $("#fName").value.trim();
  if (!name) {
    note.textContent = "اسم المنتج مطلوب.";
    note.classList.add("err");
    return;
  }
  const cat = $("#fCat").value;
  const data = {
    name,
    cat,
    desc: $("#fDesc").value.trim(),
    size: $("#fSize").value.trim(),
    use: $("#fUse").value.trim(),
    price: $("#fPrice").value.trim() || "السعر عند الطلب",
    img: pendingImg,
    visual: CAT_VISUAL[cat]
  };

  if (editingId) {
    const p = products.find(x => x.id === editingId);
    Object.assign(p, data);
    showToast("تم حفظ التعديلات");
  } else {
    products.push({ id: "u" + Date.now(), ...data });
    showToast("تمت إضافة المنتج");
  }

  if (!persist()) return;
  resetForm();
  render();
});

function removeProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (!confirm("حذف المنتج «" + p.name + "»؟")) return;
  products = products.filter(x => x.id !== id);
  persist();
  if (editingId === id) resetForm();
  render();
  showToast("تم الحذف");
}

$("#clearBtn").addEventListener("click", () => {
  if (!products.length) return;
  if (!confirm("سيتم حذف جميع المنتجات. هل أنت متأكد؟")) return;
  products = [];
  persist();
  resetForm();
  render();
  showToast("تم حذف جميع المنتجات");
});

const isDefaultId = id => /^p\d{1,3}$/.test(id);

$("#removeDefaultsBtn").addEventListener("click", () => {
  const defaults = products.filter(p => isDefaultId(p.id));
  if (!defaults.length) { showToast("لا توجد منتجات أصلية للحذف"); return; }
  if (!confirm("سيتم حذف " + defaults.length + " من المنتجات الأصلية، مع الاحتفاظ بالمنتجات التي أضفتها أنت. متابعة؟")) return;
  products = products.filter(p => !isDefaultId(p.id));
  persist();
  if (editingId && isDefaultId(editingId)) resetForm();
  render();
  showToast("تم حذف المنتجات الأصلية");
});

$("#changePassBtn").addEventListener("click", () => {
  const next = prompt("أدخل كلمة المرور الجديدة (4 أحرف على الأقل):");
  if (next === null) return;
  if (next.trim().length < 4) { showToast("كلمة المرور قصيرة جداً", true); return; }
  localStorage.setItem("sq-admin-pass", next.trim());
  showToast("تم تغيير كلمة المرور");
});

$("#exportBtn").addEventListener("click", () => {
  const content =
`const SQ_PRODUCTS_KEY = "sq-products";

const SQ_DEFAULT_PRODUCTS = ${JSON.stringify(products, null, 2)};

function sqLoadProducts() {
  try {
    const raw = localStorage.getItem(SQ_PRODUCTS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) { }
  return SQ_DEFAULT_PRODUCTS.map(p => ({ ...p }));
}

function sqSaveProducts(arr) {
  try {
    localStorage.setItem(SQ_PRODUCTS_KEY, JSON.stringify(arr));
    return true;
  } catch (e) {
    return false;
  }
}

function sqResetProducts() {
  localStorage.removeItem(SQ_PRODUCTS_KEY);
}
`;
  const blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "products.js";
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("تم تنزيل products.js — استبدل الملف في مجلد js");
});
