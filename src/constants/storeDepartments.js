/**
 * Supermarket aisle / department ordering for shopping lists.
 * Stored on items as optional `store_department` (additive Firebase field).
 */

export const STORE_DEPARTMENTS = [
  { id: "produce", icon: "eco" },
  { id: "bakery", icon: "bakery-dining" },
  { id: "dairy", icon: "breakfast-dining" },
  { id: "meat_fish", icon: "set-meal" },
  { id: "frozen", icon: "ac-unit" },
  { id: "dry_goods", icon: "inventory-2" },
  { id: "drinks", icon: "local-drink" },
  { id: "cleaning", icon: "cleaning-services" },
  { id: "personal_care", icon: "spa" },
  { id: "other", icon: "category" },
];

/** Default walking order through a typical supermarket */
export const DEFAULT_STORE_DEPARTMENT_ORDER = STORE_DEPARTMENTS.map((d) => d.id);

const KEYWORDS_BY_DEPARTMENT = {
  produce: [
    "apple", "banana", "orange", "lemon", "cucumber", "tomato", "lettuce", "carrot", "onion", "garlic",
    "potato", "avocado", "grape", "broccoli", "pepper", "spinach", "fruit", "vegetable", "salad",
    "תפוח", "בננה", "תפוז", "לימון", "מלפפון", "עגבניה", "עגבניות", "חסה", "גזר", "בצל", "שום",
    "תפוחי אדמה", "בטטה", "ברוקולי", "כרובית", "פלפל", "חציל", "אבוקדו", "ענבים", "ירק", "ירקות", "פירות",
  ],
  bakery: [
    "bread", "bagel", "croissant", "bun", "roll", "pita", "challah", "cake", "muffin", "pastry", "bakery",
    "לחם", "בגל", "בייגל", "חלה", "פיתה", "לחמניה", "מאפה", "מאפים", "עוגה", "עוגיות", "בורקס",
  ],
  dairy: [
    "milk", "cheese", "yogurt", "butter", "cream", "cottage", "egg", "eggs",
    "חלב", "גבינה", "גבינת", "יוגורט", "שמנת", "חמאה", "ביצים", "ביצה", "קוטג", "לבנה", "קפיר",
  ],
  meat_fish: [
    "chicken", "beef", "lamb", "turkey", "fish", "salmon", "tuna", "steak", "meat", "sausage", "ham",
    "עוף", "בקר", "טלה", "דג", "דגים", "סלמון", "טונה", "נקניק", "נקניקיות", "קבב", "המבורגר", "שניצל", "בשר",
  ],
  frozen: [
    "frozen", "ice cream", "gelato",
    "קפוא", "מוקפא", "מוקפאים", "גלידה", "ירקות קפואים", "פיצה קפואה",
  ],
  dry_goods: [
    "rice", "pasta", "flour", "cereal", "oats", "couscous", "bulgur", "sugar", "salt", "oil", "sauce",
    "snack", "chips", "chocolate", "cookie", "nuts", "can", "canned", "beans", "lentils",
    "אורז", "פסטה", "קמח", "דגנים", "שיבולת", "קוסקוס", "בורגול", "סוכר", "שמן", "רוטב", "חטיף", "חטיפים",
    "שוקולד", "ביסקוויט", "אגוזים", "שימורים", "עדשים", "קטניות",
  ],
  drinks: [
    "water", "juice", "soda", "cola", "coffee", "tea", "beer", "wine", "drink", "beverage",
    "מים", "מיץ", "קולה", "קפה", "תה", "בירה", "יין", "משקה", "משקאות", "סודה",
  ],
  cleaning: [
    "detergent", "soap", "bleach", "sponge", "trash", "paper towel", "toilet paper", "tissue", "dish",
    "clean", "laundry", "dishwasher",
    "סבון כביסה", "מי רצפה", "נייר טואלט", "טישו", "מפיות", "סבון כלים", "מדיח", "ניקוי", "חומרי ניקוי", "אקונומיקה",
  ],
  personal_care: [
    "shampoo", "toothpaste", "toothbrush", "deodorant", "cream", "lotion", "razor", "pad", "tampon", "diaper",
    "שמפו", "סבון", "משחת שיניים", "מברשת שיניים", "דאודורנט", "קרם", "תחבושות", "חיתול",
    "pharmacy", "vitamin", "vitamins", "תרופה", "ויטמין",
  ],
};

/** Maps legacy product `category` ids to store departments */
export const PRODUCT_CATEGORY_TO_STORE_DEPARTMENT = {
  produce: "produce",
  dairy: "dairy",
  meat: "meat_fish",
  grains: "dry_goods",
  snacks: "dry_goods",
  beverages: "drinks",
  frozen: "frozen",
  household: "cleaning",
  personal_care: "personal_care",
  baby: "personal_care",
  pharmacy: "personal_care",
  other: "other",
};

export function getStoreDepartmentById(id) {
  return STORE_DEPARTMENTS.find((d) => d.id === id) || STORE_DEPARTMENTS.find((d) => d.id === "other");
}

export function autoDetectStoreDepartment(productName) {
  if (!productName || typeof productName !== "string") {
    return "other";
  }
  const name = productName.toLowerCase().trim();

  for (const [departmentId, keywords] of Object.entries(KEYWORDS_BY_DEPARTMENT)) {
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        return departmentId;
      }
    }
  }

  return "other";
}

export function mapProductCategoryToStoreDepartment(categoryId) {
  return PRODUCT_CATEGORY_TO_STORE_DEPARTMENT[categoryId] || "other";
}

/**
 * Resolve department for display: saved field → name keywords → product category → other
 */
export function resolveStoreDepartment(item) {
  if (item?.store_department && getStoreDepartmentById(item.store_department)) {
    return item.store_department;
  }
  const fromName = autoDetectStoreDepartment(item?.name || "");
  if (fromName !== "other") {
    return fromName;
  }
  return mapProductCategoryToStoreDepartment(item?.category);
}

export function groupItemsByStoreDepartment(items, departmentOrder) {
  const order =
    departmentOrder?.length > 0 ? departmentOrder : DEFAULT_STORE_DEPARTMENT_ORDER;
  const buckets = {};
  items.forEach((item) => {
    const dept = resolveStoreDepartment(item);
    if (!buckets[dept]) {
      buckets[dept] = [];
    }
    buckets[dept].push(item);
  });

  const seen = new Set();
  const groups = [];

  order.forEach((deptId) => {
    if (buckets[deptId]?.length) {
      groups.push({ departmentId: deptId, items: buckets[deptId] });
      seen.add(deptId);
    }
  });

  Object.keys(buckets).forEach((deptId) => {
    if (!seen.has(deptId)) {
      groups.push({ departmentId: deptId, items: buckets[deptId] });
    }
  });

  return groups;
}

export function sanitizeDepartmentOrder(order) {
  const valid = new Set(DEFAULT_STORE_DEPARTMENT_ORDER);
  const result = [];
  (order || []).forEach((id) => {
    if (valid.has(id) && !result.includes(id)) {
      result.push(id);
    }
  });
  DEFAULT_STORE_DEPARTMENT_ORDER.forEach((id) => {
    if (!result.includes(id)) {
      result.push(id);
    }
  });
  return result;
}
