// Quick-commerce apps an order list can be shopped on. None of them lets another
// app fill its cart, so Voc opens each one's search for each item: tap, add in the
// app, come back, tick. On Android these links open the app when it's installed.
// Search URLs checked in a browser on 2026-10-08 (Blinkit and Zepto showed results;
// BigBasket and JioMart ask for a location first; Instamart's page showed a glitch notice to the test browser).
const q = encodeURIComponent;
export const STORES = [
  { id: 'blinkit', name: 'Blinkit', color: '#F8D985', search: s => `https://blinkit.com/s/?q=${q(s)}`, home: 'https://blinkit.com/' },
  { id: 'zepto', name: 'Zepto', color: '#A9ADF7', search: s => `https://www.zepto.com/search?query=${q(s)}`, home: 'https://www.zepto.com/' },
  { id: 'instamart', name: 'Instamart', color: '#F6978A', search: s => `https://www.swiggy.com/instamart/search?custom_back=true&query=${q(s)}`, home: 'https://www.swiggy.com/instamart' },
  { id: 'bigbasket', name: 'BigBasket', color: '#A9DCC6', search: s => `https://www.bigbasket.com/ps/?q=${q(s)}`, home: 'https://www.bigbasket.com/' },
  { id: 'jiomart', name: 'JioMart', color: '#BEE7EE', search: s => `https://www.jiomart.com/search/${q(s)}`, home: 'https://www.jiomart.com/' },
];
export const storeById = id => STORES.find(s => s.id === id) ?? STORES[0];

// Brands people name instead of the product: "randu packet maggi" should search "maggi noodles".
const BRANDS = ['maggi', 'yippee', 'milma', 'amul', 'nandini', 'aavin', 'colgate', 'pepsodent', 'closeup', 'sensodyne', 'lifebuoy', 'hamam',
  'lux', 'dettol', 'santoor', 'medimix', 'surf', 'ariel', 'tide', 'rin', 'wheel', 'vim', 'pril', 'harpic', 'lizol', 'lays', 'kurkure',
  'bingo', 'parle', 'britannia', 'sunfeast', 'oreo', 'aashirvaad', 'pillsbury', 'fortune', 'saffola', 'bru', 'nescafe', 'tata', 'brooke bond',
  'red label', 'horlicks', 'boost', 'bournvita', 'complan', 'kissan', 'haldiram', 'eastern', 'brahmins', 'nirapara', 'double horse',
  'kitchen treasures', 'saras', 'elite', 'modern', 'quaker', 'kelloggs', 'dabur', 'patanjali', 'himalaya', 'pampers', 'huggies', 'whisper', 'stayfree'];
const BRAND_RE = new RegExp(`\\b(${BRANDS.map(b => b.replace(' ', '\\s*')).join('|')})\\b`, 'i');
const SIZE_UNITS = { kg: 'kg', g: 'g', l: 'l', ml: 'ml' };

export function searchTerm(item) {
  const brand = BRAND_RE.exec(item.said ?? '')?.[1];
  let term = item.name;
  if (brand && !item.name.toLowerCase().includes(brand.toLowerCase())) {
    term = item.known ? `${brand} ${item.name}` : brand;
  }
  // a pack size narrows the results: "matta rice 5 kg"; counts and packets don't
  if (item.qty != null && SIZE_UNITS[item.unit]) term += ` ${+item.qty} ${SIZE_UNITS[item.unit]}`;
  return term.toLowerCase();
}
