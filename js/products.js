const SQ_PRODUCTS_KEY = "sq-products";

const SQ_DEFAULT_PRODUCTS = [];

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
