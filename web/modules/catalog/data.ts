export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  image: string;
  sku: string;
  pack: string;
  units: number;
  price: number;
  volumePrice: number;
  available: boolean;
  tag?: string;
  description: string;
};
// Design fixtures only. Prices, SKU, packaging and availability are illustrative.
export const products: Product[] = [
  {
    id: 'jasmine-rice',
    name: 'Premium Jasmine Rice',
    category: 'Rice & grains',
    brand: 'Madame Sarah',
    image: '/products/jasmine-rice.jpg',
    sku: 'HV-RIC-001',
    pack: '4 × 20 lb bags',
    units: 4,
    price: 8496,
    volumePrice: 7896,
    available: true,
    tag: 'BESTSELLER',
    description:
      'A fragrant, long-grain pantry essential. Versatile rice for everyday dishes and Caribbean favorites.',
  },
  {
    id: 'madame-sarah-black-eye-peas',
    name: 'Dried Black-Eyed Peas',
    category: 'Beans & legumes',
    brand: 'Madame Sarah',
    image: '/products/madame-sarah-black-eye-peas.jpg',
    sku: 'HV-BEA-002',
    pack: '6 × 5 lb bags',
    units: 6,
    price: 4194,
    volumePrice: 3894,
    available: true,
    description:
      'A staple for traditional recipes, soups and sides. Convenient retail-ready bags for your shelves.',
  },
  {
    id: 'fresh-epis-seasoning-medium-spicy',
    name: 'Fresh Epis · Medium',
    category: 'Spices & seasonings',
    brand: 'Madame Sarah',
    image: '/products/fresh-epis-seasoning-medium-spicy.jpg',
    sku: 'HV-EPI-003',
    pack: '12 × 16 oz jars',
    units: 12,
    price: 7190,
    volumePrice: 6590,
    available: true,
    tag: 'CUSTOMER FAVORITE',
    description:
      'A traditional Haitian cooking base that brings a balanced, lively flavor to marinades, rice and stews.',
  },
  {
    id: 'haitian-coffee',
    name: 'Haitian Ground Coffee',
    category: 'Coffee & beverages',
    brand: 'Horizon Vert',
    image: '/products/haitian-coffee.jpg',
    sku: 'HV-COF-004',
    pack: '12 × 12 oz bags',
    units: 12,
    price: 9600,
    volumePrice: 9000,
    available: true,
    description:
      'Distinctive Haitian coffee, ready for the morning ritual. An inviting addition to specialty grocery shelves.',
  },
  {
    id: 'breadfruit-flour',
    name: 'Breadfruit Flour',
    category: 'Flours & baking',
    brand: 'Madame Sarah',
    image: '/products/breadfruit-flour.jpg',
    sku: 'HV-FLR-005',
    pack: '12 × 2 lb bags',
    units: 12,
    price: 6590,
    volumePrice: 5990,
    available: true,
    tag: 'PANTRY ESSENTIAL',
    description:
      'A versatile flour for baking and traditional cooking. Explore a Caribbean pantry favorite.',
  },
  {
    id: 'diri-shella-haitian-rice',
    name: 'Diri Shella Rice',
    category: 'Rice & grains',
    brand: 'Horizon Vert',
    image: '/products/diri-shella-haitian-rice.jpg',
    sku: 'HV-RIC-006',
    pack: '6 × 5 lb bags',
    units: 6,
    price: 4794,
    volumePrice: 4494,
    available: true,
    description:
      'A familiar foundation for Haitian cooking, packed in practical bags for home cooks and specialty retailers.',
  },
  {
    id: 'small-red-beans',
    name: 'Small Red Beans',
    category: 'Beans & legumes',
    brand: 'Madame Sarah',
    image: '/products/small-red-beans.png',
    sku: 'HV-BEA-007',
    pack: '6 × 5 lb bags',
    units: 6,
    price: 4494,
    volumePrice: 4194,
    available: true,
    description:
      'A pantry staple for rice and beans, hearty soups and traditional Caribbean dishes.',
  },
  {
    id: 'cornmeal',
    name: 'Golden Cornmeal',
    category: 'Rice & grains',
    brand: 'Madame Sarah',
    image: '/products/cornmeal.jpg',
    sku: 'HV-GRN-008',
    pack: '12 × 2 lb bags',
    units: 12,
    price: 3590,
    volumePrice: 3290,
    available: true,
    description:
      'A versatile cornmeal for comforting everyday meals, traditional dishes and baking.',
  },
  {
    id: 'plantain-flour',
    name: 'Plantain Flour',
    category: 'Flours & baking',
    brand: 'Madame Sarah',
    image: '/products/plantain-flour.jpg',
    sku: 'HV-FLR-009',
    pack: '12 × 2 lb bags',
    units: 12,
    price: 5990,
    volumePrice: 5490,
    available: true,
    description:
      'Bring a Caribbean pantry favorite to your assortment with retail-ready plantain flour.',
  },
  {
    id: 'caribbean-pikliz',
    name: 'Caribbean Pikliz',
    category: 'Sauces & condiments',
    brand: 'Partner brands',
    image: '/products/caribbean-pikliz.jpg',
    sku: 'HV-SAU-010',
    pack: '12 × 27 oz jars',
    units: 12,
    price: 8390,
    volumePrice: 7790,
    available: true,
    description:
      'A bright, spicy shredded condiment to pair with traditional meals and grilled favorites.',
  },
  {
    id: 'djon-djon',
    name: 'Djon Djon Mushrooms',
    category: 'Spices & seasonings',
    brand: 'Madame Sarah',
    image: '/products/djon-djon.jpg',
    sku: 'HV-SPC-011',
    pack: '12 × 2 oz bags',
    units: 12,
    price: 11990,
    volumePrice: 10990,
    available: false,
    description:
      'The signature ingredient behind Haitian black mushroom rice. Availability varies.',
  },
  {
    id: 'vanilla-extract',
    name: 'Vanilla Extract',
    category: 'Flours & baking',
    brand: 'Madame Sarah',
    image: '/products/vanilla-extract.jpg',
    sku: 'HV-BAK-012',
    pack: '12 × 8 fl oz bottles',
    units: 12,
    price: 5390,
    volumePrice: 4990,
    available: true,
    description:
      'A classic baking staple for sweets, drinks and everyday recipes.',
  },
];
export const categories = [
  'All products',
  'Rice & grains',
  'Beans & legumes',
  'Spices & seasonings',
  'Flours & baking',
  'Sauces & condiments',
  'Coffee & beverages',
];
export const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  );
export const casePrice = (p: Product, q: number) =>
  q >= 10 ? p.volumePrice : p.price;
