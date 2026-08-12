/**
 * DEMO CATALOGUE — placeholder data for development and for showing the site
 * to the business owner before the real catalogue is loaded.
 *
 * IMPORTANT: every price here is a PLACEHOLDER chosen to look plausible for a
 * Kenyan household goods shop. None of it came from Debby's Kitchenware.
 * Replace prices, stock and photos in the admin dashboard before going live.
 * Nothing in this file is a real customer, review or business claim.
 */

export interface SeedCategory {
  name: string;
  description: string;
  children?: { name: string; description: string }[];
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: 'Kitchenware',
    description: 'Plates, cups, cutlery, cooking utensils, pots and everything else you need to cook and serve.',
    children: [
      { name: 'Plates & Bowls', description: 'Melamine, plastic and stainless plates, bowls and serving dishes.' },
      { name: 'Cups & Mugs', description: 'Drinking cups, mugs, glasses and flasks.' },
      { name: 'Cutlery', description: 'Spoons, forks, knives and serving sets.' },
      { name: 'Cooking Utensils', description: 'Cooking spoons, turners, ladles, sieves and graters.' },
      { name: 'Pots & Pans', description: 'Sufurias, frying pans, kettles and lids.' },
    ],
  },
  {
    name: 'Household',
    description: 'Everyday items that keep a home running, from laundry to general use.',
    children: [
      { name: 'Laundry', description: 'Basins, pegs, hangers, washing lines and laundry baskets.' },
      { name: 'General Household', description: 'Mali mali and everyday household items.' },
    ],
  },
  {
    name: 'Plastic Products',
    description: 'Hard-wearing plastic buckets, basins, containers and bowls.',
    children: [
      { name: 'Buckets', description: 'Water buckets and pails in a range of sizes.' },
      { name: 'Basins', description: 'Washing basins and multipurpose basins.' },
      { name: 'Jerricans & Tanks', description: 'Water storage jerricans and drums.' },
    ],
  },
  {
    name: 'Storage',
    description: 'Keep food fresh and the house tidy with containers, boxes and organisers.',
    children: [
      { name: 'Food Containers', description: 'Airtight containers, lunch boxes and food flasks.' },
      { name: 'Organisers & Baskets', description: 'Shelf organisers, racks and storage baskets.' },
    ],
  },
  {
    name: 'Cleaning',
    description: 'Brooms, mops, brushes and cleaning accessories.',
    children: [
      { name: 'Brooms & Mops', description: 'Soft brooms, hard brooms, mops and mop buckets.' },
      { name: 'Brushes & Scrubs', description: 'Scrubbing brushes, toilet brushes, sponges and steel wool.' },
      { name: 'Dustpans & Bins', description: 'Dustpans, dustbins and waste baskets.' },
    ],
  },
  {
    name: 'Other',
    description: 'Anything that does not fit neatly elsewhere. Add your own categories any time.',
  },
];

export interface SeedProduct {
  name: string;
  sku: string;
  category: string;
  description: string;
  keywords: string;
  price: number;       // shillings, converted to cents on insert
  salePrice?: number;  // shillings
  stock: number;
  unit?: string;
  featured?: boolean;
  newArrival?: boolean;
  /** Shape hint used to draw the placeholder image. */
  shape: 'bucket' | 'basin' | 'plate' | 'cup' | 'cutlery' | 'pot' | 'container' | 'broom' | 'brush' | 'box';
}

