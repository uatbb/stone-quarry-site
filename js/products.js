const SQ_PRODUCTS_KEY = "sq-products";

const SQ_DEFAULT_PRODUCTS = [
  { id: "p1", cat: "crush", name: "رمل غسيل 0-5 مم", desc: "رمل نظيف خالٍ من الشوائب، مثالي للخلطات والبلوك والطين المسلح.", size: "0 – 5 مم", use: "خلطات، بلوك", price: "السعر عند الطلب", visual: "v-sand", img: "" },
  { id: "p2", cat: "crush", name: "ركام 5-10 مم", desc: "حصى مكعب الشكل يمنح تماسكاً ممتازاً للخرسانة والإسفلت الخفيف.", size: "5 – 10 مم", use: "خرسانة، إسفلت", price: "السعر عند الطلب", visual: "v-gravel", img: "" },
  { id: "p3", cat: "crush", name: "ركام 10-20 مم", desc: "الاختيار الأول للخرسانة المسلحة والأعمال الإنشائية العامة.", size: "10 – 20 مم", use: "خرسانة مسلحة", price: "السعر عند الطلب", visual: "v-gravel2", img: "" },
  { id: "p4", cat: "crush", name: "ركام 20-40 مم", desc: "حصى خشن للأعمال الثقيلة: الأساسات، السدود، وطبقات التربة.", size: "20 – 40 مم", use: "أساسات، سدود", price: "السعر عند الطلب", visual: "v-rock", img: "" },
  { id: "p5", cat: "natural", name: "بوزلانا / حجر مكعب", desc: "قطع حجر طبيعي لجداريات وديكورات المواقع والمناظر الطبيعية.", size: "15 – 60 سم", use: "جدران، ديكور", price: "السعر عند الطلب", visual: "v-boulder", img: "" },
  { id: "p6", cat: "natural", name: "حصى مغسول طبيعي", desc: "حصى مغسول بألوان طبيعية لتنسيق الحدائق ومسارات المشاة.", size: "10 – 30 مم", use: "تنسيق حدائق", price: "السعر عند الطلب", visual: "v-wash", img: "" },
  { id: "p7", cat: "powder", name: "مسحوق الحجر (بيضاء)", desc: "مسحوق حجر جيري ناعم للطلاءات والزلط وأعمال المعالجة.", size: "أقل من 0.5 مم", use: "زلط، طلاء", price: "السعر عند الطلب", visual: "v-powder", img: "" },
  { id: "p8", cat: "powder", name: "دست الركام (بيضاء خام)", desc: "ناتج جانبي ناعم يُستخدم في أعمال الردم والتسوية الأساسية.", size: "0 – 2 مم", use: "ردم، تسوية", price: "السعر عند الطلب", visual: "v-dust", img: "" }
];

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
