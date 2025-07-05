// קטגוריות למוצרים
export const CATEGORIES = [
  { id: 'produce', name: 'פירות וירקות', icon: 'eco', color: '#4CAF50' },
  { id: 'dairy', name: 'חלב וגבינות', icon: 'local-bar', color: '#2196F3' },
  { id: 'meat', name: 'בשר ודגים', icon: 'restaurant', color: '#F44336' },
  { id: 'grains', name: 'דגנים וקמח', icon: 'grain', color: '#FF9800' },
  { id: 'snacks', name: 'חטיפים וממתקים', icon: 'cake', color: '#E91E63' },
  { id: 'beverages', name: 'משקאות', icon: 'local-drink', color: '#00BCD4' },
  { id: 'frozen', name: 'מוקפאים', icon: 'ac-unit', color: '#9C27B0' },
  { id: 'household', name: 'חומרי ניקוי', icon: 'cleaning-services', color: '#607D8B' },
  { id: 'personal_care', name: 'טיפוח אישי', icon: 'face', color: '#795548' },
  { id: 'baby', name: 'מוצרי תינוקות', icon: 'child-care', color: '#FFEB3B' },
  { id: 'pharmacy', name: 'בית מרקחת', icon: 'medical-services', color: '#8BC34A' },
  { id: 'other', name: 'אחר', icon: 'category', color: '#9E9E9E' }
];

// יחידות מידה
export const UNITS = [
  { id: 'pieces', name: 'יחידות', shortName: 'יח׳' },
  { id: 'kg', name: 'קילוגרם', shortName: 'ק״ג' },
  { id: 'grams', name: 'גרם', shortName: 'גר׳' },
  { id: 'liters', name: 'ליטר', shortName: 'ל׳' },
  { id: 'ml', name: 'מיליליטר', shortName: 'מ״ל' },
  { id: 'packages', name: 'אריזות', shortName: 'אריז׳' },
  { id: 'bottles', name: 'בקבוקים', shortName: 'בק׳' },
  { id: 'cans', name: 'קופסאות שימורים', shortName: 'קופ׳' },
  { id: 'boxes', name: 'קופסאות', shortName: 'קופ׳' },
  { id: 'bags', name: 'שקיות', shortName: 'שק׳' }
];

// פונקציה לקבלת קטגוריה לפי ID
export const getCategoryById = (id) => {
  return CATEGORIES.find(cat => cat.id === id) || CATEGORIES.find(cat => cat.id === 'other');
};

// פונקציה לקבלת יחידה לפי ID
export const getUnitById = (id) => {
  return UNITS.find(unit => unit.id === id) || UNITS.find(unit => unit.id === 'pieces');
};

// מיפוי אוטומטי של פריטים לקטגוריות
export const AUTO_CATEGORIZE = {
  // פירות וירקות
  'produce': [
    'תפוח', 'בננה', 'תפוז', 'לימון', 'מלפפון', 'עגבניה', 'חסה', 'גזר', 'בצל', 'שום',
    'תפוחי אדמה', 'בטטה', 'ברוקולי', 'כרובית', 'פלפל', 'חציל', 'אבוקדו', 'ענבים'
  ],
  // חלב וגבינות
  'dairy': [
    'חלב', 'גבינה', 'גבינת קוטג׳', 'יוגורט', 'שמנת', 'חמאה', 'ביצים', 'קפיר', 'לבנה'
  ],
  // בשר ודגים
  'meat': [
    'עוף', 'בקר', 'טלה', 'דג', 'סלמון', 'טונה', 'נקניקיות', 'קבב', 'המבורגר', 'נתחי עוף'
  ],
  // דגנים וקמח
  'grains': [
    'קמח', 'לחם', 'אורז', 'פסטה', 'בורגול', 'קוסקוס', 'שיבולת שועל', 'קוואקר', 'כוסמין'
  ],
  // חטיפים וממתקים
  'snacks': [
    'ביסקוויט', 'שוקולד', 'סוכריות', 'צ׳יפס', 'בוטנים', 'אגוזים', 'חטיף', 'קוקיס'
  ],
  // משקאות
  'beverages': [
    'מים', 'מיץ', 'קולה', 'קפה', 'תה', 'בירה', 'יין', 'מים מינרליים', 'משקה אנרגיה'
  ],
  // מוקפאים
  'frozen': [
    'גלידה', 'ירקות קפואים', 'דגים קפואים', 'פיצה קפואה', 'בצק עלים', 'שניצל קפוא'
  ],
  // חומרי ניקוי
  'household': [
    'סבון כביסה', 'מי רצפה', 'נייר טואלט', 'טישו', 'מפיות', 'סבון כלים', 'מלח למדיח'
  ],
  // טיפוח אישי
  'personal_care': [
    'שמפו', 'סבון', 'משחת שיניים', 'מברשת שיניים', 'קרם', 'שמן', 'דאודורנט'
  ]
};

// פונקציה לזיהוי אוטומטי של קטגוריה לפי שם המוצר
export const autoDetectCategory = (productName) => {
  const name = productName.toLowerCase();
  
  for (const [categoryId, keywords] of Object.entries(AUTO_CATEGORIZE)) {
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        return categoryId;
      }
    }
  }
  
  return 'other';
};

// יחידות ברירת מחדל לקטגוריות
export const DEFAULT_UNITS_BY_CATEGORY = {
  'produce': 'kg',
  'dairy': 'pieces',
  'meat': 'kg',
  'grains': 'kg',
  'snacks': 'packages',
  'beverages': 'liters',
  'frozen': 'packages',
  'household': 'pieces',
  'personal_care': 'pieces',
  'baby': 'pieces',
  'pharmacy': 'pieces',
  'other': 'pieces'
};

// פונקציה לקבלת יחידת ברירת מחדל לקטגוריה
export const getDefaultUnitForCategory = (categoryId) => {
  return DEFAULT_UNITS_BY_CATEGORY[categoryId] || 'pieces';
}; 