export const SEED_PRODUCTS: SeedProduct[] = [
  { name: '10L Plastic Bucket', sku: 'DK-BKT-010', category: 'Buckets', shape: 'bucket', price: 350, stock: 48, featured: true,
    keywords: 'ndoo, pail, water bucket, small bucket, 10 litre',
    description: 'A 10 litre plastic bucket with a strong metal handle. Light enough for children to carry water and small enough to fit under most taps. Food-safe plastic, easy to wash.' },
  { name: '20L Plastic Bucket', sku: 'DK-BKT-020', category: 'Buckets', shape: 'bucket', price: 550, salePrice: 450, stock: 36, featured: true,
    keywords: 'ndoo kubwa, pail, water bucket, 20 litre, big bucket',
    description: 'The everyday 20 litre bucket for fetching and storing water, soaking laundry or general household use. Thick walls, reinforced rim and a metal handle that will not cut into your hand.' },
  { name: 'Heavy Duty Bucket with Lid', sku: 'DK-BKT-HD1', category: 'Buckets', shape: 'bucket', price: 850, stock: 18, newArrival: true,
    keywords: 'ndoo, lidded bucket, storage bucket, heavy duty',
    description: 'Thick-walled bucket with a tight-fitting lid. Suitable for storing flour, animal feed or water without dust getting in.' },
  { name: 'Large Plastic Basin', sku: 'DK-BSN-L01', category: 'Basins', shape: 'basin', price: 650, stock: 24, featured: true,
    keywords: 'karai, washing basin, laundry basin, beseni',
    description: 'A wide, deep basin for washing clothes, dishes or vegetables. Rounded rim so it does not cut your hands during a long wash.' },
  { name: 'Medium Plastic Basin', sku: 'DK-BSN-M01', category: 'Basins', shape: 'basin', price: 420, stock: 30,
    keywords: 'beseni, washing basin, medium basin',
    description: 'A medium basin that fits comfortably in a small kitchen or bathroom. Good for soaking, rinsing and general washing.' },
  { name: '20L Water Jerrican', sku: 'DK-JRC-020', category: 'Jerricans & Tanks', shape: 'container', price: 780, stock: 22,
    keywords: 'mtungi, jerrican, water container, 20 litre',
    description: 'A 20 litre jerrican with a screw cap and moulded handle for carrying and storing drinking water.' },

  { name: 'Melamine Dinner Plates, Set of 6', sku: 'DK-PLT-M06', category: 'Plates & Bowls', shape: 'plate', price: 1200, salePrice: 990, stock: 20, featured: true,
    keywords: 'sahani, dinner plates, melamine, plate set',
    description: 'Six unbreakable melamine dinner plates. They do not chip like ceramic and do not stain easily, which makes them a practical everyday choice for a busy family.' },
  { name: 'Stainless Steel Serving Bowl', sku: 'DK-BWL-S01', category: 'Plates & Bowls', shape: 'plate', price: 480, stock: 26,
    keywords: 'bakuli, serving bowl, steel bowl',
    description: 'A polished stainless steel bowl for serving, mixing or storing. Will not crack or absorb smells.' },
  { name: 'Plastic Serving Tray', sku: 'DK-TRY-P01', category: 'Plates & Bowls', shape: 'plate', price: 350, stock: 34,
    keywords: 'tray, serving tray, sinia',
    description: 'A light, wipe-clean serving tray with raised edges so cups do not slide off.' },
  { name: 'Drinking Cups, Set of 6', sku: 'DK-CUP-006', category: 'Cups & Mugs', shape: 'cup', price: 600, stock: 40, featured: true,
    keywords: 'vikombe, cups, drinking cups, plastic cups, tumblers',
    description: 'Six sturdy drinking cups that stack neatly in the cupboard. Safe for children and light enough to carry.' },
  { name: 'Ceramic Mug', sku: 'DK-MUG-C01', category: 'Cups & Mugs', shape: 'cup', price: 250, stock: 60,
    keywords: 'kikombe, mug, tea mug, coffee mug',
    description: 'A classic ceramic mug for tea or coffee. Comfortable handle, dishwasher friendly.' },
  { name: '1.8L Vacuum Flask', sku: 'DK-FLK-018', category: 'Cups & Mugs', shape: 'cup', price: 1450, stock: 12, newArrival: true,
    keywords: 'thermos, flask, vacuum flask, chai flask',
    description: 'Keeps chai hot for hours. Screw stopper, carry handle and a cup lid that doubles as a mug.' },
  { name: 'Cutlery Set, 24 Pieces', sku: 'DK-CTL-024', category: 'Cutlery', shape: 'cutlery', price: 1600, salePrice: 1350, stock: 15, featured: true,
    keywords: 'vijiko, cutlery, spoons, forks, knives, cutlery set',
    description: 'Six each of dinner spoons, forks, knives and teaspoons in stainless steel. Enough for a family table with spares in the drawer.' },
  { name: 'Table Spoons, Pack of 12', sku: 'DK-SPN-012', category: 'Cutlery', shape: 'cutlery', price: 480, stock: 44,
    keywords: 'vijiko, spoons, table spoons, stainless spoons',
    description: 'Twelve stainless steel table spoons. Sold as a pack so you always have enough when visitors come.' },
  { name: 'Kitchen Knife Set, 3 Pieces', sku: 'DK-KNF-003', category: 'Cutlery', shape: 'cutlery', price: 950, stock: 16,
    keywords: 'kisu, knife, kitchen knife, chopping knife',
    description: 'A chef knife, a utility knife and a paring knife with moulded grips. Covers almost everything a home kitchen needs.' },
  { name: 'Wooden Cooking Spoon Set', sku: 'DK-CSP-W03', category: 'Cooking Utensils', shape: 'cutlery', price: 420, stock: 38,
    keywords: 'mwiko, cooking spoon, wooden spoon, ugali stick',
    description: 'Three hardwood cooking spoons that will not scratch non-stick pans and stay cool in the hand.' },
  { name: 'Stainless Serving Spoon', sku: 'DK-SSP-001', category: 'Cooking Utensils', shape: 'cutlery', price: 220, stock: 52,
    keywords: 'upawa, serving spoon, ladle',
    description: 'A deep stainless serving spoon with a long handle for reaching the bottom of a large sufuria.' },
  { name: 'Cooking Turner (Mwiko)', sku: 'DK-TRN-001', category: 'Cooking Utensils', shape: 'cutlery', price: 260, stock: 41,
    keywords: 'mwiko, turner, spatula, ugali',
    description: 'A broad flat turner for ugali, chapati and frying. Heat resistant handle.' },
  { name: 'Stainless Grater', sku: 'DK-GRT-001', category: 'Cooking Utensils', shape: 'cutlery', price: 380, stock: 27,
    keywords: 'grater, cheese grater, vegetable grater',
    description: 'Four-sided grater for carrots, cheese and ginger, with a stable base and a comfortable top handle.' },
  { name: '5L Aluminium Sufuria with Lid', sku: 'DK-SUF-005', category: 'Pots & Pans', shape: 'pot', price: 1250, stock: 14, featured: true,
    keywords: 'sufuria, cooking pot, aluminium pot, 5 litre',
    description: 'A five litre aluminium sufuria with a matching lid and riveted handles. Heats evenly and is light to lift when full.' },
  { name: '24cm Non-Stick Frying Pan', sku: 'DK-PAN-024', category: 'Pots & Pans', shape: 'pot', price: 1100, salePrice: 890, stock: 19,
    keywords: 'frying pan, non stick, pan, kikaango',
    description: 'A 24cm non-stick frying pan with a stay-cool handle. Good for eggs, chapati and quick frying with little oil.' },
  { name: '3L Whistling Kettle', sku: 'DK-KTL-003', category: 'Pots & Pans', shape: 'pot', price: 1350, stock: 11, newArrival: true,
    keywords: 'birika, kettle, whistling kettle, tea kettle',
    description: 'A three litre stovetop kettle that whistles when the water boils, with a flip-open spout for safe pouring.' },

  { name: 'Airtight Food Container, 1.5L', sku: 'DK-CNT-015', category: 'Food Containers', shape: 'container', price: 450, stock: 33, featured: true,
    keywords: 'container, food container, airtight, storage container',
    description: 'A 1.5 litre container with a clip-down airtight lid. Keeps flour, sugar and leftovers fresh and free of ants.' },
  { name: 'Food Container Set, 5 Pieces', sku: 'DK-CNT-S05', category: 'Food Containers', shape: 'container', price: 1250, salePrice: 1050, stock: 21,
    keywords: 'containers, food storage, set, nesting containers',
    description: 'Five graduated containers that nest inside one another when empty, so they take up almost no cupboard space.' },
  { name: 'Lunch Box with Compartments', sku: 'DK-LNC-001', category: 'Food Containers', shape: 'container', price: 520, stock: 29, newArrival: true,
    keywords: 'lunch box, school lunch box, food flask',
    description: 'A leak-resistant lunch box with separate compartments so the stew does not run into the rice.' },
  { name: 'Storage Box with Lid, 30L', sku: 'DK-STB-030', category: 'Organisers & Baskets', shape: 'box', price: 1400, stock: 13,
    keywords: 'storage box, plastic box, crate, storage bin',
    description: 'A 30 litre lidded box for clothes, shoes or household items. Stackable and strong enough to sit on.' },
  { name: 'Three-Tier Kitchen Organiser', sku: 'DK-ORG-003', category: 'Organisers & Baskets', shape: 'box', price: 1850, stock: 9, featured: true,
    keywords: 'organiser, kitchen rack, shelf, storage rack',
    description: 'A free-standing three-tier rack that turns one shelf into three. Useful in small kitchens where counter space is tight.' },
  { name: 'Woven Storage Basket', sku: 'DK-BSK-001', category: 'Organisers & Baskets', shape: 'box', price: 690, stock: 17,
    keywords: 'kikapu, basket, storage basket, laundry basket',
    description: 'A light woven basket for fruit, clothes or general tidying up. Handles on both sides.' },

  { name: 'Soft Broom', sku: 'DK-BRM-S01', category: 'Brooms & Mops', shape: 'broom', price: 320, stock: 45, featured: true,
    keywords: 'ufagio, broom, soft broom, sweeping brush',
    description: 'A soft-bristle broom for indoor floors. Picks up fine dust without scratching tiles or wooden floors.' },
  { name: 'Hard Broom (Outdoor)', sku: 'DK-BRM-H01', category: 'Brooms & Mops', shape: 'broom', price: 380, stock: 31,
    keywords: 'ufagio, hard broom, yard broom, outdoor broom',
    description: 'Stiff bristles for the compound, verandah and rough concrete where a soft broom gives up.' },
  { name: 'Floor Mop with Handle', sku: 'DK-MOP-001', category: 'Brooms & Mops', shape: 'broom', price: 650, stock: 23,
    keywords: 'mop, floor mop, cleaning mop',
    description: 'A cotton head mop on a long steel handle. The head unscrews so it can be washed or replaced.' },
  { name: 'Spin Mop with Bucket', sku: 'DK-MOP-SPN', category: 'Brooms & Mops', shape: 'broom', price: 2450, salePrice: 1990, stock: 7, newArrival: true, featured: true,
    keywords: 'spin mop, mop bucket, cleaning set, magic mop',
    description: 'A microfibre spin mop with its own wringing bucket, so you clean the floor without putting your hands in dirty water.' },
  { name: 'Scrubbing Brush', sku: 'DK-BRS-S01', category: 'Brushes & Scrubs', shape: 'brush', price: 180, stock: 58,
    keywords: 'brush, scrubbing brush, cleaning brush, burashi',
    description: 'A stiff hand brush for scrubbing floors, tiles and stubborn stains.' },
  { name: 'Toilet Brush with Holder', sku: 'DK-BRS-T01', category: 'Brushes & Scrubs', shape: 'brush', price: 340, stock: 26,
    keywords: 'toilet brush, bathroom brush, brush holder',
    description: 'A toilet brush that sits in its own holder to keep the bathroom floor clean between uses.' },
  { name: 'Dish Sponge, Pack of 5', sku: 'DK-SPG-005', category: 'Brushes & Scrubs', shape: 'brush', price: 200, stock: 62,
    keywords: 'sponge, dish sponge, scourer, washing sponge',
    description: 'Five two-sided sponges: soft on one face for washing, abrasive on the other for burnt sufurias.' },
  { name: 'Dustpan and Brush Set', sku: 'DK-DST-001', category: 'Dustpans & Bins', shape: 'brush', price: 290, stock: 37,
    keywords: 'dustpan, brush, dust pan set',
    description: 'A dustpan with a rubber lip that sits flat on the floor, plus a matching hand brush that clips onto it.' },
  { name: '25L Pedal Dustbin', sku: 'DK-BIN-025', category: 'Dustpans & Bins', shape: 'box', price: 1550, stock: 10,
    keywords: 'dustbin, bin, waste bin, pedal bin, rubbish bin',
    description: 'A 25 litre pedal bin with an inner liner bucket, so the bag stays hidden and the lid closes fully.' },

  { name: 'Laundry Basket, 45L', sku: 'DK-LND-045', category: 'Laundry', shape: 'box', price: 890, stock: 15,
    keywords: 'laundry basket, clothes basket, washing basket',
    description: 'A ventilated 45 litre laundry basket with cut-out handles so damp clothes can breathe.' },
  { name: 'Clothes Pegs, Pack of 24', sku: 'DK-PEG-024', category: 'Laundry', shape: 'container', price: 150, stock: 70,
    keywords: 'pegs, clothes pegs, clips, hanging pegs',
    description: 'Twenty-four strong-spring pegs that hold in the wind without leaving marks on clothes.' },
  { name: 'Clothes Hangers, Pack of 10', sku: 'DK-HNG-010', category: 'Laundry', shape: 'container', price: 380, stock: 42,
    keywords: 'hangers, clothes hangers, wardrobe hangers',
    description: 'Ten moulded plastic hangers with notched shoulders so straps do not slip off.' },
  { name: 'Washing Line, 20m', sku: 'DK-LIN-020', category: 'Laundry', shape: 'container', price: 260, stock: 33,
    keywords: 'washing line, clothes line, kamba ya nguo',
    description: 'Twenty metres of plastic-coated washing line that will not rust or mark wet clothes.' },
  { name: 'Chopping Board', sku: 'DK-CHB-001', category: 'General Household', shape: 'plate', price: 420, stock: 28,
    keywords: 'chopping board, cutting board, kitchen board',
    description: 'A wipe-clean chopping board with a groove around the edge to catch juices from tomatoes and meat.' },
  { name: 'Thermos Food Flask, 2L', sku: 'DK-TFL-002', category: 'General Household', shape: 'container', price: 1750, stock: 8, newArrival: true,
    keywords: 'food flask, thermos, hot pot, casserole',
    description: 'An insulated two litre serving flask that keeps rice or stew hot on the table through a long meal.' },
];

/**
 * Delivery zones are seeded INACTIVE with a zero fee on purpose. Real fees are
 * a commercial decision for the owner — the site must not invent them. Set the
 * fee and switch the zone on from Admin > Delivery zones.
 */
export const SEED_DELIVERY_ZONES = [
  { name: 'Nairobi CBD', county: 'Nairobi', etaText: 'Same day', sortOrder: 1 },
  { name: 'Kasarani', county: 'Nairobi', etaText: 'Same day', sortOrder: 2 },
  { name: 'Roysambu', county: 'Nairobi', etaText: 'Same day', sortOrder: 3 },
  { name: 'Ruiru', county: 'Kiambu', etaText: '1 day', sortOrder: 4 },
  { name: 'Thika Road (other)', county: 'Nairobi', etaText: '1 day', sortOrder: 5 },
  { name: 'Westlands & Parklands', county: 'Nairobi', etaText: '1 day', sortOrder: 6 },
  { name: 'Eastlands', county: 'Nairobi', etaText: '1 day', sortOrder: 7 },
  { name: 'Other areas (we will confirm)', county: 'Nairobi', etaText: 'We will confirm on WhatsApp', sortOrder: 99 },
];
